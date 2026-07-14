"use client";

import { Fragment } from "react";
import { Check, X } from "lucide-react";
import { AccessGuard, BackLink } from "@/components/parts";
import { PageHeader, Card, Badge } from "@/components/ui";
import { PERMISSIONS, type MenuKey } from "@/lib/permissions";
import { NAV } from "@/lib/nav";
import { ROLE_LABEL, type Role } from "@/lib/types";

export default function Page() {
  return (
    <AccessGuard menu="cai-dat">
      <Inner />
    </AccessGuard>
  );
}

const ROLES: Role[] = ["admin", "manager", "staff"];

function Yn({ ok }: { ok: boolean }) {
  return ok ? (
    <Check size={15} className="mx-auto text-[var(--success)]" />
  ) : (
    <X size={15} className="mx-auto text-[var(--muted)] opacity-40" />
  );
}

function Inner() {
  const menuLabel = (k: MenuKey) => NAV.find((n) => n.key === k)?.label ?? k;

  return (
    <div>
      <BackLink href="/cai-dat">Về cài đặt</BackLink>
      <PageHeader title="Phân quyền" subtitle="Gán quyền Xem / Thêm / Sửa / Xoá cho từng vai trò trên từng menu" />

      <Card className="overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-[var(--border)] bg-[var(--surface-2)] text-xs uppercase text-[var(--muted)]">
                <th className="px-4 py-3 text-left">Menu</th>
                {ROLES.map((r) => (
                  <th key={r} colSpan={4} className="border-l border-[var(--border)] px-2 py-2 text-center">
                    {ROLE_LABEL[r]}
                  </th>
                ))}
              </tr>
              <tr className="border-b border-[var(--border)] bg-[var(--surface-2)] text-[11px] text-[var(--muted)]">
                <th></th>
                {ROLES.map((r) => (
                  <Fragment key={r}>
                    {["Xem", "Thêm", "Sửa", "Xoá"].map((c, i) => (
                      <th key={r + c} className={`px-2 py-1.5 font-normal ${i === 0 ? "border-l border-[var(--border)]" : ""}`}>
                        {c}
                      </th>
                    ))}
                  </Fragment>
                ))}
              </tr>
            </thead>
            <tbody>
              {(Object.keys(PERMISSIONS) as MenuKey[]).map((menu) => (
                <tr key={menu} className="border-b border-[var(--border)] last:border-0">
                  <td className="px-4 py-2.5 font-medium whitespace-nowrap">{menuLabel(menu)}</td>
                  {ROLES.map((r) => {
                    const p = PERMISSIONS[menu][r];
                    return (
                      <Fragment key={r}>
                        <td className="border-l border-[var(--border)] px-2 py-2.5 text-center">
                          <Yn ok={p.view} />
                        </td>
                        <td className="px-2 py-2.5 text-center">
                          <Yn ok={p.create} />
                        </td>
                        <td className="px-2 py-2.5 text-center">
                          <Yn ok={p.edit} />
                        </td>
                        <td className="px-2 py-2.5 text-center">
                          <Yn ok={p.remove} />
                        </td>
                      </Fragment>
                    );
                  })}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </Card>

      <div className="mt-4 flex flex-wrap gap-2 text-xs text-[var(--muted)]">
        <Badge tone="warning">Lưu ý</Badge>
        Nhân viên không thấy lợi nhuận (Dashboard), không truy cập Thu-Chi; chỉ Admin vào Cài đặt; duyệt phiếu thu máy cần Admin/Quản lý.
      </div>
    </div>
  );
}
