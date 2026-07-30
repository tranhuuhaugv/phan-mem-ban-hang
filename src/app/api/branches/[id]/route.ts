import { db } from "@/lib/db";
import { requirePermission, HttpError } from "@/lib/auth";
import { handler, ok } from "@/lib/api-utils";

type Ctx = { params: Promise<{ id: string }> };

export const PATCH = handler(async (req: Request, { params }: Ctx) => {
  await requirePermission("chi-nhanh", "edit");
  const { id } = await params;
  const b = await req.json();

  const branch = await db.branch.findUnique({ where: { id } });
  if (!branch) throw new HttpError(404, "Không tìm thấy chi nhánh");

  const newName = b.name !== undefined ? String(b.name).trim() : branch.name;
  if (!newName) throw new HttpError(400, "Tên chi nhánh không được trống");
  if (newName !== branch.name) {
    const dup = await db.branch.findUnique({ where: { name: newName } });
    if (dup) throw new HttpError(409, "Tên chi nhánh đã tồn tại");
  }

  const row = await db.branch.update({
    where: { id },
    data: {
      name: newName,
      address: b.address !== undefined ? (b.address ? String(b.address).trim() : null) : undefined,
      phone: b.phone !== undefined ? (b.phone ? String(b.phone).trim() : null) : undefined,
      note: b.note !== undefined ? (b.note ? String(b.note).trim() : null) : undefined,
    },
  });
  return ok(row);
});

export const DELETE = handler(async (_req: Request, { params }: Ctx) => {
  await requirePermission("chi-nhanh", "remove");
  const { id } = await params;
  const branch = await db.branch.findUnique({ where: { id } });
  if (!branch) throw new HttpError(404, "Không tìm thấy chi nhánh");
  const used = await db.machine.count({ where: { branchId: id } });
  if (used > 0) throw new HttpError(409, `Không thể xoá — đang có ${used} máy thuộc chi nhánh này`);
  await db.branch.delete({ where: { id } });
  return ok({ ok: true });
});
