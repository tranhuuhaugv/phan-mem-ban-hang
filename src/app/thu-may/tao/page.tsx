"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Save } from "lucide-react";
import { AccessGuard, BackLink, SectionCard } from "@/components/parts";
import { CustomerField } from "@/components/customer-field";
import { Button, PageHeader, Field, Input, Textarea } from "@/components/ui";
import { useToast } from "@/components/toast";
import { apiPost } from "@/lib/api";
import type { BuyReceipt } from "@/lib/types";

export default function Page() {
  return (
    <AccessGuard menu="thu-may">
      <Inner />
    </AccessGuard>
  );
}

function Inner() {
  const router = useRouter();
  const toast = useToast();
  const [busy, setBusy] = useState(false);
  const [f, setF] = useState({ customerName: "", phone: "", model: "", config: "", price: "", condition: "" });
  const set = (k: keyof typeof f) => (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) =>
    setF((s) => ({ ...s, [k]: e.target.value }));

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setBusy(true);
    try {
      const row = await apiPost<BuyReceipt>("/api/buy-receipts", { ...f, price: Number(f.price) || 0 });
      toast(`Đã tạo phiếu ${row.code} — chờ duyệt`);
      router.push("/thu-may");
    } catch (err) {
      toast(err instanceof Error ? err.message : "Tạo phiếu thất bại", "warning");
    } finally {
      setBusy(false);
    }
  };

  return (
    <div>
      <BackLink href="/thu-may">Về danh sách phiếu</BackLink>
      <PageHeader title="Tạo phiếu thu máy" subtitle="Ghi nhận máy mua lại từ khách — phiếu sẽ ở trạng thái Chờ duyệt" />
      <form onSubmit={submit} className="space-y-3">
        <div className="grid items-start gap-3 lg:grid-cols-2">
          <SectionCard title="Thông tin khách">
            <CustomerField
              name={f.customerName}
              phone={f.phone}
              onName={(v) => setF((s) => ({ ...s, customerName: v }))}
              onPhone={(v) => setF((s) => ({ ...s, phone: v }))}
              layout="grid"
            />
          </SectionCard>
          <SectionCard title="Thông tin máy thu">
            <div className="grid grid-cols-2 gap-3">
              <Field label="Model *">
                <Input value={f.model} onChange={set("model")} placeholder="VD: HP EliteBook 840 G8" required />
              </Field>
              <Field label="Cấu hình">
                <Input value={f.config} onChange={set("config")} placeholder="VD: i7/16GB/512GB" />
              </Field>
              <Field label="Giá thu (₫) *">
                <Input type="number" value={f.price} onChange={set("price")} placeholder="VD: 11200000" required />
              </Field>
            </div>
            <div className="mt-3">
              <Field label="Tình trạng máy">
                <Textarea rows={2} value={f.condition} onChange={set("condition")} placeholder="VD: Đẹp 98%, pin tốt, còn BH hãng..." />
              </Field>
            </div>
          </SectionCard>
        </div>
        <div className="flex justify-end gap-2">
          <Button variant="outline" href="/thu-may">
            Huỷ
          </Button>
          <Button type="submit" disabled={busy}>
            <Save size={16} /> {busy ? "Đang tạo..." : "Tạo phiếu"}
          </Button>
        </div>
      </form>
    </div>
  );
}
