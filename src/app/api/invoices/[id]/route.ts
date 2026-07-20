import { db } from "@/lib/db";
import { requirePermission, HttpError } from "@/lib/auth";
import { handler, ok, serializeInvoice } from "@/lib/api-utils";

type Ctx = { params: Promise<{ id: string }> };

export const GET = handler(async (_req: Request, { params }: Ctx) => {
  await requirePermission("hoa-don", "view");
  const { id } = await params;
  const row = await db.invoice.findUnique({
    where: { id },
    include: {
      order: true,
      items: { include: { machine: true } },
      warranties: { include: { machine: true } },
    },
  });
  if (!row) throw new HttpError(404, "Không tìm thấy hoá đơn");
  return ok({
    ...serializeInvoice(row),
    warranties: row.warranties.map((w) => ({
      id: w.id,
      serial: w.machine?.serial ?? "",
      months: w.months,
      condition: w.condition,
      startDate: w.startDate.toISOString(),
    })),
  });
});
