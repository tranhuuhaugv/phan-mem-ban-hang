"use client";

import { use } from "react";
import { Printer, ShieldCheck } from "lucide-react";
import { AccessGuard, BackLink } from "@/components/parts";
import { Button, PageHeader, Card } from "@/components/ui";
import { invoices, orders, machines, warranties } from "@/lib/mock-data";
import { formatVND, formatDate } from "@/lib/format";

export default function Page({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  return (
    <AccessGuard menu="hoa-don">
      <Inner id={id} />
    </AccessGuard>
  );
}

function Inner({ id }: { id: string }) {
  const iv = invoices.find((i) => i.id === id);
  if (!iv) {
    return (
      <div>
        <BackLink href="/hoa-don">Về danh sách hoá đơn</BackLink>
        <Card className="p-8 text-center text-sm text-[var(--muted)]">Không tìm thấy hoá đơn.</Card>
      </div>
    );
  }
  const order = orders.find((o) => o.code === iv.orderCode);
  const machine = order ? machines.find((m) => m.serial === order.serial) : undefined;
  const warranty = warranties.find((w) => w.invoiceCode === iv.code);

  return (
    <div className="max-w-3xl">
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
            <div className="text-lg font-bold">HOÁ ĐƠN BÁN HÀNG</div>
            <div className="font-mono text-sm text-[var(--muted)]">{iv.code}</div>
            <div className="text-sm text-[var(--muted)]">Ngày {formatDate(iv.date)}</div>
          </div>
        </div>

        <div className="grid grid-cols-2 gap-4 py-4 text-sm">
          <div>
            <div className="text-[var(--muted)]">Khách hàng</div>
            <div className="font-medium">{iv.customerName}</div>
            {order && <div className="text-[var(--muted)]">{order.phone}</div>}
          </div>
          <div className="text-right">
            <div className="text-[var(--muted)]">Đơn hàng</div>
            <div className="font-mono font-medium">{iv.orderCode}</div>
          </div>
        </div>

        <table className="w-full border-collapse text-sm">
          <thead>
            <tr className="border-y border-[var(--border)] text-left text-[var(--muted)]">
              <th className="py-2">Sản phẩm</th>
              <th className="py-2">Serial</th>
              <th className="py-2 text-right">Thành tiền</th>
            </tr>
          </thead>
          <tbody>
            <tr className="border-b border-[var(--border)]">
              <td className="py-3">
                <div className="font-medium">{order?.model ?? "Laptop"}</div>
                {machine && (
                  <div className="text-xs text-[var(--muted)]">
                    {machine.cpu} · {machine.ram} · {machine.storage}
                  </div>
                )}
              </td>
              <td className="py-3 font-mono text-xs">{order?.serial ?? "—"}</td>
              <td className="py-3 text-right font-medium">{formatVND(iv.value)}</td>
            </tr>
          </tbody>
        </table>

        <div className="mt-4 flex justify-end">
          <div className="w-56 space-y-1 text-sm">
            <div className="flex justify-between">
              <span className="text-[var(--muted)]">Tạm tính</span>
              <span>{formatVND(iv.value)}</span>
            </div>
            <div className="flex justify-between border-t border-[var(--border)] pt-1 text-base font-bold">
              <span>Tổng cộng</span>
              <span>{formatVND(iv.value)}</span>
            </div>
          </div>
        </div>

        {warranty && (
          <div className="mt-6 rounded-lg border border-[var(--border)] p-3 text-sm">
            <div className="mb-1 flex items-center gap-1.5 font-medium">
              <ShieldCheck size={15} className="text-[var(--success)]" /> Phiếu bảo hành
            </div>
            <div className="text-[var(--muted)]">
              Serial {warranty.serial} · {warranty.months} tháng kể từ {formatDate(warranty.startDate)}
            </div>
            <div className="text-[var(--muted)]">Điều kiện: {warranty.condition}</div>
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
