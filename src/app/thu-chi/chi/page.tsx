"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Save } from "lucide-react";
import { AccessGuard, BackLink, SectionCard } from "@/components/parts";
import { Button, PageHeader, Field, Input, Select } from "@/components/ui";
import { useToast } from "@/components/toast";
import { apiPost } from "@/lib/api";
import type { CashFlow } from "@/lib/types";

export default function Page() {
  return (
    <AccessGuard menu="thu-chi">
      <Inner />
    </AccessGuard>
  );
}

function Inner() {
  const router = useRouter();
  const toast = useToast();
  const [busy, setBusy] = useState(false);
  const [f, setF] = useState({
    date: new Date().toISOString().slice(0, 10),
    amount: "",
    category: "Nhập hàng",
    partner: "",
    content: "",
  });
  const set = (k: keyof typeof f) => (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) =>
    setF((s) => ({ ...s, [k]: e.target.value }));

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setBusy(true);
    try {
      const row = await apiPost<CashFlow>("/api/cashflows", { ...f, type: "chi", amount: Number(f.amount) || 0 });
      toast(`Đã tạo phiếu chi ${row.code}`);
      router.push("/thu-chi");
    } catch (err) {
      toast(err instanceof Error ? err.message : "Tạo phiếu thất bại", "warning");
    } finally {
      setBusy(false);
    }
  };

  return (
    <div>
      <BackLink href="/thu-chi">Về sổ quỹ</BackLink>
      <PageHeader title="Tạo phiếu chi" subtitle="Ghi nhận khoản tiền chi ra (nhập hàng, sửa chữa, mặt bằng, quảng cáo...)" />
      <form onSubmit={submit} className="max-w-3xl space-y-3">
        <SectionCard>
          <div className="grid grid-cols-2 gap-3">
            <Field label="Ngày">
              <Input type="date" value={f.date} onChange={set("date")} required />
            </Field>
            <Field label="Số tiền (₫) *">
              <Input type="number" value={f.amount} onChange={set("amount")} placeholder="VD: 12000000" required />
            </Field>
            <Field label="Loại chi phí">
              <Select value={f.category} onChange={set("category")}>
                {["Nhập hàng", "Thu mua máy", "Sửa chữa", "Mặt bằng", "Quảng cáo", "Lương", "Khác"].map((x) => (
                  <option key={x}>{x}</option>
                ))}
              </Select>
            </Field>
            <Field label="Người nhận / NCC">
              <Input value={f.partner} onChange={set("partner")} placeholder="Tên đối tác" />
            </Field>
          </div>
          <div className="mt-3">
            <Field label="Nội dung *">
              <Input value={f.content} onChange={set("content")} placeholder="VD: Nhập lô 3 máy từ HN" required />
            </Field>
          </div>
        </SectionCard>
        <div className="flex justify-end gap-2">
          <Button variant="outline" href="/thu-chi">
            Huỷ
          </Button>
          <Button type="submit" disabled={busy}>
            <Save size={16} /> {busy ? "Đang lưu..." : "Lưu phiếu chi"}
          </Button>
        </div>
      </form>
    </div>
  );
}
