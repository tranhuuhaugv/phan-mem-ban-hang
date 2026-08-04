import { db } from "@/lib/db";
import { requirePermission, HttpError } from "@/lib/auth";
import { handler, ok, serializeInvoice, nextCode, upsertCustomer } from "@/lib/api-utils";
import { logAudit, auditVnd } from "@/lib/audit";

export const GET = handler(async () => {
  await requirePermission("hoa-don", "view");
  const rows = await db.invoice.findMany({
    include: { order: true, repair: true, seller: true, items: { include: { machine: true } } },
    orderBy: { createdAt: "desc" },
  });
  return ok(rows.map(serializeInvoice));
});

// Tạo hoá đơn / phiếu thanh toán:
// - mode "direct": items = [{serial, price}] → máy Đã bán, ghi phiếu thu, bảo hành tuỳ chọn
// - mode "order": orderId → lấy máy từ đơn, đơn Đã giao, thu phần còn lại
// - mode "repair": repairId → thu tiền công sửa, ghi phiếu thu
export const POST = handler(async (req: Request) => {
  const user = await requirePermission("hoa-don", "create");
  const b = await req.json();
  const code = await nextCode("invoice", "HD-", 4);

  // ===== Phiếu thanh toán từ phiếu sửa chữa =====
  if (b.mode === "repair") {
    if (!b.repairId) throw new HttpError(400, "Chọn phiếu sửa chữa");
    const repair = await db.repair.findUnique({ where: { id: b.repairId }, include: { machine: true } });
    if (!repair) throw new HttpError(404, "Không tìm thấy phiếu sửa");
    const existed = await db.invoice.findFirst({ where: { repairId: repair.id } });
    if (existed) throw new HttpError(409, `Phiếu sửa này đã có hoá đơn ${existed.code}`);

    const machineName = repair.machine ? `${repair.machine.brand} ${repair.machine.model}` : (repair.machineName ?? "Máy");
    const cost = repair.actualCost ?? repair.estCost;
    const custName = repair.customerName?.trim() || "Khách sửa chữa";
    const custPhone = repair.customerPhone?.trim() || "";

    const row = await db.$transaction(async (tx) => {
      if (custPhone) await upsertCustomer(tx, custName, custPhone);
      const invoice = await tx.invoice.create({
        data: {
          code,
          sellerId: user.id,
          kind: "sua_chua",
          customerName: custName,
          phone: custPhone || null,
          total: cost,
          paid: cost,
          payMethod: "tien_mat",
          repairId: repair.id,
          items: {
            create: [
              {
                name: `Sửa chữa: ${machineName} (${repair.code})`,
                config: repair.errorDesc,
                price: cost,
                machineId: repair.machineId,
              },
            ],
          },
        },
        include: { order: true, repair: true, items: { include: { machine: true } } },
      });
      const cashCode = await nextCode("cashFlow", "PT-", 4);
      await tx.cashFlow.create({
        data: {
          code: cashCode,
          type: "thu",
          amount: cost,
          content: `Thu tiền công sửa - phiếu ${repair.code} (HĐ ${code})`,
          category: "Sửa chữa",
          partner: custName,
          invoiceId: invoice.id,
        },
      });
      return invoice;
    });
    await logAudit(user, "create", "invoice", row.code, `Tạo hoá đơn ${row.code} — ${auditVnd(row.total)}`);
  return ok(serializeInvoice(row), 201);
  }

  if (b.mode === "order") {
    if (!b.orderId) throw new HttpError(400, "Chọn đơn hàng");
    const order = await db.order.findUnique({ where: { id: b.orderId }, include: { machine: true } });
    if (!order) throw new HttpError(404, "Không tìm thấy đơn hàng");
    if (order.status === "huy") throw new HttpError(409, "Đơn đã huỷ, không lập được hoá đơn");

    const row = await db.$transaction(async (tx) => {
      const invoice = await tx.invoice.create({
        data: {
          code,
          sellerId: user.id,
          kind: "don_hang",
          customerName: order.customerName,
          phone: order.phone || null,
          total: order.sellPrice,
          paid: order.sellPrice,
          payMethod: "tien_mat",
          orderId: order.id,
          items: {
            create: [
              {
                name: order.machine ? `${order.machine.brand} ${order.machine.model}` : "Laptop",
                config: order.machine ? [order.machine.cpu, order.machine.ram, order.machine.storage].filter(Boolean).join(" · ") : "",
                price: order.sellPrice,
                machineId: order.machineId,
              },
            ],
          },
        },
        include: { order: true, repair: true, items: { include: { machine: true } } },
      });

      if (order.status !== "da_giao") {
        await tx.order.update({ where: { id: order.id }, data: { status: "da_giao" } });
        if (order.machineId) await tx.machine.update({ where: { id: order.machineId }, data: { status: "da_ban" } });
        const remain = order.sellPrice - order.deposit;
        if (remain > 0) {
          const cashCode = await nextCode("cashFlow", "PT-", 4);
          await tx.cashFlow.create({
            data: {
              code: cashCode,
              type: "thu",
              amount: remain,
              content: `Thanh toán đơn ${order.code} (HĐ ${code})`,
              category: "Bán hàng",
              partner: order.customerName,
              invoiceId: invoice.id,
            },
          });
        }
      }

      if (b.warranty?.months) {
        await tx.warranty.create({
          data: {
            months: Number(b.warranty.months) || 6,
            condition: String(b.warranty.condition ?? "").trim(),
            machineId: order.machineId,
            invoiceId: invoice.id,
          },
        });
      }
      return invoice;
    });
    await logAudit(user, "create", "invoice", row.code, `Tạo hoá đơn ${row.code} — ${auditVnd(row.total)}`);
  return ok(serializeInvoice(row), 201);
  }

  // ===== Bán trực tiếp từ kho =====
  const items: { serial: string; price: number }[] = Array.isArray(b.items) ? b.items : [];
  if (items.length === 0) throw new HttpError(400, "Thêm ít nhất 1 sản phẩm");
  if (items.some((i) => !Number(i.price) || Number(i.price) <= 0)) throw new HttpError(400, "Nhập giá bán cho tất cả sản phẩm");

  const machines = await db.machine.findMany({ where: { serial: { in: items.map((i) => i.serial) } } });
  if (machines.length !== items.length) throw new HttpError(404, "Có Mã SP không tồn tại trong kho");
  const notInStock = machines.filter((m) => m.status !== "ton_kho");
  if (notInStock.length > 0)
    throw new HttpError(409, `Máy không còn tồn kho: ${notInStock.map((m) => m.serial).join(", ")}`);

  const total = items.reduce((s, i) => s + Number(i.price), 0);

  // Thanh toán: mặc định thu đủ; cho phép thu một phần (còn nợ) và tách nhiều hình thức
  const norm = (m: unknown) => (m === "the" || m === "chuyen_khoan" ? m : "tien_mat");
  const rawPay: { method: string; amount: number }[] = Array.isArray(b.payments)
    ? b.payments
        .map((p: { method?: string; amount?: number }) => ({ method: norm(p.method), amount: Math.round(Number(p.amount) || 0) }))
        .filter((p: { amount: number }) => p.amount > 0)
    : (() => {
        const amt =
          b.amountPaid === undefined || b.amountPaid === null || b.amountPaid === ""
            ? total
            : Math.round(Number(b.amountPaid) || 0);
        return amt > 0 ? [{ method: norm(b.payMethod), amount: amt }] : [];
      })();

  // Cắt theo tổng tiền hoá đơn (không thu quá)
  let remainCap = total;
  const payLines: { method: string; amount: number }[] = [];
  for (const l of rawPay) {
    if (remainCap <= 0) break;
    const p = Math.min(l.amount, remainCap);
    payLines.push({ method: l.method, amount: p });
    remainCap -= p;
  }
  const paid = payLines.reduce((s, l) => s + l.amount, 0);
  const payMethod = payLines.length ? payLines.slice().sort((a, b2) => b2.amount - a.amount)[0].method : "tien_mat";

  const custName = String(b.customerName ?? "Khách lẻ").trim() || "Khách lẻ";
  const custPhone = b.phone ? String(b.phone).trim() : "";

  const row = await db.$transaction(async (tx) => {
    // Tự lưu khách vào danh bạ (nếu có SĐT)
    if (custPhone) await upsertCustomer(tx, custName, custPhone);

    const invoice = await tx.invoice.create({
      data: {
        code,
        sellerId: user.id,
        kind: "ban",
        customerName: custName,
        phone: custPhone || null,
        total,
        paid,
        payMethod,
        items: {
          create: items.map((i) => {
            const m = machines.find((x) => x.serial === i.serial)!;
            return {
              name: `${m.brand} ${m.model}`,
              config: [m.cpu, m.ram, m.storage].filter(Boolean).join(" · "),
              price: Number(i.price),
              machineId: m.id,
            };
          }),
        },
      },
      include: { order: true, repair: true, items: { include: { machine: true } } },
    });

    await tx.machine.updateMany({ where: { id: { in: machines.map((m) => m.id) } }, data: { status: "da_ban" } });

    if (payLines.length > 0) {
      const firstCode = await nextCode("cashFlow", "PT-", 4);
      const baseNum = parseInt(firstCode.slice(3), 10) || 1;
      for (let i = 0; i < payLines.length; i++) {
        const l = payLines[i];
        await tx.cashFlow.create({
          data: {
            code: `PT-${String(baseNum + i).padStart(4, "0")}`,
            type: "thu",
            amount: l.amount,
            content: `Bán hàng - hoá đơn ${code}${paid < total ? " (trả một phần)" : ""}`,
            category: "Bán hàng",
            partner: invoice.customerName,
            method: l.method,
            invoiceId: invoice.id,
          },
        });
      }
    }

    if (b.warranty?.months) {
      for (const m of machines) {
        await tx.warranty.create({
          data: {
            months: Number(b.warranty.months) || 6,
            condition: String(b.warranty.condition ?? "").trim(),
            machineId: m.id,
            invoiceId: invoice.id,
          },
        });
      }
    }
    return invoice;
  });

  await logAudit(user, "create", "invoice", row.code, `Tạo hoá đơn ${row.code} — ${auditVnd(row.total)}`);
  return ok(serializeInvoice(row), 201);
});
