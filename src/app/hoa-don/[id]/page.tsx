"use client";

import { use, useState, useEffect, useRef } from "react";
import { useSearchParams } from "next/navigation";
import { Printer, ShieldCheck, Loader2, HandCoins, Wallet, CreditCard, Landmark, Pencil, Save, Trash2 } from "lucide-react";
import { AccessGuard, BackLink } from "@/components/parts";
import { Button, PageHeader, Card, MoneyInput, Field, Input, Select } from "@/components/ui";
import { Modal } from "@/components/modal";
import { useToast } from "@/components/toast";
import { useRole } from "@/components/role-context";
import { useApi, apiPost, apiPatch } from "@/lib/api";
import { PAY_METHOD_LABEL, type Machine } from "@/lib/types";
import { formatVND, formatDateTime } from "@/lib/format";

interface InvoiceDetail {
  id: string;
  code: string;
  kind: string;
  orderCode: string;
  repairCode: string;
  customerName: string;
  phone: string;
  value: number;
  paid: number;
  debt: number;
  payMethod?: string;
  date: string;
  items: { id: string; serial: string; name: string; config: string; price: number }[];
  warranties: { id: string; serial: string; months: number; condition: string; startDate: string }[];
  payments: { id: string; code: string; amount: number; method?: string; date: string }[];
}

export default function Page({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  return (
    <AccessGuard menu="hoa-don">
      <Inner id={id} />
    </AccessGuard>
  );
}

interface StoreConfig {
  name: string;
  phone: string;
  address: string;
  logoUrl?: string;
  thankYou: string;
}

function Inner({ id }: { id: string }) {
  const { data: iv, loading, error, reload } = useApi<InvoiceDetail>(`/api/invoices/${id}`);
  const { data: store } = useApi<StoreConfig>("/api/store-config");
  const { can } = useRole();
  const toast = useToast();
  const { data: machines } = useApi<Machine[]>("/api/machines");
  const [openPay, setOpenPay] = useState(false);
  const [pay3, setPay3] = useState({ tien_mat: "", the: "", chuyen_khoan: "" });
  const [openEditInv, setOpenEditInv] = useState(false);
  const [editItems, setEditItems] = useState<{ serial: string; name: string; price: number }[]>([]);
  const [editCust, setEditCust] = useState({ customerName: "", phone: "" });
  const [busy, setBusy] = useState(false);

  const openEditInvoice = () => {
    if (!iv) return;
    setEditItems(iv.items.map((it) => ({ serial: it.serial, name: it.name, price: it.price })));
    setEditCust({ customerName: iv.customerName ?? "", phone: iv.phone ?? "" });
    setOpenEditInv(true);
  };
  const addEditItem = (serial: string) => {
    const m = (machines ?? []).find((x) => x.serial === serial);
    if (!m || editItems.some((i) => i.serial === serial)) return;
    setEditItems((s) => [...s, { serial: m.serial, name: `${m.brand} ${m.model}`, price: m.salePrice ?? 0 }]);
  };
  const saveEditInvoice = async () => {
    if (editItems.length === 0) return toast("Hoá đơn cần ít nhất 1 sản phẩm", "warning");
    if (editItems.some((i) => !i.price)) return toast("Nhập giá cho tất cả sản phẩm", "warning");
    setBusy(true);
    try {
      await apiPatch(`/api/invoices/${id}`, {
        items: editItems.map((i) => ({ serial: i.serial, price: i.price })),
        customerName: editCust.customerName.trim(),
        phone: editCust.phone.trim(),
      });
      toast("Đã cập nhật hoá đơn");
      setOpenEditInv(false);
      reload();
    } catch (e) {
      toast(e instanceof Error ? e.message : "Cập nhật thất bại", "warning");
    } finally {
      setBusy(false);
    }
  };
  const editTotal = editItems.reduce((s, i) => s + (Number(i.price) || 0), 0);

  // Mở thẳng form Sửa khi vào từ danh sách (?edit=1)
  const searchParams = useSearchParams();
  const didAutoEdit = useRef(false);
  useEffect(() => {
    if (!didAutoEdit.current && iv && searchParams.get("edit") === "1" && can("hoa-don").edit) {
      didAutoEdit.current = true;
      openEditInvoice();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [iv, searchParams]);

  const payTotal = (["tien_mat", "the", "chuyen_khoan"] as const).reduce((s, m) => s + (Number(pay3[m]) || 0), 0);

  const openPayModal = (debt: number) => {
    setPay3({ tien_mat: String(debt), the: "", chuyen_khoan: "" });
    setOpenPay(true);
  };
  const pay = async () => {
    const payments = (["tien_mat", "the", "chuyen_khoan"] as const)
      .map((m) => ({ method: m, amount: Math.round(Number(pay3[m]) || 0) }))
      .filter((p) => p.amount > 0);
    if (payments.length === 0) {
      toast("Nhập số tiền thanh toán", "warning");
      return;
    }
    setBusy(true);
    try {
      const res = await apiPost<{ paid: number; debt: number }>(`/api/invoices/${id}/pay`, { payments });
      toast(res.debt > 0 ? `Đã thu ${formatVND(res.paid)} — còn nợ ${formatVND(res.debt)}` : "Đã thu đủ hoá đơn");
      setOpenPay(false);
      reload();
    } catch (e) {
      toast(e instanceof Error ? e.message : "Thanh toán thất bại", "warning");
    } finally {
      setBusy(false);
    }
  };

  if (loading) {
    return (
      <div className="grid min-h-[40vh] place-items-center">
        <Loader2 className="animate-spin text-[var(--muted)]" />
      </div>
    );
  }
  if (error || !iv) {
    return (
      <div>
        <BackLink href="/hoa-don">Về danh sách hoá đơn</BackLink>
        <Card className="p-8 text-center text-sm text-[var(--muted)]">{error ?? "Không tìm thấy hoá đơn."}</Card>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-4xl">
      <div className="print:hidden">
        <BackLink href="/hoa-don">Về danh sách hoá đơn</BackLink>
        <PageHeader
          title={`Hoá đơn ${iv.code}`}
          subtitle="Xem trước bản in — bấm In để in hoặc lưu PDF"
          actions={
            <div className="flex gap-2">
              {iv.debt > 0 && can("hoa-don").create && (
                <Button variant="outline" onClick={() => openPayModal(iv.debt)}>
                  <HandCoins size={16} /> Thanh toán
                </Button>
              )}
              {can("hoa-don").edit && (
                <Button variant="outline" onClick={openEditInvoice}>
                  <Pencil size={16} /> Sửa
                </Button>
              )}
              <Button onClick={() => window.print()}>
                <Printer size={16} /> In / Xuất PDF
              </Button>
            </div>
          }
        />
      </div>

      {/* Bản in */}
      <Card className="p-8 print:border-0 print:shadow-none">
        <div className="flex items-start justify-between border-b border-[var(--border)] pb-4">
          <div className="flex items-center gap-3">
            {store?.logoUrl && (
              // eslint-disable-next-line @next/next/no-img-element
              <img src={store.logoUrl} alt="Logo" className="h-14 w-14 object-contain" />
            )}
            <div>
              <div className="text-lg font-bold">{store?.name || "CỬA HÀNG LAPTOP"}</div>
              <div className="text-sm text-[var(--muted)]">
                {[store?.address, store?.phone].filter(Boolean).join(" · ") || "—"}
              </div>
            </div>
          </div>
          <div className="text-right">
            <div className="text-lg font-bold">{iv.kind === "sua_chua" ? "PHIẾU THANH TOÁN SỬA CHỮA" : "HOÁ ĐƠN BÁN HÀNG"}</div>
            <div className="font-mono text-sm text-[var(--muted)]">{iv.code}</div>
            <div className="text-sm text-[var(--muted)]">Ngày lập {formatDateTime(iv.date)}</div>
          </div>
        </div>

        <div className="py-4 text-sm">
          <div className="text-[var(--muted)]">Khách hàng</div>
          <div className="font-medium">{iv.customerName}</div>
          {iv.phone && <div className="text-[var(--muted)]">{iv.phone}</div>}
        </div>

        <table className="w-full border-collapse text-sm">
          <thead>
            <tr className="border-y border-[var(--border)] text-left text-[var(--muted)]">
              <th className="py-2">Sản phẩm</th>
              <th className="py-2 text-right">Thành tiền</th>
            </tr>
          </thead>
          <tbody>
            {iv.items.map((it) => (
              <tr key={it.id} className="border-b border-[var(--border)]">
                <td className="py-3">
                  <div className="font-medium">{it.name}</div>
                  {it.config && <div className="text-xs text-[var(--muted)]">{it.config}</div>}
                </td>
                <td className="py-3 text-right font-medium">{formatVND(it.price)}</td>
              </tr>
            ))}
          </tbody>
        </table>

        <div className="mt-4 flex justify-end">
          <div className="w-64 space-y-1 text-sm">
            <div className="flex justify-between">
              <span className="text-[var(--muted)]">Tạm tính ({iv.items.length} sản phẩm)</span>
              <span>{formatVND(iv.value)}</span>
            </div>
            <div className="flex justify-between border-t border-[var(--border)] pt-1 text-base font-bold">
              <span>Tổng cộng</span>
              <span>{formatVND(iv.value)}</span>
            </div>
            <div className="flex justify-between pt-1 text-[var(--muted)]">
              <span>Đã thanh toán</span>
              <span className="font-medium text-[var(--success)]">{formatVND(iv.paid)}</span>
            </div>
            {iv.debt > 0 && (
              <div className="flex justify-between font-semibold">
                <span>Còn nợ</span>
                <span className="text-[var(--danger)]">{formatVND(iv.debt)}</span>
              </div>
            )}
          </div>
        </div>

        {iv.kind !== "sua_chua" && (
          <div className="mt-6 rounded-lg border border-[var(--border)] p-4 text-[13px] leading-relaxed">
            <div className="mb-1.5 flex items-center gap-1.5 font-semibold">
              <ShieldCheck size={15} className="text-[var(--success)]" /> Chế độ bảo hành sản phẩm máy
            </div>
            <p className="font-semibold text-[var(--danger)]">Áp dụng đối với tất cả các máy bán ra tại cửa hàng.</p>
            <div className="mt-1 flex flex-wrap items-center gap-x-4 gap-y-1">
              <span>– Được bảo hành 6 tháng, máy lỗi đổi mới (LK), riêng ram, chip, bộ nhớ bảo hành 12 tháng.</span>
              <span className="inline-flex items-center gap-3">
                <span className="inline-flex items-center gap-1">
                  <span className="inline-block h-3.5 w-3.5 border border-current" /> Like new
                </span>
                <span className="inline-flex items-center gap-1">
                  <span className="inline-block h-3.5 w-3.5 border border-current" /> Laptop cũ
                </span>
              </span>
            </div>
            <p className="mt-1.5 font-medium">* Đối với Laptop cũ, Like new:</p>
            <p>
              – Được bao test trong 15 ngày đổi miễn phí (Không nhận hoàn trả lại sản phẩm). Sản phẩm phải có đầy đủ phụ
              kiện kèm theo và không bị trầy xước phát sinh.
            </p>
            <p>– Được bảo hành 3 tháng, máy lỗi đổi mới (LK), riêng ram, chip, bộ nhớ bảo hành 12 tháng.</p>
            <p className="mt-1.5 font-medium">* Đối với iPad:</p>
            <p>– Được bao test 7 ngày + bảo hành 3 tháng. Không nhận hoàn trả lại sản phẩm.</p>
            <p className="mt-2 font-bold text-[var(--danger)]">
              ĐẶC BIỆT: HỖ TRỢ CÀI ĐẶT PHẦN MỀM VÀ VỆ SINH MÁY CƠ BẢN MIỄN PHÍ TRỌN ĐỜI.
            </p>
            <p className="mt-2 italic">☞ Khách hàng xác nhận: Đã kiểm tra máy và đọc kĩ chế độ bảo hành.</p>
          </div>
        )}

        {store?.thankYou && (
          <p className="mt-6 text-center text-sm italic text-[var(--muted)]">{store.thankYou}</p>
        )}

        <div className="mt-8 grid grid-cols-2 gap-4 text-center text-sm text-[var(--muted)]">
          <div>
            <div>Khách hàng</div>
            <div className="mt-8 italic">(Ký, ghi rõ họ tên)</div>
          </div>
          <div>
            <div>Người bán hàng</div>
            <div className="mt-8 italic">(Ký, ghi rõ họ tên)</div>
          </div>
        </div>
      </Card>

      {/* Lịch sử thanh toán — không in */}
      <Card className="mt-4 p-4 print:hidden">
        <div className="mb-2 flex items-center justify-between">
          <h2 className="text-[13px] font-semibold uppercase tracking-wide text-[var(--muted)]">Lịch sử thanh toán</h2>
          {iv.debt > 0 && can("hoa-don").create && (
            <Button size="sm" onClick={() => openPayModal(iv.debt)}>
              <HandCoins size={15} /> Thu tiền
            </Button>
          )}
        </div>
        {iv.payments.length === 0 ? (
          <div className="py-3 text-center text-sm text-[var(--muted)]">Chưa có lần thu nào</div>
        ) : (
          <div className="divide-y divide-[var(--border)]">
            {iv.payments.map((p) => (
              <div key={p.id} className="flex items-center justify-between py-2 text-sm">
                <div className="flex items-center gap-2">
                  <span className="font-mono text-xs text-[var(--muted)]">{p.code}</span>
                  <span className="text-[var(--muted)]">{formatDateTime(p.date)}</span>
                  {p.method && (
                    <span className="inline-flex items-center gap-1 text-xs text-[var(--muted)]">
                      {p.method === "tien_mat" ? <Wallet size={12} /> : p.method === "the" ? <CreditCard size={12} /> : <Landmark size={12} />}
                      {PAY_METHOD_LABEL[p.method] ?? p.method}
                    </span>
                  )}
                </div>
                <span className="font-medium text-[var(--success)]">{formatVND(p.amount)}</span>
              </div>
            ))}
          </div>
        )}
      </Card>

      <Modal
        open={openPay}
        onClose={() => setOpenPay(false)}
        title="Thanh toán hoá đơn"
        footer={
          <>
            <Button variant="outline" onClick={() => setOpenPay(false)}>
              Huỷ
            </Button>
            <Button onClick={pay} disabled={busy}>
              {busy ? "Đang lưu..." : "Xác nhận thu"}
            </Button>
          </>
        }
      >
        <div className="space-y-3">
          <div className="rounded-lg bg-[var(--surface-2)] px-3 py-2 text-sm">
            Còn nợ: <span className="font-semibold text-[var(--danger)]">{formatVND(iv.debt)}</span>
          </div>
          <p className="text-xs text-[var(--muted)]">
            Nhập số tiền theo từng hình thức — có thể tách (VD: 5.000.000 chuyển khoản + 5.000.000 tiền mặt).
          </p>
          {([
            { k: "tien_mat", label: "Tiền mặt", icon: Wallet },
            { k: "the", label: "Thẻ", icon: CreditCard },
            { k: "chuyen_khoan", label: "Chuyển khoản", icon: Landmark },
          ] as const).map(({ k, label, icon: Icon }) => (
            <div key={k} className="flex items-center gap-3">
              <span className="flex w-32 shrink-0 items-center gap-1.5 text-sm">
                <Icon size={15} /> {label}
              </span>
              <MoneyInput value={pay3[k]} onChange={(v) => setPay3((s) => ({ ...s, [k]: v }))} placeholder="0" className="flex-1" />
            </div>
          ))}
          <div className="flex items-center justify-between border-t border-[var(--border)] pt-2 text-sm">
            <span className="text-[var(--muted)]">Tổng thu</span>
            <span className={`font-semibold ${payTotal > iv.debt ? "text-[var(--danger)]" : "text-[var(--success)]"}`}>
              {formatVND(payTotal)}
              {payTotal > iv.debt && <span className="ml-1 text-xs font-normal">(vượt còn nợ, sẽ chỉ thu tối đa {formatVND(iv.debt)})</span>}
            </span>
          </div>
        </div>
      </Modal>

      <Modal
        open={openEditInv}
        onClose={() => setOpenEditInv(false)}
        title={`Sửa hoá đơn ${iv.code}`}
        wide
        footer={
          <>
            <Button variant="outline" onClick={() => setOpenEditInv(false)}>
              Huỷ
            </Button>
            <Button onClick={saveEditInvoice} disabled={busy}>
              <Save size={16} /> {busy ? "Đang lưu..." : "Lưu thay đổi"}
            </Button>
          </>
        }
      >
        <div className="space-y-3">
          {iv.paid > 0 && (
            <p className="rounded-lg bg-[var(--warning-bg)] px-3 py-2 text-xs text-[var(--warning)]">
              Hoá đơn đã thu {formatVND(iv.paid)}. Sửa sản phẩm sẽ tính lại tổng; nếu tổng mới nhỏ hơn đã thu, phần đã thu sẽ được giữ tối đa bằng tổng mới.
            </p>
          )}
          <div className="grid grid-cols-2 gap-3">
            <Field label="Tên khách">
              <Input value={editCust.customerName} onChange={(e) => setEditCust((s) => ({ ...s, customerName: e.target.value }))} />
            </Field>
            <Field label="SĐT">
              <Input value={editCust.phone} onChange={(e) => setEditCust((s) => ({ ...s, phone: e.target.value }))} />
            </Field>
          </div>

          <div className="space-y-1.5">
            <p className="text-sm font-medium">Sản phẩm</p>
            {editItems.map((it, i) => (
              <div key={it.serial} className="flex items-center gap-2 rounded-lg border border-[var(--border)] px-3 py-2">
                <div className="min-w-0 flex-1">
                  <div className="truncate text-sm font-medium">{it.name}</div>
                  <div className="font-mono text-xs text-[var(--muted)]">{it.serial}</div>
                </div>
                <MoneyInput
                  value={String(it.price)}
                  onChange={(v) => setEditItems((s) => s.map((x, idx) => (idx === i ? { ...x, price: Number(v) || 0 } : x)))}
                  placeholder="Giá bán"
                  className="w-40"
                />
                <button
                  type="button"
                  onClick={() => setEditItems((s) => s.filter((_, idx) => idx !== i))}
                  className="text-[var(--muted)] hover:text-[var(--danger)]"
                >
                  <Trash2 size={15} />
                </button>
              </div>
            ))}
            {editItems.length === 0 && <p className="text-xs text-[var(--muted)]">Chưa có sản phẩm nào.</p>}
          </div>

          <div className="flex items-center gap-2">
            <Select
              value=""
              onChange={(e) => {
                if (e.target.value) addEditItem(e.target.value);
                e.target.value = "";
              }}
              className="flex-1"
            >
              <option value="">+ Thêm máy tồn kho…</option>
              {(machines ?? [])
                .filter((m) => m.status === "ton_kho" && !editItems.some((i) => i.serial === m.serial))
                .map((m) => (
                  <option key={m.id} value={m.serial}>
                    {m.serial} — {m.brand} {m.model} {m.salePrice ? `(${formatVND(m.salePrice)})` : ""}
                  </option>
                ))}
            </Select>
          </div>

          <div className="flex items-center justify-between border-t border-[var(--border)] pt-2 text-sm">
            <span className="text-[var(--muted)]">Tổng tiền mới</span>
            <span className="font-semibold">{formatVND(editTotal)}</span>
          </div>
        </div>
      </Modal>
    </div>
  );
}
