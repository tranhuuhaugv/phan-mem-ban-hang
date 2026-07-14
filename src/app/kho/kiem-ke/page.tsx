"use client";

import { useState } from "react";
import { ClipboardCheck, Check } from "lucide-react";
import { AccessGuard, BackLink } from "@/components/parts";
import { Button, PageHeader, Table, Tr, Td, Card, Badge } from "@/components/ui";
import { useToast } from "@/components/toast";
import { machines } from "@/lib/mock-data";

export default function Page() {
  return (
    <AccessGuard menu="kho">
      <Inner />
    </AccessGuard>
  );
}

function Inner() {
  const toast = useToast();
  // Chỉ kiểm kê máy còn trong kho (không tính đã bán)
  const list = machines.filter((m) => m.status !== "da_ban");
  const [checked, setChecked] = useState<Record<string, boolean>>({});
  const done = list.filter((m) => checked[m.id]).length;

  return (
    <div>
      <BackLink href="/kho">Về danh sách kho</BackLink>
      <PageHeader
        title="Kiểm kê kho"
        subtitle="Đối chiếu số lượng tồn thực tế với hệ thống — tick máy đã kiểm đếm thực tế"
        actions={
          <Button
            onClick={() => toast(`Đã lưu phiên kiểm kê: ${done}/${list.length} máy khớp (demo)`)}
            disabled={done === 0}
          >
            <Check size={16} /> Lưu kết quả
          </Button>
        }
      />

      <div className="mb-4 grid grid-cols-3 gap-4">
        <Card className="p-4">
          <p className="text-sm text-[var(--muted)]">Theo hệ thống</p>
          <p className="mt-1 text-2xl font-semibold">{list.length}</p>
        </Card>
        <Card className="p-4">
          <p className="text-sm text-[var(--muted)]">Đã kiểm đếm</p>
          <p className="mt-1 text-2xl font-semibold text-[var(--success)]">{done}</p>
        </Card>
        <Card className="p-4">
          <p className="text-sm text-[var(--muted)]">Chưa thấy</p>
          <p className="mt-1 text-2xl font-semibold text-[var(--danger)]">{list.length - done}</p>
        </Card>
      </div>

      <Table head={["✓", "Mã SP", "Model", "Trạng thái HT", "Kiểm kê"]}>
        {list.map((m) => (
          <Tr key={m.id}>
            <Td>
              <input
                type="checkbox"
                checked={!!checked[m.id]}
                onChange={(e) => setChecked((s) => ({ ...s, [m.id]: e.target.checked }))}
                className="h-4 w-4 accent-[var(--primary)]"
              />
            </Td>
            <Td className="font-mono text-xs">{m.serial}</Td>
            <Td>
              <div className="font-medium">{m.model}</div>
              <div className="text-xs text-[var(--muted)]">{m.brand}</div>
            </Td>
            <Td className="text-xs text-[var(--muted)]">Có trong kho</Td>
            <Td>
              {checked[m.id] ? (
                <Badge tone="success">
                  <ClipboardCheck size={12} /> Đã đếm
                </Badge>
              ) : (
                <Badge tone="warning">Chưa đếm</Badge>
              )}
            </Td>
          </Tr>
        ))}
      </Table>
    </div>
  );
}
