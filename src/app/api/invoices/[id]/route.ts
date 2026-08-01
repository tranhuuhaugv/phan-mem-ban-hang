import { db } from "@/lib/db";
import { requirePermission, HttpError } from "@/lib/auth";
import { handler, ok, serializeInvoice } from "@/lib/api-utils";

type Ctx = { params: Promise<{ id: string }> };

// Xoá hoá đơn: đảo máy về tồn kho (bán trực tiếp) hoặc đặt cọc (đơn hàng); xoá phiếu thu + bảo hành của HĐ
export const DELETE = handler(async (_req: Request, { params }: Ctx) => {
  await requirePermission("hoa-don", "remove");
  const { id } = await params;
  const inv = await db.invoice.findUnique({ where: { id }, include: { items: true } });
  if (!inv) throw new HttpError(404, "Không tìm thấy hoá đơn");

  await db.$transaction(async (tx) => {
    if (inv.orderId) {
      const order = await tx.order.findUnique({ where: { id: inv.orderId } });
      if (order?.machineId) await tx.machine.update({ where: { id: order.machineId }, data: { status: "dat_coc" } });
      if (order) await tx.order.update({ where: { id: order.id }, data: { status: order.deposit > 0 ? "da_coc" : "cho_coc" } });
    } else if (inv.kind !== "sua_chua") {
      const machineIds = inv.items.map((i) => i.machineId).filter(Boolean) as string[];
      if (machineIds.length) await tx.machine.updateMany({ where: { id: { in: machineIds } }, data: { status: "ton_kho" } });
    }
    await tx.cashFlow.deleteMany({ where: { invoiceId: id } });
    await tx.warranty.deleteMany({ where: { invoiceId: id } });
    await tx.invoice.delete({ where: { id } });
  });
  return ok({ ok: true });
});

export const GET = handler(async (_req: Request, { params }: Ctx) => {
  await requirePermission("hoa-don", "view");
  const { id } = await params;
  const row = await db.invoice.findUnique({
    where: { id },
    include: {
      order: true,
      repair: true,
      items: { include: { machine: true } },
      warranties: { include: { machine: true } },
    },
  });
  if (!row) throw new HttpError(404, "Không tìm thấy hoá đơn");
  const payments = await db.cashFlow.findMany({ where: { invoiceId: id, type: "thu" }, orderBy: { date: "asc" } });
  return ok({
    ...serializeInvoice(row),
    warranties: row.warranties.map((w) => ({
      id: w.id,
      serial: w.machine?.serial ?? "",
      months: w.months,
      condition: w.condition,
      startDate: w.startDate.toISOString(),
    })),
    payments: payments.map((p) => ({
      id: p.id,
      code: p.code,
      amount: p.amount,
      method: p.method ?? undefined,
      date: p.date.toISOString(),
    })),
  });
});
