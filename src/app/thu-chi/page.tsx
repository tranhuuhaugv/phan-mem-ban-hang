"use client";

import { useState } from "react";
import { ArrowDownCircle, ArrowUpCircle, FileBarChart } from "lucide-react";
import { AccessGuard } from "@/components/parts";
import { Button, PageHeader, Table, Tr, Td, Card, Badge, Select, SearchInput } from "@/components/ui";
import { cashFlows } from "@/lib/mock-data";
import { formatVND, formatDateTime } from "@/lib/format";
import type { CashType } from "@/lib/types";

export default function Page() {
  return (
    <AccessGuard menu="thu-chi">
      <Inner />
    </AccessGuard>
  );
}

function Inner() {
  const [filter, setFilter] = useState<CashType | "all">("all");
  const [q, setQ] = useState("");
  const totalThu = cashFlows.filter((c) => c.type === "thu").reduce((s, c) => s + c.amount, 0);
  const totalChi = cashFlows.filter((c) => c.type === "chi").reduce((s, c) => s + c.amount, 0);
  const rows = [...cashFlows]
    .filter((c) => filter === "all" || c.type === filter)
    .filter((c) =>
      `${c.code} ${c.content} ${c.category} ${c.partner ?? ""}`.toLowerCase().includes(q.trim().toLowerCase()),
    )
    .sort((a, b) => b.date.localeCompare(a.date));

  return (
    <div>
      <PageHeader
        title="Thu - Chi"
        subtitle="Sổ quỹ toàn bộ dòng tiền vào ra"
        actions={
          <div className="flex gap-2">
            <Button variant="outline" href="/thu-chi/bao-cao">
              <FileBarChart size={16} /> Báo cáo lãi/lỗ
            </Button>
            <Button variant="outline" href="/thu-chi/chi">
              <ArrowDownCircle size={16} /> Phiếu chi
            </Button>
            <Button href="/thu-chi/thu">
              <ArrowUpCircle size={16} /> Phiếu thu
            </Button>
          </div>
        }
      />

      <div className="mb-4 grid grid-cols-1 gap-4 sm:grid-cols-3">
        <Card className="p-4">
          <p className="text-sm text-[var(--muted)]">Tổng thu</p>
          <p className="mt-1 text-2xl font-semibold text-[var(--success)]">{formatVND(totalThu)}</p>
        </Card>
        <Card className="p-4">
          <p className="text-sm text-[var(--muted)]">Tổng chi</p>
          <p className="mt-1 text-2xl font-semibold text-[var(--danger)]">{formatVND(totalChi)}</p>
        </Card>
        <Card className="p-4">
          <p className="text-sm text-[var(--muted)]">Tồn quỹ</p>
          <p className="mt-1 text-2xl font-semibold">{formatVND(totalThu - totalChi)}</p>
        </Card>
      </div>

      <div className="mb-4 flex flex-wrap items-center gap-2">
        <SearchInput value={q} onChange={setQ} placeholder="Tìm mã phiếu, nội dung, phân loại, đối tác..." />
        <Select value={filter} onChange={(e) => setFilter(e.target.value as CashType | "all")} className="w-44">
          <option value="all">Tất cả</option>
          <option value="thu">Chỉ phiếu thu</option>
          <option value="chi">Chỉ phiếu chi</option>
        </Select>
      </div>

      <Table head={["Mã", "Ngày", "Loại", "Nội dung", "Phân loại", "Số tiền"]}>
        {rows.map((c) => (
          <Tr key={c.id}>
            <Td className="font-mono text-xs font-medium">{c.code}</Td>
            <Td className="whitespace-nowrap text-xs text-[var(--muted)]">{formatDateTime(c.date)}</Td>
            <Td>
              <Badge tone={c.type === "thu" ? "success" : "danger"}>{c.type === "thu" ? "Thu" : "Chi"}</Badge>
            </Td>
            <Td>
              <div>{c.content}</div>
              {c.partner && <div className="text-xs text-[var(--muted)]">{c.partner}</div>}
            </Td>
            <Td className="text-[var(--muted)]">{c.category}</Td>
            <Td className={`whitespace-nowrap font-medium ${c.type === "thu" ? "text-[var(--success)]" : "text-[var(--danger)]"}`}>
              {c.type === "thu" ? "+" : "−"}
              {formatVND(c.amount)}
            </Td>
          </Tr>
        ))}
      </Table>
    </div>
  );
}
