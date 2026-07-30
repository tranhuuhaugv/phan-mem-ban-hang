"use client";

import { useState } from "react";
import { Plus, Pencil, Trash2, Truck, MapPin, Phone } from "lucide-react";
import { AccessGuard } from "@/components/parts";
import { Button, PageHeader, Table, Tr, Td, Badge, Field, Input, SearchInput } from "@/components/ui";
import { Modal, ConfirmDialog } from "@/components/modal";
import { useToast } from "@/components/toast";
import { useRole } from "@/components/role-context";
import { useApi, apiPost, apiPatch, apiDelete } from "@/lib/api";
import type { Supplier } from "@/lib/types";

export default function NhaCungCapPage() {
  return (
    <AccessGuard menu="nha-cung-cap">
      <Inner />
    </AccessGuard>
  );
}

function Inner() {
  const { can } = useRole();
  const perm = can("nha-cung-cap");
  const toast = useToast();
  const { data, loading, reload } = useApi<Supplier[]>("/api/suppliers");
  const suppliers = data ?? [];

  const [openForm, setOpenForm] = useState(false);
  const [editId, setEditId] = useState<string | null>(null);
  const [f, setF] = useState({ name: "", phone: "", address: "", note: "" });
  const [del, setDel] = useState<Supplier | null>(null);
  const [q, setQ] = useState("");
  const [busy, setBusy] = useState(false);

  const rows = suppliers.filter((s) =>
    `${s.name} ${s.phone ?? ""} ${s.address ?? ""}`.toLowerCase().includes(q.trim().toLowerCase()),
  );

  const openCreate = () => {
    setEditId(null);
    setF({ name: "", phone: "", address: "", note: "" });
    setOpenForm(true);
  };
  const openEdit = (s: Supplier) => {
    setEditId(s.id);
    setF({ name: s.name, phone: s.phone ?? "", address: s.address ?? "", note: s.note ?? "" });
    setOpenForm(true);
  };

  const save = async () => {
    if (!f.name.trim()) {
      toast("Nhập tên nhà cung cấp", "warning");
      return;
    }
    setBusy(true);
    try {
      if (editId) {
        await apiPatch(`/api/suppliers/${editId}`, f);
        toast("Đã cập nhật nhà cung cấp");
      } else {
        await apiPost("/api/suppliers", f);
        toast("Đã thêm nhà cung cấp");
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
        title="Nhà cung cấp"
        subtitle="Danh bạ nhà cung cấp — nguồn nhập hàng vào kho, gán được cho từng máy khi thêm máy mới"
        actions={
          perm.create && (
            <Button onClick={openCreate}>
              <Plus size={16} /> Thêm nhà cung cấp
            </Button>
          )
        }
      />

      <div className="mb-4 flex flex-wrap items-center gap-2">
        <SearchInput value={q} onChange={setQ} placeholder="Tìm nhà cung cấp..." className="max-w-sm" />
      </div>

      <Table head={["Nhà cung cấp", "Điện thoại", "Địa chỉ", "Số máy đã nhập", ""]}>
        {rows.map((s) => (
          <Tr key={s.id}>
            <Td>
              <div className="flex items-center gap-2 font-medium">
                <span className="grid h-7 w-7 place-items-center rounded-lg bg-[var(--warning-bg)] text-[var(--warning)]">
                  <Truck size={14} />
                </span>
                <div>
                  {s.name}
                  {s.note && <div className="text-xs font-normal text-[var(--muted)]">{s.note}</div>}
                </div>
              </div>
            </Td>
            <Td className="text-sm text-[var(--muted)]">
              {s.phone ? (
                <span className="inline-flex items-center gap-1">
                  <Phone size={13} /> {s.phone}
                </span>
              ) : (
                "—"
              )}
            </Td>
            <Td className="text-sm text-[var(--muted)]">
              {s.address ? (
                <span className="inline-flex items-center gap-1">
                  <MapPin size={13} /> {s.address}
                </span>
              ) : (
                "—"
              )}
            </Td>
            <Td>
              <Badge tone={s.machineCount > 0 ? "info" : "muted"}>{s.machineCount} máy</Badge>
            </Td>
            <Td>
              <div className="flex items-center justify-end gap-1">
                {perm.edit && (
                  <Button size="sm" variant="ghost" onClick={() => openEdit(s)}>
                    <Pencil size={15} />
                  </Button>
                )}
                {perm.remove && (
                  <Button size="sm" variant="ghost" className="text-[var(--danger)]" onClick={() => setDel(s)}>
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
              <div className="py-6">{loading ? "Đang tải dữ liệu..." : "Chưa có nhà cung cấp nào"}</div>
            </Td>
          </Tr>
        )}
      </Table>

      {!perm.create && <p className="mt-3 text-xs text-[var(--muted)]">Vai trò của bạn chỉ được xem nhà cung cấp.</p>}

      <Modal
        open={openForm}
        onClose={() => setOpenForm(false)}
        title={editId ? "Sửa nhà cung cấp" : "Thêm nhà cung cấp"}
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
          <Field label="Tên nhà cung cấp *" hint="VD: Công ty ABC, Kho sỉ Nhật Minh...">
            <Input value={f.name} onChange={set("name")} placeholder="VD: Công ty ABC" autoFocus />
          </Field>
          <Field label="Điện thoại" hint="Dùng để chống trùng nhà cung cấp">
            <Input value={f.phone} onChange={set("phone")} placeholder="VD: 0901234567" />
          </Field>
          <Field label="Địa chỉ">
            <Input value={f.address} onChange={set("address")} placeholder="Số nhà, đường, quận..." />
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
            await apiDelete(`/api/suppliers/${del.id}`);
            toast("Đã xoá nhà cung cấp");
            reload();
          } catch (e) {
            toast(e instanceof Error ? e.message : "Xoá thất bại", "warning");
          }
        }}
        title="Xoá nhà cung cấp"
        message={del ? `Xoá nhà cung cấp "${del.name}"?` : ""}
        confirmText="Xoá"
        danger
      />
    </div>
  );
}
