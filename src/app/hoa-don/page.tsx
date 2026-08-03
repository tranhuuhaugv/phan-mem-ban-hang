"use client";

import { useState } from "react";
import { Plus, Trash2 } from "lucide-react";
import Link from "next/link";
import { AccessGuard } from "@/components/parts";
import { Button, PageHeader, Table, Tr, Td, FootTd, EmptyState, SearchInput, Badge, FilterBar, FilterSelect, DateRange, ClearFilterButton, inDateRange } from "@/components/ui";
import { ConfirmDialog } from "@/components/modal";
import { useToast } from "@/components/toast";
import { useRole } from "@/components/role-context";
import { useApi, apiDelete } from "@/lib/api";
import type { Invoice } from "@/lib/types";
import { formatVND, formatDateTime } from "@/lib/format";
import { PayAmount } from "@/components/pay";

export default function Page() {
  return (
    <AccessGuard menu="hoa-don">
      <Inner />
    </AccessGuard>
  );
}

function Inner() {
  const { can } = useRole();
  const toast = useToast();
  const { data, loading, reload } = useApi<Invoice[]>("/api/invoices");
  const [q, setQ] = useState("");
  const [source, setSource] = useState<"all" | "ban" | "don_hang" | "sua_chua">("all");
  const [payFilter, setPayFilter] = useState<"all" | "debt" | "paid">("all");
  const [fromDate, setFromDate] = useState("");
  const [toDate, setToDate] = useState("");
  const [del, setDel] = useState<Invoice | null>(null);
  const kindOf = (iv: Invoice) => (iv.repairCode ? "sua_chua" : iv.orderCode ? "don_hang" : "ban");
  const rows = (data ?? [])
    .filter((iv) => `${iv.code} ${iv.orderCode} ${iv.repairCode ?? ""} ${iv.customerName}`.toLowerCase().includes(q.trim().toLowerCase()))
    .filter((iv) => source === "all" || kindOf(iv) === source)
    .filter((iv) => payFilter === "all" || (payFilter === "debt" ? (iv.debt ?? 0) > 0 : (iv.debt ?? 0) <= 0))
    .filter((iv) => inDateRange(iv.date, fromDate, toDate));
  const sumValue = rows.reduce((s, iv) => s + (iv.value ?? 0), 0);
  const sumDebt = rows.reduce((s, iv) => s + (iv.debt ?? 0), 0);
  return (
    <div>
      <PageHeader
        title="Hoá đơn"
        subtitle="Hoá đơn gắn với đơn bán — xem, in hoặc xuất PDF"
        actions={
          can("hoa-don").create && (
            <Button href="/hoa-don/tao">
              <Plus size={16} /> Tạo hoá đơn
            </Button>
          )
        }
      />
      <FilterBar search={<SearchInput value={q} onChange={setQ} placeholder="Tìm mã hoá đơn, đơn hàng, khách hàng..." className="max-w-xs" />}>
        <DateRange from={fromDate} to={toDate} onFrom={setFromDate} onTo={setToDate} />
        <FilterSelect value={source} onChange={(e) => setSource(e.target.value as typeof source)}>
          <option value="all">Tất cả nguồn</option>
          <option value="ban">Bán trực tiếp</option>
          <option value="don_hang">Từ đơn hàng</option>
          <option value="sua_chua">Từ sửa chữa</option>
        </FilterSelect>
        <FilterSelect value={payFilter} onChange={(e) => setPayFilter(e.target.value as typeof payFilter)}>
          <option value="all">Tất cả TT</option>
          <option value="debt">Còn nợ</option>
          <option value="paid">Đã đủ</option>
        </FilterSelect>
        <ClearFilterButton
          show={!!(fromDate || toDate || source !== "all" || payFilter !== "all")}
          onClick={() => {
            setFromDate("");
            setToDate("");
            setSource("all");
            setPayFilter("all");
          }}
        />
      </FilterBar>
      {rows.length === 0 ? (
        <EmptyState text={loading ? "Đang tải dữ liệu..." : q ? "Không tìm thấy hoá đơn phù hợp" : "Chưa có hoá đơn nào"} />
      ) : (
        <Table
          head={["Mã hoá đơn", "Nguồn", "Khách hàng", "Giá trị", "Còn nợ", "Ngày lập", "Người tạo", ""]}
          foot={
            <tr>
              <FootTd className="text-xs uppercase tracking-wide text-[var(--muted)]">Tổng {rows.length} HĐ</FootTd>
              <FootTd />
              <FootTd />
              <FootTd className="whitespace-nowrap">{formatVND(sumValue)}</FootTd>
              <FootTd className="whitespace-nowrap text-[var(--danger)]">{sumDebt > 0 ? formatVND(sumDebt) : "—"}</FootTd>
              <FootTd />
              <FootTd />
              <FootTd />
            </tr>
          }
        >
          {rows.map((iv) => (
            <Tr key={iv.id}>
              <Td className="font-mono text-xs font-medium">
                <Link href={`/hoa-don/${iv.id}?edit=1`} className="text-[var(--primary)] hover:underline">
                  {iv.code}
                </Link>
              </Td>
              <Td>
                {iv.kind === "sua_chua" ? (
                  <Badge tone="warning">Sửa chữa {iv.repairCode}</Badge>
                ) : iv.orderCode ? (
                  <Badge tone="info">Đơn {iv.orderCode}</Badge>
                ) : (
                  <Badge tone="success">Bán trực tiếp</Badge>
                )}
              </Td>
              <Td className="font-medium">{iv.customerName}</Td>
              <Td className="whitespace-nowrap font-medium">
                <PayAmount amount={iv.value} method={iv.payMethod} />
              </Td>
              <Td className="whitespace-nowrap">
                {iv.debt && iv.debt > 0 ? (
                  <span className="font-medium text-[var(--danger)]">{formatVND(iv.debt)}</span>
                ) : (
                  <span className="text-xs text-[var(--muted)]">Đủ</span>
                )}
              </Td>
              <Td className="whitespace-nowrap text-xs text-[var(--muted)]">{formatDateTime(iv.date)}</Td>
              <Td className="whitespace-nowrap text-xs text-[var(--muted)]">{iv.createdByName ?? "—"}</Td>
              <Td>
                <div className="flex items-center justify-end gap-2">
                  <Link href={`/hoa-don/${iv.id}`} className="text-sm text-[var(--primary)] hover:underline">
                    Xem / In
                  </Link>
                  {can("hoa-don").remove && (
                    <Button size="sm" variant="ghost" className="text-[var(--danger)]" onClick={() => setDel(iv)}>
                      <Trash2 size={15} />
                    </Button>
                  )}
                </div>
              </Td>
            </Tr>
          ))}
        </Table>
      )}

      <ConfirmDialog
        open={!!del}
        onClose={() => setDel(null)}
        onConfirm={async () => {
          if (!del) return;
          try {
            await apiDelete(`/api/invoices/${del.id}`);
            toast(`Đã xoá hoá đơn ${del.code}`);
            reload();
          } catch (e) {
            toast(e instanceof Error ? e.message : "Xoá thất bại", "warning");
          }
        }}
        title="Xoá hoá đơn"
        message={del ? `Xoá hoá đơn ${del.code}? Máy sẽ trả về kho, phiếu thu của hoá đơn bị xoá theo.` : ""}
        confirmText="Xoá"
        danger
      />
    </div>
  );
}
