"use client";

import { use, useState, useEffect, useRef } from "react";
import { useSearchParams } from "next/navigation";
import { AccessGuard, BackLink, DetailRow, SectionCard } from "@/components/parts";
import { PageHeader, Card, Button, Field, Input, Select, MoneyInput } from "@/components/ui";
import { Modal } from "@/components/modal";
import { OrderStatusBadge } from "@/components/status";
import { useToast } from "@/components/toast";
import { useRole } from "@/components/role-context";
import { useApi, apiPatch } from "@/lib/api";
import type { Order, Machine } from "@/lib/types";
import { formatVND, formatDateTime } from "@/lib/format";
import { ReceiptText, CheckCircle2, XCircle, Loader2, Pencil, Save } from "lucide-react";

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
  const { can } = useRole();
  const canEdit = can("dat-hang").edit;
  const { data: order, loading, reload } = useApi<OrderDetail>(`/api/orders/${id}`);
  const { data: machines } = useApi<Machine[]>("/api/machines");
  const [busy, setBusy] = useState(false);
  const [edit, setEdit] = useState(false);
  const [f, setF] = useState({ customerName: "", phone: "", serial: "", sellPrice: "", deposit: "" });

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

  const openEdit = () => {
    if (!order) return;
    setF({
      customerName: order.customerName ?? "",
      phone: order.phone ?? "",
      serial: order.serial ?? "",
      sellPrice: String(order.sellPrice ?? ""),
      deposit: String(order.deposit ?? ""),
    });
    setEdit(true);
  };
  const saveEdit = async () => {
    const machineId = (machines ?? []).find((m) => m.serial === f.serial)?.id ?? "";
    setBusy(true);
    try {
      await apiPatch(`/api/orders/${id}`, {
        customerName: f.customerName.trim(),
        phone: f.phone.trim(),
        machineId,
        sellPrice: Number(f.sellPrice) || 0,
        deposit: Number(f.deposit) || 0,
      });
      toast("Đã cập nhật đơn hàng");
      setEdit(false);
      reload();
    } catch (e) {
      toast(e instanceof Error ? e.message : "Cập nhật thất bại", "warning");
    } finally {
      setBusy(false);
    }
  };

  const searchParams = useSearchParams();
  const didAutoEdit = useRef(false);
  useEffect(() => {
    if (!didAutoEdit.current && order && searchParams.get("edit") === "1" && canEdit) {
      didAutoEdit.current = true;
      openEdit();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [order, searchParams]);

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
            {canEdit && (
              <Button variant="outline" onClick={openEdit}>
                <Pencil size={15} /> Sửa đơn
              </Button>
            )}
            <Button href={`/hoa-don/tao?order=${order.id}`}>
              <ReceiptText size={16} /> Tạo phiếu thanh toán
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

      <Modal
        open={edit}
        onClose={() => setEdit(false)}
        title="Sửa đơn hàng"
        footer={
          <>
            <Button variant="outline" onClick={() => setEdit(false)}>
              Huỷ
            </Button>
            <Button onClick={saveEdit} disabled={busy}>
              <Save size={16} /> {busy ? "Đang lưu..." : "Lưu"}
            </Button>
          </>
        }
      >
        <div className="grid grid-cols-2 gap-3">
          <Field label="Tên khách">
            <Input value={f.customerName} onChange={(e) => setF((s) => ({ ...s, customerName: e.target.value }))} />
          </Field>
          <Field label="SĐT">
            <Input value={f.phone} onChange={(e) => setF((s) => ({ ...s, phone: e.target.value }))} />
          </Field>
          <div className="col-span-2">
            <Field label="Máy (Mã SP)" hint="Đổi máy: máy cũ trả về Tồn kho, máy mới được giữ cho đơn">
              <Select value={f.serial} onChange={(e) => setF((s) => ({ ...s, serial: e.target.value }))}>
                <option value="">— Chưa gán máy —</option>
                {order.serial && !(machines ?? []).some((m) => m.serial === order.serial && m.status === "ton_kho") && (
                  <option value={order.serial}>{order.serial} — {order.model} (đang gán)</option>
                )}
                {(machines ?? [])
                  .filter((m) => m.status === "ton_kho")
                  .map((m) => (
                    <option key={m.id} value={m.serial}>
                      {m.serial} — {m.brand} {m.model}
                    </option>
                  ))}
              </Select>
            </Field>
          </div>
          <Field label="Giá bán (₫)">
            <MoneyInput value={f.sellPrice} onChange={(v) => setF((s) => ({ ...s, sellPrice: v }))} />
          </Field>
          <Field label="Đã cọc (₫)">
            <MoneyInput value={f.deposit} onChange={(v) => setF((s) => ({ ...s, deposit: v }))} />
          </Field>
        </div>
      </Modal>
    </div>
  );
}
