import { db } from "@/lib/db";
import { requirePermission, HttpError } from "@/lib/auth";
import { handler, ok } from "@/lib/api-utils";

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
