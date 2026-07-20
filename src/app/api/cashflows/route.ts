import { db } from "@/lib/db";
import { requirePermission, HttpError } from "@/lib/auth";
import { handler, ok, serializeCashFlow, nextCode } from "@/lib/api-utils";

export const GET = handler(async () => {
  await requirePermission("thu-chi", "view");
  const rows = await db.cashFlow.findMany({ orderBy: { date: "desc" } });
  return ok(rows.map(serializeCashFlow));
});

export const POST = handler(async (req: Request) => {
  await requirePermission("thu-chi", "create");
  const b = await req.json();
  const type = b.type === "chi" ? "chi" : "thu";
  if (!b.content) throw new HttpError(400, "Nhập nội dung phiếu");
  const amount = Number(b.amount);
  if (!amount || amount <= 0) throw new HttpError(400, "Số tiền không hợp lệ");

  const code = await nextCode("cashFlow", type === "thu" ? "PT-" : "PC-", 4);
  const row = await db.cashFlow.create({
    data: {
      code,
      type,
      amount,
      date: b.date ? new Date(b.date) : new Date(),
      content: String(b.content).trim(),
      category: String(b.category ?? "Khác").trim(),
      partner: b.partner ? String(b.partner).trim() : null,
    },
  });
  return ok(serializeCashFlow(row), 201);
});
