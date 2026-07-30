import { db } from "@/lib/db";
import { requirePermission, HttpError } from "@/lib/auth";
import { handler, ok } from "@/lib/api-utils";
import type { Condition } from "@/generated/prisma/enums";

// Danh sách phiếu nhập kho
export const GET = handler(async () => {
  await requirePermission("nhap-kho", "view");
  const rows = await db.stockIn.findMany({
    orderBy: { createdAt: "desc" },
    include: { supplier: true, branch: true, _count: { select: { machines: true } } },
  });
  return ok(
    rows.map((r) => ({
      id: r.id,
      code: r.code,
      date: r.date.toISOString(),
      supplierName: r.supplier?.name ?? undefined,
      branchName: r.branch?.name ?? undefined,
      machineCount: r._count.machines,
      total: r.total,
      paid: r.paid,
      debt: r.debt,
      payMethod: r.payMethod ?? undefined,
    })),
  );
});

interface LineInput {
  category?: string;
  name?: string;
  serial?: string;
  quantity?: number;
  unitPrice?: number;
  salePrice?: number | string;
  description?: string;
}

// Tạo phiếu nhập gồm nhiều dòng máy
export const POST = handler(async (req: Request) => {
  await requirePermission("nhap-kho", "create");
  const b = await req.json();

  const rawItems: LineInput[] = Array.isArray(b.items) ? b.items : [];
  if (rawItems.length === 0) throw new HttpError(400, "Phiếu nhập phải có ít nhất 1 máy");

  const branchId = b.branchId ? String(b.branchId) : null;
  const supplierId = b.supplierId ? String(b.supplierId) : null;
  const note = b.note ? String(b.note).trim() : null;
  const createdAt = b.date ? new Date(b.date) : undefined;
  if (createdAt && isNaN(createdAt.getTime())) throw new HttpError(400, "Ngày không hợp lệ");

  // Chuẩn hoá + validate từng dòng
  const items = rawItems.map((it, idx) => {
    const name = String(it.name ?? "").trim();
    if (!name) throw new HttpError(400, `Dòng ${idx + 1}: thiếu Tên sản phẩm`);
    const serial = String(it.serial ?? "").trim().toUpperCase();
    const quantity = Math.max(1, Math.floor(Number(it.quantity) || 1));
    if (serial && quantity > 1) throw new HttpError(400, `Dòng ${idx + 1} (${name}): có Serial thì số lượng phải là 1`);
    const unitPrice = Number(it.unitPrice) || 0;
    const salePrice = it.salePrice !== undefined && it.salePrice !== "" && it.salePrice !== null ? Number(it.salePrice) : null;
    return {
      name,
      serial,
      quantity: serial ? 1 : quantity,
      unitPrice,
      salePrice,
      category: it.category ? String(it.category).trim() : null,
      description: it.description ? String(it.description).trim() : null,
    };
  });

  // NCC + kiểm tra trùng serial nhập tay
  let supplierName: string | null = null;
  if (supplierId) {
    const sup = await db.supplier.findUnique({ where: { id: supplierId } });
    if (!sup) throw new HttpError(404, "Không tìm thấy nhà cung cấp");
    supplierName = sup.name;
  }
  const manualSerials = items.filter((i) => i.serial).map((i) => i.serial);
  const dupInBody = manualSerials.find((s, i) => manualSerials.indexOf(s) !== i);
  if (dupInBody) throw new HttpError(400, `Serial ${dupInBody} bị lặp trong phiếu`);
  if (manualSerials.length) {
    const existing = await db.machine.findMany({ where: { serial: { in: manualSerials } }, select: { serial: true } });
    if (existing.length) throw new HttpError(409, `Mã SP ${existing.map((m) => m.serial).join(", ")} đã tồn tại trong kho`);
  }

  // Tiền
  const total = items.reduce((s, it) => s + it.quantity * it.unitPrice, 0);
  const paid = Math.max(0, Math.min(total, Math.round(Number(b.amountPaid) || 0)));
  const unpaid = total - paid;
  const payMethod = b.payMethod === "chuyen_khoan" ? "chuyen_khoan" : "tien_mat";

  const source = supplierName ? `NCC: ${supplierName}` : "Nhập kho";

  const receipt = await db.$transaction(async (tx) => {
    // Mã phiếu kế tiếp
    const lastR = await tx.stockIn.findFirst({ where: { code: { startsWith: "PN-" } }, orderBy: { code: "desc" } });
    const rn = lastR ? (parseInt(lastR.code.slice(3), 10) || 0) + 1 : 1;
    const code = `PN-${String(rn).padStart(4, "0")}`;

    // Số serial tự sinh kế tiếp
    const lastM = await tx.machine.findFirst({ where: { serial: { startsWith: "SP" } }, orderBy: { serial: "desc" } });
    let sn = lastM ? parseInt(lastM.serial.slice(2), 10) || 0 : 0;

    const created = await tx.stockIn.create({
      data: { code, total, paid, debt: unpaid, payMethod, note, branchId, supplierId, ...(createdAt ? { date: createdAt } : {}) },
    });

    for (const it of items) {
      for (let i = 0; i < it.quantity; i++) {
        let serial: string;
        if (it.serial) serial = it.serial;
        else {
          sn += 1;
          serial = `SP${String(sn).padStart(4, "0")}`;
        }
        await tx.machine.create({
          data: {
            serial,
            brand: "",
            model: it.name,
            cpu: "",
            ram: "",
            storage: "",
            screen: "",
            condition: "like_new" as Condition,
            category: it.category,
            purchasePrice: it.unitPrice,
            salePrice: it.salePrice,
            source,
            note: it.description,
            branchId,
            supplierId,
            stockInId: created.id,
            ...(createdAt ? { createdAt } : {}),
          },
        });
      }
    }

    if (paid > 0) {
      const lastC = await tx.cashFlow.findFirst({ where: { code: { startsWith: "PC-" } }, orderBy: { code: "desc" } });
      const cn = lastC ? (parseInt(lastC.code.slice(3), 10) || 0) + 1 : 1;
      await tx.cashFlow.create({
        data: {
          code: `PC-${String(cn).padStart(4, "0")}`,
          type: "chi",
          amount: paid,
          content: `Thanh toán phiếu nhập ${code}`,
          category: "Nhập hàng",
          partner: supplierName,
          method: payMethod,
          supplierId,
          ...(createdAt ? { date: createdAt } : {}),
        },
      });
    }
    if (unpaid > 0 && supplierId) {
      await tx.supplier.update({ where: { id: supplierId }, data: { debt: { increment: unpaid } } });
    }
    return created;
  });

  return ok({ id: receipt.id, code: receipt.code, total, paid, debt: unpaid, debtToSupplier: unpaid > 0 && !!supplierId }, 201);
});
