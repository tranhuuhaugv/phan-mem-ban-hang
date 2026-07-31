"use client";

import { use } from "react";
import { Loader2, UserRound } from "lucide-react";
import { AccessGuard, BackLink, SectionCard } from "@/components/parts";
import { PageHeader, Card } from "@/components/ui";
import { MachineHistory, type HistoryEvent } from "@/components/machine-history";
import { useApi } from "@/lib/api";
import { formatVND } from "@/lib/format";

interface CustomerDetail {
  customer: { id: string; name: string; phone: string; address?: string; note?: string };
  stats: { orderCount: number; repairCount: number; buyCount: number; totalSpent: number };
  events: HistoryEvent[];
}

export default function Page({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  return (
    <AccessGuard menu="khach-hang">
      <Inner id={id} />
    </AccessGuard>
  );
}

function Inner({ id }: { id: string }) {
  const { data, loading, error } = useApi<CustomerDetail>(`/api/customers/${id}`);

  if (loading) {
    return (
      <div className="grid min-h-[40vh] place-items-center">
        <Loader2 className="animate-spin text-[var(--muted)]" />
      </div>
    );
  }
  if (error || !data) {
    return (
      <div>
        <BackLink href="/khach-hang">Về danh sách khách hàng</BackLink>
        <Card className="p-8 text-center text-sm text-[var(--muted)]">{error ?? "Không tìm thấy khách hàng."}</Card>
      </div>
    );
  }

  const { customer: c, stats, events } = data;
  const cards = [
    { label: "Số đơn hàng", value: `${stats.orderCount}`, tone: "text-[var(--info)]" },
    { label: "Lần sửa chữa", value: `${stats.repairCount}`, tone: "text-[var(--warning)]" },
    { label: "Bán máy cũ cho shop", value: `${stats.buyCount}`, tone: "" },
    { label: "Tổng chi tiêu", value: formatVND(stats.totalSpent), tone: "text-[var(--success)]" },
  ];

  return (
    <div>
      <BackLink href="/khach-hang">Về danh sách khách hàng</BackLink>
      <PageHeader
        title={c.name}
        subtitle={[c.phone, c.address].filter(Boolean).join(" · ") || "Khách hàng"}
      />

      <div className="mb-4 grid grid-cols-2 gap-3 lg:grid-cols-4">
        {cards.map((k) => (
          <Card key={k.label} className="p-4">
            <div className="text-xs text-[var(--muted)]">{k.label}</div>
            <div className={`mt-1 text-lg font-semibold ${k.tone}`}>{k.value}</div>
          </Card>
        ))}
      </div>

      <div className="grid items-start gap-4 lg:grid-cols-3">
        <SectionCard title="Thông tin khách">
          <div className="mb-3 flex items-center gap-3">
            <span className="grid h-11 w-11 place-items-center rounded-2xl bg-[var(--teal-bg,var(--surface-2))] text-[var(--primary)]">
              <UserRound size={20} />
            </span>
            <div>
              <div className="font-semibold">{c.name}</div>
              <div className="text-xs text-[var(--muted)]">{c.phone}</div>
            </div>
          </div>
          {c.address && <div className="text-sm text-[var(--muted)]">Địa chỉ: {c.address}</div>}
          {c.note && <div className="mt-1 text-sm text-[var(--muted)]">Ghi chú: {c.note}</div>}
        </SectionCard>

        <div className="lg:col-span-2">
          <SectionCard title={`Lịch sử giao dịch (${events.length})`}>
            <MachineHistory events={events} />
          </SectionCard>
        </div>
      </div>
    </div>
  );
}
