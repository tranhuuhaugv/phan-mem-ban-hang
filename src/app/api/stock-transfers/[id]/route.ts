import { db } from "@/lib/db";
import { requirePermission, HttpError } from "@/lib/auth";
import { handler, ok } from "@/lib/api-utils";

type Ctx = { params: Promise<{ id: string }> };

// Xoá phiếu chuyển: nếu đã nhận thì đưa máy về chi nhánh gửi
export const DELETE = handler(async (_req: Request, { params }: Ctx) => {
  await requirePermission("chuyen-kho", "remove");
  const { id } = await params;
  const t = await db.stockTransfer.findUnique({ where: { id }, include: { items: true } });
  if (!t) throw new HttpError(404, "Không tìm thấy phiếu chuyển");

  await db.$transaction(async (tx) => {
    if (t.status === "da_nhan" && t.fromBranchId) {
      await tx.machine.updateMany({ where: { id: { in: t.items.map((i) => i.machineId) } }, data: { branchId: t.fromBranchId } });
    }
    await tx.stockTransfer.delete({ where: { id } });
  });
  return ok({ ok: true });
});

// Chi tiết phiếu chuyển kho
export const GET = handler(async (_req: Request, { params }: Ctx) => {
  await requirePermission("chuyen-kho", "view");
  const { id } = await params;
  const r = await db.stockTransfer.findUnique({
    where: { id },
    include: { fromBranch: true, toBranch: true, items: { include: { machine: true } } },
  });
  if (!r) throw new HttpError(404, "Không tìm thấy phiếu chuyển");

  return ok({
    id: r.id,
    code: r.code,
    date: r.createdAt.toISOString(),
    fromBranch: r.fromBranch?.name ?? undefined,
    toBranch: r.toBranch?.name ?? undefined,
    status: r.status,
    senderNote: r.senderNote ?? undefined,
    receiverNote: r.receiverNote ?? undefined,
    createdByName: r.createdByName ?? undefined,
    receivedByName: r.receivedByName ?? undefined,
    receivedAt: r.receivedAt?.toISOString(),
    items: r.items.map((it) => ({
      id: it.id,
      serial: it.machine.serial,
      name: it.machine.model,
      note: it.note ?? undefined,
    })),
  });
});
