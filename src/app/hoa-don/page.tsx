"use client";

import { useState } from "react";
import { Plus, Trash2 } from "lucide-react";
import Link from "next/link";
import { AccessGuard } from "@/components/parts";
import { Button, PageHeader, Table, Tr, Td, EmptyState, SearchInput, Badge, Select } from "@/components/ui";
import { ConfirmDialog } from "@/components/modal";
import { useToast } from "@/components/toast";
import { useRole } from "@/components/role-context";
import { useApi, apiDelete } from "@/lib/api";
import type { Invoice } from "@/lib/types";
import { formatVND, formatDateTime } from "@/lib/format";

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
  const [del, setDel] = useState<Invoice | null>(null);
  const kindOf = (iv: Invoice) => (iv.repairCode ? "sua_chua" : iv.orderCode ? "don_hang" : "ban");
  const rows = (data ?? [])
    .filter((iv) => `${iv.code} ${iv.orderCode} ${iv.repairCode ?? ""} ${iv.customerName}`.toLowerCase().includes(q.trim().toLowerCase()))
    .filter((iv) => source === "all" || kindOf(iv) === source)
    .filter((iv) => payFilter === "all" || (payFilter === "debt" ? (iv.debt ?? 0) > 0 : (iv.debt ?? 0) <= 0));
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
      <div className="mb-4 flex flex-wrap items-center gap-2">
        <SearchInput value={q} onChange={setQ} placeholder="Tìm mã hoá đơn, đơn hàng, khách hàng..." className="max-w-xs" />
        <Select value={source} onChange={(e) => setSource(e.target.value as typeof source)} className="w-44">
          <option value="all">Tất cả nguồn</option>
          <option value="ban">Bán trực tiếp</option>
          <option value="don_hang">Từ đơn hàng</option>
          <option value="sua_chua">Từ sửa chữa</option>
        </Select>
        <Select value={payFilter} onChange={(e) => setPayFilter(e.target.value as typeof payFilter)} className="w-40">
          <option value="all">Tất cả TT</option>
          <option value="debt">Còn nợ</option>
          <option value="paid">Đã đủ</option>
        </Select>
      </div>
      {rows.length === 0 ? (
        <EmptyState text={loading ? "Đang tải dữ liệu..." : q ? "Không tìm thấy hoá đơn phù hợp" : "Chưa có hoá đơn nào"} />
      ) : (
        <Table head={["Mã hoá đơn", "Nguồn", "Khách hàng", "Giá trị", "Còn nợ", "Ngày lập", ""]}>
          {rows.map((iv) => (
            <Tr key={iv.id}>
              <Td className="font-mono text-xs font-medium">{iv.code}</Td>
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
              <Td className="whitespace-nowrap font-medium">{formatVND(iv.value)}</Td>
              <Td className="whitespace-nowrap">
                {iv.debt && iv.debt > 0 ? (
                  <span className="font-medium text-[var(--danger)]">{formatVND(iv.debt)}</span>
                ) : (
                  <span className="text-xs text-[var(--muted)]">Đủ</span>
                )}
              </Td>
              <Td className="whitespace-nowrap text-xs text-[var(--muted)]">{formatDateTime(iv.date)}</Td>
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
