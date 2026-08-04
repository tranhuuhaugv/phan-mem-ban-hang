import { db } from "@/lib/db";
import { requirePermission, HttpError } from "@/lib/auth";
import { handler, ok, serializeCashFlow } from "@/lib/api-utils";
import { logAudit } from "@/lib/audit";

type Ctx = { params: Promise<{ id: string }> };

// Sửa phiếu thu/chi. Phiếu gắn hoá đơn / NCC: không cho đổi số tiền (sửa ở nguồn), chỉ đổi nội dung/loại/đối tác/ngày/hình thức.
export const PATCH = handler(async (req: Request, { params }: Ctx) => {
  const user = await requirePermission("thu-chi", "edit");
  const { id } = await params;
  const b = await req.json();
  const cf = await db.cashFlow.findUnique({ where: { id } });
  if (!cf) throw new HttpError(404, "Không tìm thấy phiếu");

  const linked = !!cf.invoiceId || !!cf.supplierId;
  if (b.amount !== undefined && Number(b.amount) !== cf.amount && linked) {
    throw new HttpError(409, "Phiếu gắn với hoá đơn / nhà cung cấp — sửa số tiền ở hoá đơn hoặc phần thanh toán, không sửa trực tiếp ở đây");
  }

  const row = await db.cashFlow.update({
    where: { id },
    data: {
      amount: b.amount !== undefined && !linked ? Math.max(0, Math.round(Number(b.amount) || 0)) : undefined,
      content: b.content !== undefined ? String(b.content).trim() : undefined,
      category: b.category !== undefined ? String(b.category).trim() : undefined,
      partner: b.partner !== undefined ? (b.partner ? String(b.partner).trim() : null) : undefined,
      method: b.method !== undefined ? (b.method ? String(b.method) : null) : undefined,
      date: b.date !== undefined ? new Date(b.date) : undefined,
    },
  });
  await logAudit(user, "update", "cashflow", cf.code, `Sửa phiếu ${cf.type} ${cf.code}`);
  return ok(serializeCashFlow(row));
});

// Xoá phiếu thu/chi + đảo ngược số liệu: HĐ (trừ đã trả), NCC (cộng lại công nợ)
export const DELETE = handler(async (_req: Request, { params }: Ctx) => {
  const user = await requirePermission("thu-chi", "remove");
  const { id } = await params;
  const cf = await db.cashFlow.findUnique({ where: { id } });
  if (!cf) throw new HttpError(404, "Không tìm thấy phiếu");

  await db.$transaction(async (tx) => {
    if (cf.invoiceId) {
      const inv = await tx.invoice.findUnique({ where: { id: cf.invoiceId } });
      if (inv) await tx.invoice.update({ where: { id: inv.id }, data: { paid: Math.max(0, inv.paid - cf.amount) } });
    } else if (cf.supplierId) {
      // Xoá một khoản đã trả NCC → khách hàng nợ lại khoản đó
      await tx.supplier.update({ where: { id: cf.supplierId }, data: { debt: { increment: cf.amount } } });
    }
    await tx.cashFlow.delete({ where: { id } });
  });
  await logAudit(user, "delete", "cashflow", cf.code, `Xoá phiếu ${cf.type} ${cf.code}`);
  return ok({ ok: true });
});
