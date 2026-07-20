import { db } from "@/lib/db";
import { requirePermission, HttpError } from "@/lib/auth";
import { handler, ok, serializeRepair } from "@/lib/api-utils";
import type { RepairStatus } from "@/generated/prisma/enums";

type Ctx = { params: Promise<{ id: string }> };

// Cập nhật phiếu sửa (KTV, chi phí thực tế, trạng thái) — hoàn tất trả máy về Tồn kho
export const PATCH = handler(async (req: Request, { params }: Ctx) => {
  await requirePermission("sua-chua", "edit");
  const { id } = await params;
  const b = await req.json();
  const status = b.status as RepairStatus | undefined;

  const repair = await db.repair.findUnique({ where: { id } });
  if (!repair) throw new HttpError(404, "Không tìm thấy phiếu sửa");

  const row = await db.$transaction(async (tx) => {
    const updated = await tx.repair.update({
      where: { id },
      data: {
        status,
        technician: b.technician !== undefined ? String(b.technician) : undefined,
        actualCost: b.actualCost !== undefined ? Number(b.actualCost) : undefined,
        note: b.note !== undefined ? (b.note ? String(b.note) : null) : undefined,
        returnDate: status === "hoan_tat" ? new Date() : undefined,
      },
      include: { machine: true },
    });
    if (status === "hoan_tat" && repair.machineId) {
      await tx.machine.update({ where: { id: repair.machineId }, data: { status: "ton_kho" } });
    }
    return updated;
  });
  return ok(serializeRepair(row));
});
