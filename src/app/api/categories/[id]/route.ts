import { db } from "@/lib/db";
import { requirePermission, HttpError } from "@/lib/auth";
import { handler, ok } from "@/lib/api-utils";
import type { Condition } from "@/generated/prisma/enums";

type Ctx = { params: Promise<{ id: string }> };

export const PATCH = handler(async (req: Request, { params }: Ctx) => {
  await requirePermission("danh-muc", "edit");
  const { id } = await params;
  const b = await req.json();
  const row = await db.category.update({
    where: { id },
    data: {
      brand: b.brand !== undefined ? String(b.brand) : undefined,
      model: b.model !== undefined ? String(b.model) : undefined,
      cpu: b.cpu !== undefined ? String(b.cpu) : undefined,
      ram: b.ram !== undefined ? String(b.ram) : undefined,
      storage: b.storage !== undefined ? String(b.storage) : undefined,
      type: b.type !== undefined ? (b.type as Condition) : undefined,
    },
  });
  return ok(row);
});

export const DELETE = handler(async (_req: Request, { params }: Ctx) => {
  await requirePermission("danh-muc", "remove");
  const { id } = await params;
  const cat = await db.category.findUnique({ where: { id } });
  if (!cat) throw new HttpError(404, "Không tìm thấy danh mục");
  const used = await db.machine.count({ where: { brand: cat.brand, model: cat.model } });
  if (used > 0) throw new HttpError(409, `Không thể xoá — đang có ${used} máy dùng danh mục này`);
  await db.category.delete({ where: { id } });
  return ok({ ok: true });
});
