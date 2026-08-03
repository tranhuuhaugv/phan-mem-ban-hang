"use client";

import { useState } from "react";
import { Plus, Pencil, Trash2, Building2, MapPin, Phone } from "lucide-react";
import { AccessGuard } from "@/components/parts";
import { Button, PageHeader, Table, Tr, Td, Badge, Field, Input, SearchInput } from "@/components/ui";
import { Modal, ConfirmDialog } from "@/components/modal";
import { useToast } from "@/components/toast";
import { useRole } from "@/components/role-context";
import { useApi, apiPost, apiPatch, apiDelete } from "@/lib/api";
import type { Branch } from "@/lib/types";

export default function ChiNhanhPage() {
  return (
    <AccessGuard menu="chi-nhanh">
      <Inner />
    </AccessGuard>
  );
}

function Inner() {
  const { can } = useRole();
  const perm = can("chi-nhanh");
  const toast = useToast();
  const { data, loading, reload } = useApi<Branch[]>("/api/branches");
  const branches = data ?? [];

  const [openForm, setOpenForm] = useState(false);
  const [editId, setEditId] = useState<string | null>(null);
  const [f, setF] = useState({ name: "", address: "", phone: "", note: "" });
  const [del, setDel] = useState<Branch | null>(null);
  const [q, setQ] = useState("");
  const [busy, setBusy] = useState(false);

  const rows = branches.filter((b) =>
    `${b.name} ${b.address ?? ""} ${b.phone ?? ""}`.toLowerCase().includes(q.trim().toLowerCase()),
  );

  const openCreate = () => {
    setEditId(null);
    setF({ name: "", address: "", phone: "", note: "" });
    setOpenForm(true);
  };
  const openEdit = (b: Branch) => {
    setEditId(b.id);
    setF({ name: b.name, address: b.address ?? "", phone: b.phone ?? "", note: b.note ?? "" });
    setOpenForm(true);
  };

  const save = async () => {
    if (!f.name.trim()) {
      toast("Nhập tên chi nhánh", "warning");
      return;
    }
    setBusy(true);
    try {
      if (editId) {
        await apiPatch(`/api/branches/${editId}`, f);
        toast("Đã cập nhật chi nhánh");
      } else {
        await apiPost("/api/branches", f);
        toast("Đã thêm chi nhánh");
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
        title="Chi nhánh"
        subtitle="Các chi nhánh / cửa hàng của bạn — mỗi máy trong kho có thể gán vào 1 chi nhánh"
        actions={
          perm.create && (
            <Button onClick={openCreate}>
              <Plus size={16} /> Thêm chi nhánh
            </Button>
          )
        }
      />

      <div className="mb-4 flex flex-wrap items-center gap-2">
        <SearchInput value={q} onChange={setQ} placeholder="Tìm chi nhánh..." className="max-w-sm" />
      </div>

      <Table head={["Chi nhánh", "Địa chỉ", "Điện thoại", "Số máy", "Người tạo", ""]}>
        {rows.map((b) => (
          <Tr key={b.id}>
            <Td>
              <div className="flex items-center gap-2 font-medium">
                <span className="grid h-7 w-7 place-items-center rounded-lg bg-[var(--info-bg)] text-[var(--info)]">
                  <Building2 size={14} />
                </span>
                <div>
                  {b.name}
                  {b.note && <div className="text-xs font-normal text-[var(--muted)]">{b.note}</div>}
                </div>
              </div>
            </Td>
            <Td className="text-sm text-[var(--muted)]">
              {b.address ? (
                <span className="inline-flex items-center gap-1">
                  <MapPin size={13} /> {b.address}
                </span>
              ) : (
                "—"
              )}
            </Td>
            <Td className="text-sm text-[var(--muted)]">
              {b.phone ? (
                <span className="inline-flex items-center gap-1">
                  <Phone size={13} /> {b.phone}
                </span>
              ) : (
                "—"
              )}
            </Td>
            <Td>
              <Badge tone={b.machineCount > 0 ? "info" : "muted"}>{b.machineCount} máy</Badge>
            </Td>
            <Td className="whitespace-nowrap text-xs text-[var(--muted)]">{b.createdByName ?? "—"}</Td>
            <Td>
              <div className="flex items-center justify-end gap-1">
                {perm.edit && (
                  <Button size="sm" variant="ghost" onClick={() => openEdit(b)}>
                    <Pencil size={15} />
                  </Button>
                )}
                {perm.remove && (
                  <Button size="sm" variant="ghost" className="text-[var(--danger)]" onClick={() => setDel(b)}>
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
              <div className="py-6">{loading ? "Đang tải dữ liệu..." : "Chưa có chi nhánh nào"}</div>
            </Td>
          </Tr>
        )}
      </Table>

      {!perm.create && <p className="mt-3 text-xs text-[var(--muted)]">Vai trò của bạn chỉ được xem chi nhánh.</p>}

      <Modal
        open={openForm}
        onClose={() => setOpenForm(false)}
        title={editId ? "Sửa chi nhánh" : "Thêm chi nhánh"}
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
          <Field label="Tên chi nhánh *" hint="VD: Chi nhánh Quận 1, Cửa hàng Hà Nội...">
            <Input value={f.name} onChange={set("name")} placeholder="VD: Chi nhánh Quận 1" autoFocus />
          </Field>
          <Field label="Địa chỉ">
            <Input value={f.address} onChange={set("address")} placeholder="Số nhà, đường, quận..." />
          </Field>
          <Field label="Điện thoại">
            <Input value={f.phone} onChange={set("phone")} placeholder="VD: 0901234567" />
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
            await apiDelete(`/api/branches/${del.id}`);
            toast("Đã xoá chi nhánh");
            reload();
          } catch (e) {
            toast(e instanceof Error ? e.message : "Xoá thất bại", "warning");
          }
        }}
        title="Xoá chi nhánh"
        message={del ? `Xoá chi nhánh "${del.name}"?` : ""}
        confirmText="Xoá"
        danger
      />
    </div>
  );
}
