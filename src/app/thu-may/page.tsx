"use client";

import { useState } from "react";
import { Plus, CheckCircle2 } from "lucide-react";
import { AccessGuard, DetailRow } from "@/components/parts";
import { Button, PageHeader, Table, Tr, Td, Field, Input, Select, SearchInput } from "@/components/ui";
import { Modal } from "@/components/modal";
import { BuyStatusBadge } from "@/components/status";
import { useToast } from "@/components/toast";
import { useRole } from "@/components/role-context";
import { useApi, apiPost } from "@/lib/api";
import { formatVND, formatDateTime } from "@/lib/format";
import { BUY_STATUS_LABEL, type BuyReceipt, type BuyReceiptStatus } from "@/lib/types";

export default function Page() {
  return (
    <AccessGuard menu="thu-may">
      <Inner />
    </AccessGuard>
  );
}

function Inner() {
  const { can } = useRole();
  const perm = can("thu-may");
  const toast = useToast();
  const { data, loading, reload } = useApi<BuyReceipt[]>("/api/buy-receipts");
  const [approve, setApprove] = useState<BuyReceipt | null>(null);
  const [serial, setSerial] = useState("");
  const [busy, setBusy] = useState(false);
  const [q, setQ] = useState("");
  const [status, setStatus] = useState<BuyReceiptStatus | "all">("all");

  const rows = (data ?? []).filter((b) => {
    if (status !== "all" && b.status !== status) return false;
    return `${b.code} ${b.customerName} ${b.phone} ${b.model} ${b.config}`
      .toLowerCase()
      .includes(q.trim().toLowerCase());
  });

  const doApprove = async () => {
    if (!approve) return;
    setBusy(true);
    try {
      const res = await apiPost<{ machineSerial: string }>(`/api/buy-receipts/${approve.id}/approve`, { serial });
      toast(`Đã duyệt ${approve.code} — máy ${res.machineSerial} được đẩy vào kho`);
      setApprove(null);
      reload();
    } catch (e) {
      toast(e instanceof Error ? e.message : "Duyệt thất bại", "warning");
    } finally {
      setBusy(false);
    }
  };

  return (
    <div>
      <PageHeader
        title="Thu máy"
        subtitle="Phiếu mua lại / thu cũ máy từ khách — duyệt phiếu để tự đẩy máy vào kho"
        actions={
          perm.create && (
            <Button href="/thu-may/tao">
              <Plus size={16} /> Tạo phiếu thu máy
            </Button>
          )
        }
      />

      <div className="mb-4 flex flex-wrap items-center gap-2">
        <SearchInput value={q} onChange={setQ} placeholder="Tìm mã phiếu, khách hàng, SĐT, model..." />
        <Select value={status} onChange={(e) => setStatus(e.target.value as BuyReceiptStatus | "all")} className="w-48">
          <option value="all">Tất cả trạng thái</option>
          {Object.entries(BUY_STATUS_LABEL).map(([k, v]) => (
            <option key={k} value={k}>
              {v}
            </option>
          ))}
        </Select>
      </div>

      <Table head={["Mã phiếu", "Khách hàng", "Máy", "Giá thu", "Ngày", "Trạng thái", ""]}>
        {rows.map((b) => (
          <Tr key={b.id}>
            <Td className="font-mono text-xs font-medium">{b.code}</Td>
            <Td>
              <div className="font-medium">{b.customerName}</div>
              <div className="text-xs text-[var(--muted)]">{b.phone}</div>
            </Td>
            <Td>
              <div>{b.model}</div>
              <div className="text-xs text-[var(--muted)]">{b.config}</div>
            </Td>
            <Td className="whitespace-nowrap font-medium">{formatVND(b.price)}</Td>
            <Td className="whitespace-nowrap text-xs text-[var(--muted)]">{formatDateTime(b.date)}</Td>
            <Td>
              <BuyStatusBadge status={b.status} />
            </Td>
            <Td>
              <div className="flex justify-end">
                {b.status === "cho_duyet" && perm.approve ? (
                  <Button
                    size="sm"
                    onClick={() => {
                      setApprove(b);
                      setSerial("");
                    }}
                  >
                    <CheckCircle2 size={15} /> Duyệt
                  </Button>
                ) : b.status === "cho_duyet" ? (
                  <span className="text-xs text-[var(--muted)]">Chờ Admin/Quản lý duyệt</span>
                ) : b.serial ? (
                  <span className="font-mono text-xs text-[var(--primary)]">{b.serial}</span>
                ) : null}
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
        open={!!approve}
        onClose={() => setApprove(null)}
        title={`Duyệt phiếu ${approve?.code ?? ""}`}
        footer={
          <>
            <Button variant="outline" onClick={() => setApprove(null)}>
              Huỷ
            </Button>
            <Button onClick={doApprove} disabled={busy}>
              <CheckCircle2 size={16} /> {busy ? "Đang duyệt..." : "Duyệt & đẩy vào kho"}
            </Button>
          </>
        }
      >
        {approve && (
          <div>
            <DetailRow label="Khách hàng">{approve.customerName}</DetailRow>
            <DetailRow label="Máy">{approve.model}</DetailRow>
            <DetailRow label="Cấu hình">{approve.config}</DetailRow>
            <DetailRow label="Tình trạng">{approve.condition}</DetailRow>
            <DetailRow label="Giá thu">{formatVND(approve.price)}</DetailRow>
            <div className="mt-4">
              <Field label="Gán Mã SP cho máy" hint="Bỏ trống = tự sinh mã kế tiếp. Duyệt = xác nhận chi tiền + tạo máy trong kho.">
                <Input value={serial} onChange={(e) => setSerial(e.target.value)} placeholder="VD: SP0009 (tuỳ chọn)" />
              </Field>
            </div>
          </div>
        )}
      </Modal>
    </div>
  );
}
