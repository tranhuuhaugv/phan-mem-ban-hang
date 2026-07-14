"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Save } from "lucide-react";
import { AccessGuard, BackLink, FormGrid, SectionCard, DemoNote } from "@/components/parts";
import { Button, PageHeader, Field, Input, Select, Textarea } from "@/components/ui";
import { useToast } from "@/components/toast";
import { categories } from "@/lib/mock-data";
import { CONDITION_LABEL } from "@/lib/types";

export default function Page() {
  return (
    <AccessGuard menu="kho">
      <Inner />
    </AccessGuard>
  );
}

function Inner() {
  const router = useRouter();
  const toast = useToast();
  const [serial, setSerial] = useState("");

  const submit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!serial.trim()) {
      toast("Vui lòng nhập Số Serial", "warning");
      return;
    }
    toast(`Đã thêm máy ${serial} vào kho (demo)`);
    router.push("/kho");
  };

  return (
    <div>
      <BackLink href="/kho">Về danh sách kho</BackLink>
      <PageHeader title="Thêm máy mới" subtitle="Nhập thông tin 1 máy vào kho — Số Serial là khoá duy nhất, không trùng" />

      <form onSubmit={submit} className="space-y-4">
        <SectionCard title="Định danh máy">
          <FormGrid>
            <Field label="Số Serial *" hint="Bắt buộc, không được trùng với máy đã có">
              <Input value={serial} onChange={(e) => setSerial(e.target.value)} placeholder="VD: DL5420-A1001" />
            </Field>
            <Field label="Chọn nhanh từ danh mục" hint="Tự điền cấu hình chuẩn">
              <Select defaultValue="">
                <option value="">— Không dùng danh mục —</option>
                {categories.map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.brand} {c.model} · {c.cpu}/{c.ram}/{c.storage}
                  </option>
                ))}
              </Select>
            </Field>
          </FormGrid>
        </SectionCard>

        <SectionCard title="Cấu hình">
          <FormGrid>
            <Field label="Hãng">
              <Input placeholder="Dell / HP / Asus..." />
            </Field>
            <Field label="Model">
              <Input placeholder="VD: Latitude 5420" />
            </Field>
            <Field label="CPU">
              <Input placeholder="VD: i5-1135G7" />
            </Field>
            <Field label="RAM">
              <Input placeholder="VD: 16GB" />
            </Field>
            <Field label="Ổ cứng">
              <Input placeholder="VD: 512GB SSD" />
            </Field>
            <Field label="Màn hình">
              <Input placeholder="VD: 14 FHD" />
            </Field>
          </FormGrid>
        </SectionCard>

        <SectionCard title="Nhập kho">
          <FormGrid>
            <Field label="Ngoại hình / Loại">
              <Select defaultValue="like_new">
                {Object.entries(CONDITION_LABEL).map(([k, v]) => (
                  <option key={k} value={k}>
                    {v}
                  </option>
                ))}
              </Select>
            </Field>
            <Field label="Giá nhập (₫)">
              <Input type="number" placeholder="VD: 8500000" />
            </Field>
            <Field label="Nguồn nhập">
              <Input placeholder="VD: Thu cũ - Anh Tuấn / Nhập lô HN" />
            </Field>
            <Field label="Ghi chú">
              <Input placeholder="Tuỳ chọn" />
            </Field>
          </FormGrid>
          <div className="mt-4">
            <Field label="Mô tả thêm">
              <Textarea rows={3} placeholder="Tình trạng pin, phụ kiện kèm theo..." />
            </Field>
          </div>
        </SectionCard>

        <DemoNote />

        <div className="flex justify-end gap-2">
          <Button variant="outline" href="/kho">
            Huỷ
          </Button>
          <Button type="submit">
            <Save size={16} /> Lưu máy vào kho
          </Button>
        </div>
      </form>
    </div>
  );
}
