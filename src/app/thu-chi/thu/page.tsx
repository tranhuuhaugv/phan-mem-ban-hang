"use client";

import { useState } from "react";
import { Plus, ArrowUpCircle, Pencil, Trash2 } from "lucide-react";
import { AccessGuard } from "@/components/parts";
import { Button, PageHeader, Table, Tr, Td, Card, Field, Input, Select, SearchInput } from "@/components/ui";
import { Modal, ConfirmDialog } from "@/components/modal";
import { useToast } from "@/components/toast";
import { useRole } from "@/components/role-context";
import { useApi, apiPost, apiPatch, apiDelete } from "@/lib/api";
import type { CashFlow } from "@/lib/types";
import { formatVND, formatDateTime } from "@/lib/format";

const CATEGORIES = ["Bán hàng", "Thu nợ", "Sửa chữa", "Khác"];

export default function Page() {
  return (
    <AccessGuard menu="thu-chi">
      <Inner />
    </AccessGuard>
  );
}

function todayISO() {
  return new Date().toISOString().slice(0, 10);
}

function Inner() {
  const { can } = useRole();
  const perm = can("thu-chi");
  const toast = useToast();
  const { data, reload } = useApi<CashFlow[]>("/api/cashflows");
  const rowsAll = (data ?? []).filter((c) => c.type === "thu");
  const [q, setQ] = useState("");
  const [catF, setCatF] = useState("all");
  const [from, setFrom] = useState("");
  const [to, setTo] = useState("");
  const [open, setOpen] = useState(false);
  const [editId, setEditId] = useState<string | null>(null);
  const [del, setDel] = useState<CashFlow | null>(null);
  const [busy, setBusy] = useState(false);
  const [f, setF] = useState({ date: todayISO(), amount: "", category: "Bán hàng", partner: "", content: "" });
  const set = (k: keyof typeof f) => (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) =>
    setF((s) => ({ ...s, [k]: e.target.value }));

  const cats = Array.from(new Set(rowsAll.map((c) => c.category).filter(Boolean))).sort();
  const rows = rowsAll
    .filter((c) => `${c.code} ${c.content} ${c.category} ${c.partner ?? ""}`.toLowerCase().includes(q.trim().toLowerCase()))
    .filter((c) => catF === "all" || c.category === catF)
    .filter((c) => !from || c.date.slice(0, 10) >= from)
    .filter((c) => !to || c.date.slice(0, 10) <= to)
    .sort((a, b) => b.date.localeCompare(a.date));
  const total = rows.reduce((s, c) => s + c.amount, 0);

  const openCreate = () => {
    setEditId(null);
    setF({ date: todayISO(), amount: "", category: "Bán hàng", partner: "", content: "" });
    setOpen(true);
  };
  const openEdit = (c: CashFlow) => {
    setEditId(c.id);
    setF({ date: c.date.slice(0, 10), amount: String(c.amount), category: c.category, partner: c.partner ?? "", content: c.content });
    setOpen(true);
  };
  const save = async () => {
    if (!f.content.trim()) return toast("Nhập nội dung phiếu", "warning");
    if (!Number(f.amount)) return toast("Nhập số tiền", "warning");
    setBusy(true);
    try {
      if (editId) {
        await apiPatch(`/api/cashflows/${editId}`, { ...f, amount: Number(f.amount) || 0 });
        toast("Đã cập nhật phiếu thu");
      } else {
        const row = await apiPost<CashFlow>("/api/cashflows", { ...f, type: "thu", amount: Number(f.amount) || 0 });
        toast(`Đã tạo phiếu thu ${row.code}`);
      }
      setOpen(false);
      reload();
    } catch (e) {
      toast(e instanceof Error ? e.message : "Lưu thất bại", "warning");
    } finally {
      setBusy(false);
    }
  };

  return (
    <div>
      <PageHeader
        title="Danh sách phiếu thu"
        subtitle="Các khoản tiền thu vào (bán hàng, thu nợ, sửa chữa...)"
        actions={
          perm.create && (
            <Button onClick={openCreate}>
              <Plus size={16} /> Tạo phiếu thu
            </Button>
          )
        }
      />

      <Card className="mb-4 p-4" style={{ background: "linear-gradient(135deg, #05966914, var(--surface) 55%)", borderColor: "#05966930" }}>
        <p className="text-sm font-medium text-[var(--success)]">Tổng thu ({rows.length} phiếu)</p>
        <p className="mt-1 text-2xl font-bold text-[var(--success)]">{formatVND(total)}</p>
      </Card>

      <div className="mb-4 flex flex-wrap items-center gap-2">
        <SearchInput value={q} onChange={setQ} placeholder="Tìm mã phiếu, nội dung, người nộp..." className="max-w-xs" />
        <Select value={catF} onChange={(e) => setCatF(e.target.value)} className="w-40">
          <option value="all">Tất cả nguồn</option>
          {cats.map((c) => (
            <option key={c} value={c}>
              {c}
            </option>
          ))}
        </Select>
        <Input type="date" value={from} onChange={(e) => setFrom(e.target.value)} className="w-40" title="Từ ngày" />
        <Input type="date" value={to} onChange={(e) => setTo(e.target.value)} className="w-40" title="Đến ngày" />
      </div>

      <Table head={["Mã phiếu", "Ngày", "Nội dung", "Nguồn thu", "Người nộp", "Số tiền", ""]}>
        {rows.map((c) => (
          <Tr key={c.id}>
            <Td className="font-mono text-xs font-medium">{c.code}</Td>
            <Td className="whitespace-nowrap text-xs text-[var(--muted)]">{formatDateTime(c.date)}</Td>
            <Td>{c.content}</Td>
            <Td className="text-[var(--muted)]">{c.category}</Td>
            <Td className="text-sm">{c.partner || <span className="text-[var(--muted)]">—</span>}</Td>
            <Td className="whitespace-nowrap font-medium text-[var(--success)]">+{formatVND(c.amount)}</Td>
            <Td>
              <div className="flex items-center justify-end gap-1">
                {perm.edit && (
                  <Button size="sm" variant="ghost" onClick={() => openEdit(c)}>
                    <Pencil size={15} />
                  </Button>
                )}
                {perm.remove && (
                  <Button size="sm" variant="ghost" className="text-[var(--danger)]" onClick={() => setDel(c)}>
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
              <div className="py-6">Chưa có phiếu thu nào</div>
            </Td>
          </Tr>
        )}
      </Table>

      <Modal
        open={open}
        onClose={() => setOpen(false)}
        title={editId ? "Sửa phiếu thu" : "Tạo phiếu thu"}
        footer={
          <>
            <Button variant="outline" onClick={() => setOpen(false)}>
              Huỷ
            </Button>
            <Button onClick={save} disabled={busy}>
              <ArrowUpCircle size={16} /> {busy ? "Đang lưu..." : editId ? "Cập nhật" : "Lưu phiếu thu"}
            </Button>
          </>
        }
      >
        <div className="space-y-3">
          <div className="grid grid-cols-2 gap-3">
            <Field label="Ngày">
              <Input type="date" value={f.date} onChange={set("date")} />
            </Field>
            <Field label="Số tiền (₫) *">
              <Input type="number" value={f.amount} onChange={set("amount")} placeholder="VD: 5000000" autoFocus />
            </Field>
            <Field label="Nguồn thu">
              <Select value={f.category} onChange={set("category")}>
                {CATEGORIES.map((x) => (
                  <option key={x}>{x}</option>
                ))}
              </Select>
            </Field>
            <Field label="Người nộp">
              <Input value={f.partner} onChange={set("partner")} placeholder="Tên khách / đối tác" />
            </Field>
          </div>
          <Field label="Nội dung *">
            <Input value={f.content} onChange={set("content")} placeholder="VD: Thu tiền bán máy SP0001" />
          </Field>
        </div>
      </Modal>

      <ConfirmDialog
        open={!!del}
        onClose={() => setDel(null)}
        onConfirm={async () => {
          if (!del) return;
          try {
            await apiDelete(`/api/cashflows/${del.id}`);
            toast("Đã xoá phiếu thu");
            reload();
          } catch (e) {
            toast(e instanceof Error ? e.message : "Xoá thất bại", "warning");
          }
        }}
        title="Xoá phiếu thu"
        message={del ? `Xoá phiếu thu ${del.code} (${formatVND(del.amount)})? Nếu là tiền thu của hoá đơn thì hoá đơn sẽ trừ lại phần đã trả.` : ""}
        confirmText="Xoá"
        danger
      />
    </div>
  );
}
