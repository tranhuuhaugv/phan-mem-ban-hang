"use client";

import { useState } from "react";
import Link from "next/link";
import { Plus, FileText } from "lucide-react";
import { AccessGuard } from "@/components/parts";
import { Button, PageHeader, Table, Tr, Td, FootTd, Badge, SearchInput, FilterBar, FilterSelect, DateRange, ClearFilterButton, inDateRange } from "@/components/ui";
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
  const [supplier, setSupplier] = useState("all");
  const [branch, setBranch] = useState("all");
  const [payFilter, setPayFilter] = useState<"all" | "debt" | "paid">("all");
  const [fromDate, setFromDate] = useState("");
  const [toDate, setToDate] = useState("");

  const suppliers = Array.from(new Set(receipts.map((r) => r.supplierName).filter(Boolean) as string[])).sort();
  const branches = Array.from(new Set(receipts.map((r) => r.branchName).filter(Boolean) as string[])).sort();

  const rows = receipts
    .filter((r) => `${r.code} ${r.supplierName ?? ""} ${r.branchName ?? ""}`.toLowerCase().includes(q.trim().toLowerCase()))
    .filter((r) => supplier === "all" || r.supplierName === supplier)
    .filter((r) => branch === "all" || r.branchName === branch)
    .filter((r) => payFilter === "all" || (payFilter === "debt" ? r.debt > 0 : r.debt <= 0))
    .filter((r) => inDateRange(r.date, fromDate, toDate));
  const sumMachines = rows.reduce((s, r) => s + r.machineCount, 0);
  const sumTotal = rows.reduce((s, r) => s + r.total, 0);
  const sumPaid = rows.reduce((s, r) => s + r.paid, 0);
  const sumDebt = rows.reduce((s, r) => s + r.debt, 0);

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

      <FilterBar search={<SearchInput value={q} onChange={setQ} placeholder="Tìm mã phiếu, NCC, chi nhánh..." className="max-w-xs" />}>
        <DateRange from={fromDate} to={toDate} onFrom={setFromDate} onTo={setToDate} />
        <FilterSelect value={supplier} onChange={(e) => setSupplier(e.target.value)}>
          <option value="all">Tất cả NCC</option>
          {suppliers.map((s) => (
            <option key={s} value={s}>
              {s}
            </option>
          ))}
        </FilterSelect>
        <FilterSelect value={branch} onChange={(e) => setBranch(e.target.value)}>
          <option value="all">Tất cả chi nhánh</option>
          {branches.map((b) => (
            <option key={b} value={b}>
              {b}
            </option>
          ))}
        </FilterSelect>
        <FilterSelect value={payFilter} onChange={(e) => setPayFilter(e.target.value as typeof payFilter)}>
          <option value="all">Tất cả TT</option>
          <option value="debt">Còn nợ</option>
          <option value="paid">Đã đủ</option>
        </FilterSelect>
        <ClearFilterButton
          show={!!(fromDate || toDate || supplier !== "all" || branch !== "all" || payFilter !== "all")}
          onClick={() => {
            setFromDate("");
            setToDate("");
            setSupplier("all");
            setBranch("all");
            setPayFilter("all");
          }}
        />
      </FilterBar>

      <Table
        head={["Mã phiếu", "Ngày", "Nhà cung cấp", "Chi nhánh", "Số máy", "Tổng tiền", "Đã trả", "Còn nợ"]}
        foot={
          rows.length > 0 ? (
            <tr>
              <FootTd className="text-xs uppercase tracking-wide text-[var(--muted)]">Tổng {rows.length} phiếu</FootTd>
              <FootTd />
              <FootTd />
              <FootTd />
              <FootTd className="whitespace-nowrap">{sumMachines} máy</FootTd>
              <FootTd className="whitespace-nowrap">{formatVND(sumTotal)}</FootTd>
              <FootTd className="whitespace-nowrap text-[var(--success)]">{formatVND(sumPaid)}</FootTd>
              <FootTd className="whitespace-nowrap text-[var(--danger)]">{sumDebt > 0 ? formatVND(sumDebt) : "—"}</FootTd>
            </tr>
          ) : undefined
        }
      >
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
