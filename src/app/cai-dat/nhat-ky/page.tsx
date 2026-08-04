"use client";

import { useState } from "react";
import { AccessGuard } from "@/components/parts";
import {
  PageHeader,
  Table,
  Tr,
  Td,
  Badge,
  SearchInput,
  FilterBar,
  FilterSelect,
  DateRange,
  ClearFilterButton,
  EmptyState,
} from "@/components/ui";
import { useApi } from "@/lib/api";
import { formatDateTime } from "@/lib/format";
import { ROLE_LABEL, type Role } from "@/lib/types";

interface LogRow {
  id: string;
  at: string;
  userName: string;
  role?: Role;
  action: string;
  entity: string;
  code?: string;
  detail?: string;
}

const ENTITY_LABEL: Record<string, string> = {
  invoice: "Hoá đơn",
  cashflow: "Thu / Chi",
  stockin: "Phiếu nhập",
  order: "Đơn hàng",
  repair: "Sửa chữa",
  buy: "Thu máy",
  machine: "Sản phẩm",
};
const ACTION_LABEL: Record<string, string> = {
  create: "Tạo",
  update: "Sửa",
  delete: "Xoá",
  pay: "Thu tiền",
  approve: "Duyệt",
  status: "Đổi trạng thái",
};
const ACTION_TONE: Record<string, "success" | "info" | "danger" | "warning" | "purple" | "muted"> = {
  create: "success",
  update: "info",
  delete: "danger",
  pay: "success",
  approve: "purple",
  status: "warning",
};

export default function Page() {
  return (
    <AccessGuard menu="cai-dat">
      <Inner />
    </AccessGuard>
  );
}

function Inner() {
  const [q, setQ] = useState("");
  const [entity, setEntity] = useState("all");
  const [action, setAction] = useState("all");
  const [from, setFrom] = useState("");
  const [to, setTo] = useState("");

  const params = new URLSearchParams();
  if (entity !== "all") params.set("entity", entity);
  if (action !== "all") params.set("action", action);
  if (from) params.set("from", from);
  if (to) params.set("to", to);
  if (q.trim()) params.set("q", q.trim());
  const qs = params.toString();
  const { data, loading } = useApi<LogRow[]>(`/api/audit-logs${qs ? `?${qs}` : ""}`);
  const rows = data ?? [];

  return (
    <div>
      <PageHeader title="Nhật ký thao tác" subtitle="Ai đã tạo / sửa / xoá / thu tiền các phiếu, hoá đơn — 300 dòng gần nhất" />

      <FilterBar search={<SearchInput value={q} onChange={setQ} placeholder="Tìm người, mã phiếu, nội dung..." className="max-w-xs" />}>
        <DateRange from={from} to={to} onFrom={setFrom} onTo={setTo} />
        <FilterSelect value={entity} onChange={(e) => setEntity(e.target.value)}>
          <option value="all">Tất cả đối tượng</option>
          {Object.entries(ENTITY_LABEL).map(([k, v]) => (
            <option key={k} value={k}>
              {v}
            </option>
          ))}
        </FilterSelect>
        <FilterSelect value={action} onChange={(e) => setAction(e.target.value)}>
          <option value="all">Tất cả thao tác</option>
          {Object.entries(ACTION_LABEL).map(([k, v]) => (
            <option key={k} value={k}>
              {v}
            </option>
          ))}
        </FilterSelect>
        <ClearFilterButton
          show={!!(from || to || q || entity !== "all" || action !== "all")}
          onClick={() => {
            setFrom("");
            setTo("");
            setQ("");
            setEntity("all");
            setAction("all");
          }}
        />
      </FilterBar>

      {rows.length === 0 ? (
        <EmptyState text={loading ? "Đang tải dữ liệu..." : "Chưa có nhật ký nào"} />
      ) : (
        <Table head={["Thời gian", "Người thực hiện", "Vai trò", "Thao tác", "Đối tượng", "Mã", "Chi tiết"]}>
          {rows.map((r) => (
            <Tr key={r.id}>
              <Td className="whitespace-nowrap text-xs text-[var(--muted)]">{formatDateTime(r.at)}</Td>
              <Td className="font-medium">{r.userName}</Td>
              <Td className="text-xs text-[var(--muted)]">{r.role ? ROLE_LABEL[r.role] : "—"}</Td>
              <Td>
                <Badge tone={ACTION_TONE[r.action] ?? "muted"}>{ACTION_LABEL[r.action] ?? r.action}</Badge>
              </Td>
              <Td className="text-sm">{ENTITY_LABEL[r.entity] ?? r.entity}</Td>
              <Td className="whitespace-nowrap font-mono text-xs">{r.code ?? "—"}</Td>
              <Td className="text-sm text-[var(--muted)]">{r.detail ?? "—"}</Td>
            </Tr>
          ))}
        </Table>
      )}
    </div>
  );
}
