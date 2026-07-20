"use client";

import { useState } from "react";
import { Plus } from "lucide-react";
import Link from "next/link";
import { AccessGuard } from "@/components/parts";
import { Button, PageHeader, Table, Tr, Td, EmptyState, SearchInput } from "@/components/ui";
import { useRole } from "@/components/role-context";
import { useApi } from "@/lib/api";
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
  const { data, loading } = useApi<Invoice[]>("/api/invoices");
  const [q, setQ] = useState("");
  const rows = (data ?? []).filter((iv) =>
    `${iv.code} ${iv.orderCode} ${iv.customerName}`.toLowerCase().includes(q.trim().toLowerCase()),
  );
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
        <SearchInput value={q} onChange={setQ} placeholder="Tìm mã hoá đơn, đơn hàng, khách hàng..." />
      </div>
      {rows.length === 0 ? (
        <EmptyState text={loading ? "Đang tải dữ liệu..." : q ? "Không tìm thấy hoá đơn phù hợp" : "Chưa có hoá đơn nào"} />
      ) : (
        <Table head={["Mã hoá đơn", "Đơn hàng", "Khách hàng", "Giá trị", "Ngày lập", ""]}>
          {rows.map((iv) => (
            <Tr key={iv.id}>
              <Td className="font-mono text-xs font-medium">{iv.code}</Td>
              <Td className="font-mono text-xs text-[var(--muted)]">{iv.orderCode}</Td>
              <Td className="font-medium">{iv.customerName}</Td>
              <Td className="whitespace-nowrap font-medium">{formatVND(iv.value)}</Td>
              <Td className="whitespace-nowrap text-xs text-[var(--muted)]">{formatDateTime(iv.date)}</Td>
              <Td>
                <div className="flex justify-end">
                  <Link href={`/hoa-don/${iv.id}`} className="text-sm text-[var(--primary)] hover:underline">
                    Xem / In
                  </Link>
                </div>
              </Td>
            </Tr>
          ))}
        </Table>
      )}
    </div>
  );
}
