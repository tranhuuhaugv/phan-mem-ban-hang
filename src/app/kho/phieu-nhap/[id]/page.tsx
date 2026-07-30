"use client";

import { use } from "react";
import Link from "next/link";
import { Loader2, Package, Wallet, CreditCard } from "lucide-react";
import { AccessGuard, BackLink, DetailRow, SectionCard } from "@/components/parts";
import { PageHeader, Card, Badge, Table, Tr, Td } from "@/components/ui";
import { MachineStatusBadge } from "@/components/status";
import { useApi } from "@/lib/api";
import { PAY_METHOD_LABEL, type StockInDetail } from "@/lib/types";
import { formatVND, formatDateTime } from "@/lib/format";

export default function Page({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  return (
    <AccessGuard menu="nhap-kho">
      <Inner id={id} />
    </AccessGuard>
  );
}

function Inner({ id }: { id: string }) {
  const { data, loading, error } = useApi<StockInDetail>(`/api/stock-ins/${id}`);

  if (loading) {
    return (
      <div className="grid min-h-[40vh] place-items-center">
        <Loader2 className="animate-spin text-[var(--muted)]" />
      </div>
    );
  }
  if (error || !data) {
    return (
      <div>
        <BackLink href="/kho/phieu-nhap">Về danh sách phiếu nhập</BackLink>
        <Card className="p-8 text-center text-sm text-[var(--muted)]">{error ?? "Không tìm thấy phiếu nhập."}</Card>
      </div>
    );
  }

  const r = data;

  return (
    <div>
      <BackLink href="/kho/phieu-nhap">Về danh sách phiếu nhập</BackLink>
      <PageHeader title={`Phiếu nhập ${r.code}`} subtitle={`Ngày ${formatDateTime(r.date)}`} />

      <div className="grid items-start gap-4 lg:grid-cols-3">
        <SectionCard title="Thông tin phiếu">
          <DetailRow label="Mã phiếu">
            <span className="font-mono">{r.code}</span>
          </DetailRow>
          <DetailRow label="Nhà cung cấp">
            {r.supplierId ? (
              <Link href={`/nha-cung-cap/${r.supplierId}`} className="text-[var(--primary)] hover:underline">
                {r.supplierName}
              </Link>
            ) : (
              r.supplierName ?? "—"
            )}
          </DetailRow>
          <DetailRow label="Chi nhánh">{r.branchName ? <Badge tone="info">{r.branchName}</Badge> : "—"}</DetailRow>
          <DetailRow label="Ngày nhập">{formatDateTime(r.date)}</DetailRow>
          {r.note && <DetailRow label="Ghi chú">{r.note}</DetailRow>}
        </SectionCard>

        <SectionCard title="Thanh toán">
          <div className="space-y-2 text-sm">
            <div className="flex items-center justify-between">
              <span className="text-[var(--muted)]">Tổng tiền</span>
              <span className="font-medium">{formatVND(r.total)}</span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-[var(--muted)]">Đã thanh toán</span>
              <span className="font-medium text-[var(--success)]">{formatVND(r.paid)}</span>
            </div>
            <div className="flex items-center justify-between border-t border-[var(--border)] pt-2">
              <span className="text-[var(--muted)]">Còn nợ NCC</span>
              <span className={`font-semibold ${r.debt > 0 ? "text-[var(--danger)]" : "text-[var(--success)]"}`}>
                {r.debt > 0 ? formatVND(r.debt) : "Không nợ"}
              </span>
            </div>
            {r.paid > 0 && (
              <div className="flex items-center gap-1.5 pt-1 text-xs text-[var(--muted)]">
                {r.payMethod === "chuyen_khoan" ? <CreditCard size={13} /> : <Wallet size={13} />}
                Hình thức: {r.payMethod ? (PAY_METHOD_LABEL[r.payMethod] ?? r.payMethod) : "—"}
              </div>
            )}
          </div>
        </SectionCard>

        <Card className="p-4">
          <div className="text-xs text-[var(--muted)]">Số máy trong phiếu</div>
          <div className="mt-1 text-2xl font-bold text-[var(--info)]">{r.items.length}</div>
          <div className="mt-2 text-xs text-[var(--muted)]">Các máy đã được đưa vào kho khi tạo phiếu.</div>
        </Card>
      </div>

      <div className="mt-4">
        <SectionCard title={`Máy trong phiếu (${r.items.length})`}>
          <Table head={["Mã SP", "Tên sản phẩm", "Giá nhập", "Giá bán", "Trạng thái"]}>
            {r.items.map((m) => (
              <Tr key={m.id}>
                <Td>
                  <Link href={`/kho/${m.serial}`} className="font-mono text-xs font-medium text-[var(--primary)] hover:underline">
                    {m.serial}
                  </Link>
                </Td>
                <Td>
                  <div className="flex items-center gap-1.5 font-medium">
                    <Package size={13} className="text-[var(--muted)]" /> {m.name}
                  </div>
                  {m.category && <div className="text-xs text-[var(--muted)]">{m.category}</div>}
                </Td>
                <Td className="whitespace-nowrap font-medium">{formatVND(m.purchasePrice)}</Td>
                <Td className="whitespace-nowrap text-sm">{m.salePrice != null ? formatVND(m.salePrice) : "—"}</Td>
                <Td>
                  <MachineStatusBadge status={m.status} />
                </Td>
              </Tr>
            ))}
          </Table>
        </SectionCard>
      </div>
    </div>
  );
}
