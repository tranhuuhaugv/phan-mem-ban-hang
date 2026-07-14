"use client";

import { useState } from "react";
import { Plus, Eye } from "lucide-react";
import { AccessGuard, DetailRow } from "@/components/parts";
import { Button, PageHeader, Table, Tr, Td, Select } from "@/components/ui";
import { Modal } from "@/components/modal";
import { RepairStatusBadge } from "@/components/status";
import { useRole } from "@/components/role-context";
import { repairs } from "@/lib/mock-data";
import { REPAIR_STATUS_LABEL, type Repair, type RepairStatus } from "@/lib/types";
import { formatVND, formatDate } from "@/lib/format";

export default function Page() {
  return (
    <AccessGuard menu="sua-chua">
      <Inner />
    </AccessGuard>
  );
}

function Inner() {
  const { can } = useRole();
  const [status, setStatus] = useState<RepairStatus | "all">("all");
  const [view, setView] = useState<Repair | null>(null);
  const rows = repairs.filter((r) => status === "all" || r.status === status);

  return (
    <div>
      <PageHeader
        title="Sửa chữa"
        subtitle="Ghi nhận máy gửi sửa, kỹ thuật viên phụ trách và chi phí"
        actions={
          can("sua-chua").create && (
            <Button href="/sua-chua/tao">
              <Plus size={16} /> Tạo phiếu sửa chữa
            </Button>
          )
        }
      />

      <div className="mb-4">
        <Select value={status} onChange={(e) => setStatus(e.target.value as RepairStatus | "all")} className="w-52">
          <option value="all">Tất cả trạng thái</option>
          {Object.entries(REPAIR_STATUS_LABEL).map(([k, v]) => (
            <option key={k} value={k}>
              {v}
            </option>
          ))}
        </Select>
      </div>

      <Table head={["Mã phiếu", "Serial / Máy", "Lỗi", "CP dự kiến", "Ngày nhận", "Trạng thái", ""]}>
        {rows.map((r) => (
          <Tr key={r.id}>
            <Td className="font-mono text-xs font-medium">{r.code}</Td>
            <Td>
              <div className="font-mono text-xs">{r.serial}</div>
              <div className="text-xs text-[var(--muted)]">{r.model}</div>
            </Td>
            <Td className="max-w-[220px] text-xs text-[var(--muted)]">{r.errorDesc}</Td>
            <Td className="whitespace-nowrap">{formatVND(r.estCost)}</Td>
            <Td className="whitespace-nowrap text-[var(--muted)]">{formatDate(r.receiveDate)}</Td>
            <Td>
              <RepairStatusBadge status={r.status} />
            </Td>
            <Td>
              <div className="flex justify-end">
                <Button size="sm" variant="ghost" onClick={() => setView(r)}>
                  <Eye size={15} />
                </Button>
              </div>
            </Td>
          </Tr>
        ))}
      </Table>

      <Modal open={!!view} onClose={() => setView(null)} title={`Phiếu sửa ${view?.code ?? ""}`}>
        {view && (
          <div>
            <DetailRow label="Serial">
              <span className="font-mono">{view.serial}</span>
            </DetailRow>
            <DetailRow label="Máy">{view.model}</DetailRow>
            <DetailRow label="Mô tả lỗi">{view.errorDesc}</DetailRow>
            <DetailRow label="Kỹ thuật viên">{view.technician ?? "Chưa phân"}</DetailRow>
            <DetailRow label="Chi phí dự kiến">{formatVND(view.estCost)}</DetailRow>
            <DetailRow label="Chi phí thực tế">{view.actualCost ? formatVND(view.actualCost) : "—"}</DetailRow>
            <DetailRow label="Ngày nhận">{formatDate(view.receiveDate)}</DetailRow>
            <DetailRow label="Ngày trả">{view.returnDate ? formatDate(view.returnDate) : "—"}</DetailRow>
            <DetailRow label="Trạng thái">
              <RepairStatusBadge status={view.status} />
            </DetailRow>
          </div>
        )}
      </Modal>
    </div>
  );
}
