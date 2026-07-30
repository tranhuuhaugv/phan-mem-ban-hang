"use client";

import { use, useState } from "react";
import { Printer, ShieldCheck, Loader2, HandCoins, Wallet, CreditCard } from "lucide-react";
import { AccessGuard, BackLink } from "@/components/parts";
import { Button, PageHeader, Card, Field, Input } from "@/components/ui";
import { Modal } from "@/components/modal";
import { useToast } from "@/components/toast";
import { useRole } from "@/components/role-context";
import { useApi, apiPost } from "@/lib/api";
import { PAY_METHOD_LABEL } from "@/lib/types";
import { formatVND, formatDate, formatDateTime } from "@/lib/format";

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

function Inner({ id }: { id: string }) {
  const { data: iv, loading, error, reload } = useApi<InvoiceDetail>(`/api/invoices/${id}`);
  const { can } = useRole();
  const toast = useToast();
  const [openPay, setOpenPay] = useState(false);
  const [amount, setAmount] = useState("");
  const [method, setMethod] = useState<"tien_mat" | "chuyen_khoan">("tien_mat");
  const [busy, setBusy] = useState(false);

  const openPayModal = (debt: number) => {
    setAmount(String(debt));
    setMethod("tien_mat");
    setOpenPay(true);
  };
  const pay = async () => {
    const amt = Math.round(Number(amount) || 0);
    if (amt <= 0) {
      toast("Nhập số tiền thanh toán", "warning");
      return;
    }
    setBusy(true);
    try {
      const res = await apiPost<{ paid: number; debt: number }>(`/api/invoices/${id}/pay`, { amount: amt, method });
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
          <div>
            <div className="text-lg font-bold">CỬA HÀNG LAPTOP ABC</div>
            <div className="text-sm text-[var(--muted)]">123 Đường XYZ, Quận 1, TP.HCM · 0900 000 000</div>
          </div>
          <div className="text-right">
            <div className="text-lg font-bold">{iv.kind === "sua_chua" ? "PHIẾU THANH TOÁN SỬA CHỮA" : "HOÁ ĐƠN BÁN HÀNG"}</div>
            <div className="font-mono text-sm text-[var(--muted)]">{iv.code}</div>
            <div className="text-sm text-[var(--muted)]">Ngày lập {formatDateTime(iv.date)}</div>
          </div>
        </div>

        <div className="grid grid-cols-2 gap-4 py-4 text-sm">
          <div>
            <div className="text-[var(--muted)]">Khách hàng</div>
            <div className="font-medium">{iv.customerName}</div>
            {iv.phone && <div className="text-[var(--muted)]">{iv.phone}</div>}
          </div>
          <div className="text-right">
            <div className="text-[var(--muted)]">Nguồn</div>
            <div className="font-mono font-medium">
              {iv.repairCode ? `Phiếu sửa ${iv.repairCode}` : iv.orderCode ? `Đơn ${iv.orderCode}` : "Bán trực tiếp"}
            </div>
          </div>
        </div>

        <table className="w-full border-collapse text-sm">
          <thead>
            <tr className="border-y border-[var(--border)] text-left text-[var(--muted)]">
              <th className="py-2">Sản phẩm</th>
              <th className="py-2">Mã SP</th>
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
                <td className="py-3 font-mono text-xs">{it.serial || "—"}</td>
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

        {iv.warranties.length > 0 && (
          <div className="mt-6 rounded-lg border border-[var(--border)] p-3 text-sm">
            <div className="mb-1 flex items-center gap-1.5 font-medium">
              <ShieldCheck size={15} className="text-[var(--success)]" /> Phiếu bảo hành
            </div>
            {iv.warranties.map((w) => (
              <div key={w.id} className="text-[var(--muted)]">
                Mã SP {w.serial || "—"} · {w.months} tháng kể từ {formatDate(w.startDate)}
                {w.condition ? ` · ${w.condition}` : ""}
              </div>
            ))}
          </div>
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
                  <span className="text-[var(--muted)]">{formatDate(p.date)}</span>
                  {p.method && (
                    <span className="inline-flex items-center gap-1 text-xs text-[var(--muted)]">
                      {p.method === "chuyen_khoan" ? <CreditCard size={12} /> : <Wallet size={12} />}
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
          <Field label="Số tiền thu (₫)" hint="Tối đa bằng số còn nợ; thu một phần cũng được">
            <Input type="number" value={amount} onChange={(e) => setAmount(e.target.value)} placeholder="0" autoFocus />
          </Field>
          <Field label="Hình thức">
            <div className="grid grid-cols-2 gap-2">
              {([
                { k: "tien_mat", label: "Tiền mặt", icon: Wallet },
                { k: "chuyen_khoan", label: "Chuyển khoản", icon: CreditCard },
              ] as const).map(({ k, label, icon: Icon }) => {
                const active = method === k;
                return (
                  <button
                    key={k}
                    type="button"
                    onClick={() => setMethod(k)}
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
      </Modal>
    </div>
  );
}
