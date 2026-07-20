"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Save } from "lucide-react";
import { AccessGuard, BackLink, SectionCard } from "@/components/parts";
import { Button, PageHeader, Field, Input, Textarea, Select } from "@/components/ui";
import { useToast } from "@/components/toast";
import { useApi, apiPost } from "@/lib/api";
import type { Machine, Repair } from "@/lib/types";

export default function Page() {
  return (
    <AccessGuard menu="sua-chua">
      <Inner />
    </AccessGuard>
  );
}

function Inner() {
  const router = useRouter();
  const toast = useToast();
  const { data } = useApi<Machine[]>("/api/machines");
  const inStock = (data ?? []).filter((m) => m.status === "ton_kho" || m.status === "bao_hanh");
  const [busy, setBusy] = useState(false);
  const [f, setF] = useState({ serial: "", errorDesc: "", estCost: "", technician: "" });
  const set = (k: keyof typeof f) => (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) =>
    setF((s) => ({ ...s, [k]: e.target.value }));

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setBusy(true);
    try {
      const row = await apiPost<Repair>("/api/repairs", { ...f, estCost: Number(f.estCost) || 0 });
      toast(`Đã tạo phiếu ${row.code}${f.serial ? ` — máy ${f.serial} chuyển Đang sửa` : ""}`);
      router.push("/sua-chua");
    } catch (err) {
      toast(err instanceof Error ? err.message : "Tạo phiếu thất bại", "warning");
    } finally {
      setBusy(false);
    }
  };

  return (
    <div>
      <BackLink href="/sua-chua">Về danh sách phiếu</BackLink>
      <PageHeader title="Tạo phiếu sửa chữa" subtitle="Chọn máy trong kho (tự chuyển Đang sửa) hoặc bỏ trống nếu là máy khách mang tới" />
      <form onSubmit={submit} className="space-y-3">
        <div className="grid items-start gap-3 lg:grid-cols-2">
          <SectionCard title="Máy & lỗi">
            <div className="space-y-3">
              <Field label="Máy trong kho (tuỳ chọn)" hint="Bỏ trống nếu sửa máy của khách">
                <Select value={f.serial} onChange={set("serial")}>
                  <option value="">— Máy khách mang tới —</option>
                  {inStock.map((m) => (
                    <option key={m.id} value={m.serial}>
                      {m.serial} · {m.brand} {m.model}
                    </option>
                  ))}
                </Select>
              </Field>
              <Field label="Mô tả lỗi *">
                <Textarea rows={3} value={f.errorDesc} onChange={set("errorDesc")} placeholder="VD: Bàn phím liệt vài phím, cần thay" required />
              </Field>
            </div>
          </SectionCard>
          <SectionCard title="Chi phí & tiếp nhận">
            <div className="grid grid-cols-2 gap-3">
              <Field label="Chi phí dự kiến (₫)">
                <Input type="number" value={f.estCost} onChange={set("estCost")} placeholder="VD: 450000" />
              </Field>
              <Field label="Kỹ thuật viên">
                <Input value={f.technician} onChange={set("technician")} placeholder="VD: KTV Hùng" />
              </Field>
            </div>
          </SectionCard>
        </div>
        <div className="flex justify-end gap-2">
          <Button variant="outline" href="/sua-chua">
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
