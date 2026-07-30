"use client";

import { useState } from "react";
import { Plus, ArrowDownCircle } from "lucide-react";
import { AccessGuard } from "@/components/parts";
import { Button, PageHeader, Table, Tr, Td, Card, Field, Input, Select, SearchInput } from "@/components/ui";
import { Modal } from "@/components/modal";
import { useToast } from "@/components/toast";
import { useRole } from "@/components/role-context";
import { useApi, apiPost } from "@/lib/api";
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
  const [open, setOpen] = useState(false);
  const [busy, setBusy] = useState(false);
  const [f, setF] = useState({ date: todayISO(), amount: "", category: "Nhập hàng", partner: "", content: "" });
  const set = (k: keyof typeof f) => (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) =>
    setF((s) => ({ ...s, [k]: e.target.value }));

  const total = rowsAll.reduce((s, c) => s + c.amount, 0);
  const rows = rowsAll
    .filter((c) => `${c.code} ${c.content} ${c.category} ${c.partner ?? ""}`.toLowerCase().includes(q.trim().toLowerCase()))
    .sort((a, b) => b.date.localeCompare(a.date));

  const openCreate = () => {
    setF({ date: todayISO(), amount: "", category: "Nhập hàng", partner: "", content: "" });
    setOpen(true);
  };
  const save = async () => {
    if (!f.content.trim()) return toast("Nhập nội dung phiếu", "warning");
    if (!Number(f.amount)) return toast("Nhập số tiền", "warning");
    setBusy(true);
    try {
      const row = await apiPost<CashFlow>("/api/cashflows", { ...f, type: "chi", amount: Number(f.amount) || 0 });
      toast(`Đã tạo phiếu chi ${row.code}`);
      setOpen(false);
      reload();
    } catch (e) {
      toast(e instanceof Error ? e.message : "Tạo phiếu thất bại", "warning");
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
        <p className="text-sm font-medium text-[var(--danger)]">Tổng chi ({rowsAll.length} phiếu)</p>
        <p className="mt-1 text-2xl font-bold text-[var(--danger)]">{formatVND(total)}</p>
      </Card>

      <div className="mb-4 flex flex-wrap items-center gap-2">
        <SearchInput value={q} onChange={setQ} placeholder="Tìm mã phiếu, nội dung, loại chi phí, đối tác..." className="max-w-md" />
      </div>

      <Table head={["Mã phiếu", "Ngày", "Nội dung", "Loại chi phí", "Người nhận", "Số tiền"]}>
        {rows.map((c) => (
          <Tr key={c.id}>
            <Td className="font-mono text-xs font-medium">{c.code}</Td>
            <Td className="whitespace-nowrap text-xs text-[var(--muted)]">{formatDateTime(c.date)}</Td>
            <Td>{c.content}</Td>
            <Td className="text-[var(--muted)]">{c.category}</Td>
            <Td className="text-sm">{c.partner || <span className="text-[var(--muted)]">—</span>}</Td>
            <Td className="whitespace-nowrap font-medium text-[var(--danger)]">−{formatVND(c.amount)}</Td>
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
        title="Tạo phiếu chi"
        footer={
          <>
            <Button variant="outline" onClick={() => setOpen(false)}>
              Huỷ
            </Button>
            <Button onClick={save} disabled={busy}>
              <ArrowDownCircle size={16} /> {busy ? "Đang lưu..." : "Lưu phiếu chi"}
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
    </div>
  );
}
