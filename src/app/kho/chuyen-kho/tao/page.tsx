"use client";

import { useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { Save, Plus, Trash2, Package, Search } from "lucide-react";
import { AccessGuard, BackLink, SectionCard } from "@/components/parts";
import { Button, PageHeader, Field, Input, Select, Table, Tr, Td } from "@/components/ui";
import { useToast } from "@/components/toast";
import { useApi, apiPost } from "@/lib/api";
import type { Machine, Branch } from "@/lib/types";

interface Item {
  serial: string;
  name: string;
  note: string;
}

export default function Page() {
  return (
    <AccessGuard menu="chuyen-kho">
      <Inner />
    </AccessGuard>
  );
}

function Inner() {
  const router = useRouter();
  const toast = useToast();
  const { data: machines } = useApi<Machine[]>("/api/machines");
  const { data: branches } = useApi<Branch[]>("/api/branches");

  const [fromBranchId, setFromBranchId] = useState("");
  const [toBranchId, setToBranchId] = useState("");
  const [senderNote, setSenderNote] = useState("");
  const [items, setItems] = useState<Item[]>([]);
  const [query, setQuery] = useState("");
  const [qty, setQty] = useState("1");
  const [draftNote, setDraftNote] = useState("");
  const [busy, setBusy] = useState(false);

  const fromBranchName = branches?.find((b) => b.id === fromBranchId)?.name;
  const nameOf = (m: Machine) => [m.brand, m.model].filter(Boolean).join(" ");

  // Máy tồn kho thuộc chi nhánh gửi, chưa được thêm
  const available = useMemo(() => {
    if (!fromBranchId) return [];
    return (machines ?? []).filter(
      (m) => m.status === "ton_kho" && m.branchId === fromBranchId && !items.some((i) => i.serial === m.serial),
    );
  }, [machines, fromBranchId, items]);

  // Gom theo tên sản phẩm để hiện số lượng tồn
  const groups = useMemo(() => {
    const map = new Map<string, Machine[]>();
    for (const m of available) {
      const n = nameOf(m);
      if (!map.has(n)) map.set(n, []);
      map.get(n)!.push(m);
    }
    return [...map.entries()].map(([name, ms]) => ({ name, machines: ms }));
  }, [available]);

  const results = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return [];
    return groups
      .filter((g) => g.name.toLowerCase().includes(q) || g.machines.some((m) => m.serial.toLowerCase().includes(q)))
      .slice(0, 8);
  }, [groups, query]);

  const addProduct = (group: { name: string; machines: Machine[] }) => {
    const want = Math.max(1, Math.floor(Number(qty) || 1));
    const n = Math.min(want, group.machines.length);
    const picked = group.machines.slice(0, n);
    setItems((arr) => [...arr, ...picked.map((m) => ({ serial: m.serial, name: group.name, note: draftNote.trim() }))]);
    setQuery("");
    setQty("1");
    setDraftNote("");
    if (n < want) toast(`Chỉ còn ${n} máy "${group.name}" tồn kho, đã thêm ${n}`, "warning");
  };
  const removeItem = (serial: string) => setItems((arr) => arr.filter((i) => i.serial !== serial));

  const save = async () => {
    if (!fromBranchId || !toBranchId) {
      toast("Chọn chi nhánh gửi và nhận", "warning");
      return;
    }
    if (fromBranchId === toBranchId) {
      toast("Chi nhánh gửi và nhận phải khác nhau", "warning");
      return;
    }
    if (items.length === 0) {
      toast("Thêm ít nhất 1 máy để chuyển", "warning");
      return;
    }
    setBusy(true);
    try {
      const res = await apiPost<{ code: string }>("/api/stock-transfers", {
        fromBranchId,
        toBranchId,
        senderNote: senderNote || undefined,
        items: items.map((i) => ({ serial: i.serial, note: i.note || undefined })),
      });
      toast(`Đã tạo phiếu chuyển ${res.code}`);
      router.push("/kho/chuyen-kho");
    } catch (e) {
      toast(e instanceof Error ? e.message : "Tạo phiếu thất bại", "warning");
    } finally {
      setBusy(false);
    }
  };

  return (
    <div>
      <BackLink href="/kho/chuyen-kho">Về danh sách phiếu chuyển</BackLink>
      <PageHeader title="Tạo phiếu chuyển kho" subtitle="Chuyển máy tồn kho từ chi nhánh này sang chi nhánh khác" />

      <SectionCard title="Thông tin phiếu chuyển">
        <div className="grid gap-3 md:grid-cols-2">
          <Field label="Từ kho (chi nhánh gửi) *">
            <Select
              value={fromBranchId}
              onChange={(e) => {
                setFromBranchId(e.target.value);
                setItems([]);
                setQuery("");
              }}
            >
              <option value="">— Chọn chi nhánh gửi —</option>
              {(branches ?? []).map((b) => (
                <option key={b.id} value={b.id}>
                  {b.name}
                </option>
              ))}
            </Select>
          </Field>
          <Field label="Tới kho (chi nhánh nhận) *">
            <Select value={toBranchId} onChange={(e) => setToBranchId(e.target.value)}>
              <option value="">— Chọn chi nhánh nhận —</option>
              {(branches ?? []).filter((b) => b.id !== fromBranchId).map((b) => (
                <option key={b.id} value={b.id}>
                  {b.name}
                </option>
              ))}
            </Select>
          </Field>
        </div>
        <div className="mt-3">
          <Field label="Ghi chú bên gửi">
            <Input value={senderNote} onChange={(e) => setSenderNote(e.target.value)} placeholder="VD: Anh Cao chuyển..." />
          </Field>
        </div>
      </SectionCard>

      <div className="mt-3">
        <SectionCard title="Máy cần chuyển">
          <div className="rounded-xl border border-dashed border-[var(--border)] p-3">
            {!fromBranchId ? (
              <p className="text-center text-sm text-[var(--muted)]">Chọn chi nhánh gửi để hiện máy tồn kho</p>
            ) : (
              <>
                <div className="grid gap-3 md:grid-cols-[1fr_7rem_1fr] md:items-end">
                  <Field label={`Tìm sản phẩm (${available.length} máy tồn ở ${fromBranchName})`}>
                    <div className="relative">
                      <Search size={16} className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-[var(--muted)]" />
                      <Input value={query} onChange={(e) => setQuery(e.target.value)} placeholder="Gõ tên hoặc mã máy..." className="pl-8" />
                    </div>
                  </Field>
                  <Field label="Số lượng">
                    <Input type="number" min={1} value={qty} onChange={(e) => setQty(e.target.value)} />
                  </Field>
                  <Field label="Ghi chú sản phẩm">
                    <Input value={draftNote} onChange={(e) => setDraftNote(e.target.value)} placeholder="Tuỳ chọn" />
                  </Field>
                </div>
                {query.trim() && (
                  <div className="mt-2 overflow-hidden rounded-lg border border-[var(--border)]">
                    {results.length === 0 ? (
                      <p className="px-3 py-3 text-center text-sm text-[var(--muted)]">Không tìm thấy máy tồn khớp “{query}”.</p>
                    ) : (
                      results.map((g) => {
                        const addN = Math.min(Math.max(1, Math.floor(Number(qty) || 1)), g.machines.length);
                        return (
                          <button
                            key={g.name}
                            type="button"
                            onClick={() => addProduct(g)}
                            className="flex w-full items-center justify-between gap-3 border-b border-[var(--border)] px-3 py-2 text-left last:border-0 hover:bg-[var(--surface-2)]"
                          >
                            <span className="min-w-0">
                              <span className="block truncate text-sm font-medium">{g.name}</span>
                              <span className="block truncate text-xs text-[var(--muted)]">
                                SL tồn: {g.machines.length} · Mã : {g.machines.map((m) => m.serial).slice(0, 3).join(", ")}
                                {g.machines.length > 3 ? "…" : ""}
                              </span>
                            </span>
                            <span className="flex shrink-0 items-center gap-1 text-xs font-medium text-[var(--primary)]">
                              <Plus size={14} /> Thêm {addN}
                            </span>
                          </button>
                        );
                      })
                    )}
                  </div>
                )}
              </>
            )}
          </div>

          <div className="mt-3">
            <Table head={["#", "Mã hàng", "Tên hàng", "Ghi chú sản phẩm", ""]}>
              {items.map((it, i) => (
                <Tr key={it.serial}>
                  <Td className="text-[var(--muted)]">{i + 1}</Td>
                  <Td className="font-mono text-xs">{it.serial}</Td>
                  <Td>
                    <div className="flex items-center gap-1.5 font-medium">
                      <Package size={13} className="text-[var(--muted)]" /> {it.name}
                    </div>
                  </Td>
                  <Td className="text-sm text-[var(--muted)]">{it.note || "—"}</Td>
                  <Td>
                    <Button size="sm" variant="ghost" className="text-[var(--danger)]" onClick={() => removeItem(it.serial)}>
                      <Trash2 size={15} />
                    </Button>
                  </Td>
                </Tr>
              ))}
              {items.length === 0 && (
                <Tr>
                  <Td className="text-center text-[var(--muted)]">
                    <div className="py-5">Chưa có máy nào trong phiếu</div>
                  </Td>
                </Tr>
              )}
            </Table>
            {items.length > 0 && <div className="mt-2 text-right text-xs text-[var(--muted)]">{items.length} máy sẽ chuyển</div>}
          </div>
        </SectionCard>
      </div>

      <div className="mt-3 flex items-center justify-end gap-2">
        <Button variant="outline" href="/kho/chuyen-kho">
          Huỷ
        </Button>
        <Button type="button" onClick={save} disabled={busy}>
          <Save size={16} /> {busy ? "Đang lưu..." : "Tạo phiếu chuyển"}
        </Button>
      </div>
    </div>
  );
}
