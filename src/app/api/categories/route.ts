import { db } from "@/lib/db";
import { requirePermission, HttpError } from "@/lib/auth";
import { handler, ok } from "@/lib/api-utils";
import type { Condition } from "@/generated/prisma/enums";

export const GET = handler(async () => {
  await requirePermission("danh-muc", "view");
  const [cats, machines] = await Promise.all([
    db.category.findMany({ orderBy: [{ brand: "asc" }, { model: "asc" }] }),
    db.machine.findMany({ select: { brand: true, model: true } }),
  ]);
  // Đếm số máy đang dùng danh mục (khớp hãng + model)
  const data = cats.map((c) => ({
    ...c,
    machineCount: machines.filter((m) => m.brand === c.brand && m.model === c.model).length,
  }));
  return ok(data);
});

export const POST = handler(async (req: Request) => {
  await requirePermission("danh-muc", "create");
  const b = await req.json();
  if (!b.brand || !b.model) throw new HttpError(400, "Nhập Hãng và Model");
  const row = await db.category.create({
    data: {
      brand: String(b.brand).trim(),
      model: String(b.model).trim(),
      cpu: String(b.cpu ?? "").trim(),
      ram: String(b.ram ?? "").trim(),
      storage: String(b.storage ?? "").trim(),
      type: (b.type ?? "like_new") as Condition,
    },
  });
  return ok(row, 201);
});
