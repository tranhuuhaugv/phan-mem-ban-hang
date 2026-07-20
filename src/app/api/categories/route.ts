import { db } from "@/lib/db";
import { requirePermission, HttpError } from "@/lib/auth";
import { handler, ok } from "@/lib/api-utils";

export const GET = handler(async () => {
  await requirePermission("danh-muc", "view");
  const [cats, machines] = await Promise.all([
    db.category.findMany({ orderBy: { name: "asc" } }),
    db.machine.findMany({ select: { category: true } }),
  ]);
  const data = cats.map((c) => ({
    id: c.id,
    name: c.name,
    note: c.note ?? undefined,
    machineCount: machines.filter((m) => m.category === c.name).length,
  }));
  return ok(data);
});

export const POST = handler(async (req: Request) => {
  await requirePermission("danh-muc", "create");
  const b = await req.json();
  const name = String(b.name ?? "").trim();
  if (!name) throw new HttpError(400, "Nhập tên danh mục");
  const dup = await db.category.findUnique({ where: { name } });
  if (dup) throw new HttpError(409, "Danh mục này đã tồn tại");
  const row = await db.category.create({
    data: { name, note: b.note ? String(b.note).trim() : null },
  });
  return ok(row, 201);
});
