"use client";

import { Plus } from "lucide-react";
import Link from "next/link";
import { AccessGuard } from "@/components/parts";
import { Button, PageHeader, Table, Tr, Td, EmptyState } from "@/components/ui";
import { useRole } from "@/components/role-context";
import { invoices } from "@/lib/mock-data";
import { formatVND, formatDate } from "@/lib/format";

export default function Page() {
  return (
    <AccessGuard menu="hoa-don">
      <Inner />
    </AccessGuard>
  );
}

function Inner() {
  const { can } = useRole();
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
      {invoices.length === 0 ? (
        <EmptyState text="Chưa có hoá đơn nào" />
      ) : (
        <Table head={["Mã hoá đơn", "Đơn hàng", "Khách hàng", "Giá trị", "Ngày lập", ""]}>
          {invoices.map((iv) => (
            <Tr key={iv.id}>
              <Td className="font-mono text-xs font-medium">{iv.code}</Td>
              <Td className="font-mono text-xs text-[var(--muted)]">{iv.orderCode}</Td>
              <Td className="font-medium">{iv.customerName}</Td>
              <Td className="whitespace-nowrap font-medium">{formatVND(iv.value)}</Td>
              <Td className="whitespace-nowrap text-[var(--muted)]">{formatDate(iv.date)}</Td>
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
