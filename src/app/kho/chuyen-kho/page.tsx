"use client";

import { useState } from "react";
import Link from "next/link";
import { Plus, ArrowRight, ArrowRightLeft } from "lucide-react";
import { AccessGuard } from "@/components/parts";
import { Button, PageHeader, Table, Tr, Td, Badge, SearchInput, Select } from "@/components/ui";
import { useRole } from "@/components/role-context";
import { useApi } from "@/lib/api";
import { TRANSFER_STATUS_LABEL, type StockTransferListItem, type TransferStatus } from "@/lib/types";
import { formatDateTime } from "@/lib/format";

const STATUS_TONE: Record<TransferStatus, "warning" | "success" | "muted"> = {
  dang_chuyen: "warning",
  da_nhan: "success",
  huy: "muted",
};

export default function Page() {
  return (
    <AccessGuard menu="chuyen-kho">
      <Inner />
    </AccessGuard>
  );
}

function Inner() {
  const { can } = useRole();
  const perm = can("chuyen-kho");
  const { data, loading } = useApi<StockTransferListItem[]>("/api/stock-transfers");
  const rowsData = data ?? [];
  const [q, setQ] = useState("");
  const [statusF, setStatusF] = useState<"all" | TransferStatus>("all");

  const rows = rowsData
    .filter((r) => `${r.code} ${r.fromBranch ?? ""} ${r.toBranch ?? ""} ${r.createdByName ?? ""}`.toLowerCase().includes(q.trim().toLowerCase()))
    .filter((r) => statusF === "all" || r.status === statusF);

  return (
    <div>
      <PageHeader
        title="Chuyển kho"
        subtitle={`${rowsData.length} phiếu chuyển kho giữa các chi nhánh`}
        actions={
          perm.create && (
            <Button href="/kho/chuyen-kho/tao">
              <Plus size={16} /> Tạo phiếu chuyển
            </Button>
          )
        }
      />

      <div className="mb-4 flex flex-wrap items-center gap-2">
        <SearchInput value={q} onChange={setQ} placeholder="Tìm mã phiếu, chi nhánh, người tạo..." className="max-w-xs" />
        <Select value={statusF} onChange={(e) => setStatusF(e.target.value as typeof statusF)} className="w-44">
          <option value="all">Tất cả trạng thái</option>
          {(["dang_chuyen", "da_nhan", "huy"] as TransferStatus[]).map((s) => (
            <option key={s} value={s}>
              {TRANSFER_STATUS_LABEL[s]}
            </option>
          ))}
        </Select>
      </div>

      <Table head={["Mã phiếu", "Ngày", "Từ kho → Tới kho", "SL chuyển / nhận", "Trạng thái", "Người tạo", "Ngày nhận", "Người nhận"]}>
        {rows.map((r) => (
          <Tr key={r.id}>
            <Td>
              <Link href={`/kho/chuyen-kho/${r.id}`} className="flex items-center gap-1.5 font-mono text-xs font-semibold text-[var(--primary)] hover:underline">
                <ArrowRightLeft size={13} /> {r.code}
              </Link>
            </Td>
            <Td className="whitespace-nowrap text-xs text-[var(--muted)]">{formatDateTime(r.date)}</Td>
            <Td className="text-sm">
              <div className="flex items-center gap-1.5">
                <span>{r.fromBranch ?? "—"}</span>
                <ArrowRight size={13} className="shrink-0 text-[var(--muted)]" />
                <span className="font-medium">{r.toBranch ?? "—"}</span>
              </div>
            </Td>
            <Td>
              <span className="font-medium">{r.qtySent}</span>
              <span className="text-[var(--muted)]"> / {r.qtyReceived}</span>
            </Td>
            <Td>
              <Badge tone={STATUS_TONE[r.status]}>{TRANSFER_STATUS_LABEL[r.status]}</Badge>
            </Td>
            <Td className="text-sm">{r.createdByName ?? <span className="text-[var(--muted)]">—</span>}</Td>
            <Td className="whitespace-nowrap text-xs text-[var(--muted)]">{r.receivedAt ? formatDateTime(r.receivedAt) : "—"}</Td>
            <Td className="text-sm">{r.receivedByName ?? <span className="text-[var(--muted)]">—</span>}</Td>
          </Tr>
        ))}
        {rows.length === 0 && (
          <Tr>
            <Td className="text-center text-[var(--muted)]">
              <div className="py-6">{loading ? "Đang tải dữ liệu..." : "Chưa có phiếu chuyển nào"}</div>
            </Td>
          </Tr>
        )}
      </Table>
    </div>
  );
}
