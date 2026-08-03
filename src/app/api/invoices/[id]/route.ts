import { db } from "@/lib/db";
import { requirePermission, HttpError } from "@/lib/auth";
import { handler, ok, serializeInvoice, nextCode } from "@/lib/api-utils";

type Ctx = { params: Promise<{ id: string }> };

// Xoá hoá đơn: đảo máy về tồn kho (bán trực tiếp) hoặc đặt cọc (đơn hàng); xoá phiếu thu + bảo hành của HĐ
export const DELETE = handler(async (_req: Request, { params }: Ctx) => {
  await requirePermission("hoa-don", "remove");
  const { id } = await params;
  const inv = await db.invoice.findUnique({ where: { id }, include: { items: true } });
  if (!inv) throw new HttpError(404, "Không tìm thấy hoá đơn");

  await db.$transaction(async (tx) => {
    if (inv.orderId) {
      const order = await tx.order.findUnique({ where: { id: inv.orderId } });
      if (order?.machineId) await tx.machine.update({ where: { id: order.machineId }, data: { status: "dat_coc" } });
      if (order) await tx.order.update({ where: { id: order.id }, data: { status: order.deposit > 0 ? "da_coc" : "cho_coc" } });
    } else if (inv.kind !== "sua_chua") {
      const machineIds = inv.items.map((i) => i.machineId).filter(Boolean) as string[];
      if (machineIds.length) await tx.machine.updateMany({ where: { id: { in: machineIds } }, data: { status: "ton_kho" } });
    }
    await tx.cashFlow.deleteMany({ where: { invoiceId: id } });
    await tx.warranty.deleteMany({ where: { invoiceId: id } });
    await tx.invoice.delete({ where: { id } });
  });
  return ok({ ok: true });
});

export const GET = handler(async (_req: Request, { params }: Ctx) => {
  await requirePermission("hoa-don", "view");
  const { id } = await params;
  const row = await db.invoice.findUnique({
    where: { id },
    include: {
      order: true,
      repair: true,
      items: { include: { machine: true } },
      warranties: { include: { machine: true } },
    },
  });
  if (!row) throw new HttpError(404, "Không tìm thấy hoá đơn");
  const payments = await db.cashFlow.findMany({ where: { invoiceId: id, type: "thu" }, orderBy: { date: "asc" } });
  return ok({
    ...serializeInvoice(row),
    warranties: row.warranties.map((w) => ({
      id: w.id,
      serial: w.machine?.serial ?? "",
      months: w.months,
      condition: w.condition,
      startDate: w.startDate.toISOString(),
    })),
    payments: payments.map((p) => ({
      id: p.id,
      code: p.code,
      amount: p.amount,
      method: p.method ?? undefined,
      date: p.date.toISOString(),
    })),
  });
});

// Sửa hoá đơn: đổi/thêm/xoá sản phẩm + khách → tính lại tổng, đảo trạng thái máy, giữ tiền đã thu
export const PATCH = handler(async (req: Request, { params }: Ctx) => {
  await requirePermission("hoa-don", "edit");
  const { id } = await params;
  const b = await req.json();

  const inv = await db.invoice.findUnique({ where: { id }, include: { items: true } });
  if (!inv) throw new HttpError(404, "Không tìm thấy hoá đơn");

  const wantItems = Array.isArray(b.items);
  const items = wantItems
    ? (b.items as { serial?: string; price?: number }[]).map((i) => ({ serial: String(i.serial ?? "").trim(), price: Math.max(0, Math.round(Number(i.price) || 0)) }))
    : [];

  const row = await db.$transaction(async (tx) => {
    if (wantItems) {
      if (items.length === 0) throw new HttpError(400, "Hoá đơn cần ít nhất 1 sản phẩm");
      if (items.some((i) => !i.price)) throw new HttpError(400, "Nhập giá bán cho tất cả sản phẩm");
      const machines = await tx.machine.findMany({ where: { serial: { in: items.map((i) => i.serial) } } });
      if (machines.length !== items.length) throw new HttpError(404, "Có Mã SP không tồn tại");
      const bySerial = new Map(machines.map((m) => [m.serial, m]));

      const oldMachineIds = inv.items.map((it) => it.machineId).filter(Boolean) as string[];
      const newMachineIds = machines.map((m) => m.id);
      const removed = oldMachineIds.filter((mid) => !newMachineIds.includes(mid));
      const added = machines.filter((m) => !oldMachineIds.includes(m.id));
      const notFree = added.filter((m) => m.status !== "ton_kho");
      if (notFree.length) throw new HttpError(409, `Máy không còn tồn kho: ${notFree.map((m) => m.serial).join(", ")}`);

      if (removed.length) await tx.machine.updateMany({ where: { id: { in: removed } }, data: { status: "ton_kho" } });
      if (added.length) await tx.machine.updateMany({ where: { id: { in: added.map((m) => m.id) } }, data: { status: "da_ban" } });

      const total = items.reduce((s, i) => s + i.price, 0);
      const basePaid = Math.min(inv.paid, total); // đã thu giữ nguyên, không vượt tổng mới

      // Thu thêm khi sửa (payments[]) — cắt theo phần còn nợ
      const norm = (m: unknown) => (m === "the" || m === "chuyen_khoan" ? m : "tien_mat");
      const rawPay = Array.isArray(b.payments)
        ? (b.payments as { method?: string; amount?: number }[])
            .map((p) => ({ method: norm(p.method), amount: Math.max(0, Math.round(Number(p.amount) || 0)) }))
            .filter((p) => p.amount > 0)
        : [];
      let remainDebt = total - basePaid;
      const applied: { method: string; amount: number }[] = [];
      for (const l of rawPay) {
        if (remainDebt <= 0) break;
        const p = Math.min(l.amount, remainDebt);
        applied.push({ method: l.method, amount: p });
        remainDebt -= p;
      }
      const finalPaid = basePaid + applied.reduce((s, l) => s + l.amount, 0);
      const finalMethod = applied.length ? applied.slice().sort((a, b2) => b2.amount - a.amount)[0].method : undefined;

      await tx.invoiceItem.deleteMany({ where: { invoiceId: id } });
      await tx.invoice.update({
        where: { id },
        data: {
          total,
          paid: finalPaid,
          ...(finalMethod ? { payMethod: finalMethod } : {}),
          customerName: b.customerName !== undefined ? String(b.customerName).trim() : undefined,
          phone: b.phone !== undefined ? (b.phone ? String(b.phone).trim() : null) : undefined,
          items: {
            create: items.map((i) => {
              const m = bySerial.get(i.serial)!;
              return {
                name: `${m.brand} ${m.model}`,
                config: [m.cpu, m.ram, m.storage].filter(Boolean).join(" · "),
                price: i.price,
                machineId: m.id,
              };
            }),
          },
        },
      });

      if (applied.length) {
        const firstCode = await nextCode("cashFlow", "PT-", 4);
        const baseNum = parseInt(firstCode.slice(3), 10) || 1;
        for (let i = 0; i < applied.length; i++) {
          const l = applied[i];
          await tx.cashFlow.create({
            data: {
              code: `PT-${String(baseNum + i).padStart(4, "0")}`,
              type: "thu",
              amount: l.amount,
              content: `Thanh toán hoá đơn ${inv.code}`,
              category: "Bán hàng",
              partner: inv.customerName,
              method: l.method,
              invoiceId: id,
            },
          });
        }
      }
    } else {
      await tx.invoice.update({
        where: { id },
        data: {
          customerName: b.customerName !== undefined ? String(b.customerName).trim() : undefined,
          phone: b.phone !== undefined ? (b.phone ? String(b.phone).trim() : null) : undefined,
        },
      });
    }
    return tx.invoice.findUnique({
      where: { id },
      include: { order: true, repair: true, seller: true, items: { include: { machine: true } } },
    });
  });

  return ok(serializeInvoice(row!));
});
