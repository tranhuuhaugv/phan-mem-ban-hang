"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Save } from "lucide-react";
import { AccessGuard, BackLink, SectionCard, DemoNoteInline } from "@/components/parts";
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
      toast("Vui lòng nhập Mã SP", "warning");
      return;
    }
    toast(`Đã thêm máy ${serial} vào kho (demo)`);
    router.push("/kho");
  };

  return (
    <div>
      <BackLink href="/kho">Về danh sách kho</BackLink>
      <PageHeader title="Thêm máy mới" subtitle="Nhập thông tin 1 máy vào kho — Mã SP là khoá duy nhất, không trùng" />

      <form onSubmit={submit} className="space-y-3">
        <div className="grid items-start gap-3 lg:grid-cols-3">
          <SectionCard title="Định danh máy">
            <div className="space-y-3">
              <Field label="Mã SP *" hint="Không được trùng máy đã có">
                <Input value={serial} onChange={(e) => setSerial(e.target.value)} placeholder="VD: SP0001" />
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
            </div>
          </SectionCard>

          <SectionCard title="Cấu hình">
            <div className="grid grid-cols-2 gap-3">
              <Field label="Hãng">
                <Input placeholder="Dell / HP..." />
              </Field>
              <Field label="Model">
                <Input placeholder="Latitude 5420" />
              </Field>
              <Field label="CPU">
                <Input placeholder="i5-1135G7" />
              </Field>
              <Field label="RAM">
                <Input placeholder="16GB" />
              </Field>
              <Field label="Ổ cứng">
                <Input placeholder="512GB SSD" />
              </Field>
              <Field label="Màn hình">
                <Input placeholder="14 FHD" />
              </Field>
            </div>
          </SectionCard>

          <SectionCard title="Nhập kho">
            <div className="grid grid-cols-2 gap-3">
              <Field label="Ngoại hình">
                <Select defaultValue="like_new">
                  {Object.entries(CONDITION_LABEL).map(([k, v]) => (
                    <option key={k} value={k}>
                      {v}
                    </option>
                  ))}
                </Select>
              </Field>
              <Field label="Giá nhập (₫)">
                <Input type="number" placeholder="8500000" />
              </Field>
              <Field label="Nguồn nhập">
                <Input placeholder="Nhập lô HN" />
              </Field>
              <Field label="Ghi chú">
                <Input placeholder="Tuỳ chọn" />
              </Field>
            </div>
            <div className="mt-3">
              <Field label="Mô tả thêm">
                <Textarea rows={2} placeholder="Tình trạng pin, phụ kiện..." />
              </Field>
            </div>
          </SectionCard>
        </div>

        <div className="flex items-center justify-between gap-2">
          <DemoNoteInline />
          <div className="flex gap-2">
            <Button variant="outline" href="/kho">
              Huỷ
            </Button>
            <Button type="submit">
              <Save size={16} /> Lưu máy vào kho
            </Button>
          </div>
        </div>
      </form>
    </div>
  );
}
