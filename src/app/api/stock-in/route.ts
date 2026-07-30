import { db } from "@/lib/db";
import { requirePermission, HttpError } from "@/lib/auth";
import { handler, ok, serializeMachine, nextCode } from "@/lib/api-utils";
import type { Condition } from "@/generated/prisma/enums";

// Nhập kho: tạo 1 hoặc nhiều máy vào kho từ 1 mặt hàng.
// Body: { date?, branchId?, supplierId?, category?, name, serial?, salePrice?, description?,
//         quantity?, unitPrice?, amountPaid?, payMethod? }
// Trả tiền một phần / không trả → phần còn thiếu ghi vào công nợ nhà cung cấp.
export const POST = handler(async (req: Request) => {
  await requirePermission("nhap-kho", "create");
  const b = await req.json();

  const name = String(b.name ?? "").trim();
  if (!name) throw new HttpError(400, "Nhập Tên sản phẩm (Mặt hàng)");

  const serialInput = String(b.serial ?? "").trim().toUpperCase();
  const quantity = Math.max(1, Math.floor(Number(b.quantity) || 1));
  if (serialInput && quantity > 1) throw new HttpError(400, "Đã nhập Serial thì số lượng phải là 1");

  const unitPrice = Number(b.unitPrice) || 0;
  const salePrice = b.salePrice !== undefined && b.salePrice !== "" && b.salePrice !== null ? Number(b.salePrice) : null;
  const category = b.category ? String(b.category).trim() : null;
  const description = b.description ? String(b.description).trim() : null;
  const branchId = b.branchId ? String(b.branchId) : null;
  const supplierId = b.supplierId ? String(b.supplierId) : null;
  const createdAt = b.date ? new Date(b.date) : undefined;
  if (createdAt && isNaN(createdAt.getTime())) throw new HttpError(400, "Ngày không hợp lệ");

  // Nguồn nhập = tên nhà cung cấp (nếu có)
  let source = "Nhập kho";
  let supplierName: string | null = null;
  if (supplierId) {
    const sup = await db.supplier.findUnique({ where: { id: supplierId } });
    if (!sup) throw new HttpError(404, "Không tìm thấy nhà cung cấp");
    supplierName = sup.name;
    source = `NCC: ${sup.name}`;
  }

  // Sinh danh sách serial cần tạo
  const serials: string[] = [];
  if (serialInput) {
    const dup = await db.machine.findUnique({ where: { serial: serialInput } });
    if (dup) throw new HttpError(409, `Mã SP ${serialInput} đã tồn tại trong kho`);
    serials.push(serialInput);
  } else {
    const prefix = "SP";
    const pad = 4;
    const last = await db.machine.findFirst({
      where: { serial: { startsWith: prefix } },
      orderBy: { serial: "desc" },
    });
    let n = last ? parseInt(last.serial.slice(prefix.length), 10) || 0 : 0;
    for (let i = 0; i < quantity; i++) {
      n += 1;
      serials.push(`${prefix}${String(n).padStart(pad, "0")}`);
    }
  }

  const base = {
    brand: "",
    model: name,
    cpu: "",
    ram: "",
    storage: "",
    screen: "",
    condition: "like_new" as Condition,
    category,
    purchasePrice: unitPrice,
    salePrice,
    source,
    note: description,
    branchId,
    supplierId,
    ...(createdAt ? { createdAt } : {}),
  };

  // Tiền: tổng = SL × đơn giá; đã trả (kẹp 0..tổng); còn thiếu → ghi nợ NCC
  const total = serials.length * unitPrice;
  const paid = Math.max(0, Math.min(total, Math.round(Number(b.amountPaid) || 0)));
  const unpaid = total - paid;
  const payMethod = b.payMethod === "chuyen_khoan" ? "chuyen_khoan" : "tien_mat";
  const cashCode = paid > 0 ? await nextCode("cashFlow", "PC-", 4) : null;

  const created = await db.$transaction(async (tx) => {
    const machines = [];
    for (const serial of serials) {
      machines.push(await tx.machine.create({ data: { serial, ...base } }));
    }
    // Đã trả → ghi phiếu chi vào sổ quỹ
    if (paid > 0 && cashCode) {
      await tx.cashFlow.create({
        data: {
          code: cashCode,
          type: "chi",
          amount: paid,
          content: `Thanh toán nhập kho ${serials.length} × ${name}`,
          category: "Nhập hàng",
          partner: supplierName,
          method: payMethod,
          supplierId,
          ...(createdAt ? { date: createdAt } : {}),
        },
      });
    }
    // Còn thiếu → cộng vào công nợ nhà cung cấp
    if (unpaid > 0 && supplierId) {
      await tx.supplier.update({ where: { id: supplierId }, data: { debt: { increment: unpaid } } });
    }
    return machines;
  });

  return ok(
    {
      count: created.length,
      serials: created.map((m) => m.serial),
      machines: created.map(serializeMachine),
      total,
      paid,
      debt: unpaid,
      debtToSupplier: unpaid > 0 && !!supplierId,
    },
    201,
  );
});
