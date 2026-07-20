import { db } from "@/lib/db";
import { requirePermission, HttpError } from "@/lib/auth";
import { handler, ok, serializeOrder, nextCode } from "@/lib/api-utils";
import type { OrderStatus } from "@/generated/prisma/enums";

type Ctx = { params: Promise<{ id: string }> };

export const GET = handler(async (_req: Request, { params }: Ctx) => {
  await requirePermission("dat-hang", "view");
  const { id } = await params;
  const row = await db.order.findUnique({ where: { id }, include: { machine: true } });
  if (!row) throw new HttpError(404, "Không tìm thấy đơn hàng");
  return ok(serializeOrder(row));
});

// Đổi trạng thái đơn → tự cập nhật trạng thái máy + ghi thu tiền còn lại khi giao
export const PATCH = handler(async (req: Request, { params }: Ctx) => {
  await requirePermission("dat-hang", "edit");
  const { id } = await params;
  const b = await req.json();
  const status = b.status as OrderStatus | undefined;

  const order = await db.order.findUnique({ where: { id } });
  if (!order) throw new HttpError(404, "Không tìm thấy đơn hàng");

  const row = await db.$transaction(async (tx) => {
    const updated = await tx.order.update({
      where: { id },
      data: {
        status,
        deposit: b.deposit !== undefined ? Number(b.deposit) : undefined,
        sellPrice: b.sellPrice !== undefined ? Number(b.sellPrice) : undefined,
      },
      include: { machine: true },
    });

    if (status && order.machineId) {
      if (status === "da_giao") {
        await tx.machine.update({ where: { id: order.machineId }, data: { status: "da_ban" } });
        const remain = updated.sellPrice - updated.deposit;
        if (remain > 0) {
          const cashCode = await nextCode("cashFlow", "PT-", 4);
          await tx.cashFlow.create({
            data: {
              code: cashCode,
              type: "thu",
              amount: remain,
              content: `Thanh toán còn lại đơn ${updated.code}`,
              category: "Bán hàng",
              partner: updated.customerName,
            },
          });
        }
      } else if (status === "huy") {
        await tx.machine.update({ where: { id: order.machineId }, data: { status: "ton_kho" } });
      } else if (status === "da_coc" || status === "cho_coc") {
        await tx.machine.update({ where: { id: order.machineId }, data: { status: "dat_coc" } });
      }
    }
    return updated;
  });

  return ok(serializeOrder(row));
});
