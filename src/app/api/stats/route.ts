import type { NextRequest } from "next/server";
import { db } from "@/lib/db";
import { requirePermission } from "@/lib/auth";
import { handler, ok } from "@/lib/api-utils";

// Thống kê Dashboard: tổng quan + số liệu theo kỳ (?period=YYYY | YYYY-MM | YYYY-MM-DD)
export const GET = handler(async (req: NextRequest) => {
  await requirePermission("tong-quan", "view");
  const period = req.nextUrl.searchParams.get("period") ?? new Date().toISOString().slice(0, 10);

  // Khoảng thời gian của kỳ
  const start = new Date(
    period.length === 4 ? `${period}-01-01T00:00:00` : period.length === 7 ? `${period}-01T00:00:00` : `${period}T00:00:00`,
  );
  const end = new Date(start);
  if (period.length === 4) end.setFullYear(end.getFullYear() + 1);
  else if (period.length === 7) end.setMonth(end.getMonth() + 1);
  else end.setDate(end.getDate() + 1);

  const inPeriod = { gte: start, lt: end };

  const [thuAgg, chiAgg, ordersCount, machinesIn, buyCount, repairCount, invoiceCount] = await Promise.all([
    db.cashFlow.aggregate({ _sum: { amount: true }, where: { type: "thu", date: inPeriod } }),
    db.cashFlow.aggregate({ _sum: { amount: true }, where: { type: "chi", date: inPeriod } }),
    db.order.count({ where: { createdAt: inPeriod } }),
    db.machine.count({ where: { createdAt: inPeriod } }),
    db.buyReceipt.count({ where: { createdAt: inPeriod } }),
    db.repair.count({ where: { receiveDate: inPeriod } }),
    db.invoice.count({ where: { createdAt: inPeriod } }),
  ]);

  // Tổng quan chung
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

  // Doanh thu 7 ngày gần nhất (biểu đồ)
  const series: { day: string; revenue: number; expense: number }[] = [];
  for (let i = 6; i >= 0; i--) {
    const d0 = new Date(todayStart);
    d0.setDate(d0.getDate() - i);
    const d1 = new Date(d0);
    d1.setDate(d1.getDate() + 1);
    const [thu, chi] = await Promise.all([
      db.cashFlow.aggregate({ _sum: { amount: true }, where: { type: "thu", date: { gte: d0, lt: d1 } } }),
      db.cashFlow.aggregate({ _sum: { amount: true }, where: { type: "chi", date: { gte: d0, lt: d1 } } }),
    ]);
    series.push({
      day: `${String(d0.getDate()).padStart(2, "0")}/${String(d0.getMonth() + 1).padStart(2, "0")}`,
      revenue: thu._sum.amount ?? 0,
      expense: chi._sum.amount ?? 0,
    });
  }

  const thu = thuAgg._sum.amount ?? 0;
  const chi = chiAgg._sum.amount ?? 0;

  return ok({
    period: { thu, chi, profit: thu - chi, ordersCount, machinesIn, buyCount, repairCount, invoiceCount },
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
