"use client";

import { useState } from "react";
import { Plus, Pencil, Trash2, Tag } from "lucide-react";
import { AccessGuard } from "@/components/parts";
import { Button, PageHeader, Table, Tr, Td, Badge, Field, Input, SearchInput } from "@/components/ui";
import { Modal, ConfirmDialog } from "@/components/modal";
import { useToast } from "@/components/toast";
import { useRole } from "@/components/role-context";
import { useApi, apiPost, apiPatch, apiDelete } from "@/lib/api";
import type { Category } from "@/lib/types";

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
  const [f, setF] = useState({ name: "", note: "" });
  const [del, setDel] = useState<Category | null>(null);
  const [q, setQ] = useState("");
  const [busy, setBusy] = useState(false);

  const rows = categories.filter((c) => `${c.name} ${c.note ?? ""}`.toLowerCase().includes(q.trim().toLowerCase()));

  const openCreate = () => {
    setEditId(null);
    setF({ name: "", note: "" });
    setOpenForm(true);
  };
  const openEdit = (c: Category) => {
    setEditId(c.id);
    setF({ name: c.name, note: c.note ?? "" });
    setOpenForm(true);
  };

  const save = async () => {
    if (!f.name.trim()) {
      toast("Nhập tên danh mục", "warning");
      return;
    }
    setBusy(true);
    try {
      if (editId) {
        await apiPatch(`/api/categories/${editId}`, f);
        toast("Đã cập nhật danh mục");
      } else {
        await apiPost("/api/categories", f);
        toast("Đã thêm danh mục");
      }
      setOpenForm(false);
      reload();
    } catch (e) {
      toast(e instanceof Error ? e.message : "Lưu thất bại", "warning");
    } finally {
      setBusy(false);
    }
  };

  const set = (k: keyof typeof f) => (e: React.ChangeEvent<HTMLInputElement>) =>
    setF((s) => ({ ...s, [k]: e.target.value }));

  return (
    <div>
      <PageHeader
        title="Danh mục sản phẩm"
        subtitle="Các loại sản phẩm bạn kinh doanh: Laptop, Macbook, Phụ kiện... — tự thêm tuỳ ý"
        actions={
          perm.create && (
            <Button onClick={openCreate}>
              <Plus size={16} /> Thêm danh mục
            </Button>
          )
        }
      />

      <div className="mb-4 flex flex-wrap items-center gap-2">
        <SearchInput value={q} onChange={setQ} placeholder="Tìm danh mục..." className="max-w-sm" />
      </div>

      <Table head={["Danh mục", "Ghi chú", "Số sản phẩm", ""]}>
        {rows.map((c) => (
          <Tr key={c.id}>
            <Td>
              <div className="flex items-center gap-2 font-medium">
                <span className="grid h-7 w-7 place-items-center rounded-lg bg-[var(--purple-bg)] text-[var(--purple)]">
                  <Tag size={14} />
                </span>
                {c.name}
              </div>
            </Td>
            <Td className="text-sm text-[var(--muted)]">{c.note ?? "—"}</Td>
            <Td>
              <Badge tone={c.machineCount > 0 ? "info" : "muted"}>{c.machineCount} sản phẩm</Badge>
            </Td>
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
        title={editId ? "Sửa danh mục" : "Thêm danh mục"}
        footer={
          <>
            <Button variant="outline" onClick={() => setOpenForm(false)}>
              Huỷ
            </Button>
            <Button onClick={save} disabled={busy}>
              {busy ? "Đang lưu..." : "Lưu"}
            </Button>
          </>
        }
      >
        <div className="space-y-3">
          <Field label="Tên danh mục *" hint="VD: Laptop, Macbook, Phụ kiện, Màn hình...">
            <Input value={f.name} onChange={set("name")} placeholder="VD: Laptop" autoFocus />
          </Field>
          <Field label="Ghi chú">
            <Input value={f.note} onChange={set("note")} placeholder="Tuỳ chọn" />
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
        message={del ? `Xoá danh mục "${del.name}"?` : ""}
        confirmText="Xoá"
        danger
      />
    </div>
  );
}
