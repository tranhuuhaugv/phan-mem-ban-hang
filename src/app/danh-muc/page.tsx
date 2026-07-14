"use client";

import { useState } from "react";
import { Plus, Pencil, Trash2 } from "lucide-react";
import { AccessGuard, FormGrid } from "@/components/parts";
import { Button, PageHeader, Table, Tr, Td, Badge, Field, Input, Select } from "@/components/ui";
import { Modal, ConfirmDialog } from "@/components/modal";
import { useToast } from "@/components/toast";
import { useRole } from "@/components/role-context";
import { categories } from "@/lib/mock-data";
import { CONDITION_LABEL } from "@/lib/types";

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
  const [openForm, setOpenForm] = useState(false);
  const [delId, setDelId] = useState<string | null>(null);
  const target = categories.find((c) => c.id === delId);

  return (
    <div>
      <PageHeader
        title="Danh mục sản phẩm"
        subtitle="Chuẩn hoá Hãng / Model / Cấu hình — nhập máy nhanh bằng dropdown"
        actions={
          perm.create && (
            <Button onClick={() => setOpenForm(true)}>
              <Plus size={16} /> Tạo danh mục
            </Button>
          )
        }
      />

      <Table head={["Hãng", "Model", "Cấu hình", "Loại", "Số máy đang dùng", ""]}>
        {categories.map((c) => (
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
                  <Button size="sm" variant="ghost" onClick={() => setOpenForm(true)}>
                    <Pencil size={15} />
                  </Button>
                )}
                {perm.remove && (
                  <Button size="sm" variant="ghost" className="text-[var(--danger)]" onClick={() => setDelId(c.id)}>
                    <Trash2 size={15} />
                  </Button>
                )}
              </div>
            </Td>
          </Tr>
        ))}
      </Table>

      {!perm.create && (
        <p className="mt-3 text-xs text-[var(--muted)]">Vai trò của bạn chỉ được xem danh mục.</p>
      )}

      <Modal
        open={openForm}
        onClose={() => setOpenForm(false)}
        title="Tạo / sửa danh mục"
        wide
        footer={
          <>
            <Button variant="outline" onClick={() => setOpenForm(false)}>
              Huỷ
            </Button>
            <Button
              onClick={() => {
                setOpenForm(false);
                toast("Đã lưu danh mục (demo)");
              }}
            >
              Lưu danh mục
            </Button>
          </>
        }
      >
        <FormGrid>
          <Field label="Hãng">
            <Select defaultValue="">
              <option value="" disabled>
                Chọn hãng
              </option>
              {["Dell", "HP", "Lenovo", "Asus", "Apple", "Acer", "MSI"].map((b) => (
                <option key={b}>{b}</option>
              ))}
            </Select>
          </Field>
          <Field label="Model">
            <Input placeholder="VD: Latitude 5420" />
          </Field>
          <Field label="CPU">
            <Input placeholder="VD: i5-1135G7" />
          </Field>
          <Field label="RAM">
            <Input placeholder="VD: 16GB" />
          </Field>
          <Field label="Ổ cứng">
            <Input placeholder="VD: 512GB SSD" />
          </Field>
          <Field label="Loại">
            <Select defaultValue="like_new">
              {Object.entries(CONDITION_LABEL).map(([k, v]) => (
                <option key={k} value={k}>
                  {v}
                </option>
              ))}
            </Select>
          </Field>
        </FormGrid>
      </Modal>

      <ConfirmDialog
        open={!!delId}
        onClose={() => setDelId(null)}
        onConfirm={() =>
          target && target.machineCount > 0
            ? toast(`Không thể xoá "${target.model}" — đang có ${target.machineCount} máy dùng danh mục này`, "warning")
            : toast("Đã xoá danh mục (demo)")
        }
        title="Xoá danh mục"
        message={
          target
            ? `Xoá danh mục "${target.brand} ${target.model}"? ${target.machineCount > 0 ? "Danh mục đang có máy sử dụng sẽ không xoá được." : ""}`
            : ""
        }
        confirmText="Xoá"
        danger
      />
    </div>
  );
}
