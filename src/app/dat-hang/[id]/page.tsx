"use client";

import { use } from "react";
import { AccessGuard, BackLink, DetailRow, SectionCard } from "@/components/parts";
import { PageHeader, Card, Button } from "@/components/ui";
import { OrderStatusBadge } from "@/components/status";
import { orders, machines } from "@/lib/mock-data";
import { formatVND, formatDate } from "@/lib/format";
import { ReceiptText } from "lucide-react";

export default function Page({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  return (
    <AccessGuard menu="dat-hang">
      <Inner id={id} />
    </AccessGuard>
  );
}

function Inner({ id }: { id: string }) {
  const order = orders.find((o) => o.id === id);
  if (!order) {
    return (
      <div>
        <BackLink href="/dat-hang">Về danh sách đơn</BackLink>
        <Card className="p-8 text-center text-sm text-[var(--muted)]">Không tìm thấy đơn hàng.</Card>
      </div>
    );
  }
  const machine = machines.find((m) => m.serial === order.serial);
  const remain = order.sellPrice - order.deposit;

  return (
    <div>
      <BackLink href="/dat-hang">Về danh sách đơn</BackLink>
      <PageHeader
        title={`Đơn ${order.code}`}
        subtitle={`Tạo ngày ${formatDate(order.date)}`}
        actions={
          <Button variant="outline" href="/hoa-don/tao">
            <ReceiptText size={16} /> Xuất hoá đơn
          </Button>
        }
      />

      <div className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-3">
        <SectionCard title="Khách hàng">
          <DetailRow label="Tên">{order.customerName}</DetailRow>
          <DetailRow label="SĐT">{order.phone}</DetailRow>
          <DetailRow label="Trạng thái">
            <OrderStatusBadge status={order.status} />
          </DetailRow>
        </SectionCard>

        <SectionCard title="Máy bán">
          <DetailRow label="Model">{order.model}</DetailRow>
          <DetailRow label="Serial">
            <span className="font-mono">{order.serial || "chưa gán"}</span>
          </DetailRow>
          {machine && (
            <DetailRow label="Cấu hình">
              {machine.cpu} · {machine.ram} · {machine.storage}
            </DetailRow>
          )}
        </SectionCard>

        <SectionCard title="Thanh toán">
          <DetailRow label="Giá bán">{formatVND(order.sellPrice)}</DetailRow>
          <DetailRow label="Đã cọc">{formatVND(order.deposit)}</DetailRow>
          <DetailRow label="Còn lại">
            <span className={remain > 0 ? "text-[var(--danger)]" : "text-[var(--success)]"}>{formatVND(remain)}</span>
          </DetailRow>
        </SectionCard>
      </div>
    </div>
  );
}
