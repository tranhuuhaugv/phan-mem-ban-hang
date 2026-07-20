"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Save } from "lucide-react";
import { AccessGuard, BackLink, SectionCard } from "@/components/parts";
import { Button, PageHeader, Field, Input, Select, Textarea } from "@/components/ui";
import { useToast } from "@/components/toast";
import { useApi, apiPost } from "@/lib/api";
import { CONDITION_LABEL, type Category, type Machine } from "@/lib/types";

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
  const { data: categories } = useApi<Category[]>("/api/categories");
  const [busy, setBusy] = useState(false);

  const [f, setF] = useState({
    serial: "",
    category: "",
    brand: "",
    model: "",
    cpu: "",
    ram: "",
    storage: "",
    screen: "",
    condition: "like_new",
    purchasePrice: "",
    source: "",
    note: "",
    desc: "",
  });
  const set = (k: keyof typeof f) => (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) =>
    setF((s) => ({ ...s, [k]: e.target.value }));

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!f.brand.trim() || !f.model.trim()) {
      toast("Nhập Hãng và Model", "warning");
      return;
    }
    setBusy(true);
    try {
      const row = await apiPost<Machine>("/api/machines", {
        serial: f.serial,
        category: f.category,
        brand: f.brand,
        model: f.model,
        cpu: f.cpu,
        ram: f.ram,
        storage: f.storage,
        screen: f.screen,
        condition: f.condition,
        purchasePrice: Number(f.purchasePrice) || 0,
        source: f.source,
        note: [f.note, f.desc].filter(Boolean).join(" — "),
      });
      toast(`Đã lưu máy ${row.serial} vào kho`);
      router.push("/kho");
    } catch (err) {
      toast(err instanceof Error ? err.message : "Lưu thất bại", "warning");
    } finally {
      setBusy(false);
    }
  };

  return (
    <div>
      <BackLink href="/kho">Về danh sách kho</BackLink>
      <PageHeader title="Thêm máy mới" subtitle="Nhập thông tin 1 máy vào kho — bỏ trống Mã SP để hệ thống tự sinh (SP kế tiếp)" />

      <form onSubmit={submit} className="space-y-3">
        <div className="grid items-start gap-3 lg:grid-cols-3">
          <SectionCard title="Định danh máy">
            <div className="space-y-3">
              <Field label="Mã SP" hint="Bỏ trống = tự sinh mã kế tiếp, không trùng">
                <Input value={f.serial} onChange={set("serial")} placeholder="VD: SP0009 (tuỳ chọn)" />
              </Field>
              <Field label="Danh mục / Loại" hint="Phân loại sản phẩm (quản ở menu Danh mục)">
                <Select value={f.category} onChange={set("category")}>
                  <option value="">— Chọn danh mục —</option>
                  {(categories ?? []).map((c) => (
                    <option key={c.id} value={c.name}>
                      {c.name}
                    </option>
                  ))}
                </Select>
              </Field>
            </div>
          </SectionCard>

          <SectionCard title="Cấu hình">
            <div className="grid grid-cols-2 gap-3">
              <Field label="Hãng *">
                <Input value={f.brand} onChange={set("brand")} placeholder="Dell / HP..." />
              </Field>
              <Field label="Model *">
                <Input value={f.model} onChange={set("model")} placeholder="Latitude 5420" />
              </Field>
              <Field label="CPU">
                <Input value={f.cpu} onChange={set("cpu")} placeholder="i5-1135G7" />
              </Field>
              <Field label="RAM">
                <Input value={f.ram} onChange={set("ram")} placeholder="16GB" />
              </Field>
              <Field label="Ổ cứng">
                <Input value={f.storage} onChange={set("storage")} placeholder="512GB SSD" />
              </Field>
              <Field label="Màn hình">
                <Input value={f.screen} onChange={set("screen")} placeholder="14 FHD" />
              </Field>
            </div>
          </SectionCard>

          <SectionCard title="Nhập kho">
            <div className="grid grid-cols-2 gap-3">
              <Field label="Ngoại hình">
                <Select value={f.condition} onChange={set("condition")}>
                  {Object.entries(CONDITION_LABEL).map(([k, v]) => (
                    <option key={k} value={k}>
                      {v}
                    </option>
                  ))}
                </Select>
              </Field>
              <Field label="Giá nhập (₫)">
                <Input type="number" value={f.purchasePrice} onChange={set("purchasePrice")} placeholder="8500000" />
              </Field>
              <Field label="Nguồn nhập">
                <Input value={f.source} onChange={set("source")} placeholder="Nhập lô HN" />
              </Field>
              <Field label="Ghi chú">
                <Input value={f.note} onChange={set("note")} placeholder="Tuỳ chọn" />
              </Field>
            </div>
            <div className="mt-3">
              <Field label="Mô tả thêm">
                <Textarea rows={2} value={f.desc} onChange={set("desc")} placeholder="Tình trạng pin, phụ kiện..." />
              </Field>
            </div>
          </SectionCard>
        </div>

        <div className="flex items-center justify-end gap-2">
          <Button variant="outline" href="/kho">
            Huỷ
          </Button>
          <Button type="submit" disabled={busy}>
            <Save size={16} /> {busy ? "Đang lưu..." : "Lưu máy vào kho"}
          </Button>
        </div>
      </form>
    </div>
  );
}
