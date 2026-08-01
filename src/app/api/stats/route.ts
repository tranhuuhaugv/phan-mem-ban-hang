import type { NextRequest } from "next/server";
import { db } from "@/lib/db";
import { requirePermission } from "@/lib/auth";
import { handler, ok } from "@/lib/api-utils";

type Mode = "day" | "month" | "quarter" | "year";

// Gộp mọi hình thức lạ / rỗng về tiền mặt (mặc định của app)
function methodKey(m?: string | null): "tien_mat" | "the" | "chuyen_khoan" {
  return m === "the" || m === "chuyen_khoan" ? m : "tien_mat";
}

// Thống kê Dashboard: tổng quan + số liệu theo kỳ
// ?period=YYYY | YYYY-MM | YYYY-MM-DD | YYYY-Qn
export const GET = handler(async (req: NextRequest) => {
  await requirePermission("tong-quan", "view");
  const period = req.nextUrl.searchParams.get("period") ?? new Date().toISOString().slice(0, 10);

  // Xác định kỳ + khoảng thời gian [start, end)
  let mode: Mode;
  let start: Date;
  let end: Date;
  const qMatch = /^(\d{4})-Q([1-4])$/.exec(period);
  if (qMatch) {
    mode = "quarter";
    const y = Number(qMatch[1]);
    const q = Number(qMatch[2]);
    start = new Date(y, (q - 1) * 3, 1);
    end = new Date(y, q * 3, 1);
  } else if (period.length === 4) {
    mode = "year";
    start = new Date(Number(period), 0, 1);
    end = new Date(Number(period) + 1, 0, 1);
  } else if (period.length === 7) {
    mode = "month";
    const [y, m] = period.split("-").map(Number);
    start = new Date(y, m - 1, 1);
    end = new Date(y, m, 1);
  } else {
    mode = "day";
    const [y, m, d] = period.split("-").map(Number);
    start = new Date(y, m - 1, d);
    end = new Date(y, m - 1, d + 1);
  }

  const inPeriod = { gte: start, lt: end };

  // Biểu đồ dựng đúng trong kỳ đang chọn
  const seriesStart = start;
  const seriesEnd = end;

  const [ordersCount, machinesIn, buyCount, repairCount, invoiceCount, flows] = await Promise.all([
    db.order.count({ where: { createdAt: inPeriod } }),
    db.machine.count({ where: { createdAt: inPeriod } }),
    db.buyReceipt.count({ where: { createdAt: inPeriod } }),
    db.repair.count({ where: { receiveDate: inPeriod } }),
    db.invoice.count({ where: { createdAt: inPeriod } }),
    db.cashFlow.findMany({
      where: { date: { gte: seriesStart, lt: seriesEnd } },
      select: { date: true, type: true, amount: true, method: true },
    }),
  ]);

  // Số liệu + tách theo hình thức thanh toán trong kỳ
  let thu = 0;
  let chi = 0;
  const revByMethod = { tien_mat: 0, the: 0, chuyen_khoan: 0 };
  const expByMethod = { tien_mat: 0, the: 0, chuyen_khoan: 0 };
  for (const f of flows) {
    const d = new Date(f.date);
    if (d < start || d >= end) continue;
    const mk = methodKey(f.method);
    if (f.type === "thu") {
      thu += f.amount;
      revByMethod[mk] += f.amount;
    } else {
      chi += f.amount;
      expByMethod[mk] += f.amount;
    }
  }

  // Chuỗi dữ liệu cho biểu đồ (tự đổi theo kỳ)
  const series: { day: string; revenue: number; expense: number }[] = [];
  const pushBucket = (label: string, from: Date, to: Date) => {
    let revenue = 0;
    let expense = 0;
    for (const f of flows) {
      const d = new Date(f.date);
      if (d < from || d >= to) continue;
      if (f.type === "thu") revenue += f.amount;
      else expense += f.amount;
    }
    series.push({ day: label, revenue, expense });
  };
  if (mode === "day") {
    for (let h = 0; h < 24; h++) {
      const from = new Date(start.getFullYear(), start.getMonth(), start.getDate(), h);
      const to = new Date(start.getFullYear(), start.getMonth(), start.getDate(), h + 1);
      pushBucket(`${h}h`, from, to);
    }
  } else if (mode === "month") {
    const cur = new Date(start);
    while (cur < end) {
      const nxt = new Date(cur.getFullYear(), cur.getMonth(), cur.getDate() + 1);
      pushBucket(String(cur.getDate()), new Date(cur), nxt);
      cur.setDate(cur.getDate() + 1);
    }
  } else {
    const cur = new Date(start);
    while (cur < end) {
      const nxt = new Date(cur.getFullYear(), cur.getMonth() + 1, 1);
      pushBucket(`Th ${cur.getMonth() + 1}`, new Date(cur), nxt);
      cur.setMonth(cur.getMonth() + 1);
    }
  }

  // Tổng quan chung (không phụ thuộc kỳ)
  const now = new Date();
  const todayStart = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  const monthStart = new Date(now.getFullYear(), now.getMonth(), 1);

  const [revToday, revMonth, expMonth, stockCount, pendingBuy, pendingOrders, repairing] = await Promise.all([
    db.cashFlow.aggregate({ _sum: { amount: true }, where: { type: "thu", date: { gte: todayStart } } }),
    db.cashFlow.aggregate({ _sum: { amount: true }, where: { type: "thu", date: { gte: monthStart } } }),
    db.cashFlow.aggregate({ _sum: { amount: true }, where: { type: "chi", date: { gte: monthStart } } }),
    db.machine.count({ where: { status: "ton_kho" } }),
    db.buyReceipt.count({ where: { status: "cho_duyet" } }),
    db.order.count({ where: { status: "cho_coc" } }),
    db.repair.count({ where: { status: { not: "hoan_tat" } } }),
  ]);

  return ok({
    mode,
    period: { thu, chi, profit: thu - chi, revByMethod, expByMethod, ordersCount, machinesIn, buyCount, repairCount, invoiceCount },
    summary: {
      revenueToday: revToday._sum.amount ?? 0,
      revenueMonth: revMonth._sum.amount ?? 0,
      expenseMonth: expMonth._sum.amount ?? 0,
      profitMonth: (revMonth._sum.amount ?? 0) - (expMonth._sum.amount ?? 0),
      stockCount,
      pendingBuy,
      pendingOrders,
      repairing,
    },
    series,
  });
});
