"use client";

import { use, useState } from "react";
import { Laptop, Loader2, Pencil, Save } from "lucide-react";
import { AccessGuard, BackLink, DetailRow, SectionCard } from "@/components/parts";
import { PageHeader, Card, Badge, Button, Field, Input, Select, Textarea, MoneyInput } from "@/components/ui";
import { Modal } from "@/components/modal";
import { MachineStatusBadge } from "@/components/status";
import { MachineHistory, type HistoryEvent } from "@/components/machine-history";
import { useToast } from "@/components/toast";
import { useRole } from "@/components/role-context";
import { useApi, apiPatch } from "@/lib/api";
import {
  CONDITION_LABEL,
  MACHINE_STATUS_LABEL,
  type Machine,
  type Branch,
  type Supplier,
  type Category,
  type Condition,
  type MachineStatus,
} from "@/lib/types";
import { formatVND, formatDateTime } from "@/lib/format";

export default function Page({ params }: { params: Promise<{ serial: string }> }) {
  const { serial } = use(params);
  return (
    <AccessGuard menu="kho">
      <Inner serial={decodeURIComponent(serial)} />
    </AccessGuard>
  );
}

function Inner({ serial }: { serial: string }) {
  const { can } = useRole();
  const toast = useToast();
  const canEdit = can("kho").edit;
  const { data, loading, error, reload } = useApi<{ machine: Machine; history: HistoryEvent[] }>(
    `/api/machines/${encodeURIComponent(serial)}`,
  );
  const { data: categories } = useApi<Category[]>("/api/categories");
  const { data: branches } = useApi<Branch[]>("/api/branches");
  const { data: suppliers } = useApi<Supplier[]>("/api/suppliers");

  const [edit, setEdit] = useState(false);
  const [busy, setBusy] = useState(false);
  const [f, setF] = useState<Record<string, string>>({});
  const set = (k: string) => (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) =>
    setF((s) => ({ ...s, [k]: e.target.value }));

  if (loading) {
    return (
      <div className="grid min-h-[40vh] place-items-center">
        <Loader2 className="animate-spin text-[var(--muted)]" />
      </div>
    );
  }
  if (error || !data) {
    return (
      <div>
        <BackLink href="/kho">Về danh sách kho</BackLink>
        <Card className="p-8 text-center text-sm text-[var(--muted)]">{error ?? `Không tìm thấy sản phẩm “${serial}”.`}</Card>
      </div>
    );
  }

  const machine = data.machine;

  const openEdit = () => {
    setF({
      brand: machine.brand ?? "",
      model: machine.model ?? "",
      category: machine.category ?? "",
      cpu: machine.cpu ?? "",
      ram: machine.ram ?? "",
      storage: machine.storage ?? "",
      screen: machine.screen ?? "",
      condition: machine.condition,
      purchasePrice: String(machine.purchasePrice ?? ""),
      salePrice: machine.salePrice != null ? String(machine.salePrice) : "",
      status: machine.status,
      branchId: machine.branchId ?? "",
      supplierId: machine.supplierId ?? "",
      source: machine.source ?? "",
      note: machine.note ?? "",
    });
    setEdit(true);
  };

  const save = async () => {
    if (!f.model.trim()) return toast("Nhập tên sản phẩm", "warning");
    setBusy(true);
    try {
      await apiPatch(`/api/machines/${encodeURIComponent(machine.serial)}`, {
        brand: f.brand.trim(),
        model: f.model.trim(),
        category: f.category.trim() || null,
        cpu: f.cpu.trim(),
        ram: f.ram.trim(),
        storage: f.storage.trim(),
        screen: f.screen.trim(),
        condition: f.condition,
        purchasePrice: Number(f.purchasePrice) || 0,
        salePrice: f.salePrice.trim() === "" ? null : Number(f.salePrice) || 0,
        status: f.status,
        branchId: f.branchId || null,
        supplierId: f.supplierId || null,
        source: f.source.trim(),
        note: f.note.trim() || null,
      });
      toast("Đã cập nhật sản phẩm");
      setEdit(false);
      reload();
    } catch (e) {
      toast(e instanceof Error ? e.message : "Cập nhật thất bại", "warning");
    } finally {
      setBusy(false);
    }
  };

  return (
    <div>
      <BackLink href="/kho">Về danh sách kho</BackLink>
      <PageHeader
        title={`${machine.brand} ${machine.model}`}
        subtitle={`Mã SP: ${machine.serial} · Nhập kho ${formatDateTime(machine.createdAt)}`}
      />

      <div className="grid items-start gap-4 lg:grid-cols-2">
        <SectionCard
          title="Thông tin sản phẩm"
          action={
            canEdit && (
              <Button size="sm" variant="outline" onClick={openEdit}>
                <Pencil size={14} /> Sửa
              </Button>
            )
          }
        >
          <div className="mb-3 flex items-center gap-3">
            <span className="brand-gradient grid h-11 w-11 place-items-center rounded-2xl text-white shadow-md-soft">
              <Laptop size={20} />
            </span>
            <div className="flex-1">
              <div className="font-semibold">
                {machine.brand} {machine.model}
              </div>
              <div className="font-mono text-xs text-[var(--muted)]">{machine.serial}</div>
            </div>
            <MachineStatusBadge status={machine.status} />
          </div>
          <DetailRow label="Danh mục">
            {machine.category ? <Badge tone="purple">{machine.category}</Badge> : "—"}
          </DetailRow>
          <DetailRow label="Cấu hình">
            {machine.cpu} · {machine.ram} · {machine.storage}
          </DetailRow>
          <DetailRow label="Màn hình">{machine.screen || "—"}</DetailRow>
          <DetailRow label="Loại">
            <Badge tone="muted">{CONDITION_LABEL[machine.condition]}</Badge>
          </DetailRow>
          <DetailRow label="Giá nhập">{formatVND(machine.purchasePrice)}</DetailRow>
          {machine.salePrice != null && <DetailRow label="Giá bán">{formatVND(machine.salePrice)}</DetailRow>}
          <DetailRow label="Chi nhánh">
            {machine.branchName ? <Badge tone="info">{machine.branchName}</Badge> : "—"}
          </DetailRow>
          <DetailRow label="Nhà cung cấp">{machine.supplierName || "—"}</DetailRow>
          <DetailRow label="Nguồn nhập">{machine.source || "—"}</DetailRow>
          <DetailRow label="Ngày nhập kho">{formatDateTime(machine.createdAt)}</DetailRow>
          {machine.note && <DetailRow label="Ghi chú">{machine.note}</DetailRow>}
        </SectionCard>

        <SectionCard title="Lịch sử sản phẩm">
          <MachineHistory events={data.history} />
        </SectionCard>
      </div>

      <Modal
        open={edit}
        onClose={() => setEdit(false)}
        title="Sửa thông tin sản phẩm"
        wide
        footer={
          <>
            <Button variant="outline" onClick={() => setEdit(false)}>
              Huỷ
            </Button>
            <Button onClick={save} disabled={busy}>
              <Save size={16} /> {busy ? "Đang lưu..." : "Lưu thay đổi"}
            </Button>
          </>
        }
      >
        <div className="grid grid-cols-2 gap-3">
          <Field label="Hãng">
            <Input value={f.brand ?? ""} onChange={set("brand")} placeholder="Dell, HP, Apple..." />
          </Field>
          <Field label="Tên sản phẩm *">
            <Input value={f.model ?? ""} onChange={set("model")} />
          </Field>
          <Field label="Danh mục">
            <Select value={f.category ?? ""} onChange={set("category")}>
              <option value="">— Không —</option>
              {(categories ?? []).map((c) => (
                <option key={c.id} value={c.name}>
                  {c.name}
                </option>
              ))}
            </Select>
          </Field>
          <Field label="Loại (ngoại hình)">
            <Select value={f.condition ?? ""} onChange={set("condition")}>
              {(Object.keys(CONDITION_LABEL) as Condition[]).map((k) => (
                <option key={k} value={k}>
                  {CONDITION_LABEL[k]}
                </option>
              ))}
            </Select>
          </Field>
          <Field label="CPU">
            <Input value={f.cpu ?? ""} onChange={set("cpu")} placeholder="i5-8250U..." />
          </Field>
          <Field label="RAM">
            <Input value={f.ram ?? ""} onChange={set("ram")} placeholder="8GB..." />
          </Field>
          <Field label="Ổ cứng">
            <Input value={f.storage ?? ""} onChange={set("storage")} placeholder="256GB SSD..." />
          </Field>
          <Field label="Màn hình">
            <Input value={f.screen ?? ""} onChange={set("screen")} placeholder='14" FHD...' />
          </Field>
          <Field label="Giá nhập (₫)">
            <MoneyInput value={f.purchasePrice ?? ""} onChange={(v) => setF((s) => ({ ...s, purchasePrice: v }))} />
          </Field>
          <Field label="Giá bán (₫)" hint="Bỏ trống nếu chưa niêm yết">
            <MoneyInput value={f.salePrice ?? ""} onChange={(v) => setF((s) => ({ ...s, salePrice: v }))} />
          </Field>
          <Field label="Chi nhánh">
            <Select value={f.branchId ?? ""} onChange={set("branchId")}>
              <option value="">— Không —</option>
              {(branches ?? []).map((b) => (
                <option key={b.id} value={b.id}>
                  {b.name}
                </option>
              ))}
            </Select>
          </Field>
          <Field label="Nhà cung cấp">
            <Select value={f.supplierId ?? ""} onChange={set("supplierId")}>
              <option value="">— Không —</option>
              {(suppliers ?? []).map((s) => (
                <option key={s.id} value={s.id}>
                  {s.name}
                </option>
              ))}
            </Select>
          </Field>
          <Field label="Trạng thái">
            <Select value={f.status ?? ""} onChange={set("status")}>
              {(Object.keys(MACHINE_STATUS_LABEL) as MachineStatus[]).map((k) => (
                <option key={k} value={k}>
                  {MACHINE_STATUS_LABEL[k]}
                </option>
              ))}
            </Select>
          </Field>
          <Field label="Nguồn nhập">
            <Input value={f.source ?? ""} onChange={set("source")} placeholder="Nhập nhanh, Thu máy..." />
          </Field>
          <div className="col-span-2">
            <Field label="Ghi chú">
              <Textarea rows={2} value={f.note ?? ""} onChange={set("note")} />
            </Field>
          </div>
        </div>
      </Modal>
    </div>
  );
}
