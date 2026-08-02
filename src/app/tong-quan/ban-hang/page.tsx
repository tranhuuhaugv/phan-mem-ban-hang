"use client";

import { useState } from "react";
import { Trophy } from "lucide-react";
import { AccessGuard } from "@/components/parts";
import {
  PageHeader,
  Table,
  Tr,
  Td,
  FootTd,
  Badge,
  FilterBar,
  DateRange,
  ClearFilterButton,
  EmptyState,
} from "@/components/ui";
import { useApi } from "@/lib/api";
import { formatVND } from "@/lib/format";
import { ROLE_LABEL, type Role } from "@/lib/types";

interface SellerRow {
  sellerId: string | null;
  name: string;
  role: Role | null;
  count: number;
  revenue: number;
  paid: number;
}

const ROLE_TONE: Record<Role, "purple" | "info" | "muted"> = {
  admin: "purple",
  manager: "info",
  staff: "muted",
};

export default function Page() {
  return (
    <AccessGuard menu="tong-quan">
      <Inner />
    </AccessGuard>
  );
}

function Inner() {
  const [from, setFrom] = useState("");
  const [to, setTo] = useState("");

  const params = new URLSearchParams();
  if (from) params.set("from", from);
  if (to) params.set("to", to);
  const qs = params.toString();
  const { data, loading } = useApi<SellerRow[]>(`/api/reports/sales-by-seller${qs ? `?${qs}` : ""}`);
  const rows = data ?? [];

  const totalCount = rows.reduce((s, r) => s + r.count, 0);
  const totalRev = rows.reduce((s, r) => s + r.revenue, 0);
  const totalPaid = rows.reduce((s, r) => s + r.paid, 0);

  return (
    <div>
      <PageHeader title="Báo cáo bán hàng" subtitle="Số hoá đơn & doanh thu theo từng người tạo hoá đơn" />

      <FilterBar>
        <DateRange from={from} to={to} onFrom={setFrom} onTo={setTo} />
        <ClearFilterButton
          show={!!(from || to)}
          onClick={() => {
            setFrom("");
            setTo("");
          }}
        />
      </FilterBar>

      {rows.length === 0 ? (
        <EmptyState text={loading ? "Đang tải dữ liệu..." : "Chưa có hoá đơn nào trong kỳ"} />
      ) : (
        <Table
          head={["#", "Người bán", "Vai trò", "Số hoá đơn", "Doanh thu", "Đã thu"]}
          foot={
            <tr>
              <FootTd />
              <FootTd className="text-xs uppercase tracking-wide text-[var(--muted)]">Tổng {rows.length} người</FootTd>
              <FootTd />
              <FootTd>{totalCount}</FootTd>
              <FootTd className="whitespace-nowrap">{formatVND(totalRev)}</FootTd>
              <FootTd className="whitespace-nowrap text-[var(--success)]">{formatVND(totalPaid)}</FootTd>
            </tr>
          }
        >
          {rows.map((r, i) => (
            <Tr key={r.sellerId ?? "none"}>
              <Td className="text-[var(--muted)]">
                {i === 0 ? <Trophy size={15} className="text-[#eab308]" /> : i + 1}
              </Td>
              <Td className="font-medium">{r.name}</Td>
              <Td>{r.role ? <Badge tone={ROLE_TONE[r.role]}>{ROLE_LABEL[r.role]}</Badge> : <span className="text-xs text-[var(--muted)]">—</span>}</Td>
              <Td className="font-semibold">{r.count}</Td>
              <Td className="whitespace-nowrap font-medium">{formatVND(r.revenue)}</Td>
              <Td className="whitespace-nowrap text-sm text-[var(--success)]">{formatVND(r.paid)}</Td>
            </Tr>
          ))}
        </Table>
      )}
    </div>
  );
}
