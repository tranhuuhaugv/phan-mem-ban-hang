import { db } from "@/lib/db";
import { requirePermission, HttpError } from "@/lib/auth";
import { handler, ok } from "@/lib/api-utils";

type Ctx = { params: Promise<{ id: string }> };

export const PATCH = handler(async (req: Request, { params }: Ctx) => {
  await requirePermission("nha-cung-cap", "edit");
  const { id } = await params;
  const b = await req.json();

  const sup = await db.supplier.findUnique({ where: { id } });
  if (!sup) throw new HttpError(404, "Không tìm thấy nhà cung cấp");

  const newName = b.name !== undefined ? String(b.name).trim() : sup.name;
  if (!newName) throw new HttpError(400, "Tên nhà cung cấp không được trống");

  const newPhone = b.phone !== undefined ? (b.phone ? String(b.phone).trim() : null) : sup.phone;
  if (newPhone && newPhone !== sup.phone) {
    const dup = await db.supplier.findUnique({ where: { phone: newPhone } });
    if (dup) throw new HttpError(409, "Số điện thoại này đã có nhà cung cấp");
  }

  const row = await db.supplier.update({
    where: { id },
    data: {
      name: newName,
      phone: b.phone !== undefined ? newPhone : undefined,
      address: b.address !== undefined ? (b.address ? String(b.address).trim() : null) : undefined,
      note: b.note !== undefined ? (b.note ? String(b.note).trim() : null) : undefined,
    },
  });
  return ok(row);
});

export const DELETE = handler(async (_req: Request, { params }: Ctx) => {
  await requirePermission("nha-cung-cap", "remove");
  const { id } = await params;
  const sup = await db.supplier.findUnique({ where: { id } });
  if (!sup) throw new HttpError(404, "Không tìm thấy nhà cung cấp");
  const used = await db.machine.count({ where: { supplierId: id } });
  if (used > 0) throw new HttpError(409, `Không thể xoá — đang có ${used} máy nhập từ nhà cung cấp này`);
  await db.supplier.delete({ where: { id } });
  return ok({ ok: true });
});
