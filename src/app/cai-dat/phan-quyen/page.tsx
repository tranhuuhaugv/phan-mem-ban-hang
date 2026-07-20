"use client";

import { Fragment, useEffect, useState } from "react";
import { Check, Loader2, RotateCcw } from "lucide-react";
import { AccessGuard, BackLink } from "@/components/parts";
import { PageHeader, Card, Badge, Button } from "@/components/ui";
import { useToast } from "@/components/toast";
import { useApi, apiPatch } from "@/lib/api";
import { PERMISSIONS, type MenuKey, type Permission } from "@/lib/permissions";
import { MENU_LABEL } from "@/lib/nav";
import { ROLE_LABEL } from "@/lib/types";

type EditableRole = "manager" | "staff";
type PermMap = Record<MenuKey, Permission>;

// Cột quyền đặc biệt theo menu (nếu có)
const SPECIAL: Partial<Record<MenuKey, { key: "approve" | "seeProfit" | "seeReport"; label: string }>> = {
  "tong-quan": { key: "seeProfit", label: "Lợi nhuận" },
  "thu-may": { key: "approve", label: "Duyệt" },
  "thu-chi": { key: "seeReport", label: "Báo cáo" },
};

const ACTIONS: { key: "view" | "create" | "edit" | "remove"; label: string }[] = [
  { key: "view", label: "Xem" },
  { key: "create", label: "Thêm" },
  { key: "edit", label: "Sửa" },
  { key: "remove", label: "Xoá" },
];

export default function Page() {
  return (
    <AccessGuard menu="cai-dat">
      <Inner />
    </AccessGuard>
  );
}

function Inner() {
  const toast = useToast();
  const { data, loading } = useApi<{ manager: PermMap; staff: PermMap }>("/api/permissions");
  const [matrix, setMatrix] = useState<{ manager: PermMap; staff: PermMap } | null>(null);
  const [saving, setSaving] = useState<string | null>(null); // "role:menu:flag" đang lưu

  useEffect(() => {
    if (data) setMatrix(data);
  }, [data]);

  const menus = Object.keys(PERMISSIONS) as MenuKey[];

  const toggle = async (role: EditableRole, menu: MenuKey, flag: string, value: boolean) => {
    if (!matrix) return;
    const key = `${role}:${menu}:${flag}`;
    setSaving(key);
    // cập nhật lạc quan trên UI
    setMatrix((m) =>
      m ? { ...m, [role]: { ...m[role], [menu]: { ...m[role][menu], [flag]: value } } } : m,
    );
    try {
      await apiPatch("/api/permissions", { role, menu, [flag]: value });
    } catch (e) {
      // lỗi → hoàn tác
      setMatrix((m) =>
        m ? { ...m, [role]: { ...m[role], [menu]: { ...m[role][menu], [flag]: !value } } } : m,
      );
      toast(e instanceof Error ? e.message : "Lưu thất bại", "warning");
    } finally {
      setSaving(null);
    }
  };

  const resetDefaults = async (role: EditableRole) => {
    if (!matrix) return;
    for (const menu of menus) {
      const def = PERMISSIONS[menu][role];
      await apiPatch("/api/permissions", { role, menu, ...def }).catch(() => {});
    }
    setMatrix((m) => (m ? { ...m, [role]: { ...PERMISSIONS_ROLE(role) } } : m));
    toast(`Đã khôi phục quyền mặc định cho ${ROLE_LABEL[role]}`);
  };

  function PERMISSIONS_ROLE(role: EditableRole): PermMap {
    return Object.fromEntries(menus.map((m) => [m, PERMISSIONS[m][role]])) as PermMap;
  }

  const CellCheckbox = ({
    role,
    menu,
    flag,
    checked,
  }: {
    role: EditableRole;
    menu: MenuKey;
    flag: string;
    checked: boolean;
  }) => {
    const key = `${role}:${menu}:${flag}`;
    return saving === key ? (
      <Loader2 size={14} className="mx-auto animate-spin text-[var(--muted)]" />
    ) : (
      <input
        type="checkbox"
        checked={checked}
        onChange={(e) => toggle(role, menu, flag, e.target.checked)}
        className="mx-auto block h-4 w-4 cursor-pointer accent-[var(--primary)]"
      />
    );
  };

  return (
    <div>
      <BackLink href="/cai-dat">Về cài đặt</BackLink>
      <PageHeader
        title="Phân quyền"
        subtitle="Tích ô = vai trò đó được dùng/hiển thị chức năng. Admin luôn toàn quyền. Thay đổi có hiệu lực khi người dùng đăng nhập lại / tải lại trang."
        actions={
          <div className="flex gap-2">
            <Button variant="outline" size="sm" onClick={() => resetDefaults("manager")}>
              <RotateCcw size={14} /> Mặc định Quản lý
            </Button>
            <Button variant="outline" size="sm" onClick={() => resetDefaults("staff")}>
              <RotateCcw size={14} /> Mặc định Nhân viên
            </Button>
          </div>
        }
      />

      <Card className="overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-[var(--border)] bg-[var(--surface-2)] text-xs uppercase text-[var(--muted)]">
                <th className="px-4 py-3 text-left">Menu</th>
                <th colSpan={5} className="border-l border-[var(--border)] px-2 py-2 text-center">
                  Admin
                </th>
                <th colSpan={5} className="border-l border-[var(--border)] px-2 py-2 text-center text-[var(--info)]">
                  Quản lý (chỉnh được)
                </th>
                <th colSpan={5} className="border-l border-[var(--border)] px-2 py-2 text-center text-[var(--warning)]">
                  Nhân viên (chỉnh được)
                </th>
              </tr>
              <tr className="border-b border-[var(--border)] bg-[var(--surface-2)] text-[11px] text-[var(--muted)]">
                <th></th>
                {(["admin", "manager", "staff"] as const).map((r) => (
                  <Fragment key={r}>
                    {ACTIONS.map((a, i) => (
                      <th key={r + a.key} className={`px-2 py-1.5 font-normal ${i === 0 ? "border-l border-[var(--border)]" : ""}`}>
                        {a.label}
                      </th>
                    ))}
                    <th className="px-2 py-1.5 font-normal">Khác</th>
                  </Fragment>
                ))}
              </tr>
            </thead>
            <tbody>
              {menus.map((menu) => {
                const special = SPECIAL[menu];
                return (
                  <tr key={menu} className="border-b border-[var(--border)] last:border-0">
                    <td className="whitespace-nowrap px-4 py-2.5 font-medium">{MENU_LABEL[menu]}</td>

                    {/* Admin — khoá, luôn full */}
                    {ACTIONS.map((a, i) => (
                      <td key={"admin" + a.key} className={`px-2 py-2.5 text-center ${i === 0 ? "border-l border-[var(--border)]" : ""}`}>
                        <Check size={15} className="mx-auto text-[var(--success)]" />
                      </td>
                    ))}
                    <td className="px-2 py-2.5 text-center">
                      {special ? <Check size={15} className="mx-auto text-[var(--success)]" /> : <span className="text-[var(--muted)] opacity-30">—</span>}
                    </td>

                    {/* Quản lý + Nhân viên — checkbox chỉnh được */}
                    {(["manager", "staff"] as EditableRole[]).map((role) => {
                      const p = matrix?.[role]?.[menu];
                      return (
                        <Fragment key={role}>
                          {ACTIONS.map((a, i) => (
                            <td key={role + a.key} className={`px-2 py-2.5 text-center ${i === 0 ? "border-l border-[var(--border)]" : ""}`}>
                              {p ? (
                                <CellCheckbox role={role} menu={menu} flag={a.key} checked={!!p[a.key]} />
                              ) : (
                                <span className="text-[var(--muted)]">·</span>
                              )}
                            </td>
                          ))}
                          <td className="px-2 py-2.5 text-center">
                            {special && p ? (
                              <div className="flex flex-col items-center gap-0.5">
                                <CellCheckbox role={role} menu={menu} flag={special.key} checked={!!p[special.key]} />
                                <span className="text-[9px] uppercase tracking-wide text-[var(--muted)]">{special.label}</span>
                              </div>
                            ) : (
                              <span className="text-[var(--muted)] opacity-30">—</span>
                            )}
                          </td>
                        </Fragment>
                      );
                    })}
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
        {loading && (
          <div className="border-t border-[var(--border)] p-3 text-center text-sm text-[var(--muted)]">
            Đang tải ma trận quyền...
          </div>
        )}
      </Card>

      <div className="mt-4 flex flex-wrap gap-2 text-xs text-[var(--muted)]">
        <Badge tone="warning">Lưu ý</Badge>
        Bỏ tích “Xem” = vai trò đó không thấy menu trên thanh điều hướng và bị chặn cả ở API. Cột “Khác”: Lợi nhuận
        (Tổng quan), Duyệt phiếu (Thu máy), Báo cáo lãi/lỗ (Thu-Chi).
      </div>
    </div>
  );
}
