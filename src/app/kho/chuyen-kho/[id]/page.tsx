"use client";

import { use, useState } from "react";
import { useRouter } from "next/navigation";
import { Loader2, Package, ArrowRight, PackageCheck, Trash2 } from "lucide-react";
import { AccessGuard, BackLink, DetailRow, SectionCard } from "@/components/parts";
import { PageHeader, Card, Badge, Button, Field, Textarea, Table, Tr, Td } from "@/components/ui";
import { Modal, ConfirmDialog } from "@/components/modal";
import { useToast } from "@/components/toast";
import { useRole } from "@/components/role-context";
import { useApi, apiPost, apiDelete } from "@/lib/api";
import { TRANSFER_STATUS_LABEL, type StockTransferDetail, type TransferStatus } from "@/lib/types";
import { formatDateTime } from "@/lib/format";

const STATUS_TONE: Record<TransferStatus, "warning" | "success" | "muted"> = {
  dang_chuyen: "warning",
  da_nhan: "success",
  huy: "muted",
};

export default function Page({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  return (
    <AccessGuard menu="chuyen-kho">
      <Inner id={id} />
    </AccessGuard>
  );
}

function Inner({ id }: { id: string }) {
  const router = useRouter();
  const { data, loading, error, reload } = useApi<StockTransferDetail>(`/api/stock-transfers/${id}`);
  const { can } = useRole();
  const toast = useToast();
  const [openReceive, setOpenReceive] = useState(false);
  const [receiverNote, setReceiverNote] = useState("");
  const [del, setDel] = useState(false);
  const [busy, setBusy] = useState(false);

  const receive = async () => {
    setBusy(true);
    try {
      await apiPost(`/api/stock-transfers/${id}/receive`, { receiverNote });
      toast("Đã nhận hàng — máy đã chuyển sang chi nhánh nhận");
      setOpenReceive(false);
      reload();
    } catch (e) {
      toast(e instanceof Error ? e.message : "Nhận hàng thất bại", "warning");
    } finally {
      setBusy(false);
    }
  };

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
        <BackLink href="/kho/chuyen-kho">Về danh sách phiếu chuyển</BackLink>
        <Card className="p-8 text-center text-sm text-[var(--muted)]">{error ?? "Không tìm thấy phiếu chuyển."}</Card>
      </div>
    );
  }

  const r = data;
  const canReceive = r.status === "dang_chuyen" && can("chuyen-kho").edit;

  return (
    <div>
      <BackLink href="/kho/chuyen-kho">Về danh sách phiếu chuyển</BackLink>
      <PageHeader
        title={`Phiếu chuyển ${r.code}`}
        subtitle={`Ngày ${formatDateTime(r.date)}`}
        actions={
          <div className="flex gap-2">
            {canReceive && (
              <Button onClick={() => setOpenReceive(true)}>
                <PackageCheck size={16} /> Nhận hàng
              </Button>
            )}
            {can("chuyen-kho").remove && (
              <Button variant="outline" className="text-[var(--danger)]" onClick={() => setDel(true)}>
                <Trash2 size={16} /> Xoá phiếu
              </Button>
            )}
          </div>
        }
      />

      <div className="grid items-start gap-4 lg:grid-cols-2">
        <SectionCard title="Thông tin phiếu">
          <DetailRow label="Mã phiếu">
            <span className="font-mono">{r.code}</span>
          </DetailRow>
          <DetailRow label="Tuyến chuyển">
            <span className="flex items-center gap-1.5">
              {r.fromBranch ?? "—"} <ArrowRight size={14} className="text-[var(--muted)]" />{" "}
              <span className="font-medium">{r.toBranch ?? "—"}</span>
            </span>
          </DetailRow>
          <DetailRow label="Trạng thái">
            <Badge tone={STATUS_TONE[r.status]}>{TRANSFER_STATUS_LABEL[r.status]}</Badge>
          </DetailRow>
          <DetailRow label="Người tạo">{r.createdByName ?? "—"}</DetailRow>
          <DetailRow label="Ghi chú bên gửi">{r.senderNote || "—"}</DetailRow>
        </SectionCard>

        <SectionCard title="Nhận hàng">
          <DetailRow label="Ngày nhận">{r.receivedAt ? formatDateTime(r.receivedAt) : "Chưa nhận"}</DetailRow>
          <DetailRow label="Người nhận">{r.receivedByName ?? "—"}</DetailRow>
          <DetailRow label="Ghi chú bên nhận">{r.receiverNote || "—"}</DetailRow>
          {canReceive && (
            <div className="mt-3">
              <Button onClick={() => setOpenReceive(true)}>
                <PackageCheck size={16} /> Xác nhận nhận hàng
              </Button>
            </div>
          )}
        </SectionCard>
      </div>

      <div className="mt-4">
        <SectionCard title={`Máy trong phiếu (${r.items.length})`}>
          <Table head={["#", "Mã hàng", "Tên hàng", "Ghi chú sản phẩm"]}>
            {r.items.map((it, i) => (
              <Tr key={it.id}>
                <Td className="text-[var(--muted)]">{i + 1}</Td>
                <Td>
                  <span className="font-mono text-xs">{it.serial}</span>
                </Td>
                <Td>
                  <div className="flex items-center gap-1.5 font-medium">
                    <Package size={13} className="text-[var(--muted)]" /> {it.name}
                  </div>
                </Td>
                <Td className="text-sm text-[var(--muted)]">{it.note || "—"}</Td>
              </Tr>
            ))}
          </Table>
        </SectionCard>
      </div>

      <Modal
        open={openReceive}
        onClose={() => setOpenReceive(false)}
        title="Xác nhận nhận hàng"
        footer={
          <>
            <Button variant="outline" onClick={() => setOpenReceive(false)}>
              Huỷ
            </Button>
            <Button onClick={receive} disabled={busy}>
              {busy ? "Đang lưu..." : "Xác nhận nhận"}
            </Button>
          </>
        }
      >
        <div className="space-y-3">
          <div className="rounded-lg bg-[var(--surface-2)] px-3 py-2 text-sm">
            Nhận {r.items.length} máy về <span className="font-semibold">{r.toBranch}</span>. Máy sẽ chuyển sang chi nhánh nhận.
          </div>
          <Field label="Ghi chú bên nhận">
            <Textarea rows={2} value={receiverNote} onChange={(e) => setReceiverNote(e.target.value)} placeholder="VD: Đã nhận đủ, máy nguyên vẹn..." />
          </Field>
        </div>
      </Modal>

      <ConfirmDialog
        open={del}
        onClose={() => setDel(false)}
        onConfirm={async () => {
          try {
            await apiDelete(`/api/stock-transfers/${id}`);
            toast(`Đã xoá phiếu chuyển ${r.code}`);
            router.push("/kho/chuyen-kho");
          } catch (e) {
            toast(e instanceof Error ? e.message : "Xoá thất bại", "warning");
          }
        }}
        title="Xoá phiếu chuyển"
        message={`Xoá phiếu ${r.code}?${r.status === "da_nhan" ? " Máy sẽ được đưa về chi nhánh gửi." : ""}`}
        confirmText="Xoá"
        danger
      />
    </div>
  );
}
