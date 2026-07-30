import { db } from "@/lib/db";
import { requirePermission, HttpError } from "@/lib/auth";
import { handler, ok } from "@/lib/api-utils";

type Ctx = { params: Promise<{ id: string }> };

// Nhận hàng: chuyển máy sang chi nhánh nhận + ghi người nhận, ngày nhận, ghi chú bên nhận
export const POST = handler(async (req: Request, { params }: Ctx) => {
  const user = await requirePermission("chuyen-kho", "edit");
  const { id } = await params;
  const b = await req.json().catch(() => ({}));

  const t = await db.stockTransfer.findUnique({ where: { id }, include: { items: true } });
  if (!t) throw new HttpError(404, "Không tìm thấy phiếu chuyển");
  if (t.status !== "dang_chuyen") throw new HttpError(409, "Phiếu đã được xử lý rồi");

  await db.$transaction(async (tx) => {
    // Chuyển máy sang chi nhánh nhận
    if (t.toBranchId) {
      await tx.machine.updateMany({
        where: { id: { in: t.items.map((i) => i.machineId) } },
        data: { branchId: t.toBranchId },
      });
    }
    await tx.stockTransfer.update({
      where: { id },
      data: {
        status: "da_nhan",
        receiverNote: b.receiverNote ? String(b.receiverNote).trim() : null,
        receivedByName: user.fullName,
        receivedAt: new Date(),
      },
    });
  });

  return ok({ ok: true, received: t.items.length });
});
