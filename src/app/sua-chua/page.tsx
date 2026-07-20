"use client";

import { useState } from "react";
import { Plus, Eye, CheckCircle2 } from "lucide-react";
import { AccessGuard, DetailRow } from "@/components/parts";
import { Button, PageHeader, Table, Tr, Td, Select, SearchInput, Input, Field } from "@/components/ui";
import { Modal } from "@/components/modal";
import { RepairStatusBadge } from "@/components/status";
import { useToast } from "@/components/toast";
import { useRole } from "@/components/role-context";
import { useApi, apiPatch } from "@/lib/api";
import { REPAIR_STATUS_LABEL, type Repair, type RepairStatus } from "@/lib/types";
import { formatVND, formatDateTime } from "@/lib/format";

export default function Page() {
  return (
    <AccessGuard menu="sua-chua">
      <Inner />
    </AccessGuard>
  );
}

function Inner() {
  const { can } = useRole();
  const toast = useToast();
  const { data, loading, reload } = useApi<Repair[]>("/api/repairs");
  const [status, setStatus] = useState<RepairStatus | "all">("all");
  const [view, setView] = useState<Repair | null>(null);
  const [actualCost, setActualCost] = useState("");
  const [q, setQ] = useState("");
  const [busy, setBusy] = useState(false);

  const rows = (data ?? []).filter((r) => {
    if (status !== "all" && r.status !== status) return false;
    return `${r.code} ${r.serial} ${r.model} ${r.errorDesc} ${r.technician ?? ""}`
      .toLowerCase()
      .includes(q.trim().toLowerCase());
  });

  const complete = async () => {
    if (!view) return;
    setBusy(true);
    try {
      await apiPatch(`/api/repairs/${view.id}`, {
        status: "hoan_tat",
        actualCost: Number(actualCost) || view.estCost,
      });
      toast(`${view.code} hoàn tất — máy trở về Tồn kho`);
      setView(null);
      reload();
    } catch (e) {
      toast(e instanceof Error ? e.message : "Cập nhật thất bại", "warning");
    } finally {
      setBusy(false);
    }
  };

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

      <div className="mb-4 flex flex-wrap items-center gap-2">
        <SearchInput value={q} onChange={setQ} placeholder="Tìm mã phiếu, Mã SP, model, lỗi, KTV..." />
        <Select value={status} onChange={(e) => setStatus(e.target.value as RepairStatus | "all")} className="w-52">
          <option value="all">Tất cả trạng thái</option>
          {Object.entries(REPAIR_STATUS_LABEL).map(([k, v]) => (
            <option key={k} value={k}>
              {v}
            </option>
          ))}
        </Select>
      </div>

      <Table head={["Mã phiếu", "Mã SP / Máy", "Lỗi", "CP dự kiến", "Ngày nhận", "Trạng thái", ""]}>
        {rows.map((r) => (
          <Tr key={r.id}>
            <Td className="font-mono text-xs font-medium">{r.code}</Td>
            <Td>
              <div className="font-mono text-xs">{r.serial || "(máy khách)"}</div>
              <div className="text-xs text-[var(--muted)]">{r.model}</div>
            </Td>
            <Td className="max-w-[220px] text-xs text-[var(--muted)]">{r.errorDesc}</Td>
            <Td className="whitespace-nowrap">{formatVND(r.estCost)}</Td>
            <Td className="whitespace-nowrap text-xs text-[var(--muted)]">{formatDateTime(r.receiveDate)}</Td>
            <Td>
              <RepairStatusBadge status={r.status} />
            </Td>
            <Td>
              <div className="flex justify-end">
                <Button
                  size="sm"
                  variant="ghost"
                  onClick={() => {
                    setView(r);
                    setActualCost(r.actualCost ? String(r.actualCost) : "");
                  }}
                >
                  <Eye size={15} />
                </Button>
              </div>
            </Td>
          </Tr>
        ))}
        {rows.length === 0 && (
          <Tr>
            <Td className="text-center text-[var(--muted)]">
              <div className="py-6">{loading ? "Đang tải dữ liệu..." : "Chưa có phiếu nào"}</div>
            </Td>
          </Tr>
        )}
      </Table>

      <Modal
        open={!!view}
        onClose={() => setView(null)}
        title={`Phiếu sửa ${view?.code ?? ""}`}
        footer={
          view && view.status !== "hoan_tat" && can("sua-chua").edit ? (
            <>
              <Button variant="outline" onClick={() => setView(null)}>
                Đóng
              </Button>
              <Button onClick={complete} disabled={busy}>
                <CheckCircle2 size={15} /> {busy ? "Đang lưu..." : "Hoàn tất & trả máy"}
              </Button>
            </>
          ) : undefined
        }
      >
        {view && (
          <div>
            <DetailRow label="Mã SP">
              <span className="font-mono">{view.serial || "(máy khách mang tới)"}</span>
            </DetailRow>
            <DetailRow label="Máy">{view.model || "—"}</DetailRow>
            <DetailRow label="Mô tả lỗi">{view.errorDesc}</DetailRow>
            <DetailRow label="Kỹ thuật viên">{view.technician ?? "Chưa phân"}</DetailRow>
            <DetailRow label="Chi phí dự kiến">{formatVND(view.estCost)}</DetailRow>
            <DetailRow label="Chi phí thực tế">{view.actualCost ? formatVND(view.actualCost) : "—"}</DetailRow>
            <DetailRow label="Ngày nhận">{formatDateTime(view.receiveDate)}</DetailRow>
            <DetailRow label="Ngày trả">{view.returnDate ? formatDateTime(view.returnDate) : "—"}</DetailRow>
            <DetailRow label="Trạng thái">
              <RepairStatusBadge status={view.status} />
            </DetailRow>
            {view.status !== "hoan_tat" && can("sua-chua").edit && (
              <div className="mt-4">
                <Field label="Chi phí thực tế (₫)" hint="Bỏ trống = lấy chi phí dự kiến">
                  <Input type="number" value={actualCost} onChange={(e) => setActualCost(e.target.value)} placeholder={String(view.estCost)} />
                </Field>
              </div>
            )}
          </div>
        )}
      </Modal>
    </div>
  );
}
