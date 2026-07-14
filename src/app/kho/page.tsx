"use client";

import { useMemo, useState } from "react";
import { Plus, Search, Trash2, Pencil, History } from "lucide-react";
import { Button, PageHeader, Table, Tr, Td, Input, Select, Badge } from "@/components/ui";
import { Modal } from "@/components/modal";
import { MachineHistory } from "@/components/machine-history";
import { MachineStatusBadge } from "@/components/status";
import { useRole } from "@/components/role-context";
import { machines, machineText } from "@/lib/mock-data";
import { CONDITION_LABEL, MACHINE_STATUS_LABEL, type Machine, type MachineStatus } from "@/lib/types";
import { formatVND, formatDateTime } from "@/lib/format";

export default function KhoPage() {
  const { can } = useRole();
  const perm = can("kho");
  const [q, setQ] = useState("");
  const [status, setStatus] = useState<MachineStatus | "all">("all");
  const [brand, setBrand] = useState<string>("all");
  const [history, setHistory] = useState<Machine | null>(null);

  const brands = useMemo(() => Array.from(new Set(machines.map((m) => m.brand))).sort(), []);

  const rows = useMemo(() => {
    return machines.filter((m) => {
      if (status !== "all" && m.status !== status) return false;
      if (brand !== "all" && m.brand !== brand) return false;
      if (q && !machineText(m).includes(q.trim().toLowerCase())) return false;
      return true;
    });
  }, [q, status, brand]);

  return (
    <div>
      <PageHeader
        title="Kho sản phẩm"
        subtitle={`${machines.length} máy trong hệ thống · lọc theo model / trạng thái / Mã SP`}
        actions={
          perm.create && (
            <Button href="/kho/them">
              <Plus size={16} /> Thêm máy mới
            </Button>
          )
        }
      />

      <div className="mb-4 flex flex-wrap items-center gap-2">
        <div className="relative flex-1 min-w-[220px]">
          <Search size={16} className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-[var(--muted)]" />
          <Input
            placeholder="Tìm theo Mã SP, tên, cấu hình..."
            value={q}
            onChange={(e) => setQ(e.target.value)}
            className="pl-9"
          />
        </div>
        <Select value={brand} onChange={(e) => setBrand(e.target.value)} className="w-40">
          <option value="all">Tất cả hãng</option>
          {brands.map((b) => (
            <option key={b} value={b}>
              {b}
            </option>
          ))}
        </Select>
        <Select value={status} onChange={(e) => setStatus(e.target.value as MachineStatus | "all")} className="w-48">
          <option value="all">Tất cả trạng thái</option>
          {Object.entries(MACHINE_STATUS_LABEL).map(([k, v]) => (
            <option key={k} value={k}>
              {v}
            </option>
          ))}
        </Select>
      </div>

      <Table head={["Mã SP", "Model", "Cấu hình", "Loại", "Giá nhập", "Ngày nhập", "Trạng thái", ""]}>
        {rows.map((m) => (
          <Tr key={m.id}>
            <Td>
              <span className="font-mono text-xs font-medium">{m.serial}</span>
            </Td>
            <Td>
              <div className="font-medium">{m.model}</div>
              <div className="text-xs text-[var(--muted)]">{m.brand}</div>
            </Td>
            <Td>
              <div className="text-xs text-[var(--muted)]">
                {m.cpu} · {m.ram} · {m.storage}
              </div>
              <div className="text-xs text-[var(--muted)]">{m.screen}</div>
            </Td>
            <Td>
              <Badge tone="muted">{CONDITION_LABEL[m.condition]}</Badge>
            </Td>
            <Td className="whitespace-nowrap font-medium">{formatVND(m.purchasePrice)}</Td>
            <Td className="whitespace-nowrap text-xs text-[var(--muted)]">{formatDateTime(m.createdAt)}</Td>
            <Td>
              <MachineStatusBadge status={m.status} />
            </Td>
            <Td>
              <div className="flex items-center justify-end gap-1">
                <Button size="sm" variant="ghost" onClick={() => setHistory(m)}>
                  <History size={15} />
                </Button>
                {perm.edit && (
                  <Button size="sm" variant="ghost">
                    <Pencil size={15} />
                  </Button>
                )}
                {perm.remove && (
                  <Button size="sm" variant="ghost" className="text-[var(--danger)]">
                    <Trash2 size={15} />
                  </Button>
                )}
              </div>
            </Td>
          </Tr>
        ))}
        {rows.length === 0 && (
          <Tr>
            <Td className="text-center text-[var(--muted)]">
              <div className="py-6">Không tìm thấy máy nào phù hợp</div>
            </Td>
          </Tr>
        )}
      </Table>

      <Modal
        open={!!history}
        onClose={() => setHistory(null)}
        title={`Lịch sử máy ${history?.serial ?? ""}`}
        wide
      >
        {history && (
          <div>
            <div className="mb-4 rounded-lg bg-[var(--surface-2)] p-3 text-sm">
              <div className="font-medium">
                {history.brand} {history.model}
              </div>
              <div className="text-xs text-[var(--muted)]">
                {history.cpu} · {history.ram} · {history.storage} · {history.screen}
              </div>
            </div>
            <MachineHistory serial={history.serial} />
          </div>
        )}
      </Modal>
    </div>
  );
}
