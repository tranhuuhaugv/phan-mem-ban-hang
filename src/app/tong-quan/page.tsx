"use client";

import {
  Area,
  AreaChart,
  Bar,
  BarChart,
  CartesianGrid,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import { Boxes, TrendingUp, PackagePlus, DollarSign } from "lucide-react";
import { Card, PageHeader, Badge } from "@/components/ui";
import { useRole } from "@/components/role-context";
import { dashboardStats as s, revenueSeries, buyReceipts, orders, repairs } from "@/lib/mock-data";
import { formatVND, formatVNDShort } from "@/lib/format";
import { BuyStatusBadge, OrderStatusBadge, RepairStatusBadge } from "@/components/status";
import Link from "next/link";

function Stat({
  icon,
  label,
  value,
  tone,
  hint,
}: {
  icon: React.ReactNode;
  label: string;
  value: string;
  tone: string;
  hint?: string;
}) {
  return (
    <Card className="p-4 transition-all hover:-translate-y-0.5 hover:shadow-md-soft">
      <div className="flex items-start justify-between">
        <div>
          <p className="text-sm text-[var(--muted)]">{label}</p>
          <p className="mt-1 text-2xl font-semibold tracking-tight">{value}</p>
          {hint && <p className="mt-1 text-xs text-[var(--muted)]">{hint}</p>}
        </div>
        <span className="grid h-11 w-11 place-items-center rounded-xl" style={{ background: tone + "1f", color: tone }}>
          {icon}
        </span>
      </div>
    </Card>
  );
}

export default function DashboardPage() {
  const { can } = useRole();
  const seeProfit = can("tong-quan").seeProfit;

  return (
    <div>
      <PageHeader title="Tổng quan" subtitle="Thống kê nhanh tình hình kinh doanh hôm nay" />

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <Stat
          icon={<DollarSign size={20} />}
          tone="#16a34a"
          label="Doanh thu hôm nay"
          value={formatVND(s.revenueToday)}
          hint={`Tháng này: ${formatVND(s.revenueMonth)}`}
        />
        {seeProfit ? (
          <Stat
            icon={<TrendingUp size={20} />}
            tone="#2563eb"
            label="Lợi nhuận tháng"
            value={formatVND(s.profitMonth)}
            hint={`Chi phí: ${formatVND(s.expenseMonth)}`}
          />
        ) : (
          <Stat icon={<Boxes size={20} />} tone="#2563eb" label="Máy tồn kho" value={`${s.stockCount} máy`} hint="Sẵn sàng bán" />
        )}
        <Stat
          icon={<Boxes size={20} />}
          tone="#7c3aed"
          label="Tổng máy tồn kho"
          value={`${s.stockCount} máy`}
          hint="Trạng thái: Tồn kho"
        />
        <Stat
          icon={<PackagePlus size={20} />}
          tone="#d97706"
          label="Phiếu chờ xử lý"
          value={`${s.pendingBuy + s.pendingOrders + s.repairing}`}
          hint={`${s.pendingBuy} thu máy · ${s.pendingOrders} đơn · ${s.repairing} sửa`}
        />
      </div>

      <div className="mt-4 grid grid-cols-1 gap-4 lg:grid-cols-3" id="bieu-do">
        <Card className="p-4 lg:col-span-2">
          <div className="mb-3 flex items-center justify-between">
            <h2 className="font-semibold">Doanh thu 7 ngày</h2>
            {seeProfit && (
              <Badge tone="primary">
                <TrendingUp size={12} /> có lợi nhuận
              </Badge>
            )}
          </div>
          <ResponsiveContainer width="100%" height={260}>
            <AreaChart data={revenueSeries} margin={{ left: -18, right: 8, top: 4 }}>
              <defs>
                <linearGradient id="rev" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor="#2563eb" stopOpacity={0.35} />
                  <stop offset="100%" stopColor="#2563eb" stopOpacity={0} />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" vertical={false} />
              <XAxis dataKey="day" tick={{ fontSize: 12, fill: "var(--muted)" }} axisLine={false} tickLine={false} />
              <YAxis tickFormatter={formatVNDShort} tick={{ fontSize: 12, fill: "var(--muted)" }} axisLine={false} tickLine={false} />
              <Tooltip
                formatter={(v) => formatVND(Number(v))}
                contentStyle={{ background: "var(--surface)", border: "1px solid var(--border)", borderRadius: 10, fontSize: 13 }}
              />
              <Area type="monotone" dataKey="revenue" name="Doanh thu" stroke="#2563eb" strokeWidth={2} fill="url(#rev)" />
            </AreaChart>
          </ResponsiveContainer>
        </Card>

        <Card className="p-4">
          <h2 className="mb-3 font-semibold">{seeProfit ? "Lợi nhuận theo ngày" : "Số máy theo trạng thái"}</h2>
          <ResponsiveContainer width="100%" height={260}>
            <BarChart data={revenueSeries} margin={{ left: -18, right: 8, top: 4 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" vertical={false} />
              <XAxis dataKey="day" tick={{ fontSize: 11, fill: "var(--muted)" }} axisLine={false} tickLine={false} />
              <YAxis tickFormatter={formatVNDShort} tick={{ fontSize: 11, fill: "var(--muted)" }} axisLine={false} tickLine={false} />
              <Tooltip
                formatter={(v) => formatVND(Number(v))}
                contentStyle={{ background: "var(--surface)", border: "1px solid var(--border)", borderRadius: 10, fontSize: 13 }}
              />
              <Bar dataKey={seeProfit ? "profit" : "revenue"} name={seeProfit ? "Lợi nhuận" : "Doanh thu"} fill="#16a34a" radius={[4, 4, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </Card>
      </div>

      <div className="mt-4 grid grid-cols-1 gap-4 lg:grid-cols-3">
        <QueueCard title="Phiếu thu máy chờ duyệt" href="/thu-may">
          {buyReceipts
            .filter((b) => b.status === "cho_duyet")
            .map((b) => (
              <Row key={b.id} left={b.model} sub={b.customerName} right={<BuyStatusBadge status={b.status} />} amount={formatVND(b.price)} />
            ))}
        </QueueCard>
        <QueueCard title="Đơn hàng cần theo dõi" href="/dat-hang">
          {orders
            .filter((o) => o.status !== "da_giao")
            .map((o) => (
              <Row key={o.id} left={o.model} sub={o.customerName} right={<OrderStatusBadge status={o.status} />} amount={formatVND(o.sellPrice)} />
            ))}
        </QueueCard>
        <QueueCard title="Máy đang sửa chữa" href="/sua-chua">
          {repairs
            .filter((r) => r.status !== "hoan_tat")
            .map((r) => (
              <Row key={r.id} left={r.model} sub={r.errorDesc} right={<RepairStatusBadge status={r.status} />} amount={formatVND(r.estCost)} />
            ))}
        </QueueCard>
      </div>
    </div>
  );
}

function QueueCard({ title, href, children }: { title: string; href: string; children: React.ReactNode }) {
  return (
    <Card className="p-4">
      <div className="mb-2 flex items-center justify-between">
        <h2 className="font-semibold">{title}</h2>
        <Link href={href} className="text-xs text-[var(--primary)] hover:underline">
          Xem tất cả
        </Link>
      </div>
      <div className="divide-y divide-[var(--border)]">{children}</div>
    </Card>
  );
}

function Row({ left, sub, right, amount }: { left: string; sub: string; right: React.ReactNode; amount: string }) {
  return (
    <div className="flex items-center justify-between gap-2 py-2.5">
      <div className="min-w-0">
        <p className="truncate text-sm font-medium">{left}</p>
        <p className="truncate text-xs text-[var(--muted)]">{sub}</p>
      </div>
      <div className="flex flex-col items-end gap-1">
        {right}
        <span className="text-xs font-medium">{amount}</span>
      </div>
    </div>
  );
}
