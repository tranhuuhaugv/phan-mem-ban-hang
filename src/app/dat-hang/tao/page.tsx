"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Save } from "lucide-react";
import { AccessGuard, BackLink, SectionCard, DetailRow } from "@/components/parts";
import { Button, PageHeader, Field, Input, Select } from "@/components/ui";
import { useToast } from "@/components/toast";
import { useApi, apiPost } from "@/lib/api";
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
  const [busy, setBusy] = useState(false);
  const picked = available.find((m) => m.serial === serial);
  const set = (k: keyof typeof f) => (e: React.ChangeEvent<HTMLInputElement>) =>
    setF((s) => ({ ...s, [k]: e.target.value }));

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
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
      <PageHeader title="Tạo đơn đặt hàng" subtitle="Chỉ chọn được máy đang Tồn kho — máy sẽ được giữ (Đặt cọc), không bán trùng" />
      <form onSubmit={submit} className="space-y-3">
        <div className="grid items-start gap-3 lg:grid-cols-3">
          <SectionCard title="Khách hàng">
            <div className="space-y-3">
              <Field label="Tên khách / công ty *">
                <Input value={f.customerName} onChange={set("customerName")} placeholder="VD: Nguyễn Hải Đăng" required />
              </Field>
              <Field label="Số điện thoại">
                <Input value={f.phone} onChange={set("phone")} placeholder="VD: 0905556677" />
              </Field>
            </div>
          </SectionCard>

          <SectionCard title="Máy bán">
            <Field label="Chọn máy tồn kho (Mã SP) *" hint={`${available.length} máy đang tồn kho có thể bán`}>
              <Select value={serial} onChange={(e) => setSerial(e.target.value)}>
                <option value="">— Chọn máy —</option>
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
                <Input type="number" value={f.sellPrice} onChange={set("sellPrice")} placeholder="VD: 16500000" required />
              </Field>
              <Field label="Tiền cọc (₫)" hint="Có cọc → tự ghi phiếu thu vào sổ quỹ">
                <Input type="number" value={f.deposit} onChange={set("deposit")} placeholder="VD: 5000000" />
              </Field>
            </div>
          </SectionCard>
        </div>

        <div className="flex justify-end gap-2">
          <Button variant="outline" href="/dat-hang">
            Huỷ
          </Button>
          <Button type="submit" disabled={busy}>
            <Save size={16} /> {busy ? "Đang tạo..." : "Tạo đơn"}
          </Button>
        </div>
      </form>
    </div>
  );
}
