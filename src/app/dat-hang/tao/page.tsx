"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { Save } from "lucide-react";
import { AccessGuard, BackLink, SectionCard, DetailRow } from "@/components/parts";
import { CustomerField } from "@/components/customer-field";
import { Button, PageHeader, Field, Select, MoneyInput } from "@/components/ui";
import { useToast } from "@/components/toast";
import { useApi, apiPost, apiPatch } from "@/lib/api";
import type { Machine, Order } from "@/lib/types";
import { formatVND } from "@/lib/format";

export default function Page() {
  return (
    <AccessGuard menu="dat-hang">
      <Inner />
    </AccessGuard>
  );
}

function Inner() {
  const router = useRouter();
  const toast = useToast();
  const { data } = useApi<Machine[]>("/api/machines");
  const available = (data ?? []).filter((m) => m.status === "ton_kho");
  const [serial, setSerial] = useState("");
  const [f, setF] = useState({ customerName: "", phone: "", sellPrice: "", deposit: "" });
  const [editId, setEditId] = useState("");
  const [busy, setBusy] = useState(false);
  const picked = (data ?? []).find((m) => m.serial === serial);

  const { data: editOrder } = useApi<Order>(editId ? `/api/orders/${editId}` : null);

  /* eslint-disable react-hooks/set-state-in-effect */
  useEffect(() => {
    const e = new URLSearchParams(window.location.search).get("edit");
    if (e) setEditId(e);
  }, []);
  useEffect(() => {
    if (!editOrder) return;
    setSerial(editOrder.serial ?? "");
    setF({
      customerName: editOrder.customerName ?? "",
      phone: editOrder.phone ?? "",
      sellPrice: String(editOrder.sellPrice ?? ""),
      deposit: String(editOrder.deposit ?? ""),
    });
  }, [editOrder]);
  /* eslint-enable react-hooks/set-state-in-effect */

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (editId) {
      setBusy(true);
      try {
        const machineId = (data ?? []).find((m) => m.serial === serial)?.id ?? "";
        await apiPatch(`/api/orders/${editId}`, {
          customerName: f.customerName,
          phone: f.phone,
          machineId,
          sellPrice: Number(f.sellPrice) || 0,
          deposit: Number(f.deposit) || 0,
        });
        toast("Đã cập nhật đơn hàng");
        router.push(`/dat-hang/${editId}`);
      } catch (err) {
        toast(err instanceof Error ? err.message : "Cập nhật thất bại", "warning");
      } finally {
        setBusy(false);
      }
      return;
    }
    if (!serial) {
      toast("Vui lòng chọn máy (Mã SP) để bán", "warning");
      return;
    }
    setBusy(true);
    try {
      const row = await apiPost<Order>("/api/orders", {
        customerName: f.customerName,
        phone: f.phone,
        serial,
        sellPrice: Number(f.sellPrice) || 0,
        deposit: Number(f.deposit) || 0,
      });
      toast(`Đã tạo đơn ${row.code} — máy ${serial} chuyển sang Đặt cọc`);
      router.push("/dat-hang");
    } catch (err) {
      toast(err instanceof Error ? err.message : "Tạo đơn thất bại", "warning");
    } finally {
      setBusy(false);
    }
  };

  return (
    <div>
      <BackLink href="/dat-hang">Về danh sách đơn</BackLink>
      <PageHeader
        title={editId ? `Sửa đơn ${editOrder?.code ?? ""}` : "Tạo đơn đặt hàng"}
        subtitle={editId ? "Đổi máy/khách/giá — lưu lại sẽ đảo trạng thái máy tương ứng" : "Chỉ chọn được máy đang Tồn kho — máy sẽ được giữ (Đặt cọc), không bán trùng"}
      />
      <form onSubmit={submit} className="space-y-3">
        <div className="grid items-start gap-3 lg:grid-cols-3">
          <SectionCard title="Khách hàng">
            <CustomerField
              name={f.customerName}
              phone={f.phone}
              onName={(v) => setF((s) => ({ ...s, customerName: v }))}
              onPhone={(v) => setF((s) => ({ ...s, phone: v }))}
            />
          </SectionCard>

          <SectionCard title="Máy bán">
            <Field label="Chọn máy tồn kho (Mã SP) *" hint={`${available.length} máy đang tồn kho có thể bán`}>
              <Select value={serial} onChange={(e) => setSerial(e.target.value)}>
                <option value="">— Chọn máy —</option>
                {editId && editOrder?.serial && !available.some((m) => m.serial === editOrder.serial) && (
                  <option value={editOrder.serial}>
                    {editOrder.serial} · {editOrder.model} (đang gán)
                  </option>
                )}
                {available.map((m) => (
                  <option key={m.id} value={m.serial}>
                    {m.serial} · {m.brand} {m.model} ({m.cpu}/{m.ram})
                  </option>
                ))}
              </Select>
            </Field>
            {picked && (
              <div className="mt-3 rounded-lg bg-[var(--surface-2)] p-3">
                <DetailRow label="Máy">
                  {picked.brand} {picked.model}
                </DetailRow>
                <DetailRow label="Cấu hình">
                  {picked.cpu} · {picked.ram} · {picked.storage}
                </DetailRow>
                <DetailRow label="Giá nhập">{formatVND(picked.purchasePrice)}</DetailRow>
              </div>
            )}
          </SectionCard>

          <SectionCard title="Thanh toán">
            <div className="space-y-3">
              <Field label="Giá bán (₫) *">
                <MoneyInput value={f.sellPrice} onChange={(v) => setF((s) => ({ ...s, sellPrice: v }))} placeholder="VD: 16.500.000" />
              </Field>
              <Field label="Tiền cọc (₫)" hint="Có cọc → tự ghi phiếu thu vào sổ quỹ">
                <MoneyInput value={f.deposit} onChange={(v) => setF((s) => ({ ...s, deposit: v }))} placeholder="VD: 5.000.000" />
              </Field>
            </div>
          </SectionCard>
        </div>

        <div className="flex justify-end gap-2">
          <Button variant="outline" href="/dat-hang">
            Huỷ
          </Button>
          <Button type="submit" disabled={busy}>
            <Save size={16} /> {busy ? "Đang lưu..." : editId ? "Lưu thay đổi" : "Tạo đơn"}
          </Button>
        </div>
      </form>
    </div>
  );
}
