"use client";

import { useState } from "react";
import { Plus, Eye, CheckCircle2, ReceiptText, Wallet, CreditCard, Landmark, Trash2 } from "lucide-react";
import { AccessGuard, DetailRow } from "@/components/parts";
import { Button, PageHeader, Table, Tr, Td, FootTd, SearchInput, MoneyInput, Field, Textarea, FilterBar, FilterSelect, DateRange, ClearFilterButton, inDateRange } from "@/components/ui";
import { Modal, ConfirmDialog } from "@/components/modal";
import { RepairStatusBadge } from "@/components/status";
import { useToast } from "@/components/toast";
import { useRole } from "@/components/role-context";
import { useApi, apiPatch, apiDelete } from "@/lib/api";
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
  const [branch, setBranch] = useState("all");
  const [view, setView] = useState<Repair | null>(null);
  const [actualCost, setActualCost] = useState("");
  const [note, setNote] = useState("");
  const [amountPaid, setAmountPaid] = useState("");
  const [payMethod, setPayMethod] = useState<"tien_mat" | "the" | "chuyen_khoan">("tien_mat");
  const [del, setDel] = useState<Repair | null>(null);
  const [q, setQ] = useState("");
  const [fromDate, setFromDate] = useState("");
  const [toDate, setToDate] = useState("");
  const [busy, setBusy] = useState(false);

  const branches = Array.from(new Set((data ?? []).map((r) => r.branchName).filter(Boolean) as string[])).sort();
  const rows = (data ?? []).filter((r) => {
    if (status !== "all" && r.status !== status) return false;
    if (branch !== "all" && r.branchName !== branch) return false;
    if (!inDateRange(r.receiveDate, fromDate, toDate)) return false;
    return `${r.code} ${r.serial} ${r.model} ${r.customerName ?? ""} ${r.errorDesc} ${r.technician ?? ""}`
      .toLowerCase()
      .includes(q.trim().toLowerCase());
  });
  const sumEst = rows.reduce((s, r) => s + r.estCost, 0);

  const openView = (r: Repair) => {
    setView(r);
    setActualCost(r.actualCost ? String(r.actualCost) : "");
    setNote(r.note ?? "");
    setAmountPaid("");
    setPayMethod("tien_mat");
  };

  const complete = async () => {
    if (!view) return;
    setBusy(true);
    try {
      const cost = Number(actualCost) || view.estCost;
      const paid = Math.min(cost, Math.max(0, Number(amountPaid) || 0));
      await apiPatch(`/api/repairs/${view.id}`, {
        status: "hoan_tat",
        actualCost: cost,
        note,
        amountPaid: paid,
        payMethod,
      });
      toast(`${view.code} hoàn tất${paid > 0 ? ` — đã thu ${formatVND(paid)}` : ""} — máy trở về Tồn kho`);
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

      <FilterBar search={<SearchInput value={q} onChange={setQ} placeholder="Tìm mã phiếu, tên máy, khách, lỗi, KTV..." className="max-w-xs" />}>
        <DateRange from={fromDate} to={toDate} onFrom={setFromDate} onTo={setToDate} />
        <FilterSelect value={status} onChange={(e) => setStatus(e.target.value as RepairStatus | "all")}>
          <option value="all">Tất cả trạng thái</option>
          {Object.entries(REPAIR_STATUS_LABEL).map(([k, v]) => (
            <option key={k} value={k}>
              {v}
            </option>
          ))}
        </FilterSelect>
        {branches.length > 0 && (
          <FilterSelect value={branch} onChange={(e) => setBranch(e.target.value)}>
            <option value="all">Tất cả chi nhánh</option>
            {branches.map((b) => (
              <option key={b} value={b}>
                {b}
              </option>
            ))}
          </FilterSelect>
        )}
        <ClearFilterButton
          show={!!(fromDate || toDate || status !== "all" || branch !== "all")}
          onClick={() => {
            setFromDate("");
            setToDate("");
            setStatus("all");
            setBranch("all");
          }}
        />
      </FilterBar>

      <Table
        head={["Mã phiếu", "Máy", "Khách hàng", "Lỗi", "KTV nhận", "CP dự kiến", "Ngày nhận", "Trạng thái", ""]}
        foot={
          rows.length > 0 ? (
            <tr>
              <FootTd className="text-xs uppercase tracking-wide text-[var(--muted)]">Tổng {rows.length} phiếu</FootTd>
              <FootTd />
              <FootTd />
              <FootTd />
              <FootTd />
              <FootTd className="whitespace-nowrap">{formatVND(sumEst)}</FootTd>
              <FootTd />
              <FootTd />
              <FootTd />
            </tr>
          ) : undefined
        }
      >
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
              {can("sua-chua").remove && (
                <Button variant="outline" className="text-[var(--danger)]" onClick={() => { setDel(view); setView(null); }}>
                  <Trash2 size={15} /> Xoá
                </Button>
              )}
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
            <DetailRow label="Chi nhánh">{view.branchName ?? "—"}</DetailRow>
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
                  <MoneyInput value={actualCost} onChange={setActualCost} placeholder={String(view.estCost)} />
                </Field>
                <Field label="Mặt hàng / linh kiện đã thay">
                  <Textarea rows={2} value={note} onChange={(e) => setNote(e.target.value)} placeholder="VD: Đã thay bàn phím + vệ sinh máy" />
                </Field>
                <Field label="Số tiền khách trả (₫)" hint="Thu tiền khi trả máy (bỏ trống nếu chưa thu)">
                  <div className="flex gap-2">
                    <MoneyInput value={amountPaid} onChange={setAmountPaid} placeholder="0" className="flex-1" />
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      onClick={() => setAmountPaid(String(Number(actualCost) || view.estCost))}
                    >
                      Trả đủ
                    </Button>
                  </div>
                </Field>
                <div className="grid grid-cols-3 gap-2">
                  {([
                    { k: "tien_mat", label: "Tiền mặt", icon: Wallet },
                    { k: "the", label: "Thẻ", icon: CreditCard },
                    { k: "chuyen_khoan", label: "Chuyển khoản", icon: Landmark },
                  ] as const).map(({ k, label, icon: Icon }) => {
                    const active = payMethod === k;
                    return (
                      <button
                        key={k}
                        type="button"
                        onClick={() => setPayMethod(k)}
                        className={`flex items-center justify-center gap-2 rounded-xl border px-3 py-2 text-sm font-medium transition ${
                          active ? "border-[var(--primary)] bg-[var(--primary)]/10 text-[var(--primary)]" : "border-[var(--border)] hover:bg-[var(--surface-2)]"
                        }`}
                      >
                        <Icon size={16} /> {label}
                      </button>
                    );
                  })}
                </div>
              </div>
            )}
          </div>
        )}
      </Modal>

      <ConfirmDialog
        open={!!del}
        onClose={() => setDel(null)}
        onConfirm={async () => {
          if (!del) return;
          try {
            await apiDelete(`/api/repairs/${del.id}`);
            toast(`Đã xoá phiếu ${del.code}`);
            reload();
          } catch (e) {
            toast(e instanceof Error ? e.message : "Xoá thất bại", "warning");
          }
        }}
        title="Xoá phiếu sửa"
        message={del ? `Xoá phiếu sửa ${del.code}? Máy (nếu trong kho) trả về tồn kho, phiếu thu tiền sửa bị xoá.` : ""}
        confirmText="Xoá"
        danger
      />
    </div>
  );
}
