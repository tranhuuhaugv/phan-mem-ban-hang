"use client";

import { useState } from "react";
import { Plus } from "lucide-react";
import { AccessGuard } from "@/components/parts";
import { Button, PageHeader, Table, Tr, Td, Select, SearchInput } from "@/components/ui";
import { OrderStatusBadge } from "@/components/status";
import { useRole } from "@/components/role-context";
import { useApi } from "@/lib/api";
import { ORDER_STATUS_LABEL, type Order, type OrderStatus } from "@/lib/types";
import { formatVND, formatDateTime } from "@/lib/format";
import Link from "next/link";

export default function Page() {
  return (
    <AccessGuard menu="dat-hang">
      <Inner />
    </AccessGuard>
  );
}

function Inner() {
  const { can } = useRole();
  const { data, loading } = useApi<Order[]>("/api/orders");
  const [status, setStatus] = useState<OrderStatus | "all">("all");
  const [q, setQ] = useState("");
  const rows = (data ?? []).filter((o) => {
    if (status !== "all" && o.status !== status) return false;
    return `${o.code} ${o.customerName} ${o.phone} ${o.serial} ${o.model}`.toLowerCase().includes(q.trim().toLowerCase());
  });

  return (
    <div>
      <PageHeader
        title="Đặt hàng"
        subtitle="Đơn bán gán Mã SP cụ thể để tránh bán trùng máy"
        actions={
          can("dat-hang").create && (
            <Button href="/dat-hang/tao">
              <Plus size={16} /> Tạo đơn đặt hàng
            </Button>
          )
        }
      />

      <div className="mb-4 flex flex-wrap items-center gap-2">
        <SearchInput value={q} onChange={setQ} placeholder="Tìm mã đơn, khách hàng, SĐT, Mã SP..." />
        <Select value={status} onChange={(e) => setStatus(e.target.value as OrderStatus | "all")} className="w-52">
          <option value="all">Tất cả trạng thái</option>
          {Object.entries(ORDER_STATUS_LABEL).map(([k, v]) => (
            <option key={k} value={k}>
              {v}
            </option>
          ))}
        </Select>
      </div>

      <Table head={["Mã đơn", "Khách hàng", "Máy (Mã SP)", "Giá bán", "Cọc", "Ngày", "Trạng thái"]}>
        {rows.map((o) => (
          <Tr key={o.id}>
            <Td>
              <Link href={`/dat-hang/${o.id}`} className="font-mono text-xs font-medium text-[var(--primary)] hover:underline">
                {o.code}
              </Link>
            </Td>
            <Td>
              <div className="font-medium">{o.customerName}</div>
              <div className="text-xs text-[var(--muted)]">{o.phone}</div>
            </Td>
            <Td>
              <div>{o.model}</div>
              <div className="font-mono text-xs text-[var(--muted)]">{o.serial || "chưa gán"}</div>
            </Td>
            <Td className="whitespace-nowrap font-medium">{formatVND(o.sellPrice)}</Td>
            <Td className="whitespace-nowrap text-[var(--muted)]">{formatVND(o.deposit)}</Td>
            <Td className="whitespace-nowrap text-xs text-[var(--muted)]">{formatDateTime(o.date)}</Td>
            <Td>
              <OrderStatusBadge status={o.status} />
            </Td>
          </Tr>
        ))}
        {rows.length === 0 && (
          <Tr>
            <Td className="text-center text-[var(--muted)]">
              <div className="py-6">{loading ? "Đang tải dữ liệu..." : "Chưa có đơn hàng nào"}</div>
            </Td>
          </Tr>
        )}
      </Table>
    </div>
  );
}
