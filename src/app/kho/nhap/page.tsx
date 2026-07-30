"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Save, Plus, RefreshCw, Package } from "lucide-react";
import { AccessGuard, BackLink, SectionCard } from "@/components/parts";
import { Button, PageHeader, Field, Input, Select } from "@/components/ui";
import { Modal } from "@/components/modal";
import { useToast } from "@/components/toast";
import { useApi, apiPost } from "@/lib/api";
import type { Category, Branch, Supplier } from "@/lib/types";
import { formatVND } from "@/lib/format";

// Sản phẩm đang soạn (chưa lưu) để nhập kho
interface DraftProduct {
  category: string;
  name: string;
  serial: string;
  salePrice: string;
  description: string;
}

const EMPTY_PRODUCT: DraftProduct = { category: "", name: "", serial: "", salePrice: "", description: "" };

export default function Page() {
  return (
    <AccessGuard menu="kho">
      <Inner />
    </AccessGuard>
  );
}

function todayISO() {
  return new Date().toISOString().slice(0, 10);
}

function Inner() {
  const router = useRouter();
  const toast = useToast();
  const { data: categories } = useApi<Category[]>("/api/categories");
  const { data: branches } = useApi<Branch[]>("/api/branches");
  const { data: suppliers, reload: reloadSuppliers } = useApi<Supplier[]>("/api/suppliers");

  const [date, setDate] = useState(todayISO());
  const [branchId, setBranchId] = useState("");
  const [supplierId, setSupplierId] = useState("");
  const [product, setProduct] = useState<DraftProduct | null>(null);
  const [quantity, setQuantity] = useState("1");
  const [unitPrice, setUnitPrice] = useState("");
  const [busy, setBusy] = useState(false);

  // Modal thêm sản phẩm
  const [openProduct, setOpenProduct] = useState(false);
  const [pf, setPf] = useState<DraftProduct>(EMPTY_PRODUCT);
  const setPF = (k: keyof DraftProduct) => (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) =>
    setPf((s) => ({ ...s, [k]: e.target.value }));

  // Modal thêm nhanh nhà cung cấp
  const [openSup, setOpenSup] = useState(false);
  const [sf, setSf] = useState({ name: "", phone: "" });
  const [supBusy, setSupBusy] = useState(false);

  const openProductModal = () => {
    setPf(product ?? { ...EMPTY_PRODUCT, category: categories?.[0]?.name ?? "" });
    setOpenProduct(true);
  };
  const saveProduct = () => {
    if (!pf.name.trim()) {
      toast("Nhập Tên sản phẩm", "warning");
      return;
    }
    setProduct({ ...pf, name: pf.name.trim() });
    setOpenProduct(false);
  };

  const saveSupplier = async () => {
    if (!sf.name.trim()) {
      toast("Nhập tên nhà cung cấp", "warning");
      return;
    }
    setSupBusy(true);
    try {
      const row = await apiPost<Supplier>("/api/suppliers", sf);
      toast("Đã thêm nhà cung cấp");
      await reloadSuppliers();
      setSupplierId(row.id);
      setOpenSup(false);
      setSf({ name: "", phone: "" });
    } catch (e) {
      toast(e instanceof Error ? e.message : "Lưu thất bại", "warning");
    } finally {
      setSupBusy(false);
    }
  };

  const refresh = () => {
    setDate(todayISO());
    setBranchId("");
    setSupplierId("");
    setProduct(null);
    setQuantity("1");
    setUnitPrice("");
  };

  const qty = Math.max(1, Math.floor(Number(quantity) || 1));
  const total = qty * (Number(unitPrice) || 0);

  const save = async () => {
    if (!product || !product.name.trim()) {
      toast("Chọn Mặt hàng — bấm dấu + để thêm sản phẩm", "warning");
      return;
    }
    if (product.serial.trim() && qty > 1) {
      toast("Đã nhập Serial thì số lượng phải là 1", "warning");
      return;
    }
    setBusy(true);
    try {
      const res = await apiPost<{ count: number; serials: string[] }>("/api/stock-in", {
        date,
        branchId: branchId || undefined,
        supplierId: supplierId || undefined,
        category: product.category || undefined,
        name: product.name,
        serial: product.serial || undefined,
        salePrice: product.salePrice || undefined,
        description: product.description || undefined,
        quantity: qty,
        unitPrice: Number(unitPrice) || 0,
      });
      toast(`Đã nhập ${res.count} máy vào kho (${res.serials.join(", ")})`);
      router.push("/kho");
    } catch (e) {
      toast(e instanceof Error ? e.message : "Nhập kho thất bại", "warning");
    } finally {
      setBusy(false);
    }
  };

  return (
    <div>
      <BackLink href="/kho">Về danh sách kho</BackLink>
      <PageHeader title="Nhập kho" subtitle="Nhập sản phẩm mới vào kho — chọn chi nhánh, nhà cung cấp, mặt hàng rồi lưu" />

      <div className="grid items-start gap-3 lg:grid-cols-2">
        <SectionCard title="Thông tin phiếu nhập">
          <div className="space-y-3">
            <Field label="Ngày">
              <Input type="date" value={date} onChange={(e) => setDate(e.target.value)} />
            </Field>
            <Field label="Chi nhánh">
              <Select value={branchId} onChange={(e) => setBranchId(e.target.value)}>
                <option value="">— Chọn chi nhánh —</option>
                {(branches ?? []).map((b) => (
                  <option key={b.id} value={b.id}>
                    {b.name}
                  </option>
                ))}
              </Select>
            </Field>
            <Field label="Nhà cung cấp">
              <div className="flex gap-2">
                <Select value={supplierId} onChange={(e) => setSupplierId(e.target.value)} className="flex-1">
                  <option value="">— Chọn nhà cung cấp —</option>
                  {(suppliers ?? []).map((s) => (
                    <option key={s.id} value={s.id}>
                      {s.name}
                    </option>
                  ))}
                </Select>
                <Button type="button" variant="outline" onClick={() => setOpenSup(true)}>
                  <Plus size={16} />
                </Button>
              </div>
            </Field>
          </div>
        </SectionCard>

        <SectionCard title="Mặt hàng nhập">
          <div className="space-y-3">
            <Field label="Mặt hàng" hint="Bấm dấu + để thêm / sửa thông tin sản phẩm">
              <div className="flex gap-2">
                <Input
                  value={product?.name ?? ""}
                  readOnly
                  placeholder="Chưa chọn sản phẩm"
                  className="flex-1 cursor-pointer"
                  onClick={openProductModal}
                />
                <Button type="button" onClick={openProductModal}>
                  <Plus size={16} />
                </Button>
              </div>
            </Field>
            {product && (
              <div className="rounded-lg border border-[var(--border)] bg-[var(--surface-2)] px-3 py-2 text-xs text-[var(--muted)]">
                <div className="flex items-center gap-1.5 font-medium text-[var(--foreground)]">
                  <Package size={13} /> {product.name}
                </div>
                <div className="mt-1 flex flex-wrap gap-x-3 gap-y-0.5">
                  {product.category && <span>Danh mục: {product.category}</span>}
                  {product.serial && <span>Serial: {product.serial}</span>}
                  {product.salePrice && <span>Giá bán: {formatVND(Number(product.salePrice))}</span>}
                </div>
              </div>
            )}
            <div className="grid grid-cols-2 gap-3">
              <Field label="Số lượng">
                <Input
                  type="number"
                  min={1}
                  value={quantity}
                  onChange={(e) => setQuantity(e.target.value)}
                  disabled={!!product?.serial.trim()}
                />
              </Field>
              <Field label="Đơn giá (₫)" hint="Giá nhập mỗi máy">
                <Input type="number" value={unitPrice} onChange={(e) => setUnitPrice(e.target.value)} placeholder="0" />
              </Field>
            </div>
            {product?.serial.trim() && (
              <p className="text-[11px] text-[var(--muted)]">Có Serial nên số lượng cố định = 1.</p>
            )}
            <div className="flex items-center justify-between border-t border-[var(--border)] pt-2 text-sm">
              <span className="text-[var(--muted)]">Thành tiền</span>
              <span className="font-semibold">{formatVND(total)}</span>
            </div>
          </div>
        </SectionCard>
      </div>

      <div className="mt-3 flex items-center justify-end gap-2">
        <Button type="button" variant="outline" onClick={refresh}>
          <RefreshCw size={16} /> Refresh
        </Button>
        <Button type="button" onClick={save} disabled={busy}>
          <Save size={16} /> {busy ? "Đang lưu..." : "Lưu"}
        </Button>
      </div>

      {/* Modal thêm mới sản phẩm */}
      <Modal
        open={openProduct}
        onClose={() => setOpenProduct(false)}
        title="Thêm mới sản phẩm"
        footer={
          <>
            <Button variant="outline" onClick={() => setOpenProduct(false)}>
              Huỷ
            </Button>
            <Button onClick={saveProduct}>{product ? "Cập nhật" : "Thêm mới"}</Button>
          </>
        }
      >
        <div className="space-y-3">
          <Field label="Danh mục">
            <Select value={pf.category} onChange={setPF("category")}>
              <option value="">— Chọn danh mục —</option>
              {(categories ?? []).map((c) => (
                <option key={c.id} value={c.name}>
                  {c.name}
                </option>
              ))}
            </Select>
          </Field>
          <Field label="Tên sản phẩm *">
            <Input value={pf.name} onChange={setPF("name")} placeholder="VD: MacBook Pro 14 M1" autoFocus />
          </Field>
          <Field label="Serial" hint="Bỏ trống = tự sinh mã SP khi lưu">
            <Input value={pf.serial} onChange={setPF("serial")} placeholder="Tuỳ chọn" />
          </Field>
          <Field label="Giá bán (₫)">
            <Input type="number" value={pf.salePrice} onChange={setPF("salePrice")} placeholder="Giá bán niêm yết" />
          </Field>
          <Field label="Mô tả">
            <Input value={pf.description} onChange={setPF("description")} placeholder="Tuỳ chọn" />
          </Field>
        </div>
      </Modal>

      {/* Modal thêm nhanh nhà cung cấp */}
      <Modal
        open={openSup}
        onClose={() => setOpenSup(false)}
        title="Thêm nhà cung cấp"
        footer={
          <>
            <Button variant="outline" onClick={() => setOpenSup(false)}>
              Huỷ
            </Button>
            <Button onClick={saveSupplier} disabled={supBusy}>
              {supBusy ? "Đang lưu..." : "Lưu"}
            </Button>
          </>
        }
      >
        <div className="space-y-3">
          <Field label="Tên nhà cung cấp *">
            <Input
              value={sf.name}
              onChange={(e) => setSf((s) => ({ ...s, name: e.target.value }))}
              placeholder="VD: Công ty ABC"
              autoFocus
            />
          </Field>
          <Field label="Điện thoại">
            <Input
              value={sf.phone}
              onChange={(e) => setSf((s) => ({ ...s, phone: e.target.value }))}
              placeholder="VD: 0901234567"
            />
          </Field>
        </div>
      </Modal>
    </div>
  );
}
