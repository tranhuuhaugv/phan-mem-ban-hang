"use client";

import { Construction } from "lucide-react";
import { PageHeader, Card } from "./ui";
import { useRole } from "./role-context";
import type { MenuKey } from "@/lib/permissions";

export function Placeholder({
  menu,
  title,
  subtitle,
  note,
}: {
  menu: MenuKey;
  title: string;
  subtitle?: string;
  note?: string;
}) {
  const { can } = useRole();
  if (!can(menu).view) {
    return (
      <Card className="p-10 text-center">
        <p className="text-sm text-[var(--muted)]">Vai trò hiện tại không có quyền truy cập mục này.</p>
      </Card>
    );
  }
  return (
    <div>
      <PageHeader title={title} subtitle={subtitle} />
      <Card className="flex flex-col items-center gap-3 p-12 text-center">
        <span className="grid h-12 w-12 place-items-center rounded-xl bg-[var(--warning-bg)] text-[var(--warning)]">
          <Construction size={24} />
        </span>
        <p className="font-medium">Màn hình đang được dựng ở giai đoạn tiếp theo</p>
        {note && <p className="max-w-md text-sm text-[var(--muted)]">{note}</p>}
      </Card>
    </div>
  );
}
