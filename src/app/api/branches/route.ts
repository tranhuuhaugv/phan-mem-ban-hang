import { db } from "@/lib/db";
import { requirePermission, HttpError } from "@/lib/auth";
import { handler, ok } from "@/lib/api-utils";

export const GET = handler(async () => {
  await requirePermission("chi-nhanh", "view");
  const rows = await db.branch.findMany({
    orderBy: { name: "asc" },
    include: { _count: { select: { machines: true } } },
  });
  return ok(
    rows.map((b) => ({
      id: b.id,
      name: b.name,
      address: b.address ?? undefined,
      phone: b.phone ?? undefined,
      note: b.note ?? undefined,
      machineCount: b._count.machines,
      createdByName: b.createdByName ?? undefined,
    })),
  );
});

export const POST = handler(async (req: Request) => {
  const user = await requirePermission("chi-nhanh", "create");
  const b = await req.json();
  const name = String(b.name ?? "").trim();
  if (!name) throw new HttpError(400, "Nhập tên chi nhánh");
  const dup = await db.branch.findUnique({ where: { name } });
  if (dup) throw new HttpError(409, "Chi nhánh này đã tồn tại");
  const row = await db.branch.create({
    data: {
      name,
      address: b.address ? String(b.address).trim() : null,
      phone: b.phone ? String(b.phone).trim() : null,
      note: b.note ? String(b.note).trim() : null,
      createdByName: user.fullName,
    },
  });
  return ok(row, 201);
});
