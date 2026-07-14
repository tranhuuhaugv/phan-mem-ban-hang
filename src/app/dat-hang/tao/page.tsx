"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Save } from "lucide-react";
import { AccessGuard, BackLink, FormGrid, SectionCard, DemoNote, DetailRow } from "@/components/parts";
import { Button, PageHeader, Field, Input, Select } from "@/components/ui";
import { useToast } from "@/components/toast";
import { machines } from "@/lib/mock-data";
import { formatVND } from "@/lib/format";

export default function Page() {
  return (
    <AccessGuard menu="dat-hang">
      <Inner />
    </AccessGuard>
  );
}

function Inner() {
  const router = useRouter();
  const toast = useToast();
  const available = machines.filter((m) => m.status === "ton_kho");
  const [serial, setSerial] = useState("");
  const picked = available.find((m) => m.serial === serial);

  return (
    <div>
      <BackLink href="/dat-hang">Về danh sách đơn</BackLink>
      <PageHeader title="Tạo đơn đặt hàng" subtitle="Chỉ chọn được máy đang Tồn kho — gán Mã SP để không bán trùng" />
      <form
        onSubmit={(e) => {
          e.preventDefault();
          if (!serial) {
            toast("Vui lòng chọn máy (Mã SP) để bán", "warning");
            return;
          }
          toast(`Đã tạo đơn cho máy ${serial} (demo)`);
          router.push("/dat-hang");
        }}
        className="space-y-4"
      >
        <SectionCard title="Khách hàng">
          <FormGrid>
            <Field label="Tên khách / công ty">
              <Input placeholder="VD: Nguyễn Hải Đăng" required />
            </Field>
            <Field label="Số điện thoại">
              <Input placeholder="VD: 0905556677" />
            </Field>
          </FormGrid>
        </SectionCard>

        <SectionCard title="Máy bán">
          <Field label="Chọn máy tồn kho (Mã SP) *" hint={`${available.length} máy đang tồn kho có thể bán`}>
            <Select value={serial} onChange={(e) => setSerial(e.target.value)}>
              <option value="">— Chọn máy —</option>
              {available.map((m) => (
                <option key={m.id} value={m.serial}>
                  {m.serial} · {m.brand} {m.model} ({m.cpu}/{m.ram})
                </option>
              ))}
            </Select>
          </Field>
          {picked && (
            <div className="mt-3 rounded-lg bg-[var(--surface-2)] p-3">
              <DetailRow label="Máy">
                {picked.brand} {picked.model}
              </DetailRow>
              <DetailRow label="Cấu hình">
                {picked.cpu} · {picked.ram} · {picked.storage}
              </DetailRow>
              <DetailRow label="Giá nhập">{formatVND(picked.purchasePrice)}</DetailRow>
            </div>
          )}
        </SectionCard>

        <SectionCard title="Thanh toán">
          <FormGrid>
            <Field label="Giá bán (₫)">
              <Input type="number" placeholder="VD: 16500000" required />
            </Field>
            <Field label="Tiền cọc (₫)">
              <Input type="number" placeholder="VD: 5000000" defaultValue={0} />
            </Field>
          </FormGrid>
        </SectionCard>

        <DemoNote />
        <div className="flex justify-end gap-2">
          <Button variant="outline" href="/dat-hang">
            Huỷ
          </Button>
          <Button type="submit">
            <Save size={16} /> Tạo đơn
          </Button>
        </div>
      </form>
    </div>
  );
}
