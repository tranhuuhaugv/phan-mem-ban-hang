"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Save } from "lucide-react";
import { AccessGuard, BackLink, FormGrid, SectionCard, DemoNote } from "@/components/parts";
import { Button, PageHeader, Field, Input, Select, Textarea } from "@/components/ui";
import { useToast } from "@/components/toast";
import { orders } from "@/lib/mock-data";
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
  const [withWarranty, setWithWarranty] = useState(false);
  const sellable = orders.filter((o) => o.status !== "huy");

  return (
    <div>
      <BackLink href="/hoa-don">Về danh sách hoá đơn</BackLink>
      <PageHeader title="Tạo hoá đơn" subtitle="Chọn đơn bán đã có để lập hoá đơn" />
      <form
        onSubmit={(e) => {
          e.preventDefault();
          toast("Đã tạo hoá đơn (demo)");
          router.push("/hoa-don");
        }}
        className="space-y-4"
      >
        <SectionCard title="Đơn hàng">
          <Field label="Chọn đơn bán *">
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
            <div className="mt-4 space-y-4">
              <FormGrid>
                <Field label="Thời hạn (tháng)">
                  <Input type="number" defaultValue={6} />
                </Field>
                <Field label="Số Serial">
                  <Input placeholder="VD: MBA-M1-5567" />
                </Field>
              </FormGrid>
              <Field label="Điều kiện bảo hành">
                <Textarea rows={2} placeholder="VD: BH phần cứng, lỗi NSX 1 đổi 1 trong 15 ngày" />
              </Field>
            </div>
          )}
        </SectionCard>

        <DemoNote />
        <div className="flex justify-end gap-2">
          <Button variant="outline" href="/hoa-don">
            Huỷ
          </Button>
          <Button type="submit">
            <Save size={16} /> Tạo hoá đơn
          </Button>
        </div>
      </form>
    </div>
  );
}
