import { db } from "@/lib/db";
import { requirePermission, HttpError } from "@/lib/auth";
import { handler, ok } from "@/lib/api-utils";

export const GET = handler(async () => {
  await requirePermission("nha-cung-cap", "view");
  const rows = await db.supplier.findMany({
    orderBy: { name: "asc" },
    include: { _count: { select: { machines: true } } },
  });
  return ok(
    rows.map((s) => ({
      id: s.id,
      name: s.name,
      phone: s.phone ?? undefined,
      address: s.address ?? undefined,
      note: s.note ?? undefined,
      debt: s.debt,
      machineCount: s._count.machines,
      createdByName: s.createdByName ?? undefined,
    })),
  );
});

export const POST = handler(async (req: Request) => {
  const user = await requirePermission("nha-cung-cap", "create");
  const b = await req.json();
  const name = String(b.name ?? "").trim();
  if (!name) throw new HttpError(400, "Nhập tên nhà cung cấp");
  const phone = b.phone ? String(b.phone).trim() : null;
  if (phone) {
    const dup = await db.supplier.findUnique({ where: { phone } });
    if (dup) throw new HttpError(409, "Số điện thoại này đã có nhà cung cấp");
  }
  const row = await db.supplier.create({
    data: {
      name,
      phone,
      address: b.address ? String(b.address).trim() : null,
      note: b.note ? String(b.note).trim() : null,
      createdByName: user.fullName,
    },
  });
  return ok(row, 201);
});
