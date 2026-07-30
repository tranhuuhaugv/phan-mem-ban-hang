import { db } from "@/lib/db";
import { requirePermission, HttpError } from "@/lib/auth";
import { handler, ok, nextCode } from "@/lib/api-utils";

type Ctx = { params: Promise<{ id: string }> };

// Thanh toán công nợ NCC: trừ nợ + ghi phiếu chi
export const POST = handler(async (req: Request, { params }: Ctx) => {
  await requirePermission("nha-cung-cap", "edit");
  const { id } = await params;
  const b = await req.json();

  const sup = await db.supplier.findUnique({ where: { id } });
  if (!sup) throw new HttpError(404, "Không tìm thấy nhà cung cấp");
  if (sup.debt <= 0) throw new HttpError(409, "Nhà cung cấp này không còn công nợ");

  const amount = Math.round(Number(b.amount) || 0);
  if (amount <= 0) throw new HttpError(400, "Nhập số tiền thanh toán");
  const pay = Math.min(amount, sup.debt);
  const method = b.method === "chuyen_khoan" ? "chuyen_khoan" : "tien_mat";
  const note = b.note ? String(b.note).trim() : "";

  const cashCode = await nextCode("cashFlow", "PC-", 4);
  await db.$transaction(async (tx) => {
    await tx.supplier.update({ where: { id }, data: { debt: { decrement: pay } } });
    await tx.cashFlow.create({
      data: {
        code: cashCode,
        type: "chi",
        amount: pay,
        content: note || `Trả nợ nhà cung cấp ${sup.name}`,
        category: "Trả nợ NCC",
        partner: sup.name,
        method,
        supplierId: id,
      },
    });
  });

  const updated = await db.supplier.findUnique({ where: { id } });
  return ok({ paid: pay, debt: updated?.debt ?? 0 });
});
