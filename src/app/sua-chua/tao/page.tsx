"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Save, Boxes, UserRound } from "lucide-react";
import { AccessGuard, BackLink, SectionCard, DetailRow } from "@/components/parts";
import { Button, PageHeader, Field, Input, Textarea, Select } from "@/components/ui";
import { useToast } from "@/components/toast";
import { useApi, apiPost } from "@/lib/api";
import { formatVND } from "@/lib/format";
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

  const [source, setSource] = useState<"kho" | "khach">("khach");
  const [serial, setSerial] = useState("");
  const [busy, setBusy] = useState(false);
  const [f, setF] = useState({
    machineName: "",
    customerName: "",
    customerPhone: "",
    errorDesc: "",
    technician: "",
    estCost: "",
    receiveDate: new Date().toISOString().slice(0, 16),
    status: "dang_sua",
  });
  const set = (k: keyof typeof f) => (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) =>
    setF((s) => ({ ...s, [k]: e.target.value }));

  const picked = inStock.find((m) => m.serial === serial);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!f.errorDesc.trim()) return toast("Nhập mô tả lỗi", "warning");
    if (source === "kho" && !serial) return toast("Chọn máy trong kho", "warning");
    if (source === "khach" && !f.machineName.trim()) return toast("Nhập tên máy khách mang tới", "warning");

    setBusy(true);
    try {
      const row = await apiPost<Repair>("/api/repairs", {
        serial: source === "kho" ? serial : "",
        machineName: source === "khach" ? f.machineName : "",
        customerName: f.customerName,
        customerPhone: f.customerPhone,
        errorDesc: f.errorDesc,
        technician: f.technician,
        estCost: Number(f.estCost) || 0,
        receiveDate: f.receiveDate,
        status: f.status,
      });
      toast(`Đã tạo phiếu ${row.code}${source === "kho" ? ` — máy ${serial} chuyển Đang sửa` : ""}`);
      router.push("/sua-chua");
    } catch (err) {
      toast(err instanceof Error ? err.message : "Tạo phiếu thất bại", "warning");
    } finally {
      setBusy(false);
    }
  };

  const tab = (active: boolean) =>
    `flex items-center gap-1.5 rounded-md px-3 py-1.5 text-[13px] font-medium transition-colors ${
      active ? "bg-[var(--primary)] text-white shadow-sm" : "text-[var(--muted)] hover:text-[var(--foreground)]"
    }`;

  return (
    <div>
      <BackLink href="/sua-chua">Về danh sách phiếu</BackLink>
      <PageHeader title="Tạo phiếu sửa chữa" subtitle="Ghi nhận máy nhận sửa: máy gì, lỗi gì, khách nào, KTV nào nhận" />

      <form onSubmit={submit} className="space-y-3">
        <div className="inline-flex rounded-lg border border-[var(--border)] bg-[var(--surface-2)] p-0.5">
          <button type="button" onClick={() => setSource("khach")} className={tab(source === "khach")}>
            <UserRound size={15} /> Máy khách mang tới
          </button>
          <button type="button" onClick={() => setSource("kho")} className={tab(source === "kho")}>
            <Boxes size={15} /> Máy trong kho
          </button>
        </div>

        <div className="grid items-start gap-3 lg:grid-cols-3">
          {/* Cột 1: Máy nhận sửa */}
          <SectionCard title="Máy nhận sửa">
            {source === "khach" ? (
              <div className="space-y-3">
                <Field label="Tên máy *" hint="Máy của khách, không có trong kho">
                  <Input value={f.machineName} onChange={set("machineName")} placeholder="VD: Dell XPS 13 9310" />
                </Field>
                <Field label="Khách hàng">
                  <Input value={f.customerName} onChange={set("customerName")} placeholder="VD: Nguyễn Văn A" />
                </Field>
                <Field label="Số điện thoại">
                  <Input value={f.customerPhone} onChange={set("customerPhone")} placeholder="VD: 0901234567" />
                </Field>
              </div>
            ) : (
              <div className="space-y-3">
                <Field label="Chọn máy trong kho (Mã SP) *">
                  <Select value={serial} onChange={(e) => setSerial(e.target.value)}>
                    <option value="">— Chọn máy —</option>
                    {inStock.map((m) => (
                      <option key={m.id} value={m.serial}>
                        {m.serial} · {m.brand} {m.model}
                      </option>
                    ))}
                  </Select>
                </Field>
                {picked && (
                  <div className="rounded-lg bg-[var(--surface-2)] p-3">
                    <DetailRow label="Máy">
                      {picked.brand} {picked.model}
                    </DetailRow>
                    <DetailRow label="Cấu hình">
                      {picked.cpu} · {picked.ram} · {picked.storage}
                    </DetailRow>
                  </div>
                )}
                <p className="text-xs text-[var(--muted)]">Máy sẽ tự chuyển trạng thái “Đang sửa” khi tạo phiếu.</p>
              </div>
            )}
          </SectionCard>

          {/* Cột 2: Lỗi */}
          <SectionCard title="Tình trạng lỗi">
            <Field label="Mô tả lỗi *">
              <Textarea rows={6} value={f.errorDesc} onChange={set("errorDesc")} placeholder="VD: Máy không lên nguồn, nghi hỏng main. Bàn phím liệt hàng phím số..." />
            </Field>
          </SectionCard>

          {/* Cột 3: Tiếp nhận */}
          <SectionCard title="Tiếp nhận">
            <div className="space-y-3">
              <Field label="KTV nhận / phụ trách">
                <Input value={f.technician} onChange={set("technician")} placeholder="VD: KTV Hùng" />
              </Field>
              <Field label="Ngày giờ nhận máy">
                <Input type="datetime-local" value={f.receiveDate} onChange={set("receiveDate")} />
              </Field>
              <Field label="Chi phí dự kiến (₫)">
                <Input type="number" value={f.estCost} onChange={set("estCost")} placeholder="VD: 450000" />
              </Field>
              <Field label="Trạng thái">
                <Select value={f.status} onChange={set("status")}>
                  <option value="dang_sua">Đang sửa</option>
                  <option value="cho_linh_kien">Chờ linh kiện</option>
                </Select>
              </Field>
            </div>
          </SectionCard>
        </div>

        <div className="flex items-center justify-between gap-2">
          <span className="text-xs text-[var(--muted)]">
            {f.estCost ? `Chi phí dự kiến: ${formatVND(Number(f.estCost))}` : ""}
          </span>
          <div className="flex gap-2">
            <Button variant="outline" href="/sua-chua">
              Huỷ
            </Button>
            <Button type="submit" disabled={busy}>
              <Save size={16} /> {busy ? "Đang tạo..." : "Tạo phiếu"}
            </Button>
          </div>
        </div>
      </form>
    </div>
  );
}
