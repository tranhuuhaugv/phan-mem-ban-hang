"use client";

import { useState } from "react";
import { Plus, Eye, CheckCircle2, ReceiptText } from "lucide-react";
import { AccessGuard, DetailRow } from "@/components/parts";
import { Button, PageHeader, Table, Tr, Td, Select, SearchInput, Input, Field, Textarea } from "@/components/ui";
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
  const [note, setNote] = useState("");
  const [q, setQ] = useState("");
  const [busy, setBusy] = useState(false);

  const rows = (data ?? []).filter((r) => {
    if (status !== "all" && r.status !== status) return false;
    return `${r.code} ${r.serial} ${r.model} ${r.customerName ?? ""} ${r.errorDesc} ${r.technician ?? ""}`
      .toLowerCase()
      .includes(q.trim().toLowerCase());
  });

  const openView = (r: Repair) => {
    setView(r);
    setActualCost(r.actualCost ? String(r.actualCost) : "");
    setNote(r.note ?? "");
  };

  const complete = async () => {
    if (!view) return;
    setBusy(true);
    try {
      await apiPatch(`/api/repairs/${view.id}`, {
        status: "hoan_tat",
        actualCost: Number(actualCost) || view.estCost,
        note,
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
        <SearchInput value={q} onChange={setQ} placeholder="Tìm mã phiếu, tên máy, khách, lỗi, KTV..." />
        <Select value={status} onChange={(e) => setStatus(e.target.value as RepairStatus | "all")} className="w-52">
          <option value="all">Tất cả trạng thái</option>
          {Object.entries(REPAIR_STATUS_LABEL).map(([k, v]) => (
            <option key={k} value={k}>
              {v}
            </option>
          ))}
        </Select>
      </div>

      <Table head={["Mã phiếu", "Máy", "Khách hàng", "Lỗi", "KTV nhận", "CP dự kiến", "Ngày nhận", "Trạng thái", ""]}>
        {rows.map((r) => (
          <Tr key={r.id}>
            <Td className="font-mono text-xs font-medium">{r.code}</Td>
            <Td>
              <div className="font-medium">{r.model || "—"}</div>
              <div className="font-mono text-xs text-[var(--muted)]">{r.inStock ? r.serial : "Máy khách"}</div>
            </Td>
            <Td>
              <div>{r.customerName || "—"}</div>
              {r.customerPhone && <div className="text-xs text-[var(--muted)]">{r.customerPhone}</div>}
            </Td>
            <Td className="max-w-[200px] text-xs text-[var(--muted)]">{r.errorDesc}</Td>
            <Td className="whitespace-nowrap text-sm">{r.technician || "—"}</Td>
            <Td className="whitespace-nowrap">{formatVND(r.estCost)}</Td>
            <Td className="whitespace-nowrap text-xs text-[var(--muted)]">{formatDateTime(r.receiveDate)}</Td>
            <Td>
              <RepairStatusBadge status={r.status} />
            </Td>
            <Td>
              <div className="flex justify-end">
                <Button size="sm" variant="ghost" onClick={() => openView(r)}>
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
          view ? (
            <>
              <Button variant="outline" onClick={() => setView(null)}>
                Đóng
              </Button>
              {can("hoa-don").create && (
                <Button variant="outline" href={`/hoa-don/tao?repair=${view.id}`}>
                  <ReceiptText size={15} /> Tạo phiếu thanh toán
                </Button>
              )}
              {view.status !== "hoan_tat" && can("sua-chua").edit && (
                <Button onClick={complete} disabled={busy}>
                  <CheckCircle2 size={15} /> {busy ? "Đang lưu..." : "Hoàn tất & trả máy"}
                </Button>
              )}
            </>
          ) : undefined
        }
      >
        {view && (
          <div>
            <DetailRow label="Máy">{view.model || "—"}</DetailRow>
            <DetailRow label={view.inStock ? "Mã SP (trong kho)" : "Nguồn máy"}>
              <span className="font-mono">{view.inStock ? view.serial : "Máy khách mang tới"}</span>
            </DetailRow>
            <DetailRow label="Khách hàng">{view.customerName ?? "—"}</DetailRow>
            <DetailRow label="Số điện thoại">{view.customerPhone ?? "—"}</DetailRow>
            <DetailRow label="Mô tả lỗi">{view.errorDesc}</DetailRow>
            <DetailRow label="KTV nhận / phụ trách">{view.technician ?? "Chưa phân"}</DetailRow>
            <DetailRow label="Chi phí dự kiến">{formatVND(view.estCost)}</DetailRow>
            <DetailRow label="Chi phí thực tế">{view.actualCost ? formatVND(view.actualCost) : "—"}</DetailRow>
            <DetailRow label="Ngày nhận">{formatDateTime(view.receiveDate)}</DetailRow>
            <DetailRow label="Ngày trả">{view.returnDate ? formatDateTime(view.returnDate) : "—"}</DetailRow>
            <DetailRow label="Trạng thái">
              <RepairStatusBadge status={view.status} />
            </DetailRow>
            {view.note && <DetailRow label="Ghi chú / linh kiện">{view.note}</DetailRow>}

            {view.status !== "hoan_tat" && can("sua-chua").edit && (
              <div className="mt-4 space-y-3 rounded-lg bg-[var(--surface-2)] p-3">
                <p className="text-xs font-medium text-[var(--muted)]">Hoàn tất & trả máy</p>
                <Field label="Chi phí thực tế (₫)" hint="Bỏ trống = lấy chi phí dự kiến">
                  <Input type="number" value={actualCost} onChange={(e) => setActualCost(e.target.value)} placeholder={String(view.estCost)} />
                </Field>
                <Field label="Ghi chú (linh kiện đã thay, tình trạng...)">
                  <Textarea rows={2} value={note} onChange={(e) => setNote(e.target.value)} placeholder="VD: Đã thay bàn phím + vệ sinh máy" />
                </Field>
              </div>
            )}
          </div>
        )}
      </Modal>
    </div>
  );
}
