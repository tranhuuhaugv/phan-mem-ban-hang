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

  const norm = (m: unknown) => (m === "the" || m === "chuyen_khoan" ? m : "tien_mat");

  // Hỗ trợ thanh toán tách nhiều hình thức: payments = [{method, amount}, ...]
  // Vẫn tương thích kiểu cũ: { amount, method }
  const rawLines: { method: string; amount: number }[] = Array.isArray(b.payments)
    ? b.payments.map((p: { method?: string; amount?: number }) => ({ method: norm(p.method), amount: Math.round(Number(p.amount) || 0) }))
    : [{ method: norm(b.method), amount: Math.round(Number(b.amount) || 0) }];

  const lines = rawLines.filter((l) => l.amount > 0);
  if (lines.length === 0) throw new HttpError(400, "Nhập số tiền thanh toán");

  // Chặn thu quá số còn nợ — cắt bớt lần lượt theo thứ tự nhập
  let remaining = debt;
  const applied: { method: string; amount: number }[] = [];
  for (const l of lines) {
    if (remaining <= 0) break;
    const p = Math.min(l.amount, remaining);
    applied.push({ method: l.method, amount: p });
    remaining -= p;
  }
  const totalPay = applied.reduce((s, l) => s + l.amount, 0);
  // Hình thức chính (lưu ở hoá đơn) = hình thức có số tiền lớn nhất
  const dominant = applied.slice().sort((a, b2) => b2.amount - a.amount)[0].method;

  // Sinh mã phiếu thu tuần tự cho từng lần (nextCode đọc dữ liệu đã commit nên phải tự tăng)
  const firstCode = await nextCode("cashFlow", "PT-", 4);
  const baseNum = parseInt(firstCode.slice(3), 10) || 1;

  await db.$transaction(async (tx) => {
    await tx.invoice.update({ where: { id }, data: { paid: { increment: totalPay }, payMethod: dominant } });
    for (let i = 0; i < applied.length; i++) {
      const l = applied[i];
      await tx.cashFlow.create({
        data: {
          code: `PT-${String(baseNum + i).padStart(4, "0")}`,
          type: "thu",
          amount: l.amount,
          content: `Thanh toán hoá đơn ${inv.code}`,
          category: "Bán hàng",
          partner: inv.customerName,
          method: l.method,
          invoiceId: id,
        },
      });
    }
  });

  return ok({ paid: totalPay, debt: debt - totalPay });
});
