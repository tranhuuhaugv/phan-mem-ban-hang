import { db } from "@/lib/db";
import { requirePermission, HttpError } from "@/lib/auth";
import { handler, ok } from "@/lib/api-utils";

type Ctx = { params: Promise<{ id: string }> };

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
