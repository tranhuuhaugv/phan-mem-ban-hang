"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { Save, FileText, PackageOpen, Plus, Trash2, Search, Wrench } from "lucide-react";
import { AccessGuard, BackLink, SectionCard, DetailRow } from "@/components/parts";
import { CustomerField } from "@/components/customer-field";
import { Button, PageHeader, Field, Input, Select, Textarea } from "@/components/ui";
import { useToast } from "@/components/toast";
import { useApi, apiPost } from "@/lib/api";
import type { Machine, Order, Repair, Invoice } from "@/lib/types";
import { formatVND } from "@/lib/format";

type Mode = "direct" | "order" | "repair";

interface LineItem {
  serial: string;
  name: string;
  config: string;
  price: number;
}

export default function Page() {
  return (
    <AccessGuard menu="hoa-don">
      <Inner />
    </AccessGuard>
  );
}

function Inner() {
  const router = useRouter();
  const toast = useToast();
  const { data: machinesData } = useApi<Machine[]>("/api/machines");
  const { data: ordersData } = useApi<Order[]>("/api/orders");
  const { data: repairsData } = useApi<Repair[]>("/api/repairs");

  const [mode, setMode] = useState<Mode>("direct");
  const [items, setItems] = useState<LineItem[]>([]);
  const [query, setQuery] = useState("");
  const [customerName, setCustomerName] = useState("");
  const [phone, setPhone] = useState("");
  const [orderId, setOrderId] = useState("");
  const [repairId, setRepairId] = useState("");
  const [withWarranty, setWithWarranty] = useState(false);
  const [wMonths, setWMonths] = useState("6");
  const [wCondition, setWCondition] = useState("");
  const [busy, setBusy] = useState(false);

  // Nhận link từ đơn hàng (?order=) hoặc phiếu sửa (?repair=)
  useEffect(() => {
    const sp = new URLSearchParams(window.location.search);
    const o = sp.get("order");
    const r = sp.get("repair");
    if (o) {
      setMode("order");
      setOrderId(o);
    } else if (r) {
      setMode("repair");
      setRepairId(r);
    }
  }, []);

  const inStock = (machinesData ?? []).filter((m) => m.status === "ton_kho");
  const sellable = (ordersData ?? []).filter((o) => o.status !== "huy" && o.status !== "da_giao");
  const repairs = repairsData ?? [];
  const pickedRepair = repairs.find((r) => r.id === repairId);
  const available = inStock.filter((m) => !items.some((i) => i.serial === m.serial));
  const total = items.reduce((s, i) => s + i.price, 0);

  const matches = query.trim()
    ? available
        .filter((m) =>
          `${m.serial} ${m.brand} ${m.model} ${m.cpu} ${m.ram} ${m.storage} ${m.screen}`
            .toLowerCase()
            .includes(query.trim().toLowerCase()),
        )
        .slice(0, 6)
    : [];

  const addMachine = (serial: string) => {
    const m = inStock.find((x) => x.serial === serial);
    if (!m) return;
    setItems((s) => [
      ...s,
      { serial: m.serial, name: `${m.brand} ${m.model}`, config: `${m.cpu} · ${m.ram} · ${m.storage}`, price: 0 },
    ]);
    setQuery("");
  };

  const setPrice = (serial: string, price: number) =>
    setItems((s) => s.map((i) => (i.serial === serial ? { ...i, price } : i)));
  const removeItem = (serial: string) => setItems((s) => s.filter((i) => i.serial !== serial));

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (mode === "direct") {
      if (items.length === 0) return toast("Thêm ít nhất 1 sản phẩm vào hoá đơn", "warning");
      if (items.some((i) => !i.price)) return toast("Nhập giá bán cho tất cả sản phẩm", "warning");
    } else if (mode === "order" && !orderId) {
      return toast("Chọn đơn hàng", "warning");
    } else if (mode === "repair" && !repairId) {
      return toast("Chọn phiếu sửa chữa", "warning");
    }
    setBusy(true);
    try {
      const warranty = withWarranty ? { months: Number(wMonths) || 6, condition: wCondition } : undefined;
      const body =
        mode === "direct"
          ? {
              mode: "direct",
              customerName,
              phone,
              items: items.map((i) => ({ serial: i.serial, price: i.price })),
              warranty,
            }
          : mode === "order"
            ? { mode: "order", orderId, warranty }
            : { mode: "repair", repairId };
      const row = await apiPost<Invoice>("/api/invoices", body);
      toast(`Đã tạo hoá đơn ${row.code} · ${formatVND(row.value)}`);
      router.push(`/hoa-don/${row.id}`);
    } catch (err) {
      toast(err instanceof Error ? err.message : "Tạo hoá đơn thất bại", "warning");
    } finally {
      setBusy(false);
    }
  };

  const pill = (active: boolean) =>
    `flex items-center gap-1.5 rounded-md px-3 py-1.5 text-[13px] font-medium transition-colors ${
      active ? "bg-[var(--primary)] text-white shadow-sm" : "text-[var(--muted)] hover:text-[var(--foreground)]"
    }`;

  return (
    <div>
      <BackLink href="/hoa-don">Về danh sách hoá đơn</BackLink>
      <PageHeader title="Tạo hoá đơn / phiếu thanh toán" subtitle="Bán trực tiếp, từ đơn đặt hàng, hoặc thu tiền công từ phiếu sửa chữa" />

      <form onSubmit={submit} className="space-y-3">
        <div className="inline-flex flex-wrap rounded-lg border border-[var(--border)] bg-[var(--surface-2)] p-0.5">
          <button type="button" onClick={() => setMode("direct")} className={pill(mode === "direct")}>
            <PackageOpen size={15} /> Bán từ kho
          </button>
          <button type="button" onClick={() => setMode("order")} className={pill(mode === "order")}>
            <FileText size={15} /> Từ đơn hàng
          </button>
          <button type="button" onClick={() => setMode("repair")} className={pill(mode === "repair")}>
            <Wrench size={15} /> Từ phiếu sửa chữa
          </button>
        </div>

        {mode === "repair" ? (
          <div className="grid items-start gap-3 lg:grid-cols-2">
            <SectionCard title="Phiếu sửa chữa">
              <Field label="Chọn phiếu sửa *" hint="Thu tiền công sửa → ghi vào sổ quỹ (thu)">
                <Select value={repairId} onChange={(e) => setRepairId(e.target.value)} required>
                  <option value="">— Chọn phiếu —</option>
                  {repairs.map((r) => (
                    <option key={r.id} value={r.id}>
                      {r.code} · {r.model} · {formatVND(r.actualCost ?? r.estCost)}
                    </option>
                  ))}
                </Select>
              </Field>
              {pickedRepair && (
                <div className="mt-3 rounded-lg bg-[var(--surface-2)] p-3">
                  <DetailRow label="Máy">{pickedRepair.model}</DetailRow>
                  <DetailRow label="Lỗi">{pickedRepair.errorDesc}</DetailRow>
                  <DetailRow label="Khách hàng">{pickedRepair.customerName || "—"}</DetailRow>
                  <DetailRow label="KTV">{pickedRepair.technician || "—"}</DetailRow>
                  <DetailRow label="Tiền công">
                    <span className="font-semibold text-[var(--primary)]">
                      {formatVND(pickedRepair.actualCost ?? pickedRepair.estCost)}
                    </span>
                  </DetailRow>
                </div>
              )}
            </SectionCard>
            <SectionCard title="Phiếu thanh toán">
              <p className="text-sm text-[var(--muted)]">
                Tạo phiếu thanh toán cho tiền công sửa chữa. Hệ thống sẽ tự ghi 1 phiếu thu vào sổ quỹ và có thể in/xuất
                PDF cho khách.
              </p>
              {pickedRepair && (
                <div className="mt-3 rounded-lg border border-[var(--border)] p-3 text-center">
                  <div className="text-xs text-[var(--muted)]">Tổng thu</div>
                  <div className="text-2xl font-bold text-[var(--primary)]">
                    {formatVND(pickedRepair.actualCost ?? pickedRepair.estCost)}
                  </div>
                </div>
              )}
            </SectionCard>
          </div>
        ) : mode === "order" ? (
          <div className="grid items-start gap-3 lg:grid-cols-2">
            <SectionCard title="Đơn hàng">
              <Field label="Chọn đơn bán *" hint="Đơn sẽ chuyển Đã giao, máy chuyển Đã bán, tiền còn lại vào sổ quỹ">
                <Select value={orderId} onChange={(e) => setOrderId(e.target.value)} required>
                  <option value="">— Chọn đơn —</option>
                  {sellable.map((o) => (
                    <option key={o.id} value={o.id}>
                      {o.code} · {o.customerName} · {formatVND(o.sellPrice)}
                    </option>
                  ))}
                </Select>
              </Field>
            </SectionCard>
            <WarrantyCard
              withWarranty={withWarranty}
              setWithWarranty={setWithWarranty}
              wMonths={wMonths}
              setWMonths={setWMonths}
              wCondition={wCondition}
              setWCondition={setWCondition}
            />
          </div>
        ) : (
          <div className="grid items-start gap-3 lg:grid-cols-3">
            <div className="space-y-3">
              <SectionCard title="Khách hàng">
                <CustomerField name={customerName} phone={phone} onName={setCustomerName} onPhone={setPhone} />
              </SectionCard>
              <WarrantyCard
                withWarranty={withWarranty}
                setWithWarranty={setWithWarranty}
                wMonths={wMonths}
                setWMonths={setWMonths}
                wCondition={wCondition}
                setWCondition={setWCondition}
              />
            </div>

            <div className="lg:col-span-2">
              <SectionCard title="Sản phẩm trong hoá đơn">
                <Field label="Tìm sản phẩm theo Mã SP" hint={`${available.length} máy tồn kho có thể thêm`}>
                  <div className="relative">
                    <Search size={16} className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-[var(--muted)]" />
                    <Input
                      value={query}
                      onChange={(e) => setQuery(e.target.value)}
                      placeholder="Gõ mã, tên hoặc cấu hình, VD: SP0001, Dell, 16GB..."
                      className="pl-9"
                    />
                  </div>
                </Field>

                {query.trim() && (
                  <div className="mt-2 overflow-hidden rounded-lg border border-[var(--border)]">
                    {matches.length === 0 ? (
                      <p className="px-3 py-3 text-center text-sm text-[var(--muted)]">
                        Không tìm thấy máy tồn kho khớp “{query}”.
                      </p>
                    ) : (
                      matches.map((m) => (
                        <button
                          key={m.id}
                          type="button"
                          onClick={() => addMachine(m.serial)}
                          className="flex w-full items-center justify-between gap-3 border-b border-[var(--border)] px-3 py-2 text-left last:border-0 hover:bg-[var(--surface-2)]"
                        >
                          <span className="min-w-0">
                            <span className="block font-mono text-xs font-medium">{m.serial}</span>
                            <span className="block truncate text-xs text-[var(--muted)]">
                              {m.brand} {m.model} · {m.cpu}/{m.ram}/{m.storage}
                            </span>
                          </span>
                          <span className="flex shrink-0 items-center gap-1 text-xs font-medium text-[var(--primary)]">
                            <Plus size={14} /> Thêm
                          </span>
                        </button>
                      ))
                    )}
                  </div>
                )}

                {items.length === 0 ? (
                  <p className="mt-3 rounded-lg border border-dashed border-[var(--border)] p-6 text-center text-sm text-[var(--muted)]">
                    Chưa có sản phẩm. Gõ mã máy ở trên để tìm và thêm vào hoá đơn.
                  </p>
                ) : (
                  <div className="mt-3 overflow-hidden rounded-lg border border-[var(--border)]">
                    <table className="w-full text-sm">
                      <thead>
                        <tr className="border-b border-[var(--border)] bg-[var(--surface-2)] text-left text-xs uppercase tracking-wide text-[var(--muted)]">
                          <th className="px-3 py-2 font-medium">Mã SP</th>
                          <th className="px-3 py-2 font-medium">Sản phẩm</th>
                          <th className="px-3 py-2 font-medium">Giá bán (₫)</th>
                          <th className="w-10 px-3 py-2"></th>
                        </tr>
                      </thead>
                      <tbody>
                        {items.map((i) => (
                          <tr key={i.serial} className="border-b border-[var(--border)] last:border-0">
                            <td className="px-3 py-2 font-mono text-xs">{i.serial}</td>
                            <td className="px-3 py-2">
                              <div className="font-medium">{i.name}</div>
                              <div className="text-xs text-[var(--muted)]">{i.config}</div>
                            </td>
                            <td className="px-3 py-2">
                              <Input
                                type="number"
                                value={i.price || ""}
                                onChange={(e) => setPrice(i.serial, Number(e.target.value))}
                                placeholder="Nhập giá"
                                className="h-8 w-32"
                              />
                            </td>
                            <td className="px-3 py-2 text-right">
                              <button
                                type="button"
                                onClick={() => removeItem(i.serial)}
                                className="text-[var(--muted)] hover:text-[var(--danger)]"
                              >
                                <Trash2 size={15} />
                              </button>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                      <tfoot>
                        <tr className="bg-[var(--surface-2)]">
                          <td colSpan={2} className="px-3 py-2.5 text-right text-sm font-medium">
                            Tổng cộng ({items.length} sản phẩm)
                          </td>
                          <td colSpan={2} className="px-3 py-2.5 text-base font-bold text-[var(--primary)]">
                            {formatVND(total)}
                          </td>
                        </tr>
                      </tfoot>
                    </table>
                  </div>
                )}
              </SectionCard>
            </div>
          </div>
        )}

        <div className="flex items-center justify-end gap-2">
          <Button variant="outline" href="/hoa-don">
            Huỷ
          </Button>
          <Button type="submit" disabled={busy}>
            <Save size={16} /> {busy ? "Đang tạo..." : "Tạo hoá đơn"}
          </Button>
        </div>
      </form>
    </div>
  );
}

function WarrantyCard({
  withWarranty,
  setWithWarranty,
  wMonths,
  setWMonths,
  wCondition,
  setWCondition,
}: {
  withWarranty: boolean;
  setWithWarranty: (v: boolean) => void;
  wMonths: string;
  setWMonths: (v: string) => void;
  wCondition: string;
  setWCondition: (v: string) => void;
}) {
  return (
    <SectionCard title="Bảo hành (tuỳ chọn)">
      <label className="flex items-center gap-2 text-sm">
        <input
          type="checkbox"
          checked={withWarranty}
          onChange={(e) => setWithWarranty(e.target.checked)}
          className="h-4 w-4 accent-[var(--primary)]"
        />
        Kèm phiếu bảo hành cho các máy trong hoá đơn
      </label>
      {withWarranty && (
        <div className="mt-3 space-y-3">
          <Field label="Thời hạn (tháng)">
            <Input type="number" value={wMonths} onChange={(e) => setWMonths(e.target.value)} />
          </Field>
          <Field label="Điều kiện bảo hành">
            <Textarea rows={2} value={wCondition} onChange={(e) => setWCondition(e.target.value)} placeholder="VD: BH phần cứng, 1 đổi 1 trong 15 ngày" />
          </Field>
        </div>
      )}
    </SectionCard>
  );
}
