"use client";

import { use, useState, useEffect, useRef } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { Loader2, Package, Wallet, CreditCard, Landmark, Trash2, Pencil, Save, Plus, X } from "lucide-react";
import { AccessGuard, BackLink, DetailRow, SectionCard } from "@/components/parts";
import { PageHeader, Card, Badge, Table, Tr, Td, Button, Field, Input, MoneyInput, Textarea } from "@/components/ui";
import { ConfirmDialog, Modal } from "@/components/modal";
import { MachineStatusBadge } from "@/components/status";
import { useToast } from "@/components/toast";
import { useRole } from "@/components/role-context";
import { useApi, apiDelete, apiPatch } from "@/lib/api";
import { PAY_METHOD_LABEL, type StockInDetail } from "@/lib/types";
import { formatVND, formatDateTime } from "@/lib/format";

export default function Page({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  return (
    <AccessGuard menu="nhap-kho">
      <Inner id={id} />
    </AccessGuard>
  );
}

function Inner({ id }: { id: string }) {
  const router = useRouter();
  const toast = useToast();
  const { can } = useRole();
  const { data, loading, error, reload } = useApi<StockInDetail>(`/api/stock-ins/${id}`);
  const [del, setDel] = useState(false);
  const [edit, setEdit] = useState(false);
  const [busy, setBusy] = useState(false);
  const [keepItems, setKeepItems] = useState<{ id: string; serial: string; name: string; category: string; purchasePrice: string; salePrice: string; status: string }[]>([]);
  const [addLines, setAddLines] = useState<{ name: string; category: string; purchasePrice: string; salePrice: string; quantity: string }[]>([]);
  const [ef, setEf] = useState({ note: "", paid: "" });

  const openEdit = () => {
    if (!data) return;
    setKeepItems(
      data.items.map((m) => ({
        id: m.id,
        serial: m.serial,
        name: m.name,
        category: m.category ?? "",
        purchasePrice: String(m.purchasePrice ?? ""),
        salePrice: m.salePrice != null ? String(m.salePrice) : "",
        status: m.status,
      })),
    );
    setAddLines([]);
    setEf({ note: data.note ?? "", paid: String(data.paid ?? "") });
    setEdit(true);
  };
  const removeKeep = (id: string, status: string) => {
    if (status !== "ton_kho") return toast("Máy đã bán/xuất, không xoá khỏi phiếu được", "warning");
    setKeepItems((s) => s.filter((k) => k.id !== id));
  };
  const editTotal =
    keepItems.reduce((s, k) => s + (Number(k.purchasePrice) || 0), 0) +
    addLines.reduce((s, a) => s + (Number(a.purchasePrice) || 0) * (Number(a.quantity) || 1), 0);
  const saveEdit = async () => {
    setBusy(true);
    try {
      await apiPatch(`/api/stock-ins/${id}`, {
        keep: keepItems.map((k) => ({
          id: k.id,
          name: k.name.trim(),
          category: k.category.trim() || undefined,
          purchasePrice: Number(k.purchasePrice) || 0,
          salePrice: k.salePrice === "" ? null : Number(k.salePrice) || 0,
        })),
        add: addLines
          .filter((a) => a.name.trim())
          .map((a) => ({
            name: a.name.trim(),
            category: a.category.trim() || undefined,
            purchasePrice: Number(a.purchasePrice) || 0,
            salePrice: a.salePrice === "" ? null : Number(a.salePrice) || 0,
            quantity: Number(a.quantity) || 1,
          })),
        note: ef.note.trim() || null,
        paid: Number(ef.paid) || 0,
      });
      toast("Đã cập nhật phiếu nhập");
      setEdit(false);
      reload();
    } catch (e) {
      toast(e instanceof Error ? e.message : "Cập nhật thất bại", "warning");
    } finally {
      setBusy(false);
    }
  };

  const searchParams = useSearchParams();
  const didAutoEdit = useRef(false);
  useEffect(() => {
    if (!didAutoEdit.current && data && searchParams.get("edit") === "1" && can("nhap-kho").edit) {
      didAutoEdit.current = true;
      openEdit();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [data, searchParams]);

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
        <BackLink href="/kho/phieu-nhap">Về danh sách phiếu nhập</BackLink>
        <Card className="p-8 text-center text-sm text-[var(--muted)]">{error ?? "Không tìm thấy phiếu nhập."}</Card>
      </div>
    );
  }

  const r = data;

  return (
    <div>
      <BackLink href="/kho/phieu-nhap">Về danh sách phiếu nhập</BackLink>
      <PageHeader
        title={`Phiếu nhập ${r.code}`}
        subtitle={`Ngày ${formatDateTime(r.date)}`}
        actions={
          <div className="flex flex-wrap gap-2">
            {can("nhap-kho").edit && (
              <Button variant="outline" onClick={openEdit}>
                <Pencil size={16} /> Sửa phiếu
              </Button>
            )}
            {can("nhap-kho").remove && (
              <Button variant="outline" className="text-[var(--danger)]" onClick={() => setDel(true)}>
                <Trash2 size={16} /> Xoá phiếu
              </Button>
            )}
          </div>
        }
      />

      <div className="grid items-start gap-4 lg:grid-cols-3">
        <SectionCard title="Thông tin phiếu">
          <DetailRow label="Mã phiếu">
            <span className="font-mono">{r.code}</span>
          </DetailRow>
          <DetailRow label="Nhà cung cấp">
            {r.supplierId ? (
              <Link href={`/nha-cung-cap/${r.supplierId}`} className="text-[var(--primary)] hover:underline">
                {r.supplierName}
              </Link>
            ) : (
              r.supplierName ?? "—"
            )}
          </DetailRow>
          <DetailRow label="Chi nhánh">{r.branchName ? <Badge tone="info">{r.branchName}</Badge> : "—"}</DetailRow>
          <DetailRow label="Ngày nhập">{formatDateTime(r.date)}</DetailRow>
          {r.note && <DetailRow label="Ghi chú">{r.note}</DetailRow>}
        </SectionCard>

        <SectionCard title="Thanh toán">
          <div className="space-y-2 text-sm">
            <div className="flex items-center justify-between">
              <span className="text-[var(--muted)]">Tổng tiền</span>
              <span className="font-medium">{formatVND(r.total)}</span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-[var(--muted)]">Đã thanh toán</span>
              <span className="font-medium text-[var(--success)]">{formatVND(r.paid)}</span>
            </div>
            <div className="flex items-center justify-between border-t border-[var(--border)] pt-2">
              <span className="text-[var(--muted)]">Còn nợ NCC</span>
              <span className={`font-semibold ${r.debt > 0 ? "text-[var(--danger)]" : "text-[var(--success)]"}`}>
                {r.debt > 0 ? formatVND(r.debt) : "Không nợ"}
              </span>
            </div>
            {r.paid > 0 && (
              <div className="flex items-center gap-1.5 pt-1 text-xs text-[var(--muted)]">
                {r.payMethod === "tien_mat" ? <Wallet size={13} /> : r.payMethod === "the" ? <CreditCard size={13} /> : <Landmark size={13} />}
                Hình thức: {r.payMethod ? (PAY_METHOD_LABEL[r.payMethod] ?? r.payMethod) : "—"}
              </div>
            )}
          </div>
        </SectionCard>

        <Card className="p-4">
          <div className="text-xs text-[var(--muted)]">Số máy trong phiếu</div>
          <div className="mt-1 text-2xl font-bold text-[var(--info)]">{r.items.length}</div>
          <div className="mt-2 text-xs text-[var(--muted)]">Các máy đã được đưa vào kho khi tạo phiếu.</div>
        </Card>
      </div>

      <div className="mt-4">
        <SectionCard title={`Máy trong phiếu (${r.items.length})`}>
          <Table head={["Mã SP", "Tên sản phẩm", "Giá nhập", "Giá bán", "Trạng thái"]}>
            {r.items.map((m) => (
              <Tr key={m.id}>
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
                <Td className="whitespace-nowrap text-sm">{m.salePrice != null ? formatVND(m.salePrice) : "—"}</Td>
                <Td>
                  <MachineStatusBadge status={m.status} />
                </Td>
              </Tr>
            ))}
          </Table>
        </SectionCard>
      </div>

      <Modal
        open={edit}
        onClose={() => setEdit(false)}
        title={`Sửa phiếu nhập ${r.code}`}
        wide
        footer={
          <>
            <Button variant="outline" onClick={() => setEdit(false)}>
              Huỷ
            </Button>
            <Button onClick={saveEdit} disabled={busy}>
              <Save size={16} /> {busy ? "Đang lưu..." : "Lưu thay đổi"}
            </Button>
          </>
        }
      >
        <div className="space-y-3">
          <p className="text-xs text-[var(--muted)]">
            Sửa giá/tên máy, xoá máy còn tồn kho, thêm máy mới. Tổng tiền & công nợ NCC sẽ được tính lại.
          </p>
          <div className="space-y-1.5">
            <p className="text-sm font-medium">Máy trong phiếu</p>
            {keepItems.map((k, i) => (
              <div key={k.id} className="flex flex-wrap items-center gap-2 rounded-lg border border-[var(--border)] px-3 py-2">
                <span className="w-16 shrink-0 font-mono text-xs text-[var(--muted)]">{k.serial}</span>
                <Input
                  value={k.name}
                  onChange={(e) => setKeepItems((s) => s.map((x, idx) => (idx === i ? { ...x, name: e.target.value } : x)))}
                  placeholder="Tên máy"
                  className="min-w-[140px] flex-1"
                />
                <MoneyInput value={k.purchasePrice} onChange={(v) => setKeepItems((s) => s.map((x, idx) => (idx === i ? { ...x, purchasePrice: v } : x)))} placeholder="Giá nhập" className="w-28" />
                <MoneyInput value={k.salePrice} onChange={(v) => setKeepItems((s) => s.map((x, idx) => (idx === i ? { ...x, salePrice: v } : x)))} placeholder="Giá bán" className="w-28" />
                <button
                  type="button"
                  onClick={() => removeKeep(k.id, k.status)}
                  className={k.status === "ton_kho" ? "text-[var(--muted)] hover:text-[var(--danger)]" : "cursor-not-allowed opacity-30"}
                  title={k.status === "ton_kho" ? "Xoá máy khỏi phiếu" : "Máy đã bán/xuất — không xoá được"}
                >
                  <X size={15} />
                </button>
              </div>
            ))}
          </div>
          <div className="space-y-1.5">
            <div className="flex items-center justify-between">
              <p className="text-sm font-medium">Thêm máy mới</p>
              <Button type="button" size="sm" variant="outline" onClick={() => setAddLines((s) => [...s, { name: "", category: "", purchasePrice: "", salePrice: "", quantity: "1" }])}>
                <Plus size={14} /> Thêm dòng
              </Button>
            </div>
            {addLines.map((a, i) => (
              <div key={i} className="flex flex-wrap items-center gap-2 rounded-lg border border-dashed border-[var(--border)] px-3 py-2">
                <Input value={a.name} onChange={(e) => setAddLines((s) => s.map((x, idx) => (idx === i ? { ...x, name: e.target.value } : x)))} placeholder="Tên máy" className="min-w-[140px] flex-1" />
                <MoneyInput value={a.purchasePrice} onChange={(v) => setAddLines((s) => s.map((x, idx) => (idx === i ? { ...x, purchasePrice: v } : x)))} placeholder="Giá nhập" className="w-28" />
                <MoneyInput value={a.salePrice} onChange={(v) => setAddLines((s) => s.map((x, idx) => (idx === i ? { ...x, salePrice: v } : x)))} placeholder="Giá bán" className="w-28" />
                <Input value={a.quantity} onChange={(e) => setAddLines((s) => s.map((x, idx) => (idx === i ? { ...x, quantity: e.target.value.replace(/\D/g, "") } : x)))} placeholder="SL" className="w-14" />
                <button type="button" onClick={() => setAddLines((s) => s.filter((_, idx) => idx !== i))} className="text-[var(--muted)] hover:text-[var(--danger)]">
                  <X size={15} />
                </button>
              </div>
            ))}
          </div>
          <div className="grid grid-cols-2 gap-3">
            <Field label="Đã thanh toán (₫)">
              <MoneyInput value={ef.paid} onChange={(v) => setEf((s) => ({ ...s, paid: v }))} />
            </Field>
            <Field label="Ghi chú">
              <Textarea rows={1} value={ef.note} onChange={(e) => setEf((s) => ({ ...s, note: e.target.value }))} />
            </Field>
          </div>
          <div className="flex items-center justify-between border-t border-[var(--border)] pt-2 text-sm">
            <span className="text-[var(--muted)]">Tổng tiền mới</span>
            <span className="font-semibold">{formatVND(editTotal)}</span>
          </div>
        </div>
      </Modal>

      <ConfirmDialog
        open={del}
        onClose={() => setDel(false)}
        onConfirm={async () => {
          try {
            await apiDelete(`/api/stock-ins/${id}`);
            toast(`Đã xoá phiếu nhập ${r.code}`);
            router.push("/kho/phieu-nhap");
          } catch (e) {
            toast(e instanceof Error ? e.message : "Xoá thất bại", "warning");
          }
        }}
        title="Xoá phiếu nhập"
        message={`Xoá phiếu ${r.code}? Các máy của phiếu (nếu chưa bán) sẽ bị xoá khỏi kho, công nợ NCC & phiếu chi được đảo lại.`}
        confirmText="Xoá"
        danger
      />
    </div>
  );
}
