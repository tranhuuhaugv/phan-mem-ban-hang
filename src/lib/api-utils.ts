// Tiện ích dùng chung cho API routes
import { NextResponse } from "next/server";
import { HttpError } from "./auth";
import { db } from "./db";

// Bọc handler: bắt lỗi HttpError/Prisma → JSON có thông báo
export function handler<T extends unknown[]>(fn: (...args: T) => Promise<Response>) {
  return async (...args: T): Promise<Response> => {
    try {
      return await fn(...args);
    } catch (e) {
      if (e instanceof HttpError) {
        return NextResponse.json({ error: e.message }, { status: e.status });
      }
      const msg = e instanceof Error ? e.message : "Lỗi không xác định";
      // Lỗi ràng buộc duy nhất của Prisma
      if (msg.includes("Unique constraint")) {
        return NextResponse.json({ error: "Dữ liệu bị trùng (mã đã tồn tại)" }, { status: 409 });
      }
      console.error("[api]", e);
      return NextResponse.json({ error: msg }, { status: 500 });
    }
  };
}

export function ok(data: unknown, status = 200) {
  return NextResponse.json(data, { status });
}

// Sinh mã kế tiếp theo tiền tố: SP0009, TM-0046, DH-0130...
export async function nextCode(
  table: "machine" | "buyReceipt" | "order" | "repair" | "cashFlow" | "invoice",
  prefix: string,
  pad: number,
): Promise<string> {
  // Lấy mã lớn nhất hiện có cùng tiền tố
  let last: string | undefined;
  if (table === "machine") {
    const row = await db.machine.findFirst({ where: { serial: { startsWith: prefix } }, orderBy: { serial: "desc" } });
    last = row?.serial;
  } else if (table === "buyReceipt") {
    const row = await db.buyReceipt.findFirst({ where: { code: { startsWith: prefix } }, orderBy: { code: "desc" } });
    last = row?.code;
  } else if (table === "order") {
    const row = await db.order.findFirst({ where: { code: { startsWith: prefix } }, orderBy: { code: "desc" } });
    last = row?.code;
  } else if (table === "repair") {
    const row = await db.repair.findFirst({ where: { code: { startsWith: prefix } }, orderBy: { code: "desc" } });
    last = row?.code;
  } else if (table === "cashFlow") {
    const row = await db.cashFlow.findFirst({ where: { code: { startsWith: prefix } }, orderBy: { code: "desc" } });
    last = row?.code;
  } else {
    const row = await db.invoice.findFirst({ where: { code: { startsWith: prefix } }, orderBy: { code: "desc" } });
    last = row?.code;
  }
  const n = last ? parseInt(last.slice(prefix.length), 10) + 1 : 1;
  return `${prefix}${String(n).padStart(pad, "0")}`;
}

// Lưu khách vào danh bạ nếu có SĐT: có rồi → cập nhật tên, chưa có → tạo mới. Trả customerId.
// client = db hoặc transaction client (tx).
type CustomerUpsertClient = {
  customer: {
    upsert: (args: {
      where: { phone: string };
      update: { name?: string; address?: string; note?: string };
      create: { name: string; phone: string; address?: string; note?: string };
    }) => Promise<{ id: string }>;
  };
};

export async function upsertCustomer(
  client: CustomerUpsertClient,
  name: string,
  phone: string,
  extra?: { address?: string; note?: string },
): Promise<string | null> {
  const p = (phone ?? "").trim();
  if (!p) return null; // không có SĐT thì không lưu được (khoá dedup là SĐT)
  const n = (name ?? "").trim();
  const c = await client.customer.upsert({
    where: { phone: p },
    update: { ...(n ? { name: n } : {}), ...(extra ?? {}) },
    create: { name: n || "Khách lẻ", phone: p, ...(extra ?? {}) },
  });
  return c.id;
}

// Bỏ dấu phân cách thừa khi cấu hình rỗng: " ·  · " → ""
function cleanConfig(s: string): string {
  return s.split("·").map((p) => p.trim()).filter(Boolean).join(" · ");
}

// ===== Serializers: DB row → hình dạng UI đang dùng (src/lib/types.ts) =====

type MachineRow = {
  id: string;
  serial: string;
  brand: string;
  model: string;
  cpu: string;
  ram: string;
  storage: string;
  screen: string;
  condition: string;
  category: string | null;
  purchasePrice: number;
  salePrice?: number | null;
  source: string;
  status: string;
  note: string | null;
  branchId?: string | null;
  supplierId?: string | null;
  branch?: { name: string } | null;
  supplier?: { name: string } | null;
  createdAt: Date;
  createdByName?: string | null;
};

export function serializeMachine(m: MachineRow) {
  return {
    id: m.id,
    serial: m.serial,
    brand: m.brand,
    model: m.model,
    cpu: m.cpu,
    ram: m.ram,
    storage: m.storage,
    screen: m.screen,
    condition: m.condition,
    category: m.category ?? undefined,
    purchasePrice: m.purchasePrice,
    salePrice: m.salePrice ?? undefined,
    source: m.source,
    status: m.status,
    note: m.note ?? undefined,
    branchId: m.branchId ?? undefined,
    branchName: m.branch?.name ?? undefined,
    supplierId: m.supplierId ?? undefined,
    supplierName: m.supplier?.name ?? undefined,
    createdAt: m.createdAt.toISOString(),
    createdByName: m.createdByName ?? undefined,
  };
}

export function serializeBuyReceipt(b: {
  id: string;
  code: string;
  customerName: string;
  phone: string;
  model: string;
  config: string;
  condition: string;
  price: number;
  status: string;
  createdAt: Date;
  createdByName?: string | null;
  machine?: { serial: string } | null;
}) {
  return {
    id: b.id,
    code: b.code,
    customerName: b.customerName,
    phone: b.phone,
    model: b.model,
    config: b.config,
    condition: b.condition,
    price: b.price,
    status: b.status,
    serial: b.machine?.serial,
    date: b.createdAt.toISOString(),
    createdByName: b.createdByName ?? undefined,
  };
}

export function serializeOrder(o: {
  id: string;
  code: string;
  customerName: string;
  phone: string;
  sellPrice: number;
  deposit: number;
  status: string;
  createdAt: Date;
  createdByName?: string | null;
  machine?: { serial: string; brand: string; model: string; cpu: string; ram: string; storage: string } | null;
}) {
  return {
    id: o.id,
    code: o.code,
    customerName: o.customerName,
    phone: o.phone,
    serial: o.machine?.serial ?? "",
    model: o.machine ? `${o.machine.brand} ${o.machine.model}` : "(chưa gán máy)",
    config: o.machine ? `${o.machine.cpu} · ${o.machine.ram} · ${o.machine.storage}` : "",
    sellPrice: o.sellPrice,
    deposit: o.deposit,
    status: o.status,
    date: o.createdAt.toISOString(),
    createdByName: o.createdByName ?? undefined,
  };
}

export function serializeRepair(r: {
  id: string;
  code: string;
  machineName: string | null;
  customerName: string | null;
  customerPhone: string | null;
  errorDesc: string;
  estCost: number;
  actualCost: number | null;
  technician: string | null;
  receiveDate: Date;
  returnDate: Date | null;
  note: string | null;
  status: string;
  createdByName?: string | null;
  machine?: { serial: string; brand: string; model: string } | null;
  branch?: { name: string } | null;
}) {
  return {
    id: r.id,
    code: r.code,
    serial: r.machine?.serial ?? "",
    inStock: !!r.machine,
    branchName: r.branch?.name ?? undefined,
    // Tên máy: máy trong kho → hãng+model, máy khách → machineName
    model: r.machine ? `${r.machine.brand} ${r.machine.model}` : (r.machineName ?? ""),
    customerName: r.customerName ?? undefined,
    customerPhone: r.customerPhone ?? undefined,
    errorDesc: r.errorDesc,
    estCost: r.estCost,
    actualCost: r.actualCost ?? undefined,
    technician: r.technician ?? undefined,
    receiveDate: r.receiveDate.toISOString(),
    returnDate: r.returnDate?.toISOString(),
    note: r.note ?? undefined,
    status: r.status,
    createdByName: r.createdByName ?? undefined,
  };
}

export function serializeCashFlow(f: {
  id: string;
  code: string;
  type: string;
  date: Date;
  amount: number;
  content: string;
  category: string;
  partner: string | null;
  method?: string | null;
  createdByName?: string | null;
}) {
  return {
    id: f.id,
    code: f.code,
    type: f.type,
    date: f.date.toISOString(),
    amount: f.amount,
    content: f.content,
    category: f.category,
    partner: f.partner ?? undefined,
    method: f.method ?? undefined,
    createdByName: f.createdByName ?? undefined,
  };
}

export function serializeInvoice(iv: {
  id: string;
  code: string;
  customerName: string;
  phone: string | null;
  total: number;
  paid?: number;
  payMethod?: string | null;
  kind?: string;
  createdAt: Date;
  order?: { code: string } | null;
  repair?: { code: string } | null;
  seller?: { fullName: string } | null;
  items?: { id: string; name: string; config: string; price: number; machine?: { serial: string } | null }[];
}) {
  const paid = iv.paid ?? 0;
  return {
    id: iv.id,
    code: iv.code,
    kind: iv.kind ?? "ban",
    orderCode: iv.order?.code ?? "",
    repairCode: iv.repair?.code ?? "",
    customerName: iv.customerName,
    phone: iv.phone ?? "",
    value: iv.total,
    paid,
    debt: iv.total - paid,
    payMethod: iv.payMethod ?? undefined,
    createdByName: iv.seller?.fullName ?? undefined,
    date: iv.createdAt.toISOString(),
    items: iv.items?.map((it) => ({
      id: it.id,
      serial: it.machine?.serial ?? "",
      name: it.name,
      config: cleanConfig(it.config),
      price: it.price,
    })),
  };
}

export function serializeAccount(a: {
  id: string;
  username: string;
  fullName: string;
  role: string;
  status: string;
  lastLogin: Date | null;
}) {
  return {
    id: a.id,
    username: a.username,
    fullName: a.fullName,
    role: a.role,
    status: a.status,
    lastLogin: a.lastLogin?.toISOString(),
  };
}
