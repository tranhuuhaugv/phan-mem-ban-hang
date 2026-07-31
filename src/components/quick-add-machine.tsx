"use client";

import { useState } from "react";
import { Modal } from "@/components/modal";
import { Button, Field, Input, Select } from "@/components/ui";
import { useToast } from "@/components/toast";
import { useApi, apiPost } from "@/lib/api";
import type { Category, Branch, Machine } from "@/lib/types";

// Modal nhập kho nhanh 1 sản phẩm — dùng ở hoá đơn / sửa chữa khi sản phẩm chưa có trong kho
export function QuickAddMachine({
  open,
  onClose,
  defaultName = "",
  onCreated,
}: {
  open: boolean;
  onClose: () => void;
  defaultName?: string;
  onCreated: (m: Machine) => void;
}) {
  const toast = useToast();
  const { data: categories } = useApi<Category[]>(open ? "/api/categories" : null);
  const { data: branches } = useApi<Branch[]>(open ? "/api/branches" : null);
  const [busy, setBusy] = useState(false);
  const [f, setF] = useState({ category: "", model: "", serial: "", purchasePrice: "", salePrice: "", branchId: "" });

  // Đồng bộ tên mặc định khi mở (không dùng effect)
  const [seen, setSeen] = useState<string | null>(null);
  if (open && seen !== defaultName) {
    setSeen(defaultName);
    setF({ category: "", model: defaultName, serial: "", purchasePrice: "", salePrice: "", branchId: "" });
  }
  if (!open && seen !== null) setSeen(null);

  const set = (k: keyof typeof f) => (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) =>
    setF((s) => ({ ...s, [k]: e.target.value }));

  const save = async () => {
    if (!f.model.trim()) {
      toast("Nhập tên sản phẩm", "warning");
      return;
    }
    setBusy(true);
    try {
      const m = await apiPost<Machine>("/api/machines", {
        model: f.model.trim(),
        serial: f.serial.trim(),
        category: f.category || undefined,
        purchasePrice: Number(f.purchasePrice) || 0,
        salePrice: f.salePrice || undefined,
        branchId: f.branchId || undefined,
        status: "ton_kho",
      });
      toast(`Đã nhập kho ${m.serial}`);
      onCreated(m);
      onClose();
    } catch (e) {
      toast(e instanceof Error ? e.message : "Nhập kho thất bại", "warning");
    } finally {
      setBusy(false);
    }
  };

  return (
    <Modal
      open={open}
      onClose={onClose}
      title="Nhập kho nhanh"
      footer={
        <>
          <Button variant="outline" onClick={onClose}>
            Huỷ
          </Button>
          <Button onClick={save} disabled={busy}>
            {busy ? "Đang lưu..." : "Nhập kho & chọn"}
          </Button>
        </>
      }
    >
      <div className="space-y-3">
        <Field label="Danh mục">
          <Select value={f.category} onChange={set("category")}>
            <option value="">— Chọn danh mục —</option>
            {(categories ?? []).map((c) => (
              <option key={c.id} value={c.name}>
                {c.name}
              </option>
            ))}
          </Select>
        </Field>
        <Field label="Tên sản phẩm *">
          <Input value={f.model} onChange={set("model")} placeholder="VD: MacBook Pro 14 M1" autoFocus />
        </Field>
        <div className="grid grid-cols-2 gap-3">
          <Field label="Serial" hint="Bỏ trống = tự sinh mã SP">
            <Input value={f.serial} onChange={set("serial")} placeholder="Tuỳ chọn" />
          </Field>
          <Field label="Chi nhánh">
            <Select value={f.branchId} onChange={set("branchId")}>
              <option value="">— Chọn —</option>
              {(branches ?? []).map((b) => (
                <option key={b.id} value={b.id}>
                  {b.name}
                </option>
              ))}
            </Select>
          </Field>
          <Field label="Giá nhập (₫)">
            <Input type="number" value={f.purchasePrice} onChange={set("purchasePrice")} placeholder="0" />
          </Field>
          <Field label="Giá bán (₫)">
            <Input type="number" value={f.salePrice} onChange={set("salePrice")} placeholder="0" />
          </Field>
        </div>
      </div>
    </Modal>
  );
}
