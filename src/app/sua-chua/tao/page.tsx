"use client";

import { useRouter } from "next/navigation";
import { Save } from "lucide-react";
import { AccessGuard, BackLink, FormGrid, SectionCard, DemoNote } from "@/components/parts";
import { Button, PageHeader, Field, Input, Textarea } from "@/components/ui";
import { useToast } from "@/components/toast";

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
  return (
    <div>
      <BackLink href="/sua-chua">Về danh sách phiếu</BackLink>
      <PageHeader title="Tạo phiếu sửa chữa" subtitle="Ghi nhận máy gửi sửa: lỗi gì, chi phí dự kiến" />
      <form
        onSubmit={(e) => {
          e.preventDefault();
          toast("Đã tạo phiếu sửa chữa (demo)");
          router.push("/sua-chua");
        }}
        className="space-y-4"
      >
        <SectionCard title="Máy & lỗi">
          <FormGrid>
            <Field label="Số Serial" hint="Máy trong kho hoặc máy khách mang tới">
              <Input placeholder="VD: AS-VIVO-4402" required />
            </Field>
            <Field label="Model">
              <Input placeholder="VD: Asus Vivobook 15" />
            </Field>
          </FormGrid>
          <div className="mt-4">
            <Field label="Mô tả lỗi">
              <Textarea rows={3} placeholder="VD: Bàn phím liệt vài phím, cần thay" required />
            </Field>
          </div>
        </SectionCard>
        <SectionCard title="Chi phí & tiếp nhận">
          <FormGrid>
            <Field label="Chi phí dự kiến (₫)">
              <Input type="number" placeholder="VD: 450000" required />
            </Field>
            <Field label="Kỹ thuật viên">
              <Input placeholder="VD: KTV Hùng" />
            </Field>
            <Field label="Ngày nhận máy">
              <Input type="date" required />
            </Field>
          </FormGrid>
        </SectionCard>
        <DemoNote />
        <div className="flex justify-end gap-2">
          <Button variant="outline" href="/sua-chua">
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
