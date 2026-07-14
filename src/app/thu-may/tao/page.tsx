"use client";

import { useRouter } from "next/navigation";
import { Save } from "lucide-react";
import { AccessGuard, BackLink, FormGrid, SectionCard, DemoNote } from "@/components/parts";
import { Button, PageHeader, Field, Input, Textarea } from "@/components/ui";
import { useToast } from "@/components/toast";

export default function Page() {
  return (
    <AccessGuard menu="thu-may">
      <Inner />
    </AccessGuard>
  );
}

function Inner() {
  const router = useRouter();
  const toast = useToast();
  return (
    <div>
      <BackLink href="/thu-may">Về danh sách phiếu</BackLink>
      <PageHeader title="Tạo phiếu thu máy" subtitle="Ghi nhận máy mua lại từ khách — phiếu sẽ ở trạng thái Chờ duyệt" />
      <form
        onSubmit={(e) => {
          e.preventDefault();
          toast("Đã tạo phiếu thu máy — chờ duyệt (demo)");
          router.push("/thu-may");
        }}
        className="space-y-4"
      >
        <SectionCard title="Thông tin khách">
          <FormGrid>
            <Field label="Tên khách">
              <Input placeholder="VD: Nguyễn Văn Tuấn" required />
            </Field>
            <Field label="Số điện thoại">
              <Input placeholder="VD: 0901234567" />
            </Field>
          </FormGrid>
        </SectionCard>
        <SectionCard title="Thông tin máy thu">
          <FormGrid>
            <Field label="Model">
              <Input placeholder="VD: HP EliteBook 840 G8" required />
            </Field>
            <Field label="Cấu hình">
              <Input placeholder="VD: i7/16GB/512GB" />
            </Field>
            <Field label="Giá thu (₫)">
              <Input type="number" placeholder="VD: 11200000" required />
            </Field>
          </FormGrid>
          <div className="mt-4">
            <Field label="Tình trạng máy">
              <Textarea rows={2} placeholder="VD: Đẹp 98%, pin tốt, còn BH hãng..." />
            </Field>
          </div>
        </SectionCard>
        <DemoNote />
        <div className="flex justify-end gap-2">
          <Button variant="outline" href="/thu-may">
            Huỷ
          </Button>
          <Button type="submit">
            <Save size={16} /> Tạo phiếu
          </Button>
        </div>
      </form>
    </div>
  );
}
