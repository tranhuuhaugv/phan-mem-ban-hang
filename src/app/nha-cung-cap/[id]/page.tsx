"use client";

import { use } from "react";
import { Loader2, Package, Wallet, CreditCard } from "lucide-react";
import Link from "next/link";
import { AccessGuard, BackLink, SectionCard } from "@/components/parts";
import { PageHeader, Card, Badge, Table, Tr, Td } from "@/components/ui";
import { MachineStatusBadge } from "@/components/status";
import { useApi } from "@/lib/api";
import { PAY_METHOD_LABEL, type MachineStatus } from "@/lib/types";
import { formatVND, formatDate } from "@/lib/format";

interface SupplierDetail {
  supplier: { id: string; name: string; phone?: string; address?: string; note?: string; debt: number };
  stats: { machineCount: number; totalPurchase: number; paidTotal: number; debt: number };
  imports: {
    id: string;
    serial: string;
    name: string;
    category?: string;
    purchasePrice: number;
    salePrice?: number;
    branchName?: string;
    status: MachineStatus;
    date: string;
  }[];
  payments: { id: string; code: string; amount: number; method?: string; content: string; date: string }[];
}

export default function Page({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  return (
    <AccessGuard menu="nha-cung-cap">
      <Inner id={id} />
    </AccessGuard>
  );
}

function Inner({ id }: { id: string }) {
  const { data, loading, error } = useApi<SupplierDetail>(`/api/suppliers/${id}`);

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
        <BackLink href="/nha-cung-cap">Về danh sách nhà cung cấp</BackLink>
        <Card className="p-8 text-center text-sm text-[var(--muted)]">{error ?? "Không tìm thấy nhà cung cấp."}</Card>
      </div>
    );
  }

  const { supplier: s, stats, imports, payments } = data;

  const cards = [
    { label: "Số máy đã nhập", value: `${stats.machineCount}`, tone: "text-[var(--info)]" },
    { label: "Tổng giá trị nhập", value: formatVND(stats.totalPurchase), tone: "" },
    { label: "Đã thanh toán", value: formatVND(stats.paidTotal), tone: "text-[var(--success)]" },
    { label: "Công nợ hiện tại", value: formatVND(stats.debt), tone: stats.debt > 0 ? "text-[var(--danger)]" : "" },
  ];

  return (
    <div>
      <BackLink href="/nha-cung-cap">Về danh sách nhà cung cấp</BackLink>
      <PageHeader
        title={s.name}
        subtitle={[s.phone && `ĐT: ${s.phone}`, s.address].filter(Boolean).join(" · ") || "Nhà cung cấp"}
      />

      <div className="mb-4 grid grid-cols-2 gap-3 lg:grid-cols-4">
        {cards.map((c) => (
          <Card key={c.label} className="p-4">
            <div className="text-xs text-[var(--muted)]">{c.label}</div>
            <div className={`mt-1 text-lg font-semibold ${c.tone}`}>{c.value}</div>
          </Card>
        ))}
      </div>

      <div className="grid items-start gap-4 xl:grid-cols-2">
        <SectionCard title={`Lịch sử nhập hàng (${imports.length})`}>
          <Table head={["Ngày", "Mã SP", "Tên sản phẩm", "Giá nhập", "Chi nhánh", "Trạng thái"]}>
            {imports.map((m) => (
              <Tr key={m.id}>
                <Td className="whitespace-nowrap text-xs text-[var(--muted)]">{formatDate(m.date)}</Td>
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
                <Td>{m.branchName ? <Badge tone="info">{m.branchName}</Badge> : <span className="text-xs text-[var(--muted)]">—</span>}</Td>
                <Td>
                  <MachineStatusBadge status={m.status} />
                </Td>
              </Tr>
            ))}
            {imports.length === 0 && (
              <Tr>
                <Td className="text-center text-[var(--muted)]">
                  <div className="py-6">Chưa có lịch sử nhập hàng từ NCC này</div>
                </Td>
              </Tr>
            )}
          </Table>
        </SectionCard>

        <SectionCard title="Công nợ & thanh toán">
          <div className="mb-3 flex items-center justify-between rounded-xl border border-[var(--border)] bg-[var(--surface-2)] px-4 py-3">
            <div className="flex items-center gap-2 text-sm">
              <Wallet size={16} className="text-[var(--muted)]" /> Công nợ hiện tại
            </div>
            <div className={`text-lg font-semibold ${stats.debt > 0 ? "text-[var(--danger)]" : "text-[var(--success)]"}`}>
              {stats.debt > 0 ? formatVND(stats.debt) : "Không nợ"}
            </div>
          </div>

          <Table head={["Ngày", "Mã phiếu", "Nội dung", "Hình thức", "Số tiền"]}>
            {payments.map((p) => (
              <Tr key={p.id}>
                <Td className="whitespace-nowrap text-xs text-[var(--muted)]">{formatDate(p.date)}</Td>
                <Td className="font-mono text-xs">{p.code}</Td>
                <Td className="text-sm">{p.content}</Td>
                <Td>
                  {p.method ? (
                    <span className="inline-flex items-center gap-1 text-xs">
                      {p.method === "chuyen_khoan" ? <CreditCard size={13} /> : <Wallet size={13} />}
                      {PAY_METHOD_LABEL[p.method] ?? p.method}
                    </span>
                  ) : (
                    <span className="text-xs text-[var(--muted)]">—</span>
                  )}
                </Td>
                <Td className="whitespace-nowrap font-medium text-[var(--success)]">{formatVND(p.amount)}</Td>
              </Tr>
            ))}
            {payments.length === 0 && (
              <Tr>
                <Td className="text-center text-[var(--muted)]">
                  <div className="py-6">Chưa có lần thanh toán nào</div>
                </Td>
              </Tr>
            )}
          </Table>
        </SectionCard>
      </div>
    </div>
  );
}
