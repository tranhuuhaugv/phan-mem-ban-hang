"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Save, FileText, PackageOpen } from "lucide-react";
import { AccessGuard, BackLink, SectionCard, DemoNoteInline, DetailRow } from "@/components/parts";
import { Button, PageHeader, Field, Input, Select, Textarea } from "@/components/ui";
import { useToast } from "@/components/toast";
import { orders, machines } from "@/lib/mock-data";
import { formatVND } from "@/lib/format";

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
  const [mode, setMode] = useState<"order" | "direct">("order");
  const [serial, setSerial] = useState("");
  const [withWarranty, setWithWarranty] = useState(false);

  const sellable = orders.filter((o) => o.status !== "huy");
  const inStock = machines.filter((m) => m.status === "ton_kho");
  const picked = inStock.find((m) => m.serial === serial);

  const pill = (active: boolean) =>
    `flex items-center gap-1.5 rounded-md px-3 py-1.5 text-[13px] font-medium transition-colors ${
      active ? "bg-[var(--primary)] text-white shadow-sm" : "text-[var(--muted)] hover:text-[var(--foreground)]"
    }`;

  const submit = (e: React.FormEvent) => {
    e.preventDefault();
    if (mode === "direct" && !serial) {
      toast("Vui lòng chọn máy trong kho để bán", "warning");
      return;
    }
    toast(mode === "direct" ? `Đã tạo hoá đơn bán trực tiếp máy ${serial} (demo)` : "Đã tạo hoá đơn (demo)");
    router.push("/hoa-don");
  };

  return (
    <div>
      <BackLink href="/hoa-don">Về danh sách hoá đơn</BackLink>
      <PageHeader title="Tạo hoá đơn" subtitle="Lập từ đơn bán có sẵn, hoặc bán trực tiếp 1 máy từ kho" />

      <form onSubmit={submit} className="space-y-3">
        {/* Chọn cách lập hoá đơn */}
        <div className="inline-flex rounded-lg border border-[var(--border)] bg-[var(--surface-2)] p-0.5">
          <button type="button" onClick={() => setMode("order")} className={pill(mode === "order")}>
            <FileText size={15} /> Từ đơn hàng
          </button>
          <button type="button" onClick={() => setMode("direct")} className={pill(mode === "direct")}>
            <PackageOpen size={15} /> Bán trực tiếp từ kho
          </button>
        </div>

        <div className="grid items-start gap-3 lg:grid-cols-2">
          {/* Nguồn hoá đơn */}
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
            <SectionCard title="Bán trực tiếp từ kho">
              <div className="space-y-3">
                <Field label="Chọn máy trong kho *" hint={`${inStock.length} máy đang tồn kho`}>
                  <Select value={serial} onChange={(e) => setSerial(e.target.value)}>
                    <option value="">— Chọn máy —</option>
                    {inStock.map((m) => (
                      <option key={m.id} value={m.serial}>
                        {m.serial} · {m.brand} {m.model} ({m.cpu}/{m.ram})
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
                    <DetailRow label="Giá nhập">{formatVND(picked.purchasePrice)}</DetailRow>
                  </div>
                )}

                <div className="grid grid-cols-2 gap-3">
                  <Field label="Khách hàng">
                    <Input placeholder="Tên khách" />
                  </Field>
                  <Field label="Số điện thoại">
                    <Input placeholder="VD: 0901234567" />
                  </Field>
                </div>
                <Field label="Giá bán (₫) *">
                  <Input type="number" placeholder="VD: 12500000" required />
                </Field>
              </div>
            </SectionCard>
          )}

          {/* Bảo hành */}
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
                <div className="grid grid-cols-2 gap-3">
                  <Field label="Thời hạn (tháng)">
                    <Input type="number" defaultValue={6} />
                  </Field>
                  <Field label="Số Serial">
                    <Input key={serial} defaultValue={mode === "direct" ? serial : ""} placeholder="VD: MBA-M1-5567" />
                  </Field>
                </div>
                <Field label="Điều kiện bảo hành">
                  <Textarea rows={2} placeholder="VD: BH phần cứng, lỗi NSX 1 đổi 1 trong 15 ngày" />
                </Field>
              </div>
            )}
          </SectionCard>
        </div>

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
