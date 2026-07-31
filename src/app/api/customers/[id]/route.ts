import { db } from "@/lib/db";
import { requirePermission, HttpError } from "@/lib/auth";
import { handler, ok } from "@/lib/api-utils";

type Ctx = { params: Promise<{ id: string }> };

const fmt = (n: number) => n.toLocaleString("vi-VN") + "₫";
const ORDER_LABEL: Record<string, string> = { cho_coc: "Chờ cọc", da_coc: "Đã cọc", da_giao: "Đã giao", huy: "Huỷ" };
const REPAIR_LABEL: Record<string, string> = { dang_sua: "Đang sửa", cho_linh_kien: "Chờ linh kiện", hoan_tat: "Hoàn tất" };

// Chi tiết 1 khách hàng + lịch sử giao dịch (mua / bán máy cũ / sửa chữa)
export const GET = handler(async (_req: Request, { params }: Ctx) => {
  await requirePermission("khach-hang", "view");
  const { id } = await params;

  const c = await db.customer.findUnique({ where: { id } });
  if (!c) throw new HttpError(404, "Không tìm thấy khách hàng");
  const phone = c.phone;

  const [orders, invoices, repairs, buys] = await Promise.all([
    db.order.findMany({ where: { OR: [{ customerId: id }, { phone }] }, include: { machine: true } }),
    db.invoice.findMany({ where: { phone, kind: "ban" } }),
    db.repair.findMany({ where: { customerPhone: phone }, include: { machine: true } }),
    db.buyReceipt.findMany({ where: { phone } }),
  ]);

  const events: { at: string; kind: string; label: string; detail: string }[] = [];
  for (const o of orders) {
    const model = o.machine ? `${o.machine.brand} ${o.machine.model}` : "(chưa gán máy)";
    events.push({ at: o.createdAt.toISOString(), kind: "ban", label: `Đơn hàng ${o.code}`, detail: `${model} · ${fmt(o.sellPrice)} · ${ORDER_LABEL[o.status] ?? o.status}` });
  }
  for (const iv of invoices) {
    events.push({ at: iv.createdAt.toISOString(), kind: "ban", label: `Hoá đơn ${iv.code}`, detail: `${fmt(iv.total)}${iv.total - iv.paid > 0 ? ` · còn nợ ${fmt(iv.total - iv.paid)}` : ""}` });
  }
  for (const r of repairs) {
    const model = r.machine ? `${r.machine.brand} ${r.machine.model}` : (r.machineName ?? "Máy");
    events.push({ at: r.receiveDate.toISOString(), kind: "sua", label: `Sửa chữa ${r.code}`, detail: `${model} · ${r.errorDesc} · ${REPAIR_LABEL[r.status] ?? r.status}` });
  }
  for (const b of buys) {
    events.push({ at: b.createdAt.toISOString(), kind: "thu", label: `Bán máy cũ ${b.code}`, detail: `${b.model} · ${fmt(b.price)}` });
  }
  events.sort((a, b) => b.at.localeCompare(a.at));

  const spentOrders = orders.filter((o) => o.status === "da_giao").reduce((s, o) => s + o.sellPrice, 0);
  const spentInvoices = invoices.reduce((s, iv) => s + iv.total, 0);
  const spentRepairs = repairs.reduce((s, r) => s + (r.actualCost ?? 0), 0);

  return ok({
    customer: { id: c.id, name: c.name, phone: c.phone, address: c.address ?? undefined, note: c.note ?? undefined },
    stats: {
      orderCount: orders.length,
      repairCount: repairs.length,
      buyCount: buys.length,
      totalSpent: spentOrders + spentInvoices + spentRepairs,
    },
    events,
  });
});
