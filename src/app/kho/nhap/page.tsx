"use client";

import { useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { Save, Plus, RefreshCw, Wallet, CreditCard, Landmark, Trash2, Pencil, Package, History } from "lucide-react";
import { AccessGuard, BackLink, SectionCard } from "@/components/parts";
import { Button, PageHeader, Field, Input, Select, Table, Tr, Td, MoneyInput } from "@/components/ui";
import { Modal } from "@/components/modal";
import { useToast } from "@/components/toast";
import { useApi, apiPost } from "@/lib/api";
import type { Category, Branch, Supplier, Machine } from "@/lib/types";
import { formatVND } from "@/lib/format";

interface Line {
  category: string;
  name: string;
  serial: string;
  quantity: string;
  unitPrice: string;
  salePrice: string;
  description: string;
}

const EMPTY_LINE: Line = { category: "", name: "", serial: "", quantity: "1", unitPrice: "", salePrice: "", description: "" };

function lineQty(l: Line) {
  return l.serial.trim() ? 1 : Math.max(1, Math.floor(Number(l.quantity) || 1));
}
function lineSubtotal(l: Line) {
  return lineQty(l) * (Number(l.unitPrice) || 0);
}

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
  const { data: machines } = useApi<Machine[]>("/api/machines");

  // Sản phẩm đã từng nhập (gộp theo tên) — để chọn lại cho nhanh
  const products = useMemo(() => {
    const map = new Map<string, { name: string; category: string; salePrice: string }>();
    for (const m of machines ?? []) {
      if (!m.model || map.has(m.model)) continue;
      map.set(m.model, { name: m.model, category: m.category ?? "", salePrice: m.salePrice != null ? String(m.salePrice) : "" });
    }
    return [...map.values()];
  }, [machines]);

  // Phiếu
  const [date, setDate] = useState(todayISO());
  const [branchId, setBranchId] = useState("");
  const [supplierId, setSupplierId] = useState("");
  const [note, setNote] = useState("");
  // Máy trong phiếu
  const [items, setItems] = useState<Line[]>([]);
  const [draft, setDraft] = useState<Line>(EMPTY_LINE);
  const [openProduct, setOpenProduct] = useState(false);
  const [editIndex, setEditIndex] = useState<number | null>(null);

  // Gợi ý sản phẩm cũ theo tên đang gõ
  const nameSuggestions = useMemo(() => {
    const q = draft.name.trim().toLowerCase();
    if (!q) return [];
    return products.filter((p) => p.name.toLowerCase().includes(q) && p.name.toLowerCase() !== q).slice(0, 6);
  }, [products, draft.name]);
  const pickProduct = (p: { name: string; category: string; salePrice: string }) =>
    setDraft((s) => ({ ...s, name: p.name, category: p.category || s.category, salePrice: p.salePrice || s.salePrice }));
  // Thanh toán
  const [amountPaid, setAmountPaid] = useState("");
  const [payMethod, setPayMethod] = useState<"tien_mat" | "the" | "chuyen_khoan">("tien_mat");
  const [busy, setBusy] = useState(false);

  // Modal thêm nhanh NCC
  const [openSup, setOpenSup] = useState(false);
  const [sf, setSf] = useState({ name: "", phone: "" });
  const [supBusy, setSupBusy] = useState(false);

  const setD = (k: keyof Line) => (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) =>
    setDraft((s) => ({ ...s, [k]: e.target.value }));

  const openAdd = () => {
    setEditIndex(null);
    setDraft({ ...EMPTY_LINE, category: categories?.[0]?.name ?? "" });
    setOpenProduct(true);
  };
  const openEdit = (i: number) => {
    setEditIndex(i);
    setDraft(items[i]);
    setOpenProduct(true);
  };
  const saveDraft = () => {
    if (!draft.name.trim()) {
      toast("Nhập Tên sản phẩm", "warning");
      return;
    }
    const line: Line = { ...draft, name: draft.name.trim(), serial: draft.serial.trim().toUpperCase() };
    setItems((arr) => (editIndex === null ? [...arr, line] : arr.map((x, idx) => (idx === editIndex ? line : x))));
    setOpenProduct(false);
  };
  const removeLine = (i: number) => setItems((arr) => arr.filter((_, idx) => idx !== i));

  const total = items.reduce((s, l) => s + lineSubtotal(l), 0);
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
    setNote("");
    setItems([]);
    setDraft(EMPTY_LINE);
    setAmountPaid("");
    setPayMethod("tien_mat");
  };

  const save = async () => {
    if (items.length === 0) {
      toast("Thêm ít nhất 1 máy vào phiếu", "warning");
      return;
    }
    setBusy(true);
    try {
      const res = await apiPost<{ code: string; debt: number }>("/api/stock-ins", {
        date,
        branchId: branchId || undefined,
        supplierId: supplierId || undefined,
        note: note || undefined,
        amountPaid: paid,
        payMethod,
        items: items.map((l) => ({
          category: l.category || undefined,
          name: l.name,
          serial: l.serial || undefined,
          quantity: lineQty(l),
          unitPrice: Number(l.unitPrice) || 0,
          salePrice: l.salePrice || undefined,
          description: l.description || undefined,
        })),
      });
      toast(res.debt > 0 ? `Đã tạo phiếu ${res.code} — còn nợ NCC ${formatVND(res.debt)}` : `Đã tạo phiếu ${res.code}, thanh toán đủ`);
      router.push("/kho/phieu-nhap");
    } catch (e) {
      toast(e instanceof Error ? e.message : "Tạo phiếu thất bại", "warning");
    } finally {
      setBusy(false);
    }
  };

  const totalMachines = items.reduce((s, l) => s + lineQty(l), 0);

  return (
    <div>
      <BackLink href="/kho/phieu-nhap">Về danh sách phiếu nhập</BackLink>
      <PageHeader title="Tạo phiếu nhập kho" subtitle="1 phiếu nhập có thể gồm nhiều máy — thêm từng dòng rồi bấm Lưu" />

      <SectionCard title="Thông tin phiếu nhập">
        <div className="grid gap-3 md:grid-cols-3">
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
        <div className="mt-3">
          <Field label="Ghi chú phiếu">
            <Input value={note} onChange={(e) => setNote(e.target.value)} placeholder="Tuỳ chọn" />
          </Field>
        </div>
      </SectionCard>

      <div className="mt-3">
        <SectionCard
          title="Máy trong phiếu"
          action={
            <Button type="button" size="sm" onClick={openAdd}>
              <Plus size={15} /> Thêm sản phẩm
            </Button>
          }
        >
          <div>
            <Table head={["#", "Sản phẩm", "Serial / SL", "Đơn giá", "Giá bán", "Thành tiền", ""]}>
              {items.map((l, i) => (
                <Tr key={i}>
                  <Td className="text-[var(--muted)]">{i + 1}</Td>
                  <Td>
                    <div className="flex items-center gap-1.5 font-medium">
                      <Package size={13} className="text-[var(--muted)]" /> {l.name}
                    </div>
                    {l.category && <div className="text-xs text-[var(--muted)]">{l.category}</div>}
                  </Td>
                  <Td className="text-sm">
                    {l.serial ? (
                      <span className="font-mono text-xs">{l.serial}</span>
                    ) : (
                      <span className="text-[var(--muted)]">SL: {lineQty(l)} (tự sinh mã)</span>
                    )}
                  </Td>
                  <Td className="whitespace-nowrap text-sm">{formatVND(Number(l.unitPrice) || 0)}</Td>
                  <Td className="whitespace-nowrap text-sm">{l.salePrice ? formatVND(Number(l.salePrice)) : "—"}</Td>
                  <Td className="whitespace-nowrap font-medium">{formatVND(lineSubtotal(l))}</Td>
                  <Td>
                    <div className="flex items-center justify-end gap-1">
                      <Button size="sm" variant="ghost" onClick={() => openEdit(i)}>
                        <Pencil size={15} />
                      </Button>
                      <Button size="sm" variant="ghost" className="text-[var(--danger)]" onClick={() => removeLine(i)}>
                        <Trash2 size={15} />
                      </Button>
                    </div>
                  </Td>
                </Tr>
              ))}
              {items.length === 0 && (
                <Tr>
                  <Td className="text-center text-[var(--muted)]">
                    <div className="py-5">Chưa có máy nào — bấm “Thêm sản phẩm”</div>
                  </Td>
                </Tr>
              )}
            </Table>
            {items.length > 0 && (
              <div className="mt-2 text-right text-xs text-[var(--muted)]">
                {items.length} dòng · {totalMachines} máy
              </div>
            )}
          </div>
        </SectionCard>
      </div>

      <div className="mt-3">
        <SectionCard title="Thanh toán">
          <div className="grid gap-4 md:grid-cols-2">
            <div className="space-y-3">
              <Field label="Số tiền thanh toán (₫)" hint="Để trống / trả thiếu → phần còn lại ghi nợ nhà cung cấp">
                <div className="flex gap-2">
                  <MoneyInput value={amountPaid} onChange={setAmountPaid} placeholder="0" className="flex-1" />
                  <Button type="button" variant="outline" onClick={() => setAmountPaid(String(total))} disabled={total <= 0}>
                    Trả đủ
                  </Button>
                </div>
              </Field>
              <Field label="Hình thức thanh toán">
                <div className="grid grid-cols-3 gap-2">
                  {([
                    { k: "tien_mat", label: "Tiền mặt", icon: Wallet },
                    { k: "the", label: "Thẻ", icon: CreditCard },
                    { k: "chuyen_khoan", label: "Chuyển khoản", icon: Landmark },
                  ] as const).map(({ k, label, icon: Icon }) => {
                    const active = payMethod === k;
                    return (
                      <button
                        key={k}
                        type="button"
                        onClick={() => setPayMethod(k)}
                        className={`flex items-center justify-center gap-2 rounded-xl border px-3 py-2 text-sm font-medium transition ${
                          active ? "border-[var(--primary)] bg-[var(--primary)]/10 text-[var(--primary)]" : "border-[var(--border)] hover:bg-[var(--surface-2)]"
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
                <span className="text-[var(--muted)]">Tổng tiền ({totalMachines} máy)</span>
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
              {debt > 0 && !supplierId && (
                <p className="text-[11px] text-[var(--muted)]">Chưa chọn NCC — chọn để ghi nợ khoản còn thiếu.</p>
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
          <Save size={16} /> {busy ? "Đang lưu..." : "Lưu phiếu nhập"}
        </Button>
      </div>

      {/* Modal thêm / sửa sản phẩm trong phiếu */}
      <Modal
        open={openProduct}
        onClose={() => setOpenProduct(false)}
        title={editIndex === null ? "Thêm mới sản phẩm" : "Sửa sản phẩm"}
        footer={
          <>
            <Button variant="outline" onClick={() => setOpenProduct(false)}>
              Huỷ
            </Button>
            <Button onClick={saveDraft}>{editIndex === null ? "Thêm mới" : "Cập nhật"}</Button>
          </>
        }
      >
        <div className="space-y-3">
          <Field label="Danh mục">
            <Select value={draft.category} onChange={setD("category")}>
              <option value="">— Chọn danh mục —</option>
              {(categories ?? []).map((c) => (
                <option key={c.id} value={c.name}>
                  {c.name}
                </option>
              ))}
            </Select>
          </Field>
          <Field label="Tên sản phẩm *" hint="Gõ để chọn lại sản phẩm cũ, hoặc nhập tên mới">
            <div className="relative">
              <Input value={draft.name} onChange={setD("name")} placeholder="VD: MacBook Pro 14 M1" autoFocus />
              {nameSuggestions.length > 0 && (
                <div className="absolute z-20 mt-1 w-full overflow-hidden rounded-lg border border-[var(--border)] bg-[var(--surface)] shadow-lg-soft">
                  <div className="flex items-center gap-1.5 border-b border-[var(--border)] px-3 py-1.5 text-[10px] uppercase tracking-wide text-[var(--muted)]">
                    <History size={11} /> Sản phẩm đã nhập
                  </div>
                  {nameSuggestions.map((p) => (
                    <button
                      key={p.name}
                      type="button"
                      onClick={() => pickProduct(p)}
                      className="flex w-full items-center justify-between gap-2 px-3 py-2 text-left text-sm hover:bg-[var(--surface-2)]"
                    >
                      <span className="truncate font-medium">{p.name}</span>
                      <span className="shrink-0 text-xs text-[var(--muted)]">
                        {[p.category, p.salePrice ? formatVND(Number(p.salePrice)) : ""].filter(Boolean).join(" · ")}
                      </span>
                    </button>
                  ))}
                </div>
              )}
            </div>
          </Field>
          <div className="grid grid-cols-2 gap-3">
            <Field label="Serial" hint="Bỏ trống = tự sinh mã SP">
              <Input value={draft.serial} onChange={setD("serial")} placeholder="Tuỳ chọn" />
            </Field>
            <Field label="Số lượng">
              <Input
                type="number"
                min={1}
                value={draft.serial.trim() ? "1" : draft.quantity}
                onChange={setD("quantity")}
                disabled={!!draft.serial.trim()}
              />
            </Field>
            <Field label="Đơn giá (₫)" hint="Giá nhập / máy">
              <MoneyInput value={draft.unitPrice} onChange={(v) => setDraft((s) => ({ ...s, unitPrice: v }))} placeholder="0" />
            </Field>
            <Field label="Giá bán (₫)">
              <MoneyInput value={draft.salePrice} onChange={(v) => setDraft((s) => ({ ...s, salePrice: v }))} placeholder="Giá bán niêm yết" />
            </Field>
          </div>
          <Field label="Mô tả">
            <Input value={draft.description} onChange={setD("description")} placeholder="Tuỳ chọn" />
          </Field>
        </div>
      </Modal>

      {/* Modal thêm nhanh NCC */}
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
            <Input value={sf.name} onChange={(e) => setSf((s) => ({ ...s, name: e.target.value }))} placeholder="VD: Công ty ABC" autoFocus />
          </Field>
          <Field label="Điện thoại">
            <Input value={sf.phone} onChange={(e) => setSf((s) => ({ ...s, phone: e.target.value }))} placeholder="VD: 0901234567" />
          </Field>
        </div>
      </Modal>
    </div>
  );
}
