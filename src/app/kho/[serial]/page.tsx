"use client";

import { use } from "react";
import { Laptop, Loader2 } from "lucide-react";
import { AccessGuard, BackLink, DetailRow, SectionCard } from "@/components/parts";
import { PageHeader, Card, Badge } from "@/components/ui";
import { MachineStatusBadge } from "@/components/status";
import { MachineHistory, type HistoryEvent } from "@/components/machine-history";
import { useApi } from "@/lib/api";
import { CONDITION_LABEL, type Machine } from "@/lib/types";
import { formatVND, formatDateTime } from "@/lib/format";

export default function Page({ params }: { params: Promise<{ serial: string }> }) {
  const { serial } = use(params);
  return (
    <AccessGuard menu="kho">
      <Inner serial={decodeURIComponent(serial)} />
    </AccessGuard>
  );
}

function Inner({ serial }: { serial: string }) {
  const { data, loading, error } = useApi<{ machine: Machine; history: HistoryEvent[] }>(
    `/api/machines/${encodeURIComponent(serial)}`,
  );

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
        <BackLink href="/kho">Về danh sách kho</BackLink>
        <Card className="p-8 text-center text-sm text-[var(--muted)]">{error ?? `Không tìm thấy sản phẩm “${serial}”.`}</Card>
      </div>
    );
  }

  const machine = data.machine;

  return (
    <div>
      <BackLink href="/kho">Về danh sách kho</BackLink>
      <PageHeader
        title={`${machine.brand} ${machine.model}`}
        subtitle={`Mã SP: ${machine.serial} · Nhập kho ${formatDateTime(machine.createdAt)}`}
      />

      <div className="grid items-start gap-4 lg:grid-cols-2">
        <SectionCard title="Thông tin sản phẩm">
          <div className="mb-3 flex items-center gap-3">
            <span className="brand-gradient grid h-11 w-11 place-items-center rounded-2xl text-white shadow-md-soft">
              <Laptop size={20} />
            </span>
            <div className="flex-1">
              <div className="font-semibold">
                {machine.brand} {machine.model}
              </div>
              <div className="font-mono text-xs text-[var(--muted)]">{machine.serial}</div>
            </div>
            <MachineStatusBadge status={machine.status} />
          </div>
          <DetailRow label="Danh mục">
            {machine.category ? <Badge tone="purple">{machine.category}</Badge> : "—"}
          </DetailRow>
          <DetailRow label="Cấu hình">
            {machine.cpu} · {machine.ram} · {machine.storage}
          </DetailRow>
          <DetailRow label="Màn hình">{machine.screen || "—"}</DetailRow>
          <DetailRow label="Loại">
            <Badge tone="muted">{CONDITION_LABEL[machine.condition]}</Badge>
          </DetailRow>
          <DetailRow label="Giá nhập">{formatVND(machine.purchasePrice)}</DetailRow>
          <DetailRow label="Nguồn nhập">{machine.source || "—"}</DetailRow>
          <DetailRow label="Ngày nhập kho">{formatDateTime(machine.createdAt)}</DetailRow>
          {machine.note && <DetailRow label="Ghi chú">{machine.note}</DetailRow>}
        </SectionCard>

        <SectionCard title="Lịch sử sản phẩm">
          <MachineHistory events={data.history} />
        </SectionCard>
      </div>
    </div>
  );
}
