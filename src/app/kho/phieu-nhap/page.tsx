"use client";

import { useState } from "react";
import Link from "next/link";
import { Plus, FileText } from "lucide-react";
import { AccessGuard } from "@/components/parts";
import { Button, PageHeader, Table, Tr, Td, Badge, SearchInput } from "@/components/ui";
import { useRole } from "@/components/role-context";
import { useApi } from "@/lib/api";
import type { StockInListItem } from "@/lib/types";
import { formatVND, formatDateTime } from "@/lib/format";

export default function Page() {
  return (
    <AccessGuard menu="nhap-kho">
      <Inner />
    </AccessGuard>
  );
}

function Inner() {
  const { can } = useRole();
  const perm = can("nhap-kho");
  const { data, loading } = useApi<StockInListItem[]>("/api/stock-ins");
  const receipts = data ?? [];
  const [q, setQ] = useState("");

  const rows = receipts.filter((r) =>
    `${r.code} ${r.supplierName ?? ""} ${r.branchName ?? ""}`.toLowerCase().includes(q.trim().toLowerCase()),
  );

  return (
    <div>
      <PageHeader
        title="Danh sách phiếu nhập"
        subtitle={`${receipts.length} phiếu nhập kho`}
        actions={
          perm.create && (
            <Button href="/kho/nhap">
              <Plus size={16} /> Tạo phiếu nhập
            </Button>
          )
        }
      />

      <div className="mb-4 flex flex-wrap items-center gap-2">
        <SearchInput value={q} onChange={setQ} placeholder="Tìm mã phiếu, NCC, chi nhánh..." className="max-w-sm" />
      </div>

      <Table head={["Mã phiếu", "Ngày", "Nhà cung cấp", "Chi nhánh", "Số máy", "Tổng tiền", "Đã trả", "Còn nợ"]}>
        {rows.map((r) => (
          <Tr key={r.id}>
            <Td>
              <Link href={`/kho/phieu-nhap/${r.id}`} className="flex items-center gap-1.5 font-mono text-xs font-semibold text-[var(--primary)] hover:underline">
                <FileText size={13} /> {r.code}
              </Link>
            </Td>
            <Td className="whitespace-nowrap text-xs text-[var(--muted)]">{formatDateTime(r.date)}</Td>
            <Td className="text-sm">{r.supplierName ?? <span className="text-[var(--muted)]">—</span>}</Td>
            <Td>{r.branchName ? <Badge tone="info">{r.branchName}</Badge> : <span className="text-xs text-[var(--muted)]">—</span>}</Td>
            <Td>
              <Badge tone="muted">{r.machineCount} máy</Badge>
            </Td>
            <Td className="whitespace-nowrap font-medium">{formatVND(r.total)}</Td>
            <Td className="whitespace-nowrap text-sm text-[var(--success)]">{formatVND(r.paid)}</Td>
            <Td className="whitespace-nowrap font-medium">
              {r.debt > 0 ? <span className="text-[var(--danger)]">{formatVND(r.debt)}</span> : <span className="text-xs text-[var(--muted)]">Đủ</span>}
            </Td>
          </Tr>
        ))}
        {rows.length === 0 && (
          <Tr>
            <Td className="text-center text-[var(--muted)]">
              <div className="py-6">{loading ? "Đang tải dữ liệu..." : "Chưa có phiếu nhập nào"}</div>
            </Td>
          </Tr>
        )}
      </Table>
    </div>
  );
}
