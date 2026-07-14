"use client";

import Link from "next/link";
import { ArrowLeft, Lock } from "lucide-react";
import { Card } from "./ui";
import { useRole } from "./role-context";
import type { MenuKey } from "@/lib/permissions";

// Chặn truy cập nếu vai trò không có quyền xem menu
export function AccessGuard({ menu, children }: { menu: MenuKey; children: React.ReactNode }) {
  const { can } = useRole();
  if (!can(menu).view) {
    return (
      <Card className="mx-auto mt-10 flex max-w-md flex-col items-center gap-3 p-10 text-center">
        <span className="grid h-12 w-12 place-items-center rounded-xl bg-[var(--danger-bg)] text-[var(--danger)]">
          <Lock size={22} />
        </span>
        <p className="font-medium">Không có quyền truy cập</p>
        <p className="text-sm text-[var(--muted)]">Vai trò hiện tại không được phép xem mục này.</p>
      </Card>
    );
  }
  return <>{children}</>;
}

export function BackLink({ href, children }: { href: string; children: React.ReactNode }) {
  return (
    <Link href={href} className="mb-3 inline-flex items-center gap-1.5 text-sm text-[var(--muted)] hover:text-[var(--foreground)]">
      <ArrowLeft size={15} /> {children}
    </Link>
  );
}

export function DetailRow({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="flex items-start justify-between gap-4 border-b border-[var(--border)] py-2.5 last:border-0">
      <span className="text-sm text-[var(--muted)]">{label}</span>
      <span className="text-right text-sm font-medium">{children}</span>
    </div>
  );
}

export function SectionCard({ title, children, action }: { title?: string; children: React.ReactNode; action?: React.ReactNode }) {
  return (
    <Card className="p-5">
      {title && (
        <div className="mb-3 flex items-center justify-between">
          <h2 className="font-semibold">{title}</h2>
          {action}
        </div>
      )}
      {children}
    </Card>
  );
}

export function FormGrid({ children }: { children: React.ReactNode }) {
  return <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-3">{children}</div>;
}

// Demo: chưa có backend nên form chỉ báo thành công
export function DemoNote() {
  return (
    <p className="mt-4 rounded-lg bg-[var(--warning-bg)] px-3 py-2 text-xs text-[var(--warning)]">
      Bản demo giao diện — dữ liệu chưa lưu vào database (sẽ nối backend ở bước sau).
    </p>
  );
}
