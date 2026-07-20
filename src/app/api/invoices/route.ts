import { db } from "@/lib/db";
import { requirePermission, HttpError } from "@/lib/auth";
import { handler, ok, serializeInvoice, nextCode, upsertCustomer } from "@/lib/api-utils";

export const GET = handler(async () => {
  await requirePermission("hoa-don", "view");
  const rows = await db.invoice.findMany({
    include: { order: true, items: { include: { machine: true } } },
    orderBy: { createdAt: "desc" },
  });
  return ok(rows.map(serializeInvoice));
});

// Tạo hoá đơn:
// - mode "direct": items = [{serial, price}] → máy chuyển Đã bán, ghi phiếu thu, bảo hành tuỳ chọn
// - mode "order": orderId → lấy máy từ đơn, đơn chuyển Đã giao, thu phần còn lại
export const POST = handler(async (req: Request) => {
  await requirePermission("hoa-don", "create");
  const b = await req.json();
  const code = await nextCode("invoice", "HD-", 4);

  if (b.mode === "order") {
    if (!b.orderId) throw new HttpError(400, "Chọn đơn hàng");
    const order = await db.order.findUnique({ where: { id: b.orderId }, include: { machine: true } });
    if (!order) throw new HttpError(404, "Không tìm thấy đơn hàng");
    if (order.status === "huy") throw new HttpError(409, "Đơn đã huỷ, không lập được hoá đơn");

    const row = await db.$transaction(async (tx) => {
      const invoice = await tx.invoice.create({
        data: {
          code,
          customerName: order.customerName,
          phone: order.phone || null,
          total: order.sellPrice,
          orderId: order.id,
          items: {
            create: [
              {
                name: order.machine ? `${order.machine.brand} ${order.machine.model}` : "Laptop",
                config: order.machine ? `${order.machine.cpu} · ${order.machine.ram} · ${order.machine.storage}` : "",
                price: order.sellPrice,
                machineId: order.machineId,
              },
            ],
          },
        },
        include: { order: true, items: { include: { machine: true } } },
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

  const custName = String(b.customerName ?? "Khách lẻ").trim() || "Khách lẻ";
  const custPhone = b.phone ? String(b.phone).trim() : "";

  const row = await db.$transaction(async (tx) => {
    // Tự lưu khách vào danh bạ (nếu có SĐT)
    if (custPhone) await upsertCustomer(tx, custName, custPhone);

    const invoice = await tx.invoice.create({
      data: {
        code,
        customerName: custName,
        phone: custPhone || null,
        total,
        items: {
          create: items.map((i) => {
            const m = machines.find((x) => x.serial === i.serial)!;
            return {
              name: `${m.brand} ${m.model}`,
              config: `${m.cpu} · ${m.ram} · ${m.storage}`,
              price: Number(i.price),
              machineId: m.id,
            };
          }),
        },
      },
      include: { order: true, items: { include: { machine: true } } },
    });

    await tx.machine.updateMany({ where: { id: { in: machines.map((m) => m.id) } }, data: { status: "da_ban" } });

    const cashCode = await nextCode("cashFlow", "PT-", 4);
    await tx.cashFlow.create({
      data: {
        code: cashCode,
        type: "thu",
        amount: total,
        content: `Bán hàng - hoá đơn ${code} (${items.length} sản phẩm)`,
        category: "Bán hàng",
        partner: invoice.customerName,
      },
    });

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

  return ok(serializeInvoice(row), 201);
});
