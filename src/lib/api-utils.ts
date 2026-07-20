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
  purchasePrice: number;
  source: string;
  status: string;
  note: string | null;
  createdAt: Date;
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
    purchasePrice: m.purchasePrice,
    source: m.source,
    status: m.status,
    note: m.note ?? undefined,
    createdAt: m.createdAt.toISOString(),
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
  machine?: { serial: string; brand: string; model: string } | null;
}) {
  return {
    id: r.id,
    code: r.code,
    serial: r.machine?.serial ?? "",
    inStock: !!r.machine,
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
  };
}

export function serializeInvoice(iv: {
  id: string;
  code: string;
  customerName: string;
  phone: string | null;
  total: number;
  createdAt: Date;
  order?: { code: string } | null;
  items?: { id: string; name: string; config: string; price: number; machine?: { serial: string } | null }[];
}) {
  return {
    id: iv.id,
    code: iv.code,
    orderCode: iv.order?.code ?? "",
    customerName: iv.customerName,
    phone: iv.phone ?? "",
    value: iv.total,
    date: iv.createdAt.toISOString(),
    items: iv.items?.map((it) => ({
      id: it.id,
      serial: it.machine?.serial ?? "",
      name: it.name,
      config: it.config,
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
