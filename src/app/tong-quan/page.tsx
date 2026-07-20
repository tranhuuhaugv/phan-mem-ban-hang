"use client";

import { useState } from "react";
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
import { Boxes, TrendingUp, PackagePlus, DollarSign, CalendarDays, Loader2 } from "lucide-react";
import { Card, PageHeader, Badge, Input, Select } from "@/components/ui";
import { useRole } from "@/components/role-context";
import { useApi } from "@/lib/api";
import { formatVND, formatVNDShort, formatDate } from "@/lib/format";
import { BuyStatusBadge, OrderStatusBadge, RepairStatusBadge } from "@/components/status";
import type { BuyReceipt, Order, Repair } from "@/lib/types";
import Link from "next/link";

interface Stats {
  period: {
    thu: number;
    chi: number;
    profit: number;
    ordersCount: number;
    machinesIn: number;
    buyCount: number;
    repairCount: number;
    invoiceCount: number;
  };
  summary: {
    revenueToday: number;
    revenueMonth: number;
    expenseMonth: number;
    profitMonth: number;
    stockCount: number;
    pendingBuy: number;
    pendingOrders: number;
    repairing: number;
  };
  series: { day: string; revenue: number; expense: number }[];
}

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
    <Card
      className="relative overflow-hidden p-4 transition-all hover:-translate-y-0.5 hover:shadow-md-soft"
      style={{ background: `linear-gradient(135deg, ${tone}0d, var(--surface) 45%)` }}
    >
      <div
        className="pointer-events-none absolute -right-10 -top-10 h-28 w-28 rounded-full opacity-[0.12]"
        style={{ background: tone }}
      />
      <div className="flex items-start justify-between">
        <div>
          <p className="text-[13px] font-medium text-[var(--muted)]">{label}</p>
          <p className="mt-1 text-[26px] font-bold tracking-tight">{value}</p>
          {hint && <p className="mt-1 text-xs text-[var(--muted)]">{hint}</p>}
        </div>
        <span
          className="grid h-11 w-11 shrink-0 place-items-center rounded-2xl text-white shadow-md-soft"
          style={{ background: `linear-gradient(135deg, ${tone}, ${tone}cc)` }}
        >
          {icon}
        </span>
      </div>
    </Card>
  );
}

function DayTile({ label, value, tone }: { label: string; value: string; tone: string }) {
  return (
    <div
      className="rounded-xl border p-3"
      style={{
        background: `linear-gradient(135deg, ${tone}14, ${tone}05)`,
        borderColor: `${tone}30`,
      }}
    >
      <p className="text-xs font-medium" style={{ color: tone }}>
        {label}
      </p>
      <p className="mt-0.5 text-lg font-bold tracking-tight" style={{ color: tone }}>
        {value}
      </p>
    </div>
  );
}

type PeriodMode = "day" | "month" | "year";
const today = new Date().toISOString().slice(0, 10);

export default function DashboardPage() {
  const { can } = useRole();
  const seeProfit = can("tong-quan").seeProfit;

  const [mode, setMode] = useState<PeriodMode>("day");
  const [day, setDay] = useState(today);
  const [month, setMonth] = useState(today.slice(0, 7));
  const [year, setYear] = useState(today.slice(0, 4));

  const prefix = mode === "day" ? day : mode === "month" ? month : year;
  const { data: stats, loading } = useApi<Stats>(`/api/stats?period=${prefix}`);
  const { data: buyReceipts } = useApi<BuyReceipt[]>("/api/buy-receipts");
  const { data: orders } = useApi<Order[]>("/api/orders");
  const { data: repairs } = useApi<Repair[]>("/api/repairs");

  const s = stats?.summary;
  const d = stats?.period;

  const periodLabel =
    mode === "day" ? formatDate(day) : mode === "month" ? `Tháng ${month.slice(5)}/${month.slice(0, 4)}` : `Năm ${year}`;

  const pill = (active: boolean) =>
    `rounded-md px-3 py-1 text-[13px] font-medium transition-colors ${
      active ? "bg-[var(--primary)] text-white shadow-sm" : "text-[var(--muted)] hover:text-[var(--foreground)]"
    }`;

  return (
    <div>
      <PageHeader title="Tổng quan" subtitle="Thống kê nhanh tình hình kinh doanh — dữ liệu thật từ database" />

      {/* Số liệu theo kỳ (ngày / tháng / năm) */}
      <Card className="mb-4 p-4">
        <div className="mb-3 flex flex-wrap items-center justify-between gap-2">
          <div className="flex items-center gap-2">
            <span className="grid h-8 w-8 place-items-center rounded-lg bg-[var(--primary)]/12 text-[var(--primary)]">
              {loading ? <Loader2 size={17} className="animate-spin" /> : <CalendarDays size={17} />}
            </span>
            <div>
              <h2 className="font-semibold leading-tight">Số liệu theo kỳ</h2>
              <p className="text-xs text-[var(--muted)]">Số liệu phát sinh trong · {periodLabel}</p>
            </div>
          </div>
          <div className="flex flex-wrap items-center gap-2">
            <div className="inline-flex rounded-lg border border-[var(--border)] bg-[var(--surface-2)] p-0.5">
              <button type="button" onClick={() => setMode("day")} className={pill(mode === "day")}>
                Ngày
              </button>
              <button type="button" onClick={() => setMode("month")} className={pill(mode === "month")}>
                Tháng
              </button>
              <button type="button" onClick={() => setMode("year")} className={pill(mode === "year")}>
                Năm
              </button>
            </div>
            {mode === "day" && <Input type="date" value={day} onChange={(e) => setDay(e.target.value)} className="w-44" />}
            {mode === "month" && (
              <Input type="month" value={month} onChange={(e) => setMonth(e.target.value)} className="w-40" />
            )}
            {mode === "year" && (
              <Select value={year} onChange={(e) => setYear(e.target.value)} className="w-28">
                {["2024", "2025", "2026", "2027"].map((y) => (
                  <option key={y} value={y}>
                    {y}
                  </option>
                ))}
              </Select>
            )}
          </div>
        </div>
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-6">
          <DayTile label="Doanh thu" value={formatVND(d?.thu ?? 0)} tone="#16a34a" />
          {seeProfit && <DayTile label="Chi phí" value={formatVND(d?.chi ?? 0)} tone="#dc2626" />}
          {seeProfit && <DayTile label="Lợi nhuận" value={formatVND(d?.profit ?? 0)} tone="#2563eb" />}
          <DayTile label="Đơn hàng mới" value={`${d?.ordersCount ?? 0}`} tone="#059669" />
          <DayTile label="Máy nhập kho" value={`${d?.machinesIn ?? 0}`} tone="#4f46e5" />
          <DayTile label="Phiếu thu máy" value={`${d?.buyCount ?? 0}`} tone="#0891b2" />
          <DayTile label="Phiếu sửa chữa" value={`${d?.repairCount ?? 0}`} tone="#ea580c" />
          <DayTile label="Hoá đơn" value={`${d?.invoiceCount ?? 0}`} tone="#db2777" />
        </div>
      </Card>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <Stat
          icon={<DollarSign size={20} />}
          tone="#16a34a"
          label="Doanh thu hôm nay"
          value={formatVND(s?.revenueToday ?? 0)}
          hint={`Tháng này: ${formatVND(s?.revenueMonth ?? 0)}`}
        />
        {seeProfit ? (
          <Stat
            icon={<TrendingUp size={20} />}
            tone="#2563eb"
            label="Lợi nhuận tháng"
            value={formatVND(s?.profitMonth ?? 0)}
            hint={`Chi phí: ${formatVND(s?.expenseMonth ?? 0)}`}
          />
        ) : (
          <Stat icon={<Boxes size={20} />} tone="#2563eb" label="Máy tồn kho" value={`${s?.stockCount ?? 0} máy`} hint="Sẵn sàng bán" />
        )}
        <Stat
          icon={<Boxes size={20} />}
          tone="#7c3aed"
          label="Tổng máy tồn kho"
          value={`${s?.stockCount ?? 0} máy`}
          hint="Trạng thái: Tồn kho"
        />
        <Stat
          icon={<PackagePlus size={20} />}
          tone="#d97706"
          label="Phiếu chờ xử lý"
          value={`${(s?.pendingBuy ?? 0) + (s?.pendingOrders ?? 0) + (s?.repairing ?? 0)}`}
          hint={`${s?.pendingBuy ?? 0} thu máy · ${s?.pendingOrders ?? 0} đơn · ${s?.repairing ?? 0} sửa`}
        />
      </div>

      <div className="mt-4 grid grid-cols-1 gap-4 lg:grid-cols-3" id="bieu-do">
        <Card className="p-4 lg:col-span-2">
          <div className="mb-3 flex items-center justify-between">
            <h2 className="font-semibold">Doanh thu 7 ngày</h2>
            {seeProfit && (
              <Badge tone="primary">
                <TrendingUp size={12} /> dữ liệu thật
              </Badge>
            )}
          </div>
          <ResponsiveContainer width="100%" height={260}>
            <AreaChart data={stats?.series ?? []} margin={{ left: -18, right: 8, top: 4 }}>
              <defs>
                <linearGradient id="rev" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor="#4f46e5" stopOpacity={0.35} />
                  <stop offset="100%" stopColor="#4f46e5" stopOpacity={0} />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" vertical={false} />
              <XAxis dataKey="day" tick={{ fontSize: 12, fill: "var(--muted)" }} axisLine={false} tickLine={false} />
              <YAxis tickFormatter={formatVNDShort} tick={{ fontSize: 12, fill: "var(--muted)" }} axisLine={false} tickLine={false} />
              <Tooltip
                formatter={(v) => formatVND(Number(v))}
                contentStyle={{ background: "var(--surface)", border: "1px solid var(--border)", borderRadius: 10, fontSize: 13 }}
              />
              <Area type="monotone" dataKey="revenue" name="Doanh thu" stroke="#4f46e5" strokeWidth={2} fill="url(#rev)" />
            </AreaChart>
          </ResponsiveContainer>
        </Card>

        <Card className="p-4">
          <h2 className="mb-3 font-semibold">{seeProfit ? "Chi phí theo ngày" : "Doanh thu theo ngày"}</h2>
          <ResponsiveContainer width="100%" height={260}>
            <BarChart data={stats?.series ?? []} margin={{ left: -18, right: 8, top: 4 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" vertical={false} />
              <XAxis dataKey="day" tick={{ fontSize: 11, fill: "var(--muted)" }} axisLine={false} tickLine={false} />
              <YAxis tickFormatter={formatVNDShort} tick={{ fontSize: 11, fill: "var(--muted)" }} axisLine={false} tickLine={false} />
              <Tooltip
                formatter={(v) => formatVND(Number(v))}
                contentStyle={{ background: "var(--surface)", border: "1px solid var(--border)", borderRadius: 10, fontSize: 13 }}
              />
              <Bar dataKey={seeProfit ? "expense" : "revenue"} name={seeProfit ? "Chi phí" : "Doanh thu"} fill={seeProfit ? "#e11d48" : "#059669"} radius={[4, 4, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </Card>
      </div>

      <div className="mt-4 grid grid-cols-1 gap-4 lg:grid-cols-3">
        <QueueCard title="Phiếu thu máy chờ duyệt" href="/thu-may" tone="#0891b2">
          {(buyReceipts ?? [])
            .filter((b) => b.status === "cho_duyet")
            .map((b) => (
              <Row key={b.id} left={b.model} sub={b.customerName} right={<BuyStatusBadge status={b.status} />} amount={formatVND(b.price)} />
            ))}
        </QueueCard>
        <QueueCard title="Đơn hàng cần theo dõi" href="/dat-hang" tone="#059669">
          {(orders ?? [])
            .filter((o) => o.status !== "da_giao" && o.status !== "huy")
            .map((o) => (
              <Row key={o.id} left={o.model} sub={o.customerName} right={<OrderStatusBadge status={o.status} />} amount={formatVND(o.sellPrice)} />
            ))}
        </QueueCard>
        <QueueCard title="Máy đang sửa chữa" href="/sua-chua" tone="#ea580c">
          {(repairs ?? [])
            .filter((r) => r.status !== "hoan_tat")
            .map((r) => (
              <Row key={r.id} left={r.model || r.errorDesc} sub={r.errorDesc} right={<RepairStatusBadge status={r.status} />} amount={formatVND(r.estCost)} />
            ))}
        </QueueCard>
      </div>
    </div>
  );
}

function QueueCard({
  title,
  href,
  tone,
  children,
}: {
  title: string;
  href: string;
  tone: string;
  children: React.ReactNode;
}) {
  return (
    <Card className="overflow-hidden p-4" style={{ borderTop: `3px solid ${tone}` }}>
      <div className="mb-2 flex items-center justify-between">
        <h2 className="flex items-center gap-2 font-semibold">
          <span className="h-2.5 w-2.5 rounded-full" style={{ background: tone }} />
          {title}
        </h2>
        <Link href={href} className="text-xs font-medium hover:underline" style={{ color: tone }}>
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
