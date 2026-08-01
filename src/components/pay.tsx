"use client";

import { useState } from "react";
import { Banknote, CreditCard, Landmark } from "lucide-react";
import { PAY_METHOD_LABEL } from "@/lib/types";
import { formatVND } from "@/lib/format";

export type PayMethodKey = "tien_mat" | "the" | "chuyen_khoan";
export const PAY_METHODS: PayMethodKey[] = ["tien_mat", "the", "chuyen_khoan"];

const ICONS: Record<string, React.ComponentType<{ size?: number; className?: string }>> = {
  tien_mat: Banknote,
  the: CreditCard,
  chuyen_khoan: Landmark,
};
const TONES: Record<string, string> = {
  tien_mat: "#16a34a",
  the: "#7c3aed",
  chuyen_khoan: "#2563eb",
};

export function PayMethodIcon({ method, size = 13 }: { method?: string; size?: number }) {
  const Icon = (method && ICONS[method]) || Banknote;
  return <Icon size={size} />;
}

// Nhãn hình thức thanh toán (icon + tên)
export function PayMethodLabel({ method, size = 13 }: { method?: string; size?: number }) {
  if (!method) return <span className="text-[var(--muted)]">Chưa ghi nhận</span>;
  return (
    <span className="inline-flex items-center gap-1.5" style={{ color: TONES[method] }}>
      <PayMethodIcon method={method} size={size} />
      {PAY_METHOD_LABEL[method] ?? method}
    </span>
  );
}

// Số tiền bấm được → bung popover cho biết hình thức thanh toán
export function PayAmount({
  amount,
  method,
  prefix = "",
  format = formatVND,
  className = "",
  align = "right",
}: {
  amount: number;
  method?: string;
  prefix?: string;
  format?: (n: number) => string;
  className?: string;
  align?: "left" | "right";
}) {
  const [open, setOpen] = useState(false);
  return (
    <span className="relative inline-block">
      <button
        type="button"
        onClick={() => setOpen((o) => !o)}
        onBlur={() => setOpen(false)}
        title="Bấm để xem hình thức thanh toán"
        className={`cursor-pointer underline decoration-dotted underline-offset-2 outline-none hover:opacity-70 ${className}`}
      >
        {prefix}
        {format(amount)}
      </button>
      {open && (
        <span
          className={`absolute z-30 mt-1 whitespace-nowrap rounded-lg border border-[var(--border)] bg-[var(--surface)] px-3 py-2 text-xs font-normal shadow-md-soft ${
            align === "right" ? "right-0" : "left-0"
          }`}
        >
          <span className="mb-0.5 block text-[11px] uppercase tracking-wide text-[var(--muted)]">Hình thức thanh toán</span>
          <PayMethodLabel method={method} />
        </span>
      )}
    </span>
  );
}

// Số tiền tổng (nhiều hình thức) → bung popover tách Tiền mặt / Thẻ / Chuyển khoản
export function PayBreakdown({
  total,
  byMethod,
  prefix = "",
  format = formatVND,
  className = "",
  align = "left",
}: {
  total: number;
  byMethod?: Partial<Record<string, number>>;
  prefix?: string;
  format?: (n: number) => string;
  className?: string;
  align?: "left" | "right";
}) {
  const [open, setOpen] = useState(false);
  const rows = PAY_METHODS.map((m) => ({ m, v: byMethod?.[m] ?? 0 }));
  return (
    <span className="relative inline-block">
      <button
        type="button"
        onClick={() => setOpen((o) => !o)}
        onBlur={() => setOpen(false)}
        title="Bấm để xem tách theo hình thức thanh toán"
        className={`cursor-pointer underline decoration-dotted underline-offset-4 outline-none hover:opacity-70 ${className}`}
      >
        {prefix}
        {format(total)}
      </button>
      {open && (
        <span
          className={`absolute z-30 mt-1 min-w-[190px] rounded-lg border border-[var(--border)] bg-[var(--surface)] p-2.5 text-xs font-normal shadow-md-soft ${
            align === "right" ? "right-0" : "left-0"
          }`}
        >
          <span className="mb-1.5 block text-[11px] uppercase tracking-wide text-[var(--muted)]">Theo hình thức thanh toán</span>
          <span className="block space-y-1">
            {rows.map(({ m, v }) => (
              <span key={m} className="flex items-center justify-between gap-4">
                <PayMethodLabel method={m} />
                <span className="font-medium">{format(v)}</span>
              </span>
            ))}
          </span>
        </span>
      )}
    </span>
  );
}
