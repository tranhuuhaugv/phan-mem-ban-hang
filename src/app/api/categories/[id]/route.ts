import { db } from "@/lib/db";
import { requirePermission, HttpError } from "@/lib/auth";
import { handler, ok } from "@/lib/api-utils";

type Ctx = { params: Promise<{ id: string }> };

export const PATCH = handler(async (req: Request, { params }: Ctx) => {
  await requirePermission("danh-muc", "edit");
  const { id } = await params;
  const b = await req.json();

  const cat = await db.category.findUnique({ where: { id } });
  if (!cat) throw new HttpError(404, "Không tìm thấy danh mục");

  const newName = b.name !== undefined ? String(b.name).trim() : cat.name;
  if (!newName) throw new HttpError(400, "Tên danh mục không được trống");

  // Đổi tên → cập nhật luôn máy đang gán danh mục cũ
  const row = await db.$transaction(async (tx) => {
    if (newName !== cat.name) {
      const dup = await tx.category.findUnique({ where: { name: newName } });
      if (dup) throw new HttpError(409, "Tên danh mục đã tồn tại");
      await tx.machine.updateMany({ where: { category: cat.name }, data: { category: newName } });
    }
    return tx.category.update({
      where: { id },
      data: { name: newName, note: b.note !== undefined ? (b.note ? String(b.note).trim() : null) : undefined },
    });
  });
  return ok(row);
});

export const DELETE = handler(async (_req: Request, { params }: Ctx) => {
  await requirePermission("danh-muc", "remove");
  const { id } = await params;
  const cat = await db.category.findUnique({ where: { id } });
  if (!cat) throw new HttpError(404, "Không tìm thấy danh mục");
  const used = await db.machine.count({ where: { category: cat.name } });
  if (used > 0) throw new HttpError(409, `Không thể xoá — đang có ${used} sản phẩm thuộc danh mục này`);
  await db.category.delete({ where: { id } });
  return ok({ ok: true });
});
