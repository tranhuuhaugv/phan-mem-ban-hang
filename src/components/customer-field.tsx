"use client";

import { UserCheck, UserPlus } from "lucide-react";
import { Field, Input } from "./ui";
import { useApi } from "@/lib/api";
import type { Customer } from "@/lib/types";

// Ô nhập khách hàng có gợi ý từ danh bạ: gõ SĐT/tên có sẵn → dropdown gợi ý (chỉ hiện khi gõ),
// chọn → tự điền SĐT + tên. Khách mới (SĐT chưa có) sẽ được tự lưu khi tạo phiếu/đơn.
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
  const { data } = useApi<Customer[]>("/api/customers");
  const customers = data ?? [];
  const existing = customers.find((c) => c.phone === phone.trim());

  const q = phone.trim().toLowerCase();
  const suggestions = q
    ? customers
        .filter((c) => (c.phone.toLowerCase().includes(q) || c.name.toLowerCase().includes(q)) && c.phone !== phone.trim())
        .slice(0, 6)
    : [];

  const pick = (c: Customer) => {
    onPhone(c.phone);
    onName(c.name);
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
    "Gõ SĐT hoặc tên để tìm khách cũ, hoặc nhập khách mới"
  );

  return (
    <div className={layout === "grid" ? "grid grid-cols-2 gap-3" : "space-y-3"}>
      <Field label="Số điện thoại" hint={hint}>
        <div className="relative">
          <Input value={phone} onChange={(e) => onPhone(e.target.value)} placeholder="VD: 0901234567" inputMode="tel" />
          {suggestions.length > 0 && (
            <div className="absolute z-20 mt-1 max-h-60 w-full overflow-auto rounded-lg border border-[var(--border)] bg-[var(--surface)] shadow-lg-soft">
              {suggestions.map((c) => (
                <button
                  key={c.id}
                  type="button"
                  onClick={() => pick(c)}
                  className="flex w-full flex-col items-start border-b border-[var(--border)] px-3 py-1.5 text-left last:border-0 hover:bg-[var(--surface-2)]"
                >
                  <span className="font-mono text-sm font-medium">{c.phone}</span>
                  <span className="text-xs text-[var(--muted)]">{c.name}</span>
                </button>
              ))}
            </div>
          )}
        </div>
      </Field>
      <Field label="Tên khách">
        <Input value={name} onChange={(e) => onName(e.target.value)} placeholder="VD: Nguyễn Văn A" />
      </Field>
    </div>
  );
}
