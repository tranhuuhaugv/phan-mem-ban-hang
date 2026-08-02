"use client";

import { use } from "react";
import { Loader2, UserRound } from "lucide-react";
import { AccessGuard, BackLink, SectionCard } from "@/components/parts";
import { PageHeader, Card, Badge } from "@/components/ui";
import { MachineHistory, type HistoryEvent } from "@/components/machine-history";
import { useApi } from "@/lib/api";
import { formatVND } from "@/lib/format";
import { ROLE_LABEL, type Role } from "@/lib/types";

interface SellerDetail {
  seller: { id: string; name: string; role: Role; username: string };
  stats: { count: number; revenue: number; paid: number; debt: number };
  events: HistoryEvent[];
}

const ROLE_TONE: Record<Role, "purple" | "info" | "muted"> = {
  admin: "purple",
  manager: "info",
  staff: "muted",
};

export default function Page({ params }: { params: Promise<{ sellerId: string }> }) {
  const { sellerId } = use(params);
  return (
    <AccessGuard menu="tong-quan">
      <Inner sellerId={sellerId} />
    </AccessGuard>
  );
}

function Inner({ sellerId }: { sellerId: string }) {
  const { data, loading, error } = useApi<SellerDetail>(`/api/reports/sales-by-seller/${sellerId}`);

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
        <BackLink href="/tong-quan/ban-hang">Về báo cáo bán hàng</BackLink>
        <Card className="p-8 text-center text-sm text-[var(--muted)]">{error ?? "Không tìm thấy người bán."}</Card>
      </div>
    );
  }

  const { seller: s, stats, events } = data;
  const cards = [
    { label: "Số hoá đơn", value: `${stats.count}`, tone: "text-[var(--info)]" },
    { label: "Doanh thu", value: formatVND(stats.revenue), tone: "text-[var(--success)]" },
    { label: "Đã thu", value: formatVND(stats.paid), tone: "" },
    { label: "Còn nợ", value: formatVND(stats.debt), tone: stats.debt > 0 ? "text-[var(--danger)]" : "" },
  ];

  return (
    <div>
      <BackLink href="/tong-quan/ban-hang">Về báo cáo bán hàng</BackLink>
      <PageHeader title={s.name} subtitle={`@${s.username} · ${ROLE_LABEL[s.role]}`} />

      <div className="mb-4 grid grid-cols-2 gap-3 lg:grid-cols-4">
        {cards.map((k) => (
          <Card key={k.label} className="p-4">
            <div className="text-xs text-[var(--muted)]">{k.label}</div>
            <div className={`mt-1 text-lg font-semibold ${k.tone}`}>{k.value}</div>
          </Card>
        ))}
      </div>

      <div className="grid items-start gap-4 lg:grid-cols-3">
        <SectionCard title="Người bán">
          <div className="mb-3 flex items-center gap-3">
            <span className="grid h-11 w-11 place-items-center rounded-2xl bg-[var(--surface-2)] text-[var(--primary)]">
              <UserRound size={20} />
            </span>
            <div>
              <div className="font-semibold">{s.name}</div>
              <div className="font-mono text-xs text-[var(--muted)]">@{s.username}</div>
            </div>
          </div>
          <div className="text-sm text-[var(--muted)]">
            Vai trò: <Badge tone={ROLE_TONE[s.role]}>{ROLE_LABEL[s.role]}</Badge>
          </div>
        </SectionCard>

        <div className="lg:col-span-2">
          <SectionCard title={`Lịch sử bán hàng (${events.length})`}>
            {events.length === 0 ? (
              <p className="text-sm text-[var(--muted)]">Chưa có hoá đơn nào.</p>
            ) : (
              <MachineHistory events={events} />
            )}
          </SectionCard>
        </div>
      </div>
    </div>
  );
}
