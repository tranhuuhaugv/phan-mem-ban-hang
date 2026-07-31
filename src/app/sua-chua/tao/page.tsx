"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Save, Search, Plus, RefreshCw, Wallet, CreditCard } from "lucide-react";
import { AccessGuard, BackLink, SectionCard } from "@/components/parts";
import { CustomerField } from "@/components/customer-field";
import { Button, PageHeader, Field, Input, Textarea, Select } from "@/components/ui";
import { useToast } from "@/components/toast";
import { useApi, apiPost } from "@/lib/api";
import { QuickAddMachine } from "@/components/quick-add-machine";
import { formatVND } from "@/lib/format";
import type { Machine, Branch, Repair } from "@/lib/types";

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
  const { data, reload: reloadMachines } = useApi<Machine[]>("/api/machines");
  const { data: branches } = useApi<Branch[]>("/api/branches");
  const inStock = (data ?? []).filter((m) => m.status === "ton_kho" || m.status === "bao_hanh");

  const [branchId, setBranchId] = useState("");
  const [technician, setTechnician] = useState("");
  const [customerName, setCustomerName] = useState("");
  const [customerPhone, setCustomerPhone] = useState("");
  const [serial, setSerial] = useState("");
  const [isCustomer, setIsCustomer] = useState(false);
  const [query, setQuery] = useState("");
  const [model, setModel] = useState("");
  const [errorDesc, setErrorDesc] = useState("");
  const [quickAdd, setQuickAdd] = useState(false);

  // Khách lấy liền → thanh toán ngay
  const [payNow, setPayNow] = useState(false);
  const [parts, setParts] = useState("");
  const [cost, setCost] = useState("");
  const [amountPaid, setAmountPaid] = useState("");
  const [payMethod, setPayMethod] = useState<"tien_mat" | "chuyen_khoan">("tien_mat");
  const [busy, setBusy] = useState(false);

  const nameOf = (m: Machine) => [m.brand, m.model].filter(Boolean).join(" ");
  const picked = inStock.find((m) => m.serial === serial);
  const matches = (
    query.trim() ? inStock.filter((m) => `${m.serial} ${m.brand} ${m.model}`.toLowerCase().includes(query.trim().toLowerCase())) : inStock
  ).slice(0, 6);

  const pickMachine = (m: Machine) => {
    setSerial(m.serial);
    setIsCustomer(false);
    setModel(nameOf(m));
  };
  const resetMachine = () => {
    setSerial("");
    setIsCustomer(false);
    setQuery("");
    setModel("");
  };
  const useCustomer = () => {
    setIsCustomer(true);
    setSerial("");
    setModel(query.trim());
  };

  const costN = Number(cost) || 0;
  const paidN = Math.min(costN, Math.max(0, Number(amountPaid) || 0));
  const debtN = costN - paidN;

  const refresh = () => {
    setBranchId("");
    setTechnician("");
    setCustomerName("");
    setCustomerPhone("");
    resetMachine();
    setErrorDesc("");
    setPayNow(false);
    setParts("");
    setCost("");
    setAmountPaid("");
    setPayMethod("tien_mat");
  };

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    const isKho = !!serial;
    if (!errorDesc.trim()) return toast("Nhập Nội dung sửa", "warning");
    if (!isKho && !model.trim()) return toast("Chọn máy trong kho hoặc nhập Mặt hàng cần sửa", "warning");
    setBusy(true);
    try {
      const row = await apiPost<Repair>("/api/repairs", {
        serial: isKho ? serial : "",
        machineName: isKho ? "" : model.trim(),
        branchId: branchId || undefined,
        customerName,
        customerPhone,
        errorDesc,
        technician,
        estCost: payNow ? costN : 0,
        ...(payNow ? { completeNow: true, note: parts, actualCost: costN, amountPaid: paidN, payMethod } : {}),
      });
      toast(payNow ? `Đã tạo & thu tiền phiếu ${row.code}` : `Đã tạo phiếu ${row.code} — đang sửa`);
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
      <PageHeader title="Phiếu sửa chữa" subtitle="Nhận máy sửa — khách lấy liền thì thu tiền ngay, không thì để Đang sửa và thu khi khách tới lấy" />

      <form onSubmit={submit} className="space-y-3">
        <SectionCard>
          <div className="grid gap-x-4 gap-y-3 md:grid-cols-2">
            {/* Trái */}
            <Field label="Chi nhánh">
              <Select value={branchId} onChange={(e) => setBranchId(e.target.value)}>
                <option value="">— Chọn chi nhánh —</option>
                {(branches ?? []).map((b) => (
                  <option key={b.id} value={b.id}>
                    {b.name}
                  </option>
                ))}
              </Select>
            </Field>
            {/* Phải */}
            <Field label="Kỹ thuật">
              <Input value={technician} onChange={(e) => setTechnician(e.target.value)} placeholder="VD: KTV Hùng" />
            </Field>

            <Field label="Khách hàng">
              <CustomerField name={customerName} phone={customerPhone} onName={setCustomerName} onPhone={setCustomerPhone} layout="grid" />
            </Field>

            <Field label="Mặt hàng (máy cần sửa)" hint="Chọn máy trong kho, hoặc + để nhập máy khách / ngoài">
              {serial && picked ? (
                <div className="flex items-center justify-between gap-2 rounded-lg border border-[var(--border)] bg-[var(--surface-2)] px-3 py-2">
                  <span className="min-w-0">
                    <span className="block truncate text-sm font-medium">{nameOf(picked)}</span>
                    <span className="block font-mono text-xs text-[var(--muted)]">{picked.serial}</span>
                  </span>
                  <Button type="button" size="sm" variant="ghost" onClick={resetMachine}>
                    Đổi
                  </Button>
                </div>
              ) : isCustomer ? (
                <div className="flex items-center justify-between gap-2 rounded-lg border border-dashed border-[var(--border)] px-3 py-2 text-sm">
                  <span className="text-[var(--muted)]">Máy khách / ngoài kho — nhập tên ở ô Model</span>
                  <button type="button" onClick={resetMachine} className="text-xs text-[var(--primary)] hover:underline">
                    Chọn máy kho
                  </button>
                </div>
              ) : (
                <div>
                  <div className="relative">
                    <Search size={16} className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-[var(--muted)]" />
                    <Input value={query} onChange={(e) => setQuery(e.target.value)} placeholder="Tìm mã SP / tên máy..." className="pl-8" />
                  </div>
                  {(query.trim() || matches.length > 0) && (
                    <div className="mt-1 overflow-hidden rounded-lg border border-[var(--border)]">
                      {matches.map((m) => (
                        <button
                          key={m.id}
                          type="button"
                          onClick={() => pickMachine(m)}
                          className="flex w-full items-center justify-between border-b border-[var(--border)] px-3 py-2 text-left hover:bg-[var(--surface-2)]"
                        >
                          <span className="min-w-0">
                            <span className="block truncate text-sm font-medium">{nameOf(m)}</span>
                            <span className="block font-mono text-xs text-[var(--muted)]">{m.serial}</span>
                          </span>
                        </button>
                      ))}
                      <button
                        type="button"
                        onClick={useCustomer}
                        className="flex w-full items-center gap-1.5 border-b border-[var(--border)] px-3 py-2 text-left text-sm font-medium text-[var(--primary)] hover:bg-[var(--surface-2)]"
                      >
                        <Plus size={15} /> Máy khách / ngoài kho{query.trim() ? ` “${query.trim()}”` : ""}
                      </button>
                      <button
                        type="button"
                        onClick={() => setQuickAdd(true)}
                        className="flex w-full items-center gap-1.5 px-3 py-2 text-left text-sm font-medium text-[var(--primary)] hover:bg-[var(--surface-2)]"
                      >
                        <Plus size={15} /> Nhập kho “{query.trim()}” (thêm vào kho)
                      </button>
                    </div>
                  )}
                </div>
              )}
            </Field>

            <Field label="Model">
              <Input
                value={model}
                onChange={(e) => setModel(e.target.value)}
                readOnly={!!serial}
                placeholder={serial ? "" : "VD: Dell XPS 13 9310"}
                className={serial ? "text-[var(--muted)]" : ""}
              />
            </Field>

            <Field label="Nội dung sửa *">
              <Textarea rows={3} value={errorDesc} onChange={(e) => setErrorDesc(e.target.value)} placeholder="VD: Máy không lên nguồn, thay pin, vệ sinh máy..." />
            </Field>
          </div>
        </SectionCard>

        {/* Khách lấy liền → thanh toán */}
        <SectionCard>
          <label className="flex items-center gap-2 text-sm font-medium">
            <input type="checkbox" checked={payNow} onChange={(e) => setPayNow(e.target.checked)} className="h-4 w-4 accent-[var(--primary)]" />
            Khách lấy liền — thanh toán & trả máy ngay
          </label>
          {payNow && (
            <div className="mt-3 grid gap-4 md:grid-cols-2">
              <div className="space-y-3">
                <Field label="Mặt hàng / linh kiện đã thay">
                  <Input value={parts} onChange={(e) => setParts(e.target.value)} placeholder="VD: Thay pin, thay bàn phím..." />
                </Field>
                <Field label="Tiền công / chi phí sửa (₫)">
                  <Input type="number" value={cost} onChange={(e) => setCost(e.target.value)} placeholder="VD: 450000" />
                </Field>
                <Field label="Hình thức">
                  <div className="grid grid-cols-2 gap-2">
                    {([
                      { k: "tien_mat", label: "Tiền mặt", icon: Wallet },
                      { k: "chuyen_khoan", label: "Chuyển khoản", icon: CreditCard },
                    ] as const).map(({ k, label, icon: Icon }) => {
                      const active = payMethod === k;
                      return (
                        <button
                          key={k}
                          type="button"
                          onClick={() => setPayMethod(k)}
                          className={`flex items-center justify-center gap-2 rounded-xl border px-3 py-2 text-sm font-medium transition ${
                            active ? "border-[var(--primary)] bg-[var(--primary)]/10 text-[var(--primary)]" : "border-[var(--border)] hover:bg-[var(--surface-2)]"
                          }`}
                        >
                          <Icon size={16} /> {label}
                        </button>
                      );
                    })}
                  </div>
                </Field>
              </div>
              <div className="space-y-3">
                <Field label="Số tiền khách trả (₫)">
                  <div className="flex gap-2">
                    <Input type="number" value={amountPaid} onChange={(e) => setAmountPaid(e.target.value)} placeholder="0" className="flex-1" />
                    <Button type="button" variant="outline" onClick={() => setAmountPaid(String(costN))} disabled={costN <= 0}>
                      Trả đủ
                    </Button>
                  </div>
                </Field>
                <div className="space-y-2 rounded-xl border border-[var(--border)] bg-[var(--surface-2)] p-4 text-sm">
                  <div className="flex justify-between">
                    <span className="text-[var(--muted)]">Chi phí</span>
                    <span className="font-medium">{formatVND(costN)}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-[var(--muted)]">Khách trả</span>
                    <span className="font-medium text-[var(--success)]">{formatVND(paidN)}</span>
                  </div>
                  <div className="flex justify-between border-t border-[var(--border)] pt-2">
                    <span className="text-[var(--muted)]">Còn nợ</span>
                    <span className={`font-semibold ${debtN > 0 ? "text-[var(--danger)]" : ""}`}>{formatVND(debtN)}</span>
                  </div>
                </div>
              </div>
            </div>
          )}
          {!payNow && (
            <p className="mt-2 text-xs text-[var(--muted)]">Bỏ trống ô này → phiếu để trạng thái “Đang sửa”, thu tiền khi khách tới lấy.</p>
          )}
        </SectionCard>

        <div className="flex items-center justify-end gap-2">
          <Button type="button" variant="outline" onClick={refresh}>
            <RefreshCw size={16} /> Refresh
          </Button>
          <Button type="submit" disabled={busy}>
            <Save size={16} /> {busy ? "Đang lưu..." : "Lưu"}
          </Button>
        </div>
      </form>

      <QuickAddMachine
        open={quickAdd}
        onClose={() => setQuickAdd(false)}
        defaultName={query.trim()}
        onCreated={(m) => {
          reloadMachines();
          setSerial(m.serial);
          setIsCustomer(false);
          setModel(nameOf(m));
        }}
      />
    </div>
  );
}
