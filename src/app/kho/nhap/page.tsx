"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Save, Plus, RefreshCw, Wallet, CreditCard } from "lucide-react";
import { AccessGuard, BackLink, SectionCard } from "@/components/parts";
import { Button, PageHeader, Field, Input, Select } from "@/components/ui";
import { Modal } from "@/components/modal";
import { useToast } from "@/components/toast";
import { useApi, apiPost } from "@/lib/api";
import type { Category, Branch, Supplier } from "@/lib/types";
import { formatVND } from "@/lib/format";

export default function Page() {
  return (
    <AccessGuard menu="nhap-kho">
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

  // Phiếu nhập
  const [date, setDate] = useState(todayISO());
  const [branchId, setBranchId] = useState("");
  const [supplierId, setSupplierId] = useState("");
  // Sản phẩm
  const [category, setCategory] = useState("");
  const [name, setName] = useState("");
  const [serial, setSerial] = useState("");
  const [salePrice, setSalePrice] = useState("");
  const [description, setDescription] = useState("");
  // Số lượng / giá nhập
  const [quantity, setQuantity] = useState("1");
  const [unitPrice, setUnitPrice] = useState("");
  // Thanh toán
  const [amountPaid, setAmountPaid] = useState("");
  const [payMethod, setPayMethod] = useState<"tien_mat" | "chuyen_khoan">("tien_mat");
  const [busy, setBusy] = useState(false);

  // Modal thêm nhanh nhà cung cấp
  const [openSup, setOpenSup] = useState(false);
  const [sf, setSf] = useState({ name: "", phone: "" });
  const [supBusy, setSupBusy] = useState(false);

  const hasSerial = serial.trim() !== "";
  const qty = hasSerial ? 1 : Math.max(1, Math.floor(Number(quantity) || 1));
  const total = qty * (Number(unitPrice) || 0);
  const paid = Math.max(0, Math.min(total, Math.round(Number(amountPaid) || 0)));
  const debt = total - paid;

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
    setCategory("");
    setName("");
    setSerial("");
    setSalePrice("");
    setDescription("");
    setQuantity("1");
    setUnitPrice("");
    setAmountPaid("");
    setPayMethod("tien_mat");
  };

  const save = async () => {
    if (!name.trim()) {
      toast("Nhập Tên sản phẩm", "warning");
      return;
    }
    setBusy(true);
    try {
      const res = await apiPost<{ count: number; serials: string[]; debt: number }>("/api/stock-in", {
        date,
        branchId: branchId || undefined,
        supplierId: supplierId || undefined,
        category: category || undefined,
        name,
        serial: serial || undefined,
        salePrice: salePrice || undefined,
        description: description || undefined,
        quantity: qty,
        unitPrice: Number(unitPrice) || 0,
        amountPaid: paid,
        payMethod,
      });
      const msg =
        res.debt > 0
          ? `Đã nhập ${res.count} máy — còn nợ NCC ${formatVND(res.debt)}`
          : `Đã nhập ${res.count} máy, đã thanh toán đủ`;
      toast(msg);
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
      <PageHeader title="Nhập kho" subtitle="Nhập sản phẩm mới vào kho — điền thông tin phiếu và sản phẩm rồi bấm Lưu" />

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

        <SectionCard title="Thông tin sản phẩm">
          <div className="space-y-3">
            <Field label="Danh mục">
              <Select value={category} onChange={(e) => setCategory(e.target.value)}>
                <option value="">— Chọn danh mục —</option>
                {(categories ?? []).map((c) => (
                  <option key={c.id} value={c.name}>
                    {c.name}
                  </option>
                ))}
              </Select>
            </Field>
            <Field label="Tên sản phẩm *">
              <Input value={name} onChange={(e) => setName(e.target.value)} placeholder="VD: MacBook Pro 14 M1" />
            </Field>
            <Field label="Serial" hint="Bỏ trống = tự sinh mã SP khi lưu">
              <Input value={serial} onChange={(e) => setSerial(e.target.value)} placeholder="Tuỳ chọn" />
            </Field>
            <div className="grid grid-cols-2 gap-3">
              <Field label="Giá bán (₫)">
                <Input type="number" value={salePrice} onChange={(e) => setSalePrice(e.target.value)} placeholder="Giá bán niêm yết" />
              </Field>
              <Field label="Số lượng">
                <Input type="number" min={1} value={hasSerial ? "1" : quantity} onChange={(e) => setQuantity(e.target.value)} disabled={hasSerial} />
              </Field>
              <Field label="Đơn giá (₫)" hint="Giá nhập mỗi máy">
                <Input type="number" value={unitPrice} onChange={(e) => setUnitPrice(e.target.value)} placeholder="0" />
              </Field>
              <Field label="Mô tả">
                <Input value={description} onChange={(e) => setDescription(e.target.value)} placeholder="Tuỳ chọn" />
              </Field>
            </div>
            {hasSerial && <p className="text-[11px] text-[var(--muted)]">Có Serial nên số lượng cố định = 1.</p>}
          </div>
        </SectionCard>
      </div>

      <div className="mt-3">
        <SectionCard title="Thanh toán">
          <div className="grid gap-4 md:grid-cols-2">
            <div className="space-y-3">
              <Field label="Số tiền thanh toán (₫)" hint="Để trống / trả thiếu → phần còn lại ghi nợ nhà cung cấp">
                <div className="flex gap-2">
                  <Input
                    type="number"
                    value={amountPaid}
                    onChange={(e) => setAmountPaid(e.target.value)}
                    placeholder="0"
                    className="flex-1"
                  />
                  <Button type="button" variant="outline" onClick={() => setAmountPaid(String(total))} disabled={total <= 0}>
                    Trả đủ
                  </Button>
                </div>
              </Field>
              <Field label="Hình thức thanh toán">
                <div className="grid grid-cols-2 gap-2">
                  {([
                    { k: "tien_mat", label: "Tiền mặt", icon: Wallet },
                    { k: "chuyen_khoan", label: "Chuyển khoản", icon: CreditCard },
                  ] as const).map(({ k, label, icon: Icon }) => {
                    const active = payMethod === k;
                    return (
                      <button
                        key={k}
                        type="button"
                        onClick={() => setPayMethod(k)}
                        className={`flex items-center justify-center gap-2 rounded-xl border px-3 py-2 text-sm font-medium transition ${
                          active
                            ? "border-[var(--primary)] bg-[var(--primary)]/10 text-[var(--primary)]"
                            : "border-[var(--border)] hover:bg-[var(--surface-2)]"
                        }`}
                      >
                        <Icon size={16} /> {label}
                      </button>
                    );
                  })}
                </div>
              </Field>
            </div>

            <div className="space-y-2 rounded-xl border border-[var(--border)] bg-[var(--surface-2)] p-4 text-sm">
              <div className="flex items-center justify-between">
                <span className="text-[var(--muted)]">Tổng tiền ({qty} máy)</span>
                <span className="font-medium">{formatVND(total)}</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-[var(--muted)]">Đã thanh toán</span>
                <span className="font-medium text-[var(--success)]">{formatVND(paid)}</span>
              </div>
              <div className="flex items-center justify-between border-t border-[var(--border)] pt-2">
                <span className="text-[var(--muted)]">Còn nợ NCC</span>
                <span className={`font-semibold ${debt > 0 ? "text-[var(--danger)]" : ""}`}>{formatVND(debt)}</span>
              </div>
              {debt > 0 && (
                <p className="text-[11px] text-[var(--muted)]">
                  {supplierId
                    ? "Lưu xong sẽ ghi nợ khoản này cho nhà cung cấp đã chọn."
                    : "Chưa chọn nhà cung cấp — chọn để ghi nợ, nếu không khoản thiếu sẽ không được theo dõi."}
                </p>
              )}
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
