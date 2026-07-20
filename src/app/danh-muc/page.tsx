"use client";

import { useState } from "react";
import { Plus, Pencil, Trash2 } from "lucide-react";
import { AccessGuard } from "@/components/parts";
import { Button, PageHeader, Table, Tr, Td, Badge, Field, Input, Select, SearchInput } from "@/components/ui";
import { Modal, ConfirmDialog } from "@/components/modal";
import { useToast } from "@/components/toast";
import { useRole } from "@/components/role-context";
import { useApi, apiPost, apiPatch, apiDelete } from "@/lib/api";
import { CONDITION_LABEL, type Category, type Condition } from "@/lib/types";

const EMPTY = { brand: "", model: "", cpu: "", ram: "", storage: "", type: "like_new" as Condition };

export default function DanhMucPage() {
  return (
    <AccessGuard menu="danh-muc">
      <Inner />
    </AccessGuard>
  );
}

function Inner() {
  const { can } = useRole();
  const perm = can("danh-muc");
  const toast = useToast();
  const { data, loading, reload } = useApi<Category[]>("/api/categories");
  const categories = data ?? [];

  const [openForm, setOpenForm] = useState(false);
  const [editId, setEditId] = useState<string | null>(null);
  const [f, setF] = useState(EMPTY);
  const [del, setDel] = useState<Category | null>(null);
  const [q, setQ] = useState("");
  const [busy, setBusy] = useState(false);

  const rows = categories.filter((c) =>
    `${c.brand} ${c.model} ${c.cpu} ${c.ram} ${c.storage}`.toLowerCase().includes(q.trim().toLowerCase()),
  );

  const openCreate = () => {
    setEditId(null);
    setF(EMPTY);
    setOpenForm(true);
  };
  const openEdit = (c: Category) => {
    setEditId(c.id);
    setF({ brand: c.brand, model: c.model, cpu: c.cpu, ram: c.ram, storage: c.storage, type: c.type });
    setOpenForm(true);
  };

  const save = async () => {
    if (!f.brand.trim() || !f.model.trim()) {
      toast("Nhập Hãng và Model", "warning");
      return;
    }
    setBusy(true);
    try {
      if (editId) {
        await apiPatch(`/api/categories/${editId}`, f);
        toast("Đã cập nhật danh mục");
      } else {
        await apiPost("/api/categories", f);
        toast("Đã tạo danh mục");
      }
      setOpenForm(false);
      reload();
    } catch (e) {
      toast(e instanceof Error ? e.message : "Lưu thất bại", "warning");
    } finally {
      setBusy(false);
    }
  };

  const set = (k: keyof typeof f) => (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) =>
    setF((s) => ({ ...s, [k]: e.target.value }));

  return (
    <div>
      <PageHeader
        title="Danh mục sản phẩm"
        subtitle="Chuẩn hoá Hãng / Model / Cấu hình — nhập máy nhanh bằng dropdown"
        actions={
          perm.create && (
            <Button onClick={openCreate}>
              <Plus size={16} /> Tạo danh mục
            </Button>
          )
        }
      />

      <div className="mb-4 flex flex-wrap items-center gap-2">
        <SearchInput value={q} onChange={setQ} placeholder="Tìm hãng, model, cấu hình..." />
      </div>

      <Table head={["Hãng", "Model", "Cấu hình", "Loại", "Số máy đang dùng", ""]}>
        {rows.map((c) => (
          <Tr key={c.id}>
            <Td className="font-medium">{c.brand}</Td>
            <Td>{c.model}</Td>
            <Td className="text-xs text-[var(--muted)]">
              {c.cpu} · {c.ram} · {c.storage}
            </Td>
            <Td>
              <Badge tone="muted">{CONDITION_LABEL[c.type]}</Badge>
            </Td>
            <Td>{c.machineCount} máy</Td>
            <Td>
              <div className="flex items-center justify-end gap-1">
                {perm.edit && (
                  <Button size="sm" variant="ghost" onClick={() => openEdit(c)}>
                    <Pencil size={15} />
                  </Button>
                )}
                {perm.remove && (
                  <Button size="sm" variant="ghost" className="text-[var(--danger)]" onClick={() => setDel(c)}>
                    <Trash2 size={15} />
                  </Button>
                )}
              </div>
            </Td>
          </Tr>
        ))}
        {rows.length === 0 && (
          <Tr>
            <Td className="text-center text-[var(--muted)]">
              <div className="py-6">{loading ? "Đang tải dữ liệu..." : "Chưa có danh mục nào"}</div>
            </Td>
          </Tr>
        )}
      </Table>

      {!perm.create && <p className="mt-3 text-xs text-[var(--muted)]">Vai trò của bạn chỉ được xem danh mục.</p>}

      <Modal
        open={openForm}
        onClose={() => setOpenForm(false)}
        title={editId ? "Sửa danh mục" : "Tạo danh mục"}
        wide
        footer={
          <>
            <Button variant="outline" onClick={() => setOpenForm(false)}>
              Huỷ
            </Button>
            <Button onClick={save} disabled={busy}>
              {busy ? "Đang lưu..." : "Lưu danh mục"}
            </Button>
          </>
        }
      >
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <Field label="Hãng *">
            <Input value={f.brand} onChange={set("brand")} placeholder="VD: Dell" />
          </Field>
          <Field label="Model *">
            <Input value={f.model} onChange={set("model")} placeholder="VD: Latitude 5420" />
          </Field>
          <Field label="CPU">
            <Input value={f.cpu} onChange={set("cpu")} placeholder="VD: i5-1135G7" />
          </Field>
          <Field label="RAM">
            <Input value={f.ram} onChange={set("ram")} placeholder="VD: 16GB" />
          </Field>
          <Field label="Ổ cứng">
            <Input value={f.storage} onChange={set("storage")} placeholder="VD: 512GB SSD" />
          </Field>
          <Field label="Loại">
            <Select value={f.type} onChange={set("type")}>
              {Object.entries(CONDITION_LABEL).map(([k, v]) => (
                <option key={k} value={k}>
                  {v}
                </option>
              ))}
            </Select>
          </Field>
        </div>
      </Modal>

      <ConfirmDialog
        open={!!del}
        onClose={() => setDel(null)}
        onConfirm={async () => {
          if (!del) return;
          try {
            await apiDelete(`/api/categories/${del.id}`);
            toast("Đã xoá danh mục");
            reload();
          } catch (e) {
            toast(e instanceof Error ? e.message : "Xoá thất bại", "warning");
          }
        }}
        title="Xoá danh mục"
        message={del ? `Xoá danh mục "${del.brand} ${del.model}"?` : ""}
        confirmText="Xoá"
        danger
      />
    </div>
  );
}
