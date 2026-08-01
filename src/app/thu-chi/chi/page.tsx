"use client";

import { useState } from "react";
import { Plus, ArrowDownCircle, Pencil, Trash2 } from "lucide-react";
import { AccessGuard } from "@/components/parts";
import { Button, PageHeader, Table, Tr, Td, FootTd, Card, Field, Input, Select, SearchInput, FilterBar, FilterSelect, DateRange, ClearFilterButton, inDateRange } from "@/components/ui";
import { Modal, ConfirmDialog } from "@/components/modal";
import { useToast } from "@/components/toast";
import { useRole } from "@/components/role-context";
import { useApi, apiPost, apiPatch, apiDelete } from "@/lib/api";
import type { CashFlow } from "@/lib/types";
import { formatVND, formatDateTime } from "@/lib/format";

const CATEGORIES = ["Nhập hàng", "Thu mua máy", "Trả nợ NCC", "Sửa chữa", "Mặt bằng", "Quảng cáo", "Lương", "Khác"];

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
  const rowsAll = (data ?? []).filter((c) => c.type === "chi");
  const [q, setQ] = useState("");
  const [catF, setCatF] = useState("all");
  const [from, setFrom] = useState("");
  const [to, setTo] = useState("");
  const [open, setOpen] = useState(false);
  const [editId, setEditId] = useState<string | null>(null);
  const [del, setDel] = useState<CashFlow | null>(null);
  const [busy, setBusy] = useState(false);
  const [f, setF] = useState({ date: todayISO(), amount: "", category: "Nhập hàng", partner: "", content: "" });
  const set = (k: keyof typeof f) => (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) =>
    setF((s) => ({ ...s, [k]: e.target.value }));

  const cats = Array.from(new Set(rowsAll.map((c) => c.category).filter(Boolean))).sort();
  const rows = rowsAll
    .filter((c) => `${c.code} ${c.content} ${c.category} ${c.partner ?? ""}`.toLowerCase().includes(q.trim().toLowerCase()))
    .filter((c) => catF === "all" || c.category === catF)
    .filter((c) => inDateRange(c.date, from, to))
    .sort((a, b) => b.date.localeCompare(a.date));
  const total = rows.reduce((s, c) => s + c.amount, 0);

  const openCreate = () => {
    setEditId(null);
    setF({ date: todayISO(), amount: "", category: "Nhập hàng", partner: "", content: "" });
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
        toast("Đã cập nhật phiếu chi");
      } else {
        const row = await apiPost<CashFlow>("/api/cashflows", { ...f, type: "chi", amount: Number(f.amount) || 0 });
        toast(`Đã tạo phiếu chi ${row.code}`);
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
        title="Danh sách phiếu chi"
        subtitle="Các khoản tiền chi ra (nhập hàng, trả nợ, chi phí...)"
        actions={
          perm.create && (
            <Button onClick={openCreate}>
              <Plus size={16} /> Tạo phiếu chi
            </Button>
          )
        }
      />

      <Card className="mb-4 p-4" style={{ background: "linear-gradient(135deg, #e11d4814, var(--surface) 55%)", borderColor: "#e11d4830" }}>
        <p className="text-sm font-medium text-[var(--danger)]">Tổng chi ({rows.length} phiếu)</p>
        <p className="mt-1 text-2xl font-bold text-[var(--danger)]">{formatVND(total)}</p>
      </Card>

      <FilterBar search={<SearchInput value={q} onChange={setQ} placeholder="Tìm mã phiếu, nội dung, đối tác..." className="max-w-xs" />}>
        <DateRange from={from} to={to} onFrom={setFrom} onTo={setTo} />
        <FilterSelect value={catF} onChange={(e) => setCatF(e.target.value)}>
          <option value="all">Tất cả loại</option>
          {cats.map((c) => (
            <option key={c} value={c}>
              {c}
            </option>
          ))}
        </FilterSelect>
        <ClearFilterButton
          show={!!(from || to || catF !== "all")}
          onClick={() => {
            setFrom("");
            setTo("");
            setCatF("all");
          }}
        />
      </FilterBar>

      <Table
        head={["Mã phiếu", "Ngày", "Nội dung", "Loại chi phí", "Người nhận", "Số tiền", ""]}
        foot={
          rows.length > 0 ? (
            <tr>
              <FootTd className="text-xs uppercase tracking-wide text-[var(--muted)]">Tổng {rows.length} phiếu</FootTd>
              <FootTd />
              <FootTd />
              <FootTd />
              <FootTd />
              <FootTd className="whitespace-nowrap text-[var(--danger)]">−{formatVND(total)}</FootTd>
              <FootTd />
            </tr>
          ) : undefined
        }
      >
        {rows.map((c) => (
          <Tr key={c.id}>
            <Td className="font-mono text-xs font-medium">{c.code}</Td>
            <Td className="whitespace-nowrap text-xs text-[var(--muted)]">{formatDateTime(c.date)}</Td>
            <Td>{c.content}</Td>
            <Td className="text-[var(--muted)]">{c.category}</Td>
            <Td className="text-sm">{c.partner || <span className="text-[var(--muted)]">—</span>}</Td>
            <Td className="whitespace-nowrap font-medium text-[var(--danger)]">−{formatVND(c.amount)}</Td>
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
              <div className="py-6">Chưa có phiếu chi nào</div>
            </Td>
          </Tr>
        )}
      </Table>

      <Modal
        open={open}
        onClose={() => setOpen(false)}
        title={editId ? "Sửa phiếu chi" : "Tạo phiếu chi"}
        footer={
          <>
            <Button variant="outline" onClick={() => setOpen(false)}>
              Huỷ
            </Button>
            <Button onClick={save} disabled={busy}>
              <ArrowDownCircle size={16} /> {busy ? "Đang lưu..." : editId ? "Cập nhật" : "Lưu phiếu chi"}
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
              <Input type="number" value={f.amount} onChange={set("amount")} placeholder="VD: 12000000" autoFocus />
            </Field>
            <Field label="Loại chi phí">
              <Select value={f.category} onChange={set("category")}>
                {CATEGORIES.map((x) => (
                  <option key={x}>{x}</option>
                ))}
              </Select>
            </Field>
            <Field label="Người nhận">
              <Input value={f.partner} onChange={set("partner")} placeholder="Tên đối tác" />
            </Field>
          </div>
          <Field label="Nội dung *">
            <Input value={f.content} onChange={set("content")} placeholder="VD: Nhập lô 3 máy từ HN" />
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
            toast("Đã xoá phiếu chi");
            reload();
          } catch (e) {
            toast(e instanceof Error ? e.message : "Xoá thất bại", "warning");
          }
        }}
        title="Xoá phiếu chi"
        message={del ? `Xoá phiếu chi ${del.code} (${formatVND(del.amount)})? Nếu là tiền trả nợ NCC thì công nợ sẽ cộng lại.` : ""}
        confirmText="Xoá"
        danger
      />
    </div>
  );
}
