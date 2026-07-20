"use client";

import { use } from "react";
import { Printer, ShieldCheck, Loader2 } from "lucide-react";
import { AccessGuard, BackLink } from "@/components/parts";
import { Button, PageHeader, Card } from "@/components/ui";
import { useApi } from "@/lib/api";
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
  date: string;
  items: { id: string; serial: string; name: string; config: string; price: number }[];
  warranties: { id: string; serial: string; months: number; condition: string; startDate: string }[];
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
  const { data: iv, loading, error } = useApi<InvoiceDetail>(`/api/invoices/${id}`);

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
            <Button onClick={() => window.print()}>
              <Printer size={16} /> In / Xuất PDF
            </Button>
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
    </div>
  );
}
