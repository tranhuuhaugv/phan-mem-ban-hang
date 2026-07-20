// Đổ dữ liệu mẫu vào database — chạy: npx prisma db seed
import bcrypt from "bcryptjs";
import { PrismaPg } from "@prisma/adapter-pg";
import { PrismaClient } from "../src/generated/prisma/client";
import {
  machines,
  categories,
  buyReceipts,
  orders,
  repairs,
  cashFlows,
  invoices,
  warranties,
  customers,
  accounts,
} from "../src/lib/mock-data";
import { PERMISSIONS, type MenuKey } from "../src/lib/permissions";

const adapter = new PrismaPg({ connectionString: process.env.DATABASE_URL });
const db = new PrismaClient({ adapter });

async function main() {
  // Xoá sạch theo thứ tự phụ thuộc (chạy lại seed không bị trùng)
  await db.invoiceItem.deleteMany();
  await db.warranty.deleteMany();
  await db.invoice.deleteMany();
  await db.order.deleteMany();
  await db.repair.deleteMany();
  await db.buyReceipt.deleteMany();
  await db.cashFlow.deleteMany();
  await db.machine.deleteMany();
  await db.category.deleteMany();
  await db.customer.deleteMany();
  await db.account.deleteMany();

  // Máy trong kho
  const machineIdBySerial = new Map<string, string>();
  for (const m of machines) {
    const row = await db.machine.create({
      data: {
        serial: m.serial,
        brand: m.brand,
        model: m.model,
        cpu: m.cpu,
        ram: m.ram,
        storage: m.storage,
        screen: m.screen,
        condition: m.condition,
        category: m.brand === "Apple" ? "Macbook" : "Laptop",
        purchasePrice: m.purchasePrice,
        source: m.source,
        status: m.status,
        note: m.note ?? null,
        createdAt: new Date(m.createdAt),
      },
    });
    machineIdBySerial.set(m.serial, row.id);
  }

  // Danh mục (loại sản phẩm)
  for (const c of categories) {
    await db.category.create({ data: { name: c.name, note: c.note ?? null } });
  }

  // Khách hàng
  const customerIdByName = new Map<string, string>();
  for (const cu of customers) {
    const row = await db.customer.create({
      data: { name: cu.name, phone: cu.phone, address: cu.address ?? null, note: cu.note ?? null },
    });
    customerIdByName.set(cu.name, row.id);
  }

  // Phiếu thu máy
  for (const b of buyReceipts) {
    await db.buyReceipt.create({
      data: {
        code: b.code,
        customerName: b.customerName,
        phone: b.phone,
        model: b.model,
        config: b.config,
        condition: b.condition,
        price: b.price,
        status: b.status,
        createdAt: new Date(b.date),
        machineId: b.serial ? (machineIdBySerial.get(b.serial) ?? null) : null,
      },
    });
  }

  // Đơn đặt hàng
  const orderIdByCode = new Map<string, string>();
  for (const o of orders) {
    const row = await db.order.create({
      data: {
        code: o.code,
        customerName: o.customerName,
        phone: o.phone,
        sellPrice: o.sellPrice,
        deposit: o.deposit,
        status: o.status,
        createdAt: new Date(o.date),
        machineId: o.serial ? (machineIdBySerial.get(o.serial) ?? null) : null,
        customerId: customerIdByName.get(o.customerName) ?? null,
      },
    });
    orderIdByCode.set(o.code, row.id);
  }

  // Phiếu sửa chữa
  for (const r of repairs) {
    await db.repair.create({
      data: {
        code: r.code,
        errorDesc: r.errorDesc,
        estCost: r.estCost,
        actualCost: r.actualCost ?? null,
        technician: r.technician ?? null,
        receiveDate: new Date(r.receiveDate),
        returnDate: r.returnDate ? new Date(r.returnDate) : null,
        status: r.status,
        machineId: machineIdBySerial.get(r.serial) ?? null,
      },
    });
  }

  // Thu chi
  for (const f of cashFlows) {
    await db.cashFlow.create({
      data: {
        code: f.code,
        type: f.type,
        date: new Date(f.date),
        amount: f.amount,
        content: f.content,
        category: f.category,
        partner: f.partner ?? null,
      },
    });
  }

  // Hoá đơn + dòng sản phẩm
  const invoiceIdByCode = new Map<string, string>();
  for (const iv of invoices) {
    const order = orders.find((o) => o.code === iv.orderCode);
    const machineId = order?.serial ? (machineIdBySerial.get(order.serial) ?? null) : null;
    const machine = machines.find((m) => m.serial === order?.serial);
    const row = await db.invoice.create({
      data: {
        code: iv.code,
        customerName: iv.customerName,
        phone: order?.phone ?? null,
        total: iv.value,
        createdAt: new Date(iv.date),
        orderId: orderIdByCode.get(iv.orderCode) ?? null,
        items: {
          create: [
            {
              name: machine ? `${machine.brand} ${machine.model}` : (order?.model ?? "Laptop"),
              config: machine ? `${machine.cpu} · ${machine.ram} · ${machine.storage}` : "",
              price: iv.value,
              machineId,
            },
          ],
        },
      },
    });
    invoiceIdByCode.set(iv.code, row.id);
  }

  // Bảo hành
  for (const w of warranties) {
    await db.warranty.create({
      data: {
        months: w.months,
        condition: w.condition,
        startDate: new Date(w.startDate),
        machineId: machineIdBySerial.get(w.serial) ?? null,
        invoiceId: invoiceIdByCode.get(w.invoiceCode) ?? null,
      },
    });
  }

  // Quyền mặc định cho Quản lý + Nhân viên (admin luôn toàn quyền, không cần lưu)
  await db.rolePermission.deleteMany();
  for (const role of ["manager", "staff"] as const) {
    for (const menu of Object.keys(PERMISSIONS) as MenuKey[]) {
      const p = PERMISSIONS[menu][role];
      await db.rolePermission.create({
        data: {
          role,
          menu,
          view: p.view,
          create: p.create,
          edit: p.edit,
          remove: p.remove,
          approve: p.approve ?? false,
          seeProfit: p.seeProfit ?? false,
          seeReport: p.seeReport ?? false,
        },
      });
    }
  }

  // Tài khoản — mật khẩu mặc định 123456 (đổi sau)
  const hash = await bcrypt.hash("123456", 10);
  for (const a of accounts) {
    await db.account.create({
      data: {
        username: a.username,
        passwordHash: hash,
        fullName: a.fullName,
        role: a.role,
        status: a.status,
        lastLogin: a.lastLogin ? new Date(a.lastLogin) : null,
      },
    });
  }

  const counts = {
    machines: await db.machine.count(),
    categories: await db.category.count(),
    buyReceipts: await db.buyReceipt.count(),
    orders: await db.order.count(),
    repairs: await db.repair.count(),
    cashFlows: await db.cashFlow.count(),
    invoices: await db.invoice.count(),
    warranties: await db.warranty.count(),
    customers: await db.customer.count(),
    accounts: await db.account.count(),
  };
  console.log("Seed xong:", counts);
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(() => db.$disconnect());
