"use client";

import { use, useState } from "react";
import { AccessGuard, BackLink, DetailRow, SectionCard } from "@/components/parts";
import { PageHeader, Card, Button } from "@/components/ui";
import { OrderStatusBadge } from "@/components/status";
import { useToast } from "@/components/toast";
import { useApi, apiPatch } from "@/lib/api";
import type { Order } from "@/lib/types";
import { formatVND, formatDateTime } from "@/lib/format";
import { ReceiptText, CheckCircle2, XCircle, Loader2 } from "lucide-react";

interface OrderDetail extends Order {
  config?: string;
}

export default function Page({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  return (
    <AccessGuard menu="dat-hang">
      <Inner id={id} />
    </AccessGuard>
  );
}

function Inner({ id }: { id: string }) {
  const toast = useToast();
  const { data: order, loading, reload } = useApi<OrderDetail>(`/api/orders/${id}`);
  const [busy, setBusy] = useState(false);

  const setStatus = async (status: string, label: string) => {
    setBusy(true);
    try {
      await apiPatch(`/api/orders/${id}`, { status });
      toast(label);
      reload();
    } catch (e) {
      toast(e instanceof Error ? e.message : "Cập nhật thất bại", "warning");
    } finally {
      setBusy(false);
    }
  };

  if (loading) {
    return (
      <div className="grid min-h-[40vh] place-items-center">
        <Loader2 className="animate-spin text-[var(--muted)]" />
      </div>
    );
  }
  if (!order) {
    return (
      <div>
        <BackLink href="/dat-hang">Về danh sách đơn</BackLink>
        <Card className="p-8 text-center text-sm text-[var(--muted)]">Không tìm thấy đơn hàng.</Card>
      </div>
    );
  }
  const remain = order.sellPrice - order.deposit;

  return (
    <div>
      <BackLink href="/dat-hang">Về danh sách đơn</BackLink>
      <PageHeader
        title={`Đơn ${order.code}`}
        subtitle={`Tạo lúc ${formatDateTime(order.date)}`}
        actions={
          <div className="flex flex-wrap gap-2">
            {order.status !== "da_giao" && order.status !== "huy" && (
              <>
                <Button variant="outline" disabled={busy} onClick={() => setStatus("huy", "Đã huỷ đơn — máy trở về Tồn kho")}>
                  <XCircle size={15} /> Huỷ đơn
                </Button>
                <Button
                  disabled={busy}
                  onClick={() => setStatus("da_giao", "Đã giao — máy chuyển Đã bán, tiền còn lại vào sổ quỹ")}
                >
                  <CheckCircle2 size={15} /> Đã giao hàng
                </Button>
              </>
            )}
            <Button variant="outline" href="/hoa-don/tao">
              <ReceiptText size={16} /> Xuất hoá đơn
            </Button>
          </div>
        }
      />

      <div className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-3">
        <SectionCard title="Khách hàng">
          <DetailRow label="Tên">{order.customerName}</DetailRow>
          <DetailRow label="SĐT">{order.phone || "—"}</DetailRow>
          <DetailRow label="Trạng thái">
            <OrderStatusBadge status={order.status} />
          </DetailRow>
        </SectionCard>

        <SectionCard title="Máy bán">
          <DetailRow label="Model">{order.model}</DetailRow>
          <DetailRow label="Mã SP">
            <span className="font-mono">{order.serial || "chưa gán"}</span>
          </DetailRow>
          {order.config && <DetailRow label="Cấu hình">{order.config}</DetailRow>}
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
