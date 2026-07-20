import { db } from "@/lib/db";
import { requirePermission, HttpError } from "@/lib/auth";
import { handler, ok, serializeRepair, nextCode } from "@/lib/api-utils";

export const GET = handler(async () => {
  await requirePermission("sua-chua", "view");
  const rows = await db.repair.findMany({ include: { machine: true }, orderBy: { receiveDate: "desc" } });
  return ok(rows.map(serializeRepair));
});

export const POST = handler(async (req: Request) => {
  await requirePermission("sua-chua", "create");
  const b = await req.json();
  if (!b.errorDesc) throw new HttpError(400, "Nhập mô tả lỗi");

  // Máy trong kho (tuỳ chọn) — nếu có thì chuyển trạng thái Đang sửa
  let machineId: string | null = null;
  if (b.serial) {
    const machine = await db.machine.findFirst({
      where: { serial: { equals: String(b.serial).trim(), mode: "insensitive" } },
    });
    if (!machine) throw new HttpError(404, "Không tìm thấy máy với Mã SP này (bỏ trống nếu là máy khách mang tới)");
    machineId = machine.id;
  }

  const code = await nextCode("repair", "SC-", 4);
  const row = await db.$transaction(async (tx) => {
    const repair = await tx.repair.create({
      data: {
        code,
        errorDesc: String(b.errorDesc).trim(),
        estCost: Number(b.estCost) || 0,
        technician: b.technician ? String(b.technician).trim() : null,
        receiveDate: b.receiveDate ? new Date(b.receiveDate) : new Date(),
        machineId,
      },
      include: { machine: true },
    });
    if (machineId) await tx.machine.update({ where: { id: machineId }, data: { status: "dang_sua" } });
    return repair;
  });
  return ok(serializeRepair(row), 201);
});
