import { db } from "@/lib/db";
import { requirePermission, HttpError } from "@/lib/auth";
import { handler, ok, serializeBuyReceipt, nextCode } from "@/lib/api-utils";

export const GET = handler(async () => {
  await requirePermission("thu-may", "view");
  const rows = await db.buyReceipt.findMany({ include: { machine: true }, orderBy: { createdAt: "desc" } });
  return ok(rows.map(serializeBuyReceipt));
});

export const POST = handler(async (req: Request) => {
  await requirePermission("thu-may", "create");
  const b = await req.json();
  if (!b.customerName || !b.model) throw new HttpError(400, "Nhập tên khách và model máy");

  const code = await nextCode("buyReceipt", "TM-", 4);
  const row = await db.buyReceipt.create({
    data: {
      code,
      customerName: String(b.customerName).trim(),
      phone: String(b.phone ?? "").trim(),
      model: String(b.model).trim(),
      config: String(b.config ?? "").trim(),
      condition: String(b.condition ?? "").trim(),
      price: Number(b.price) || 0,
    },
    include: { machine: true },
  });
  return ok(serializeBuyReceipt(row), 201);
});
