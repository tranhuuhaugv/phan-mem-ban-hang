"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useEffect, useRef, useState } from "react";
import {
  LayoutDashboard,
  Boxes,
  ShoppingCart,
  Wrench,
  Wallet,
  Settings,
  Laptop,
  ChevronDown,
  LogOut,
} from "lucide-react";
import { NAV, type NavGroup } from "@/lib/nav";
import { ROLE_LABEL } from "@/lib/types";
import { useRole } from "./role-context";

const ICONS: Record<string, React.ComponentType<{ size?: number; className?: string }>> = {
  LayoutDashboard,
  Boxes,
  ShoppingCart,
  Wrench,
  Wallet,
  Settings,
};

export function Topbar() {
  const pathname = usePathname();
  const router = useRouter();
  const { role, user, logout, can } = useRole();
  const [open, setOpen] = useState<string | null>(null);
  const [left, setLeft] = useState(0);
  const [userMenu, setUserMenu] = useState(false);
  const barRef = useRef<HTMLDivElement>(null);

  // lọc nhóm + section theo quyền
  const groups = NAV.map((g) => ({ ...g, sections: g.sections.filter((s) => can(s.key).view) })).filter(
    (g) => g.sections.length > 0,
  );
  const openGroup = groups.find((g) => g.id === open);

  useEffect(() => {
    const onDoc = (e: MouseEvent) => {
      if (barRef.current && !barRef.current.contains(e.target as Node)) {
        setOpen(null);
        setUserMenu(false);
      }
    };
    document.addEventListener("mousedown", onDoc);
    return () => document.removeEventListener("mousedown", onDoc);
  }, []);

  useEffect(() => {
    setOpen(null);
    setUserMenu(false);
  }, [pathname]);

  const isGroupActive = (g: NavGroup) =>
    g.sections.some((s) => pathname === `/${s.key}` || pathname.startsWith(`/${s.key}/`));

  const groupWidth = (g: NavGroup) => (g.sections.length > 1 ? Math.min(g.sections.length * 184, 560) : 232);

  const toggle = (g: NavGroup, e: React.MouseEvent<HTMLButtonElement>) => {
    if (open === g.id) {
      setOpen(null);
      return;
    }
    const bar = barRef.current?.getBoundingClientRect();
    const btn = e.currentTarget.getBoundingClientRect();
    if (bar) {
      const w = groupWidth(g);
      setLeft(Math.max(0, Math.min(btn.left - bar.left, bar.width - w - 8)));
    }
    setUserMenu(false);
    setOpen(g.id);
  };

  return (
    <header className="sticky top-0 z-40 border-b border-[var(--border)] bg-[var(--surface)]/80 shadow-sm backdrop-blur-xl">
      <div ref={barRef} className="relative flex h-14 items-center gap-1 px-4 md:px-6">
        <Link href="/tong-quan" className="flex items-center gap-2.5 pr-3">
          <span className="grid h-8 w-8 place-items-center rounded-lg bg-gradient-to-br from-[var(--primary)] to-[var(--purple)] text-white shadow-md-soft">
            <Laptop size={18} />
          </span>
          <span className="hidden leading-tight md:block">
            <span className="block text-[13px] font-bold tracking-tight">Kho Laptop</span>
            <span className="block text-[10px] text-[var(--muted)]">Quản lý nội bộ</span>
          </span>
        </Link>

        <nav className="flex flex-1 items-center gap-0.5 overflow-x-auto">
          {groups.map((g) => {
            const Icon = ICONS[g.icon] ?? Laptop;
            const active = isGroupActive(g);
            const isOpen = open === g.id;
            return (
              <button
                key={g.id}
                onClick={(e) => toggle(g, e)}
                className={`flex items-center gap-1.5 whitespace-nowrap rounded-lg px-3 py-2 text-[13px] font-medium ${
                  active || isOpen
                    ? "bg-[var(--primary)]/12 text-[var(--primary)]"
                    : "text-[var(--foreground)] hover:bg-[var(--surface-2)]"
                }`}
              >
                <Icon size={16} />
                <span className="hidden lg:inline">{g.label}</span>
                <ChevronDown size={13} className={`opacity-60 transition-transform ${isOpen ? "rotate-180" : ""}`} />
              </button>
            );
          })}
        </nav>

        {/* Mega dropdown — render ngoài vùng cuộn để không bị cắt */}
        {openGroup && (
          <div
            className="animate-menu absolute top-full z-50 mt-1.5"
            style={{ left, width: groupWidth(openGroup) }}
          >
            <div className="card shadow-lg-soft flex gap-1 overflow-hidden p-2">
              {openGroup.sections.map((s) => (
                <div key={s.key} className="min-w-0 flex-1">
                  {openGroup.sections.length > 1 && (
                    <div className="px-2 pb-1 pt-1 text-[10px] font-semibold uppercase tracking-wide text-[var(--muted)]">
                      {s.title}
                    </div>
                  )}
                  {s.links.map((l) => {
                    const childActive = pathname === l.href;
                    return (
                      <Link
                        key={l.href}
                        href={l.href}
                        onClick={() => setOpen(null)}
                        className={`group flex items-center gap-2 rounded-md px-2 py-1.5 text-[13px] ${
                          childActive ? "bg-[var(--primary)]/12 text-[var(--primary)]" : "hover:bg-[var(--surface-2)]"
                        }`}
                      >
                        <span
                          className={`h-1.5 w-1.5 shrink-0 rounded-full ${
                            childActive ? "bg-[var(--primary)]" : "bg-[var(--border)] group-hover:bg-[var(--primary)]"
                          }`}
                        />
                        <span className="truncate">{l.label}</span>
                      </Link>
                    );
                  })}
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Người dùng + đăng xuất */}
        <div className="relative shrink-0">
          <button
            onClick={() => {
              setOpen(null);
              setUserMenu((v) => !v);
            }}
            className={`flex items-center gap-2 rounded-lg px-1.5 py-1.5 text-sm ${
              userMenu ? "bg-[var(--surface-2)]" : "hover:bg-[var(--surface-2)]"
            }`}
          >
            <span className="grid h-8 w-8 place-items-center rounded-full bg-gradient-to-br from-[var(--primary)] to-[var(--purple)] text-xs font-semibold text-white">
              {(user?.fullName ?? "?").charAt(0)}
            </span>
            <span className="hidden text-left leading-tight sm:block">
              <span className="block text-[13px] font-medium">{user?.fullName ?? "Người dùng"}</span>
              <span className="block text-[10px] text-[var(--muted)]">{ROLE_LABEL[role]}</span>
            </span>
            <ChevronDown size={14} className={`opacity-60 transition-transform ${userMenu ? "rotate-180" : ""}`} />
          </button>

          {userMenu && (
            <div className="animate-menu absolute right-0 top-full z-50 mt-1.5 w-56">
              <div className="card shadow-lg-soft overflow-hidden p-1.5">
                <div className="mb-1 flex items-center gap-2.5 border-b border-[var(--border)] px-2.5 pb-2.5 pt-1.5">
                  <span className="grid h-9 w-9 place-items-center rounded-full bg-gradient-to-br from-[var(--primary)] to-[var(--purple)] text-sm font-semibold text-white">
                    {(user?.fullName ?? "?").charAt(0)}
                  </span>
                  <div className="min-w-0">
                    <div className="truncate text-sm font-medium">{user?.fullName}</div>
                    <div className="truncate font-mono text-xs text-[var(--muted)]">@{user?.username}</div>
                  </div>
                </div>
                <button
                  onClick={() => {
                    logout();
                    router.replace("/login");
                  }}
                  className="flex w-full items-center gap-2 rounded-lg px-2.5 py-2 text-sm text-[var(--danger)] hover:bg-[var(--danger-bg)]"
                >
                  <LogOut size={15} /> Đăng xuất
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </header>
  );
}
