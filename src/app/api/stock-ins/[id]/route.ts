import { db } from "@/lib/db";
import { requirePermission, HttpError } from "@/lib/auth";
import { handler, ok } from "@/lib/api-utils";
import type { Condition } from "@/generated/prisma/enums";

type Ctx = { params: Promise<{ id: string }> };

// Xoá phiếu nhập: xoá các máy của phiếu (nếu chưa bán/xuất), trừ lại công nợ NCC, xoá phiếu chi
export const DELETE = handler(async (_req: Request, { params }: Ctx) => {
  await requirePermission("nhap-kho", "remove");
  const { id } = await params;
  const r = await db.stockIn.findUnique({ where: { id }, include: { machines: true } });
  if (!r) throw new HttpError(404, "Không tìm thấy phiếu nhập");
  const busy = r.machines.filter((m) => m.status !== "ton_kho");
  if (busy.length) throw new HttpError(409, `Có máy đã bán/xuất (${busy.map((m) => m.serial).join(", ")}) — không xoá được phiếu`);

  await db.$transaction(async (tx) => {
    await tx.machine.deleteMany({ where: { stockInId: id } });
    if (r.debt > 0 && r.supplierId) {
      await tx.supplier.update({ where: { id: r.supplierId }, data: { debt: { decrement: r.debt } } });
    }
    await tx.cashFlow.deleteMany({ where: { content: { contains: r.code } } });
    await tx.stockIn.delete({ where: { id } });
  });
  return ok({ ok: true });
});

// Sửa phiếu nhập: cập nhật/xoá/thêm máy, giá; tính lại tổng, đã trả, còn nợ + công nợ NCC
export const PATCH = handler(async (req: Request, { params }: Ctx) => {
  const user = await requirePermission("nhap-kho", "edit");
  const { id } = await params;
  const b = await req.json();

  const r = await db.stockIn.findUnique({ where: { id }, include: { machines: true } });
  if (!r) throw new HttpError(404, "Không tìm thấy phiếu nhập");

  const num = (v: unknown) => Math.max(0, Math.round(Number(v) || 0));
  const optNum = (v: unknown) => (v === "" || v === null || v === undefined ? null : Math.round(Number(v) || 0));

  // Máy giữ lại (cập nhật) — mặc định giữ nguyên nếu không gửi
  const keep = Array.isArray(b.keep)
    ? (b.keep as { id?: string; name?: string; category?: string; purchasePrice?: number; salePrice?: number }[]).map((k) => ({
        id: String(k.id),
        name: String(k.name ?? "").trim(),
        category: k.category ? String(k.category).trim() : null,
        purchasePrice: num(k.purchasePrice),
        salePrice: optNum(k.salePrice),
      }))
    : r.machines.map((m) => ({ id: m.id, name: m.model, category: m.category, purchasePrice: m.purchasePrice, salePrice: m.salePrice }));

  const keepIds = new Set(keep.map((k) => k.id));
  const toRemove = r.machines.filter((m) => !keepIds.has(m.id));
  const busyRemove = toRemove.filter((m) => m.status !== "ton_kho");
  if (busyRemove.length) throw new HttpError(409, `Máy đã bán/xuất, không xoá khỏi phiếu: ${busyRemove.map((m) => m.serial).join(", ")}`);

  // Máy thêm mới
  const add = Array.isArray(b.add)
    ? (b.add as { name?: string; category?: string; purchasePrice?: number; salePrice?: number; quantity?: number }[]).flatMap((a) => {
        const qty = Math.max(1, Math.round(Number(a.quantity) || 1));
        const line = { name: String(a.name ?? "").trim(), category: a.category ? String(a.category).trim() : null, purchasePrice: num(a.purchasePrice), salePrice: optNum(a.salePrice) };
        return Array.from({ length: qty }, () => line);
      })
    : [];

  await db.$transaction(async (tx) => {
    if (toRemove.length) await tx.machine.deleteMany({ where: { id: { in: toRemove.map((m) => m.id) } } });

    for (const k of keep) {
      const orig = r.machines.find((m) => m.id === k.id);
      if (!orig) continue;
      await tx.machine.update({
        where: { id: k.id },
        data: { model: k.name || orig.model, category: k.category, purchasePrice: k.purchasePrice, salePrice: k.salePrice },
      });
    }

    if (add.length) {
      const lastM = await tx.machine.findFirst({ where: { serial: { startsWith: "SP" } }, orderBy: { serial: "desc" } });
      let sn = lastM ? parseInt(lastM.serial.slice(2), 10) || 0 : 0;
      for (const a of add) {
        sn += 1;
        await tx.machine.create({
          data: {
            serial: `SP${String(sn).padStart(4, "0")}`,
            brand: "",
            model: a.name,
            cpu: "",
            ram: "",
            storage: "",
            screen: "",
            condition: "like_new" as Condition,
            category: a.category,
            purchasePrice: a.purchasePrice,
            salePrice: a.salePrice,
            source: r.supplierId ? "Nhập kho (NCC)" : "Nhập kho",
            createdByName: user.fullName,
            branchId: r.branchId,
            supplierId: r.supplierId,
            stockInId: r.id,
          },
        });
      }
    }

    const total = keep.reduce((s, k) => s + k.purchasePrice, 0) + add.reduce((s, a) => s + a.purchasePrice, 0);
    const paid = b.paid !== undefined ? Math.max(0, Math.min(total, Math.round(Number(b.paid) || 0))) : Math.min(r.paid, total);
    const debt = total - paid;

    // Chỉnh công nợ NCC theo chênh lệch nợ mới - nợ cũ
    if (r.supplierId) {
      const delta = debt - r.debt;
      if (delta !== 0) await tx.supplier.update({ where: { id: r.supplierId }, data: { debt: { increment: delta } } });
    }

    await tx.stockIn.update({
      where: { id },
      data: { total, paid, debt, note: b.note !== undefined ? (b.note ? String(b.note).trim() : null) : undefined },
    });
  });

  return ok({ ok: true });
});

// Chi tiết 1 phiếu nhập: thông tin + danh sách máy trong phiếu
export const GET = handler(async (_req: Request, { params }: Ctx) => {
  await requirePermission("nhap-kho", "view");
  const { id } = await params;

  const r = await db.stockIn.findUnique({
    where: { id },
    include: { supplier: true, branch: true, machines: { orderBy: { serial: "asc" } } },
  });
  if (!r) throw new HttpError(404, "Không tìm thấy phiếu nhập");

  return ok({
    id: r.id,
    code: r.code,
    date: r.date.toISOString(),
    supplierId: r.supplierId ?? undefined,
    supplierName: r.supplier?.name ?? undefined,
    branchName: r.branch?.name ?? undefined,
    note: r.note ?? undefined,
    total: r.total,
    paid: r.paid,
    debt: r.debt,
    payMethod: r.payMethod ?? undefined,
    items: r.machines.map((m) => ({
      id: m.id,
      serial: m.serial,
      name: m.model,
      category: m.category ?? undefined,
      purchasePrice: m.purchasePrice,
      salePrice: m.salePrice ?? undefined,
      status: m.status,
    })),
  });
});
