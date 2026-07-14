"use client";

import { useState } from "react";
import { Plus, History } from "lucide-react";
import { AccessGuard, DetailRow } from "@/components/parts";
import { Button, PageHeader, Table, Tr, Td, Input, Field, Badge } from "@/components/ui";
import { Modal } from "@/components/modal";
import { useToast } from "@/components/toast";
import { useRole } from "@/components/role-context";
import { customers, orders, buyReceipts } from "@/lib/mock-data";
import { formatVND, formatDate } from "@/lib/format";
import type { Customer } from "@/lib/types";

export default function Page() {
  return (
    <AccessGuard menu="khach-hang">
      <Inner />
    </AccessGuard>
  );
}

function Inner() {
  const { can } = useRole();
  const toast = useToast();
  const [q, setQ] = useState("");
  const [openForm, setOpenForm] = useState(false);
  const [history, setHistory] = useState<Customer | null>(null);

  const rows = customers.filter((c) => `${c.name} ${c.phone}`.toLowerCase().includes(q.toLowerCase()));
  const custOrders = history ? orders.filter((o) => o.customerName === history.name) : [];
  const custBuys = history ? buyReceipts.filter((b) => b.customerName === history.name) : [];

  return (
    <div>
      <PageHeader
        title="Khách hàng"
        subtitle="Quản lý thông tin khách và lịch sử mua / bán / sửa"
        actions={
          can("khach-hang").create && (
            <Button onClick={() => setOpenForm(true)}>
              <Plus size={16} /> Thêm khách hàng
            </Button>
          )
        }
      />

      <div className="mb-4">
        <Input placeholder="Tìm theo tên hoặc SĐT..." value={q} onChange={(e) => setQ(e.target.value)} className="max-w-sm" />
      </div>

      <Table head={["Tên", "SĐT", "Địa chỉ", "Số đơn", "Tổng mua", ""]}>
        {rows.map((c) => (
          <Tr key={c.id}>
            <Td>
              <div className="font-medium">{c.name}</div>
              {c.note && <div className="text-xs text-[var(--muted)]">{c.note}</div>}
            </Td>
            <Td>{c.phone}</Td>
            <Td className="max-w-[220px] text-xs text-[var(--muted)]">{c.address ?? "—"}</Td>
            <Td>{c.orderCount}</Td>
            <Td className="whitespace-nowrap font-medium">{formatVND(c.totalSpent)}</Td>
            <Td>
              <div className="flex justify-end">
                <Button size="sm" variant="ghost" onClick={() => setHistory(c)}>
                  <History size={15} /> Lịch sử
                </Button>
              </div>
            </Td>
          </Tr>
        ))}
      </Table>

      {/* Form thêm khách */}
      <Modal
        open={openForm}
        onClose={() => setOpenForm(false)}
        title="Thêm khách hàng"
        footer={
          <>
            <Button variant="outline" onClick={() => setOpenForm(false)}>
              Huỷ
            </Button>
            <Button
              onClick={() => {
                setOpenForm(false);
                toast("Đã thêm khách hàng (demo)");
              }}
            >
              Lưu
            </Button>
          </>
        }
      >
        <div className="space-y-3">
          <Field label="Tên khách">
            <Input placeholder="VD: Nguyễn Văn A" />
          </Field>
          <Field label="Số điện thoại">
            <Input placeholder="VD: 0901234567" />
          </Field>
          <Field label="Địa chỉ">
            <Input placeholder="Tuỳ chọn" />
          </Field>
          <Field label="Ghi chú">
            <Input placeholder="Tuỳ chọn" />
          </Field>
        </div>
      </Modal>

      {/* Lịch sử khách */}
      <Modal open={!!history} onClose={() => setHistory(null)} title={`Lịch sử — ${history?.name ?? ""}`} wide>
        {history && (
          <div className="space-y-4">
            <div>
              <DetailRow label="SĐT">{history.phone}</DetailRow>
              <DetailRow label="Tổng mua">{formatVND(history.totalSpent)}</DetailRow>
            </div>

            <div>
              <div className="mb-2 text-sm font-medium">Đơn mua ({custOrders.length})</div>
              {custOrders.length === 0 ? (
                <p className="text-sm text-[var(--muted)]">Chưa có đơn.</p>
              ) : (
                custOrders.map((o) => (
                  <div key={o.id} className="flex items-center justify-between border-b border-[var(--border)] py-2 text-sm last:border-0">
                    <span>
                      <span className="font-mono text-xs">{o.code}</span> · {o.model}
                    </span>
                    <span className="flex items-center gap-2">
                      {formatVND(o.sellPrice)} <Badge tone="muted">{formatDate(o.date)}</Badge>
                    </span>
                  </div>
                ))
              )}
            </div>

            <div>
              <div className="mb-2 text-sm font-medium">Phiếu bán máy cũ cho shop ({custBuys.length})</div>
              {custBuys.length === 0 ? (
                <p className="text-sm text-[var(--muted)]">Chưa có.</p>
              ) : (
                custBuys.map((b) => (
                  <div key={b.id} className="flex items-center justify-between border-b border-[var(--border)] py-2 text-sm last:border-0">
                    <span>
                      <span className="font-mono text-xs">{b.code}</span> · {b.model}
                    </span>
                    <span>{formatVND(b.price)}</span>
                  </div>
                ))
              )}
            </div>
          </div>
        )}
      </Modal>
    </div>
  );
}
