"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Save, FileText, PackageOpen, Plus, Trash2 } from "lucide-react";
import { AccessGuard, BackLink, SectionCard, DemoNoteInline } from "@/components/parts";
import { Button, PageHeader, Field, Input, Select, Textarea } from "@/components/ui";
import { useToast } from "@/components/toast";
import { orders, machines } from "@/lib/mock-data";
import { formatVND } from "@/lib/format";

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
  const [mode, setMode] = useState<"order" | "direct">("direct");
  const [items, setItems] = useState<LineItem[]>([]);
  const [addSerial, setAddSerial] = useState("");
  const [addPrice, setAddPrice] = useState("");
  const [withWarranty, setWithWarranty] = useState(false);

  const sellable = orders.filter((o) => o.status !== "huy");
  const inStock = machines.filter((m) => m.status === "ton_kho");
  const available = inStock.filter((m) => !items.some((i) => i.serial === m.serial));
  const total = items.reduce((s, i) => s + i.price, 0);

  const addItem = () => {
    const m = inStock.find((x) => x.serial === addSerial);
    if (!m) return toast("Chọn máy để thêm", "warning");
    const price = Number(addPrice);
    if (!price || price <= 0) return toast("Nhập giá bán hợp lệ", "warning");
    setItems((s) => [
      ...s,
      { serial: m.serial, name: `${m.brand} ${m.model}`, config: `${m.cpu} · ${m.ram} · ${m.storage}`, price },
    ]);
    setAddSerial("");
    setAddPrice("");
  };

  const removeItem = (serial: string) => setItems((s) => s.filter((i) => i.serial !== serial));

  const submit = (e: React.FormEvent) => {
    e.preventDefault();
    if (mode === "direct" && items.length === 0) return toast("Thêm ít nhất 1 sản phẩm vào hoá đơn", "warning");
    toast(
      mode === "direct"
        ? `Đã tạo hoá đơn ${items.length} sản phẩm · ${formatVND(total)} (demo)`
        : "Đã tạo hoá đơn (demo)",
    );
    router.push("/hoa-don");
  };

  const pill = (active: boolean) =>
    `flex items-center gap-1.5 rounded-md px-3 py-1.5 text-[13px] font-medium transition-colors ${
      active ? "bg-[var(--primary)] text-white shadow-sm" : "text-[var(--muted)] hover:text-[var(--foreground)]"
    }`;

  return (
    <div>
      <BackLink href="/hoa-don">Về danh sách hoá đơn</BackLink>
      <PageHeader title="Tạo hoá đơn" subtitle="Tự chọn nhiều máy từ kho thêm vào 1 hoá đơn, hoặc lập từ đơn bán có sẵn" />

      <form onSubmit={submit} className="space-y-3">
        <div className="inline-flex rounded-lg border border-[var(--border)] bg-[var(--surface-2)] p-0.5">
          <button type="button" onClick={() => setMode("direct")} className={pill(mode === "direct")}>
            <PackageOpen size={15} /> Tự chọn sản phẩm từ kho
          </button>
          <button type="button" onClick={() => setMode("order")} className={pill(mode === "order")}>
            <FileText size={15} /> Từ đơn hàng
          </button>
        </div>

        {mode === "order" ? (
          <SectionCard title="Đơn hàng">
            <Field label="Chọn đơn bán *" hint="Hoá đơn sẽ gắn với đơn này">
              <Select defaultValue="" required>
                <option value="">— Chọn đơn —</option>
                {sellable.map((o) => (
                  <option key={o.id} value={o.id}>
                    {o.code} · {o.customerName} · {formatVND(o.sellPrice)}
                  </option>
                ))}
              </Select>
            </Field>
          </SectionCard>
        ) : (
          <div className="grid items-start gap-3 lg:grid-cols-3">
            {/* Cột trái: khách hàng + bảo hành */}
            <div className="space-y-3">
              <SectionCard title="Khách hàng">
                <div className="space-y-3">
                  <Field label="Tên khách">
                    <Input placeholder="VD: Nguyễn Văn A" />
                  </Field>
                  <Field label="Số điện thoại">
                    <Input placeholder="VD: 0901234567" />
                  </Field>
                </div>
              </SectionCard>

              <SectionCard title="Bảo hành (tuỳ chọn)">
                <label className="flex items-center gap-2 text-sm">
                  <input
                    type="checkbox"
                    checked={withWarranty}
                    onChange={(e) => setWithWarranty(e.target.checked)}
                    className="h-4 w-4 accent-[var(--primary)]"
                  />
                  Kèm phiếu bảo hành
                </label>
                {withWarranty && (
                  <div className="mt-3 space-y-3">
                    <Field label="Thời hạn (tháng)">
                      <Input type="number" defaultValue={6} />
                    </Field>
                    <Field label="Điều kiện bảo hành">
                      <Textarea rows={2} placeholder="VD: BH phần cứng, 1 đổi 1 trong 15 ngày" />
                    </Field>
                  </div>
                )}
              </SectionCard>
            </div>

            {/* Cột phải: dựng danh sách sản phẩm */}
            <div className="lg:col-span-2">
              <SectionCard title="Sản phẩm trong hoá đơn">
                {/* Hàng thêm sản phẩm */}
                <div className="flex flex-wrap items-end gap-2">
                  <div className="min-w-[200px] flex-1">
                    <Field label="Chọn máy từ kho" hint={`Còn ${available.length} máy tồn kho`}>
                      <Select value={addSerial} onChange={(e) => setAddSerial(e.target.value)}>
                        <option value="">— Chọn máy —</option>
                        {available.map((m) => (
                          <option key={m.id} value={m.serial}>
                            {m.serial} · {m.brand} {m.model} ({m.cpu}/{m.ram})
                          </option>
                        ))}
                      </Select>
                    </Field>
                  </div>
                  <div className="w-40">
                    <Field label="Giá bán (₫)">
                      <Input
                        type="number"
                        value={addPrice}
                        onChange={(e) => setAddPrice(e.target.value)}
                        placeholder="VD: 12500000"
                      />
                    </Field>
                  </div>
                  <Button type="button" variant="outline" onClick={addItem}>
                    <Plus size={16} /> Thêm
                  </Button>
                </div>

                {/* Bảng sản phẩm đã thêm */}
                {items.length === 0 ? (
                  <p className="mt-3 rounded-lg border border-dashed border-[var(--border)] p-6 text-center text-sm text-[var(--muted)]">
                    Chưa có sản phẩm nào. Chọn máy + nhập giá rồi bấm <b>Thêm</b>.
                  </p>
                ) : (
                  <div className="mt-3 overflow-hidden rounded-lg border border-[var(--border)]">
                    <table className="w-full text-sm">
                      <thead>
                        <tr className="border-b border-[var(--border)] bg-[var(--surface-2)] text-left text-xs uppercase tracking-wide text-[var(--muted)]">
                          <th className="px-3 py-2 font-medium">Serial</th>
                          <th className="px-3 py-2 font-medium">Sản phẩm</th>
                          <th className="px-3 py-2 text-right font-medium">Giá bán</th>
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
                            <td className="whitespace-nowrap px-3 py-2 text-right font-medium">{formatVND(i.price)}</td>
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
                          <td className="px-3 py-2.5 text-right text-base font-bold text-[var(--primary)]">
                            {formatVND(total)}
                          </td>
                          <td></td>
                        </tr>
                      </tfoot>
                    </table>
                  </div>
                )}
              </SectionCard>
            </div>
          </div>
        )}

        <div className="flex items-center justify-between gap-2">
          <DemoNoteInline />
          <div className="flex gap-2">
            <Button variant="outline" href="/hoa-don">
              Huỷ
            </Button>
            <Button type="submit">
              <Save size={16} /> Tạo hoá đơn
            </Button>
          </div>
        </div>
      </form>
    </div>
  );
}
