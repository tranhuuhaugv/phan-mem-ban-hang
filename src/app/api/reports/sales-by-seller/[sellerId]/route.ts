import { db } from "@/lib/db";
import { requirePermission, HttpError } from "@/lib/auth";
import { handler, ok } from "@/lib/api-utils";

type Ctx = { params: Promise<{ sellerId: string }> };

const fmt = (n: number) => n.toLocaleString("vi-VN") + "₫";
const KIND_LABEL: Record<string, string> = {
  ban: "Bán trực tiếp",
  don_hang: "Từ đơn hàng",
  sua_chua: "Từ sửa chữa",
};

// Chi tiết bán hàng của 1 người tạo hoá đơn + lịch sử từng hoá đơn (giống lịch sử khách hàng)
export const GET = handler(async (_req: Request, { params }: Ctx) => {
  await requirePermission("tong-quan", "view");
  const { sellerId } = await params;

  const acc = await db.account.findUnique({ where: { id: sellerId } });
  if (!acc) throw new HttpError(404, "Không tìm thấy người bán");

  const invoices = await db.invoice.findMany({
    where: { sellerId },
    orderBy: { createdAt: "desc" },
  });

  const events = invoices.map((iv) => {
    const debt = iv.total - iv.paid;
    return {
      at: iv.createdAt.toISOString(),
      kind: "ban",
      label: `Hoá đơn ${iv.code}`,
      detail: `${iv.customerName} · ${fmt(iv.total)}${debt > 0 ? ` · còn nợ ${fmt(debt)}` : ""} · ${KIND_LABEL[iv.kind] ?? iv.kind}`,
    };
  });

  const revenue = invoices.reduce((s, iv) => s + iv.total, 0);
  const paid = invoices.reduce((s, iv) => s + iv.paid, 0);

  return ok({
    seller: { id: acc.id, name: acc.fullName, role: acc.role, username: acc.username },
    stats: { count: invoices.length, revenue, paid, debt: revenue - paid },
    events,
  });
});

// Xoá toàn bộ hoá đơn của 1 người bán (chỉ admin — quyền hoa-don remove).
// sellerId = "none" → xoá các hoá đơn không có người bán.
// Đảo máy về kho / đơn về đặt cọc, xoá phiếu thu + bảo hành như xoá từng hoá đơn.
export const DELETE = handler(async (_req: Request, { params }: Ctx) => {
  await requirePermission("hoa-don", "remove");
  const { sellerId } = await params;
  const where = sellerId === "none" ? { sellerId: null } : { sellerId };

  const invoices = await db.invoice.findMany({ where, include: { items: true } });
  if (invoices.length === 0) throw new HttpError(404, "Không có hoá đơn để xoá");

  await db.$transaction(async (tx) => {
    for (const inv of invoices) {
      if (inv.orderId) {
        const order = await tx.order.findUnique({ where: { id: inv.orderId } });
        if (order?.machineId) await tx.machine.update({ where: { id: order.machineId }, data: { status: "dat_coc" } });
        if (order) await tx.order.update({ where: { id: order.id }, data: { status: order.deposit > 0 ? "da_coc" : "cho_coc" } });
      } else if (inv.kind !== "sua_chua") {
        const machineIds = inv.items.map((i) => i.machineId).filter(Boolean) as string[];
        if (machineIds.length) await tx.machine.updateMany({ where: { id: { in: machineIds } }, data: { status: "ton_kho" } });
      }
      await tx.cashFlow.deleteMany({ where: { invoiceId: inv.id } });
      await tx.warranty.deleteMany({ where: { invoiceId: inv.id } });
      await tx.invoice.delete({ where: { id: inv.id } });
    }
  });

  return ok({ ok: true, deleted: invoices.length });
});
