import { db } from "@/lib/db";
import { requirePermission, HttpError } from "@/lib/auth";
import { handler, ok, serializeRepair, nextCode } from "@/lib/api-utils";
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

  const amountPaid = b.amountPaid !== undefined ? Math.max(0, Math.round(Number(b.amountPaid) || 0)) : 0;
  const payMethod = b.payMethod === "chuyen_khoan" ? "chuyen_khoan" : "tien_mat";

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
      include: { machine: true, branch: true },
    });
    if (status === "hoan_tat" && repair.machineId) {
      await tx.machine.update({ where: { id: repair.machineId }, data: { status: "ton_kho" } });
    }
    // Thu tiền khi hoàn tất (khách tới lấy)
    if (status === "hoan_tat" && amountPaid > 0) {
      const cashCode = await nextCode("cashFlow", "PT-", 4);
      await tx.cashFlow.create({
        data: {
          code: cashCode,
          type: "thu",
          amount: amountPaid,
          content: `Thu tiền sửa chữa - phiếu ${repair.code}`,
          category: "Sửa chữa",
          partner: repair.customerName,
          method: payMethod,
        },
      });
    }
    return updated;
  });
  return ok(serializeRepair(row));
});
