import { db } from "@/lib/db";
import { requirePermission, HttpError } from "@/lib/auth";
import { handler, ok, nextCode } from "@/lib/api-utils";

type Ctx = { params: Promise<{ id: string }> };

// Thanh toán thêm cho hoá đơn (thu tiền công nợ khách) → tăng paid + ghi phiếu thu
export const POST = handler(async (req: Request, { params }: Ctx) => {
  await requirePermission("hoa-don", "create");
  const { id } = await params;
  const b = await req.json();

  const inv = await db.invoice.findUnique({ where: { id } });
  if (!inv) throw new HttpError(404, "Không tìm thấy hoá đơn");
  const debt = inv.total - inv.paid;
  if (debt <= 0) throw new HttpError(409, "Hoá đơn đã thanh toán đủ");

  const amount = Math.round(Number(b.amount) || 0);
  if (amount <= 0) throw new HttpError(400, "Nhập số tiền thanh toán");
  const pay = Math.min(amount, debt);
  const method = b.method === "chuyen_khoan" ? "chuyen_khoan" : "tien_mat";

  const cashCode = await nextCode("cashFlow", "PT-", 4);
  await db.$transaction(async (tx) => {
    await tx.invoice.update({ where: { id }, data: { paid: { increment: pay }, payMethod: method } });
    await tx.cashFlow.create({
      data: {
        code: cashCode,
        type: "thu",
        amount: pay,
        content: `Thanh toán hoá đơn ${inv.code}`,
        category: "Bán hàng",
        partner: inv.customerName,
        method,
        invoiceId: id,
      },
    });
  });

  return ok({ paid: pay, debt: debt - pay });
});
