"use client";

import { useRouter } from "next/navigation";
import { Save } from "lucide-react";
import { AccessGuard, BackLink, FormGrid, SectionCard, DemoNote } from "@/components/parts";
import { Button, PageHeader, Field, Input, Select } from "@/components/ui";
import { useToast } from "@/components/toast";

export default function Page() {
  return (
    <AccessGuard menu="thu-chi">
      <Inner />
    </AccessGuard>
  );
}

function Inner() {
  const router = useRouter();
  const toast = useToast();
  return (
    <div>
      <BackLink href="/thu-chi">Về sổ quỹ</BackLink>
      <PageHeader title="Tạo phiếu thu" subtitle="Ghi nhận khoản tiền thu vào (bán hàng, thu nợ...)" />
      <form
        onSubmit={(e) => {
          e.preventDefault();
          toast("Đã tạo phiếu thu (demo)");
          router.push("/thu-chi");
        }}
        className="space-y-4"
      >
        <SectionCard>
          <FormGrid>
            <Field label="Ngày">
              <Input type="date" required />
            </Field>
            <Field label="Số tiền (₫)">
              <Input type="number" placeholder="VD: 5000000" required />
            </Field>
            <Field label="Nguồn thu">
              <Select defaultValue="Bán hàng">
                {["Bán hàng", "Thu nợ", "Sửa chữa", "Khác"].map((x) => (
                  <option key={x}>{x}</option>
                ))}
              </Select>
            </Field>
            <Field label="Người nộp">
              <Input placeholder="Tên khách / đối tác" />
            </Field>
          </FormGrid>
          <div className="mt-4">
            <Field label="Nội dung">
              <Input placeholder="VD: Cọc đơn DH-0128" required />
            </Field>
          </div>
        </SectionCard>
        <DemoNote />
        <div className="flex justify-end gap-2">
          <Button variant="outline" href="/thu-chi">
            Huỷ
          </Button>
          <Button type="submit">
            <Save size={16} /> Lưu phiếu thu
          </Button>
        </div>
      </form>
    </div>
  );
}
