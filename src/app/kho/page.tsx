"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { Plus, Search, Trash2, Pencil, History, Cpu } from "lucide-react";
import { Button, PageHeader, Table, Tr, Td, Input, Select, Badge } from "@/components/ui";
import { ConfirmDialog } from "@/components/modal";
import { MachineStatusBadge } from "@/components/status";
import { useRole } from "@/components/role-context";
import { useToast } from "@/components/toast";
import { useApi, apiDelete } from "@/lib/api";
import { CONDITION_LABEL, MACHINE_STATUS_LABEL, type Machine, type MachineStatus } from "@/lib/types";
import { formatVND, formatDateTime } from "@/lib/format";

export default function KhoPage() {
  const { can } = useRole();
  const perm = can("kho");
  const toast = useToast();
  const { data, loading, reload } = useApi<Machine[]>("/api/machines");
  const machines = useMemo(() => data ?? [], [data]);
  const [maSP, setMaSP] = useState("");
  const [ten, setTen] = useState("");
  const [cauHinh, setCauHinh] = useState("");
  const [status, setStatus] = useState<MachineStatus | "all">("all");
  const [brand, setBrand] = useState<string>("all");
  const [del, setDel] = useState<Machine | null>(null);

  const brands = useMemo(() => Array.from(new Set(machines.map((m) => m.brand))).sort(), [machines]);

  const rows = useMemo(() => {
    const qMa = maSP.trim().toLowerCase();
    const qTen = ten.trim().toLowerCase();
    const qCh = cauHinh.trim().toLowerCase();
    return machines.filter((m) => {
      if (status !== "all" && m.status !== status) return false;
      if (brand !== "all" && m.brand !== brand) return false;
      if (qMa && !m.serial.toLowerCase().includes(qMa)) return false;
      if (qTen && !`${m.brand} ${m.model}`.toLowerCase().includes(qTen)) return false;
      if (qCh && !`${m.cpu} ${m.ram} ${m.storage} ${m.screen}`.toLowerCase().includes(qCh)) return false;
      return true;
    });
  }, [machines, maSP, ten, cauHinh, status, brand]);

  return (
    <div>
      <PageHeader
        title="Kho sản phẩm"
        subtitle={`${machines.length} máy trong hệ thống · bấm vào tên sản phẩm để xem lịch sử`}
        actions={
          perm.create && (
            <Button href="/kho/them">
              <Plus size={16} /> Thêm máy mới
            </Button>
          )
        }
      />

      {/* Mỗi tiêu chí 1 ô riêng */}
      <div className="mb-4 grid grid-cols-2 gap-2 md:grid-cols-3 xl:grid-cols-5">
        <div className="relative">
          <Search size={15} className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-[var(--muted)]" />
          <Input placeholder="Mã SP (VD: SP0001)" value={maSP} onChange={(e) => setMaSP(e.target.value)} className="pl-8" />
        </div>
        <div className="relative">
          <Search size={15} className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-[var(--muted)]" />
          <Input placeholder="Tên sản phẩm (VD: Dell Latitude)" value={ten} onChange={(e) => setTen(e.target.value)} className="pl-8" />
        </div>
        <div className="relative">
          <Cpu size={15} className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-[var(--muted)]" />
          <Input placeholder="Cấu hình (VD: 16GB, i7...)" value={cauHinh} onChange={(e) => setCauHinh(e.target.value)} className="pl-8" />
        </div>
        <Select value={brand} onChange={(e) => setBrand(e.target.value)}>
          <option value="all">Tất cả hãng</option>
          {brands.map((b) => (
            <option key={b} value={b}>
              {b}
            </option>
          ))}
        </Select>
        <Select value={status} onChange={(e) => setStatus(e.target.value as MachineStatus | "all")}>
          <option value="all">Tất cả trạng thái</option>
          {Object.entries(MACHINE_STATUS_LABEL).map(([k, v]) => (
            <option key={k} value={k}>
              {v}
            </option>
          ))}
        </Select>
      </div>

      <Table head={["Mã SP", "Tên sản phẩm", "Cấu hình", "Loại", "Giá nhập", "Ngày nhập", "Trạng thái", ""]}>
        {rows.map((m) => (
          <Tr key={m.id}>
            <Td>
              <Link href={`/kho/${m.serial}`} className="font-mono text-xs font-medium text-[var(--primary)] hover:underline">
                {m.serial}
              </Link>
            </Td>
            <Td>
              <Link href={`/kho/${m.serial}`} className="font-medium hover:text-[var(--primary)] hover:underline">
                {m.model}
              </Link>
              <div className="text-xs text-[var(--muted)]">{m.brand}</div>
            </Td>
            <Td>
              <div className="text-xs text-[var(--muted)]">
                {m.cpu} · {m.ram} · {m.storage}
              </div>
              <div className="text-xs text-[var(--muted)]">{m.screen}</div>
            </Td>
            <Td>
              <Badge tone="muted">{CONDITION_LABEL[m.condition]}</Badge>
            </Td>
            <Td className="whitespace-nowrap font-medium">{formatVND(m.purchasePrice)}</Td>
            <Td className="whitespace-nowrap text-xs text-[var(--muted)]">{formatDateTime(m.createdAt)}</Td>
            <Td>
              <MachineStatusBadge status={m.status} />
            </Td>
            <Td>
              <div className="flex items-center justify-end gap-1">
                <Button size="sm" variant="ghost" href={`/kho/${m.serial}`}>
                  <History size={15} />
                </Button>
                {perm.edit && (
                  <Button size="sm" variant="ghost">
                    <Pencil size={15} />
                  </Button>
                )}
                {perm.remove && (
                  <Button size="sm" variant="ghost" className="text-[var(--danger)]" onClick={() => setDel(m)}>
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
              <div className="py-6">{loading ? "Đang tải dữ liệu..." : "Không tìm thấy máy nào phù hợp"}</div>
            </Td>
          </Tr>
        )}
      </Table>

      <ConfirmDialog
        open={!!del}
        onClose={() => setDel(null)}
        onConfirm={async () => {
          if (!del) return;
          try {
            await apiDelete(`/api/machines/${del.serial}`);
            toast(`Đã xoá máy ${del.serial}`);
            reload();
          } catch (e) {
            toast(e instanceof Error ? e.message : "Xoá thất bại", "warning");
          }
        }}
        title="Xoá máy khỏi kho"
        message={del ? `Xoá máy ${del.serial} — ${del.brand} ${del.model}? Hành động này không hoàn tác được.` : ""}
        confirmText="Xoá"
        danger
      />
    </div>
  );
}
