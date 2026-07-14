"use client";

import { useState } from "react";
import { Plus } from "lucide-react";
import { AccessGuard } from "@/components/parts";
import { Button, PageHeader, Table, Tr, Td, Select } from "@/components/ui";
import { OrderStatusBadge } from "@/components/status";
import { useRole } from "@/components/role-context";
import { orders } from "@/lib/mock-data";
import { ORDER_STATUS_LABEL, type OrderStatus } from "@/lib/types";
import { formatVND, formatDate } from "@/lib/format";
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
  const [status, setStatus] = useState<OrderStatus | "all">("all");
  const rows = orders.filter((o) => status === "all" || o.status === status);

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

      <div className="mb-4">
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
            <Td className="whitespace-nowrap text-[var(--muted)]">{formatDate(o.date)}</Td>
            <Td>
              <OrderStatusBadge status={o.status} />
            </Td>
          </Tr>
        ))}
      </Table>
    </div>
  );
}
