import { db } from "@/lib/db";
import { requirePermission, HttpError } from "@/lib/auth";
import { handler, ok, serializeMachine } from "@/lib/api-utils";
import type { Condition, MachineStatus } from "@/generated/prisma/enums";

type Ctx = { params: Promise<{ serial: string }> };

async function findMachine(serial: string) {
  const m = await db.machine.findFirst({
    where: { serial: { equals: decodeURIComponent(serial), mode: "insensitive" } },
  });
  if (!m) throw new HttpError(404, "Không tìm thấy sản phẩm");
  return m;
}

// Chi tiết máy + lịch sử vòng đời (nhập/thu/sửa/bán/bảo hành)
export const GET = handler(async (_req: Request, { params }: Ctx) => {
  await requirePermission("kho", "view");
  const { serial } = await params;
  const m = await findMachine(serial);

  const [buy, repairs, orders, warranties] = await Promise.all([
    db.buyReceipt.findFirst({ where: { machineId: m.id } }),
    db.repair.findMany({ where: { machineId: m.id } }),
    db.order.findMany({ where: { machineId: m.id } }),
    db.warranty.findMany({ where: { machineId: m.id }, include: { invoice: true } }),
  ]);

  const fmt = (n: number) => n.toLocaleString("vi-VN") + "₫";
  const history: { at: string; kind: string; label: string; detail: string }[] = [
    { at: m.createdAt.toISOString(), kind: "nhap", label: "Nhập kho", detail: `Nguồn: ${m.source} · Giá nhập ${fmt(m.purchasePrice)}` },
  ];
  if (buy)
    history.push({ at: buy.createdAt.toISOString(), kind: "thu", label: `Thu máy ${buy.code}`, detail: `Từ ${buy.customerName} · ${fmt(buy.price)}` });
  for (const r of repairs) {
    history.push({ at: r.receiveDate.toISOString(), kind: "sua", label: `Nhận sửa ${r.code}`, detail: `${r.errorDesc} · KTV ${r.technician ?? "?"}` });
    if (r.returnDate)
      history.push({ at: r.returnDate.toISOString(), kind: "sua", label: `Trả máy sau sửa ${r.code}`, detail: `Chi phí ${fmt(r.actualCost ?? r.estCost)}` });
  }
  for (const o of orders)
    history.push({ at: o.createdAt.toISOString(), kind: "ban", label: `Bán - đơn ${o.code}`, detail: `${o.customerName} · ${fmt(o.sellPrice)}` });
  for (const w of warranties)
    history.push({ at: w.startDate.toISOString(), kind: "bh", label: `Bảo hành${w.invoice ? ` (HĐ ${w.invoice.code})` : ""}`, detail: `${w.months} tháng · ${w.condition}` });
  history.sort((a, b) => a.at.localeCompare(b.at));

  return ok({ machine: serializeMachine(m), history });
});

export const PATCH = handler(async (req: Request, { params }: Ctx) => {
  await requirePermission("kho", "edit");
  const { serial } = await params;
  const m = await findMachine(serial);
  const b = await req.json();

  const row = await db.machine.update({
    where: { id: m.id },
    data: {
      brand: b.brand !== undefined ? String(b.brand) : undefined,
      model: b.model !== undefined ? String(b.model) : undefined,
      cpu: b.cpu !== undefined ? String(b.cpu) : undefined,
      ram: b.ram !== undefined ? String(b.ram) : undefined,
      storage: b.storage !== undefined ? String(b.storage) : undefined,
      screen: b.screen !== undefined ? String(b.screen) : undefined,
      condition: b.condition !== undefined ? (b.condition as Condition) : undefined,
      purchasePrice: b.purchasePrice !== undefined ? Number(b.purchasePrice) : undefined,
      source: b.source !== undefined ? String(b.source) : undefined,
      status: b.status !== undefined ? (b.status as MachineStatus) : undefined,
      note: b.note !== undefined ? (b.note ? String(b.note) : null) : undefined,
    },
  });
  return ok(serializeMachine(row));
});

export const DELETE = handler(async (_req: Request, { params }: Ctx) => {
  await requirePermission("kho", "remove");
  const { serial } = await params;
  const m = await findMachine(serial);

  const linked = await db.order.count({ where: { machineId: m.id } });
  if (linked > 0) throw new HttpError(409, "Máy đã có đơn hàng liên quan, không thể xoá");

  await db.$transaction([
    db.repair.deleteMany({ where: { machineId: m.id } }),
    db.warranty.deleteMany({ where: { machineId: m.id } }),
    db.buyReceipt.updateMany({ where: { machineId: m.id }, data: { machineId: null } }),
    db.machine.delete({ where: { id: m.id } }),
  ]);
  return ok({ ok: true });
});
