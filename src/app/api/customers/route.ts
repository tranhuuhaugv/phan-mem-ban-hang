import { db } from "@/lib/db";
import { requirePermission, HttpError } from "@/lib/auth";
import { handler, ok } from "@/lib/api-utils";

export const GET = handler(async () => {
  await requirePermission("khach-hang", "view");
  const rows = await db.customer.findMany({ include: { orders: true }, orderBy: { name: "asc" } });
  return ok(
    rows.map((c) => ({
      id: c.id,
      name: c.name,
      phone: c.phone,
      address: c.address ?? undefined,
      note: c.note ?? undefined,
      totalSpent: c.orders.filter((o) => o.status === "da_giao").reduce((s, o) => s + o.sellPrice, 0),
      orderCount: c.orders.length,
    })),
  );
});

export const POST = handler(async (req: Request) => {
  await requirePermission("khach-hang", "create");
  const b = await req.json();
  if (!b.name || !b.phone) throw new HttpError(400, "Nhập tên và số điện thoại");
  const row = await db.customer.create({
    data: {
      name: String(b.name).trim(),
      phone: String(b.phone).trim(),
      address: b.address ? String(b.address).trim() : null,
      note: b.note ? String(b.note).trim() : null,
    },
  });
  return ok(row, 201);
});
