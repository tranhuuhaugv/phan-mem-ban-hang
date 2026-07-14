"use client";

import { useState } from "react";
import { Search, Laptop, History } from "lucide-react";
import { AccessGuard, BackLink, DetailRow, SectionCard } from "@/components/parts";
import { Button, PageHeader, Input, Card } from "@/components/ui";
import { MachineStatusBadge } from "@/components/status";
import { machines, buyReceipts, orders, repairs } from "@/lib/mock-data";
import { CONDITION_LABEL } from "@/lib/types";
import { formatVND, formatDate } from "@/lib/format";

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

  // Dựng dòng thời gian từ các nguồn dữ liệu liên quan tới Serial
  const timeline = machine
    ? [
        { date: machine.createdAt, label: "Nhập kho", detail: `Nguồn: ${machine.source} · Giá nhập ${formatVND(machine.purchasePrice)}` },
        ...buyReceipts.filter((b) => b.serial === machine.serial).map((b) => ({ date: b.date, label: `Thu máy ${b.code}`, detail: `Từ ${b.customerName} · ${formatVND(b.price)}` })),
        ...repairs.filter((r) => r.serial === machine.serial).map((r) => ({ date: r.receiveDate, label: `Sửa chữa ${r.code}`, detail: r.errorDesc })),
        ...orders.filter((o) => o.serial === machine.serial).map((o) => ({ date: o.date, label: `Bán - đơn ${o.code}`, detail: `${o.customerName} · ${formatVND(o.sellPrice)}` })),
      ].sort((a, b) => a.date.localeCompare(b.date))
    : [];

  return (
    <div>
      <BackLink href="/kho">Về danh sách kho</BackLink>
      <PageHeader title="Tra cứu Serial" subtitle="Nhập Số Serial để xem thông tin & lịch sử đầy đủ của 1 máy (dùng khi bảo hành)" />

      <form
        onSubmit={(e) => {
          e.preventDefault();
          setSearched(true);
        }}
        className="mb-4 flex gap-2"
      >
        <div className="relative flex-1">
          <Search size={16} className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-[var(--muted)]" />
          <Input value={q} onChange={(e) => setQ(e.target.value)} placeholder="Nhập chính xác Số Serial, VD: DL5420-A1001" className="pl-9" />
        </div>
        <Button type="submit">Tra cứu</Button>
      </form>

      {searched && !machine && (
        <Card className="p-8 text-center text-sm text-[var(--muted)]">Không tìm thấy máy với Serial này.</Card>
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
          </SectionCard>

          <SectionCard title="Lịch sử máy">
            <div className="relative ml-1 space-y-4 border-l border-[var(--border)] pl-5">
              {timeline.map((t, i) => (
                <div key={i} className="relative">
                  <span className="absolute -left-[26px] top-1 grid h-4 w-4 place-items-center rounded-full border-2 border-[var(--surface)] bg-[var(--primary)]" />
                  <div className="flex items-center gap-2">
                    <History size={13} className="text-[var(--muted)]" />
                    <span className="text-sm font-medium">{t.label}</span>
                    <span className="text-xs text-[var(--muted)]">{formatDate(t.date)}</span>
                  </div>
                  <p className="mt-0.5 text-xs text-[var(--muted)]">{t.detail}</p>
                </div>
              ))}
            </div>
          </SectionCard>
        </div>
      )}
    </div>
  );
}
