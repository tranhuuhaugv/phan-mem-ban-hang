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
    category: "Bán hàng",
    partner: "",
    content: "",
  });
  const set = (k: keyof typeof f) => (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) =>
    setF((s) => ({ ...s, [k]: e.target.value }));

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setBusy(true);
    try {
      const row = await apiPost<CashFlow>("/api/cashflows", { ...f, type: "thu", amount: Number(f.amount) || 0 });
      toast(`Đã tạo phiếu thu ${row.code}`);
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
      <PageHeader title="Tạo phiếu thu" subtitle="Ghi nhận khoản tiền thu vào (bán hàng, thu nợ...)" />
      <form onSubmit={submit} className="max-w-3xl space-y-3">
        <SectionCard>
          <div className="grid grid-cols-2 gap-3">
            <Field label="Ngày">
              <Input type="date" value={f.date} onChange={set("date")} required />
            </Field>
            <Field label="Số tiền (₫) *">
              <Input type="number" value={f.amount} onChange={set("amount")} placeholder="VD: 5000000" required />
            </Field>
            <Field label="Nguồn thu">
              <Select value={f.category} onChange={set("category")}>
                {["Bán hàng", "Thu nợ", "Sửa chữa", "Khác"].map((x) => (
                  <option key={x}>{x}</option>
                ))}
              </Select>
            </Field>
            <Field label="Người nộp">
              <Input value={f.partner} onChange={set("partner")} placeholder="Tên khách / đối tác" />
            </Field>
          </div>
          <div className="mt-3">
            <Field label="Nội dung *">
              <Input value={f.content} onChange={set("content")} placeholder="VD: Cọc đơn DH-0128" required />
            </Field>
          </div>
        </SectionCard>
        <div className="flex justify-end gap-2">
          <Button variant="outline" href="/thu-chi">
            Huỷ
          </Button>
          <Button type="submit" disabled={busy}>
            <Save size={16} /> {busy ? "Đang lưu..." : "Lưu phiếu thu"}
          </Button>
        </div>
      </form>
    </div>
  );
}
