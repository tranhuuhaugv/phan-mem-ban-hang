import { db } from "@/lib/db";
import { requirePermission, HttpError } from "@/lib/auth";
import { handler, ok, serializeOrder, nextCode } from "@/lib/api-utils";

export const GET = handler(async () => {
  await requirePermission("dat-hang", "view");
  const rows = await db.order.findMany({ include: { machine: true }, orderBy: { createdAt: "desc" } });
  return ok(rows.map(serializeOrder));
});

export const POST = handler(async (req: Request) => {
  await requirePermission("dat-hang", "create");
  const b = await req.json();
  if (!b.customerName) throw new HttpError(400, "Nhập tên khách hàng");
  if (!b.serial) throw new HttpError(400, "Chọn máy (Mã SP) để bán");

  const machine = await db.machine.findUnique({ where: { serial: String(b.serial).trim().toUpperCase() } });
  if (!machine) throw new HttpError(404, "Không tìm thấy máy trong kho");
  if (machine.status !== "ton_kho") throw new HttpError(409, "Máy này không còn tồn kho (đã được giữ/bán)");

  const code = await nextCode("order", "DH-", 4);
  const deposit = Number(b.deposit) || 0;
  const phone = String(b.phone ?? "").trim();

  const row = await db.$transaction(async (tx) => {
    // Gắn khách hàng (tạo mới nếu chưa có, theo SĐT)
    let customerId: string | null = null;
    if (phone) {
      const customer = await tx.customer.upsert({
        where: { phone },
        update: { name: String(b.customerName).trim() },
        create: { name: String(b.customerName).trim(), phone },
      });
      customerId = customer.id;
    }

    const order = await tx.order.create({
      data: {
        code,
        customerName: String(b.customerName).trim(),
        phone,
        sellPrice: Number(b.sellPrice) || 0,
        deposit,
        status: deposit > 0 ? "da_coc" : "cho_coc",
        machineId: machine.id,
        customerId,
      },
      include: { machine: true },
    });

    // Giữ máy — chuyển trạng thái Đặt cọc
    await tx.machine.update({ where: { id: machine.id }, data: { status: "dat_coc" } });

    // Có cọc → ghi phiếu thu
    if (deposit > 0) {
      const cashCode = await nextCode("cashFlow", "PT-", 4);
      await tx.cashFlow.create({
        data: {
          code: cashCode,
          type: "thu",
          amount: deposit,
          content: `Cọc đơn ${code}`,
          category: "Bán hàng",
          partner: String(b.customerName).trim(),
        },
      });
    }
    return order;
  });

  return ok(serializeOrder(row), 201);
});
