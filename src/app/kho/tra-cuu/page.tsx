"use client";

import { useState } from "react";
import { Search, Laptop } from "lucide-react";
import { AccessGuard, BackLink, DetailRow, SectionCard } from "@/components/parts";
import { Button, PageHeader, Input, Card } from "@/components/ui";
import { MachineStatusBadge } from "@/components/status";
import { MachineHistory } from "@/components/machine-history";
import { machines } from "@/lib/mock-data";
import { CONDITION_LABEL } from "@/lib/types";
import { formatVND, formatDateTime } from "@/lib/format";

export default function Page() {
  return (
    <AccessGuard menu="kho">
      <Inner />
    </AccessGuard>
  );
}

function Inner() {
  const [q, setQ] = useState("");
  const [searched, setSearched] = useState(false);
  const machine = machines.find((m) => m.serial.toLowerCase() === q.trim().toLowerCase());

  return (
    <div>
      <BackLink href="/kho">Về danh sách kho</BackLink>
      <PageHeader title="Tra cứu Mã SP" subtitle="Nhập Mã SP để xem thông tin & lịch sử đầy đủ của 1 máy (dùng khi bảo hành)" />

      <form
        onSubmit={(e) => {
          e.preventDefault();
          setSearched(true);
        }}
        className="mb-4 flex gap-2"
      >
        <div className="relative flex-1">
          <Search size={16} className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-[var(--muted)]" />
          <Input value={q} onChange={(e) => setQ(e.target.value)} placeholder="Nhập chính xác Mã SP, VD: SP0001" className="pl-9" />
        </div>
        <Button type="submit">Tra cứu</Button>
      </form>

      {searched && !machine && (
        <Card className="p-8 text-center text-sm text-[var(--muted)]">Không tìm thấy máy với Mã SP này.</Card>
      )}

      {machine && (
        <div className="grid items-start gap-4 lg:grid-cols-2">
          <SectionCard>
            <div className="mb-3 flex items-center gap-3">
              <span className="grid h-10 w-10 place-items-center rounded-lg bg-[var(--primary)]/12 text-[var(--primary)]">
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
            <DetailRow label="Cấu hình">
              {machine.cpu} · {machine.ram} · {machine.storage}
            </DetailRow>
            <DetailRow label="Màn hình">{machine.screen}</DetailRow>
            <DetailRow label="Loại">{CONDITION_LABEL[machine.condition]}</DetailRow>
            <DetailRow label="Giá nhập">{formatVND(machine.purchasePrice)}</DetailRow>
            <DetailRow label="Nguồn nhập">{machine.source}</DetailRow>
            <DetailRow label="Ngày nhập kho">{formatDateTime(machine.createdAt)}</DetailRow>
          </SectionCard>

          <SectionCard title="Lịch sử máy">
            <MachineHistory serial={machine.serial} />
          </SectionCard>
        </div>
      )}
    </div>
  );
}
