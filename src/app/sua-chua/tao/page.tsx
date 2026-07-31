"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Save, Search, Plus } from "lucide-react";
import { AccessGuard, BackLink, SectionCard } from "@/components/parts";
import { CustomerField } from "@/components/customer-field";
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

  const [serial, setSerial] = useState("");
  const [khachMode, setKhachMode] = useState(false);
  const [query, setQuery] = useState("");
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
  const nameOf = (m: Machine) => [m.brand, m.model].filter(Boolean).join(" ");
  const matches = (
    query.trim()
      ? inStock.filter((m) => `${m.serial} ${m.brand} ${m.model}`.toLowerCase().includes(query.trim().toLowerCase()))
      : inStock
  ).slice(0, 6);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    const isKho = !!serial;
    if (!f.errorDesc.trim()) return toast("Nhập mô tả lỗi", "warning");
    if (!isKho && !f.machineName.trim()) return toast("Chọn máy trong kho hoặc nhập tên máy khách", "warning");

    setBusy(true);
    try {
      const row = await apiPost<Repair>("/api/repairs", {
        serial: isKho ? serial : "",
        machineName: isKho ? "" : f.machineName,
        customerName: f.customerName,
        customerPhone: f.customerPhone,
        errorDesc: f.errorDesc,
        technician: f.technician,
        estCost: Number(f.estCost) || 0,
        receiveDate: f.receiveDate,
        status: f.status,
      });
      toast(`Đã tạo phiếu ${row.code}${isKho ? ` — máy ${serial} chuyển Đang sửa` : ""}`);
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
      <PageHeader title="Tạo phiếu sửa chữa" subtitle="Ghi nhận máy nhận sửa: máy gì, lỗi gì, khách nào, KTV nào nhận" />

      <form onSubmit={submit} className="space-y-3">
        <div className="grid items-start gap-3 lg:grid-cols-3">
          {/* Cột 1: Máy nhận sửa */}
          <SectionCard title="Máy nhận sửa">
            {serial && picked ? (
              // Đã chọn máy trong kho
              <div className="space-y-3">
                <div className="flex items-start justify-between gap-2 rounded-lg bg-[var(--surface-2)] p-3">
                  <div className="min-w-0">
                    <div className="font-medium">{nameOf(picked)}</div>
                    <div className="font-mono text-xs text-[var(--muted)]">{picked.serial}</div>
                    <div className="text-xs text-[var(--muted)]">
                      {picked.cpu} · {picked.ram} · {picked.storage}
                    </div>
                  </div>
                  <Button type="button" size="sm" variant="ghost" onClick={() => { setSerial(""); setQuery(""); }}>
                    Đổi máy
                  </Button>
                </div>
                <p className="text-xs text-[var(--muted)]">Máy sẽ tự chuyển trạng thái “Đang sửa” khi tạo phiếu.</p>
              </div>
            ) : khachMode ? (
              // Máy khách mang tới (không có trong kho)
              <div className="space-y-3">
                <button
                  type="button"
                  onClick={() => setKhachMode(false)}
                  className="text-xs text-[var(--primary)] hover:underline"
                >
                  ← Tìm máy trong kho
                </button>
                <Field label="Tên máy *" hint="Máy của khách, không có trong kho">
                  <Input value={f.machineName} onChange={set("machineName")} placeholder="VD: Dell XPS 13 9310" autoFocus />
                </Field>
                <CustomerField
                  name={f.customerName}
                  phone={f.customerPhone}
                  onName={(v) => setF((s) => ({ ...s, customerName: v }))}
                  onPhone={(v) => setF((s) => ({ ...s, customerPhone: v }))}
                />
              </div>
            ) : (
              // Ô tìm sản phẩm để sửa
              <div className="space-y-2">
                <Field label="Tìm sản phẩm cần sửa *" hint="Chọn máy trong kho, hoặc bấm + để nhập máy khách">
                  <div className="relative">
                    <Search size={16} className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-[var(--muted)]" />
                    <Input value={query} onChange={(e) => setQuery(e.target.value)} placeholder="VD: SP0001, MacBook..." className="pl-8" />
                  </div>
                </Field>
                <div className="overflow-hidden rounded-lg border border-[var(--border)]">
                  {matches.map((m) => (
                    <button
                      key={m.id}
                      type="button"
                      onClick={() => setSerial(m.serial)}
                      className="flex w-full items-center justify-between gap-2 border-b border-[var(--border)] px-3 py-2 text-left hover:bg-[var(--surface-2)]"
                    >
                      <span className="min-w-0">
                        <span className="block truncate text-sm font-medium">{nameOf(m)}</span>
                        <span className="block font-mono text-xs text-[var(--muted)]">{m.serial}</span>
                      </span>
                    </button>
                  ))}
                  {matches.length === 0 && (
                    <p className="px-3 py-2 text-center text-xs text-[var(--muted)]">Không có máy khớp trong kho</p>
                  )}
                  <button
                    type="button"
                    onClick={() => {
                      setKhachMode(true);
                      setF((s) => ({ ...s, machineName: query.trim() }));
                    }}
                    className="flex w-full items-center gap-1.5 px-3 py-2 text-left text-sm font-medium text-[var(--primary)] hover:bg-[var(--surface-2)]"
                  >
                    <Plus size={15} /> Máy khách mang tới{query.trim() ? ` “${query.trim()}”` : " (không có trong kho)"}
                  </button>
                </div>
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
