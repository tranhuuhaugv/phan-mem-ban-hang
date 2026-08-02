import type { NextRequest } from "next/server";
import { db } from "@/lib/db";
import { requirePermission } from "@/lib/auth";
import { handler, ok } from "@/lib/api-utils";

// Thống kê bán hàng theo người tạo hoá đơn (nhân viên / quản lý)
// ?from=YYYY-MM-DD&to=YYYY-MM-DD (tuỳ chọn)
export const GET = handler(async (req: NextRequest) => {
  await requirePermission("tong-quan", "view");
  const sp = req.nextUrl.searchParams;
  const from = sp.get("from");
  const to = sp.get("to");

  const createdAt: { gte?: Date; lt?: Date } = {};
  if (from) {
    const [y, m, d] = from.split("-").map(Number);
    createdAt.gte = new Date(y, m - 1, d);
  }
  if (to) {
    const [y, m, d] = to.split("-").map(Number);
    createdAt.lt = new Date(y, m - 1, d + 1);
  }
  const where = from || to ? { createdAt } : {};

  const [grouped, accounts] = await Promise.all([
    db.invoice.groupBy({
      by: ["sellerId"],
      where,
      _count: { _all: true },
      _sum: { total: true, paid: true },
    }),
    db.account.findMany({ select: { id: true, fullName: true, role: true } }),
  ]);
  const map = new Map(accounts.map((a) => [a.id, a]));

  const rows = grouped
    .map((g) => {
      const acc = g.sellerId ? map.get(g.sellerId) : undefined;
      return {
        sellerId: g.sellerId,
        name: acc?.fullName ?? "Không rõ",
        role: acc?.role ?? null,
        count: g._count._all,
        revenue: g._sum.total ?? 0,
        paid: g._sum.paid ?? 0,
      };
    })
    .sort((a, b) => b.count - a.count || b.revenue - a.revenue);

  return ok(rows);
});
