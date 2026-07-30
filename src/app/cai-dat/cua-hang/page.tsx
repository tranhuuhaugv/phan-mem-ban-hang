"use client";

import { useRef, useState } from "react";
import { Save, Store, Loader2 } from "lucide-react";
import { AccessGuard, BackLink, FormGrid, SectionCard } from "@/components/parts";
import { Button, PageHeader, Field, Input, Textarea, Select } from "@/components/ui";
import { useToast } from "@/components/toast";
import { useRole } from "@/components/role-context";
import { useApi, api } from "@/lib/api";
import type { Branch } from "@/lib/types";

interface StoreConfig {
  name: string;
  phone: string;
  address: string;
  logoUrl?: string;
  paperSize: string;
  defaultBranch: string;
  thankYou: string;
}

export default function Page() {
  return (
    <AccessGuard menu="cai-dat">
      <Inner />
    </AccessGuard>
  );
}

function Inner() {
  const toast = useToast();
  const { can } = useRole();
  const canEdit = can("cai-dat").edit;
  const { data } = useApi<StoreConfig>("/api/store-config");
  const { data: branches } = useApi<Branch[]>("/api/branches");
  const fileRef = useRef<HTMLInputElement>(null);

  const [f, setF] = useState<StoreConfig>({
    name: "",
    phone: "",
    address: "",
    logoUrl: undefined,
    paperSize: "A5",
    defaultBranch: "",
    thankYou: "",
  });
  const [busy, setBusy] = useState(false);

  // Nạp dữ liệu đã lưu vào form khi tải xong (sync khi render — không dùng effect)
  const [synced, setSynced] = useState<StoreConfig | null>(null);
  if (data && data !== synced) {
    setSynced(data);
    setF(data);
  }

  const set =
    (k: keyof StoreConfig) => (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) =>
      setF((s) => ({ ...s, [k]: e.target.value }));

  const onLogo = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (file.size > 1024 * 1024) {
      toast("Logo tối đa 1MB", "warning");
      return;
    }
    const reader = new FileReader();
    reader.onload = () => setF((s) => ({ ...s, logoUrl: String(reader.result) }));
    reader.readAsDataURL(file);
  };

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setBusy(true);
    try {
      await api("/api/store-config", { method: "PUT", body: JSON.stringify(f) });
      toast("Đã lưu cấu hình cửa hàng");
    } catch (err) {
      toast(err instanceof Error ? err.message : "Lưu thất bại", "warning");
    } finally {
      setBusy(false);
    }
  };

  return (
    <div>
      <BackLink href="/cai-dat">Về cài đặt</BackLink>
      <PageHeader title="Cấu hình cửa hàng" subtitle="Thông tin hiển thị trên hoá đơn & mẫu in" />
      <form onSubmit={submit} className="space-y-4">
        <SectionCard title="Thông tin cửa hàng">
          <div className="mb-4 flex items-center gap-3">
            <span className="grid h-16 w-16 place-items-center overflow-hidden rounded-xl border border-dashed border-[var(--border)] text-[var(--muted)]">
              {f.logoUrl ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img src={f.logoUrl} alt="Logo" className="h-full w-full object-contain" />
              ) : (
                <Store size={24} />
              )}
            </span>
            <div>
              <input ref={fileRef} type="file" accept="image/png,image/jpeg" className="hidden" onChange={onLogo} />
              <div className="flex gap-2">
                <Button type="button" variant="outline" size="sm" onClick={() => fileRef.current?.click()} disabled={!canEdit}>
                  Tải logo lên
                </Button>
                {f.logoUrl && (
                  <Button type="button" variant="ghost" size="sm" onClick={() => setF((s) => ({ ...s, logoUrl: undefined }))} disabled={!canEdit}>
                    Xoá logo
                  </Button>
                )}
              </div>
              <p className="mt-1 text-xs text-[var(--muted)]">PNG / JPG, tối đa 1MB</p>
            </div>
          </div>
          <FormGrid>
            <Field label="Tên cửa hàng">
              <Input value={f.name} onChange={set("name")} placeholder="VD: CÔNG TY TNHH LAPTOP CHÍNH NGUYỄN" />
            </Field>
            <Field label="Số điện thoại">
              <Input value={f.phone} onChange={set("phone")} placeholder="VD: 0936 122 144" />
            </Field>
          </FormGrid>
          <div className="mt-4">
            <Field label="Địa chỉ">
              <Input value={f.address} onChange={set("address")} placeholder="Số nhà, đường, quận, thành phố" />
            </Field>
          </div>
        </SectionCard>

        <SectionCard title="Mẫu in hoá đơn">
          <FormGrid>
            <Field label="Khổ giấy">
              <Select value={f.paperSize} onChange={set("paperSize")}>
                <option>A4</option>
                <option>A5</option>
                <option>K80 (bill nhiệt)</option>
              </Select>
            </Field>
            <Field label="Chi nhánh mặc định">
              <Select value={f.defaultBranch} onChange={set("defaultBranch")}>
                <option value="">— Không chọn —</option>
                {(branches ?? []).map((b) => (
                  <option key={b.id} value={b.name}>
                    {b.name}
                  </option>
                ))}
              </Select>
            </Field>
          </FormGrid>
          <div className="mt-4">
            <Field label="Lời cảm ơn cuối hoá đơn">
              <Textarea rows={2} value={f.thankYou} onChange={set("thankYou")} placeholder="VD: Cảm ơn quý khách đã mua hàng!" />
            </Field>
          </div>
        </SectionCard>

        <div className="flex justify-end">
          <Button type="submit" disabled={busy || !canEdit}>
            {busy ? <Loader2 size={16} className="animate-spin" /> : <Save size={16} />} Lưu cấu hình
          </Button>
        </div>
        {!canEdit && <p className="text-right text-xs text-[var(--muted)]">Chỉ Admin được sửa cấu hình.</p>}
      </form>
    </div>
  );
}
