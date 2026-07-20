"use client";

import { useId } from "react";
import { UserCheck, UserPlus } from "lucide-react";
import { Field, Input } from "./ui";
import { useApi } from "@/lib/api";
import type { Customer } from "@/lib/types";

// Ô nhập khách hàng có gợi ý từ danh bạ: gõ/chọn SĐT có sẵn → tự điền tên + báo "Khách cũ".
// Khách mới (SĐT chưa có) sẽ được tự lưu vào danh bạ khi tạo phiếu/đơn.
export function CustomerField({
  name,
  phone,
  onName,
  onPhone,
  layout = "stack",
}: {
  name: string;
  phone: string;
  onName: (v: string) => void;
  onPhone: (v: string) => void;
  layout?: "stack" | "grid";
}) {
  const listId = useId();
  const { data } = useApi<Customer[]>("/api/customers");
  const customers = data ?? [];
  const existing = customers.find((c) => c.phone === phone.trim());

  const handlePhone = (v: string) => {
    onPhone(v);
    const m = customers.find((c) => c.phone === v.trim());
    if (m) onName(m.name); // tự điền tên khi khớp khách cũ
  };

  const hint = phone.trim() ? (
    existing ? (
      <span className="inline-flex items-center gap-1 text-[var(--success)]">
        <UserCheck size={12} /> Khách cũ — đã có trong danh bạ
      </span>
    ) : (
      <span className="inline-flex items-center gap-1 text-[var(--primary)]">
        <UserPlus size={12} /> Khách mới — sẽ tự lưu vào danh bạ
      </span>
    )
  ) : (
    "Gõ SĐT để tìm khách cũ, hoặc nhập khách mới"
  );

  return (
    <div className={layout === "grid" ? "grid grid-cols-2 gap-3" : "space-y-3"}>
      <Field label="Số điện thoại" hint={hint}>
        <Input
          value={phone}
          onChange={(e) => handlePhone(e.target.value)}
          placeholder="VD: 0901234567"
          list={listId}
          inputMode="tel"
        />
        <datalist id={listId}>
          {customers.map((c) => (
            <option key={c.id} value={c.phone}>
              {c.name}
            </option>
          ))}
        </datalist>
      </Field>
      <Field label="Tên khách">
        <Input value={name} onChange={(e) => onName(e.target.value)} placeholder="VD: Nguyễn Văn A" />
      </Field>
    </div>
  );
}
