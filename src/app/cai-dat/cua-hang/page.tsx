"use client";

import { Save, Store } from "lucide-react";
import { AccessGuard, BackLink, FormGrid, SectionCard, DemoNote } from "@/components/parts";
import { Button, PageHeader, Field, Input, Textarea, Select } from "@/components/ui";
import { useToast } from "@/components/toast";

export default function Page() {
  return (
    <AccessGuard menu="cai-dat">
      <Inner />
    </AccessGuard>
  );
}

function Inner() {
  const toast = useToast();
  return (
    <div className="max-w-3xl">
      <BackLink href="/cai-dat">Về cài đặt</BackLink>
      <PageHeader title="Cấu hình cửa hàng" subtitle="Thông tin hiển thị trên hoá đơn & mẫu in" />
      <form
        onSubmit={(e) => {
          e.preventDefault();
          toast("Đã lưu cấu hình cửa hàng (demo)");
        }}
        className="space-y-4"
      >
        <SectionCard title="Thông tin cửa hàng">
          <div className="mb-4 flex items-center gap-3">
            <span className="grid h-16 w-16 place-items-center rounded-xl border border-dashed border-[var(--border)] text-[var(--muted)]">
              <Store size={24} />
            </span>
            <div>
              <Button variant="outline" size="sm" onClick={() => toast("Chọn logo (demo)", "info")}>
                Tải logo lên
              </Button>
              <p className="mt-1 text-xs text-[var(--muted)]">PNG / JPG, tối đa 1MB</p>
            </div>
          </div>
          <FormGrid>
            <Field label="Tên cửa hàng">
              <Input defaultValue="CỬA HÀNG LAPTOP ABC" />
            </Field>
            <Field label="Số điện thoại">
              <Input defaultValue="0900 000 000" />
            </Field>
          </FormGrid>
          <div className="mt-4">
            <Field label="Địa chỉ">
              <Input defaultValue="123 Đường XYZ, Quận 1, TP.HCM" />
            </Field>
          </div>
        </SectionCard>

        <SectionCard title="Mẫu in hoá đơn">
          <FormGrid>
            <Field label="Khổ giấy">
              <Select defaultValue="A5">
                <option>A4</option>
                <option>A5</option>
                <option>K80 (bill nhiệt)</option>
              </Select>
            </Field>
            <Field label="Chi nhánh mặc định">
              <Input defaultValue="Chi nhánh chính" />
            </Field>
          </FormGrid>
          <div className="mt-4">
            <Field label="Lời cảm ơn cuối hoá đơn">
              <Textarea rows={2} defaultValue="Cảm ơn quý khách đã mua hàng! Bảo hành theo phiếu đi kèm." />
            </Field>
          </div>
        </SectionCard>

        <DemoNote />
        <div className="flex justify-end">
          <Button type="submit">
            <Save size={16} /> Lưu cấu hình
          </Button>
        </div>
      </form>
    </div>
  );
}
