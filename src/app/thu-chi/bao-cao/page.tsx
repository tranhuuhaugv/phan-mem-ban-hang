"use client";

import { Bar, BarChart, CartesianGrid, Cell, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";
import { AccessGuard, BackLink, DetailRow, SectionCard } from "@/components/parts";
import { PageHeader, Card } from "@/components/ui";
import { useApi } from "@/lib/api";
import type { CashFlow } from "@/lib/types";
import { formatVND, formatVNDShort } from "@/lib/format";

export default function Page() {
  return (
    <AccessGuard menu="thu-chi">
      <Inner />
    </AccessGuard>
  );
}

function Inner() {
  const { data } = useApi<CashFlow[]>("/api/cashflows");
  const cashFlows = data ?? [];
  const thu = cashFlows.filter((c) => c.type === "thu").reduce((s, c) => s + c.amount, 0);
  const chi = cashFlows.filter((c) => c.type === "chi").reduce((s, c) => s + c.amount, 0);
  const profit = thu - chi;

  // Chi theo loại
  const byCategory = Object.entries(
    cashFlows.filter((c) => c.type === "chi").reduce<Record<string, number>>((acc, c) => {
      acc[c.category] = (acc[c.category] || 0) + c.amount;
      return acc;
    }, {}),
  ).map(([name, value]) => ({ name, value }));

  const summary = [
    { name: "Tổng thu", value: thu, color: "#16a34a" },
    { name: "Tổng chi", value: chi, color: "#dc2626" },
    { name: "Lợi nhuận", value: profit, color: "#2563eb" },
  ];

  return (
    <div>
      <BackLink href="/thu-chi">Về sổ quỹ</BackLink>
      <PageHeader title="Báo cáo lãi/lỗ" subtitle="Tổng hợp tự động từ Kho + Đặt hàng + Thu-Chi (kỳ tháng 7/2026)" />

      <div className="mb-4 grid grid-cols-1 gap-4 sm:grid-cols-3">
        <Card className="p-4" style={{ background: "linear-gradient(135deg, #05966914, var(--surface) 55%)", borderColor: "#05966930" }}>
          <p className="text-sm font-medium text-[var(--success)]">Tổng thu</p>
          <p className="mt-1 text-2xl font-bold text-[var(--success)]">{formatVND(thu)}</p>
        </Card>
        <Card className="p-4" style={{ background: "linear-gradient(135deg, #e11d4814, var(--surface) 55%)", borderColor: "#e11d4830" }}>
          <p className="text-sm font-medium text-[var(--danger)]">Tổng chi</p>
          <p className="mt-1 text-2xl font-bold text-[var(--danger)]">{formatVND(chi)}</p>
        </Card>
        <Card className="p-4" style={{ background: "linear-gradient(135deg, #4f46e514, var(--surface) 55%)", borderColor: "#4f46e530" }}>
          <p className="text-sm font-medium text-[var(--primary)]">Lợi nhuận</p>
          <p className={`mt-1 text-2xl font-bold ${profit >= 0 ? "text-[var(--primary)]" : "text-[var(--danger)]"}`}>
            {formatVND(profit)}
          </p>
        </Card>
      </div>

      <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
        <SectionCard title="Thu / Chi / Lợi nhuận">
          <ResponsiveContainer width="100%" height={240}>
            <BarChart data={summary} margin={{ left: -8, right: 8, top: 4 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" vertical={false} />
              <XAxis dataKey="name" tick={{ fontSize: 12, fill: "var(--muted)" }} axisLine={false} tickLine={false} />
              <YAxis tickFormatter={formatVNDShort} tick={{ fontSize: 11, fill: "var(--muted)" }} axisLine={false} tickLine={false} />
              <Tooltip
                formatter={(v) => formatVND(Number(v))}
                contentStyle={{ background: "var(--surface)", border: "1px solid var(--border)", borderRadius: 10, fontSize: 13 }}
              />
              <Bar dataKey="value" radius={[4, 4, 0, 0]}>
                {summary.map((s, i) => (
                  <Cell key={i} fill={s.color} />
                ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </SectionCard>

        <SectionCard title="Cơ cấu chi phí">
          {byCategory.map((c) => (
            <DetailRow key={c.name} label={c.name}>
              {formatVND(c.value)}
            </DetailRow>
          ))}
          <div className="mt-2 flex justify-between border-t border-[var(--border)] pt-2 text-sm font-semibold">
            <span>Tổng chi</span>
            <span className="text-[var(--danger)]">{formatVND(chi)}</span>
          </div>
        </SectionCard>
      </div>
    </div>
  );
}
