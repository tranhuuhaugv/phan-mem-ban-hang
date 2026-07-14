"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useEffect, useRef, useState } from "react";
import {
  LayoutDashboard,
  Boxes,
  Tags,
  PackagePlus,
  ShoppingCart,
  Wrench,
  Wallet,
  ReceiptText,
  Users,
  Settings,
  Laptop,
  ChevronDown,
  LogOut,
} from "lucide-react";
import { NAV } from "@/lib/nav";
import { ROLE_LABEL } from "@/lib/types";
import { useRole } from "./role-context";

const ICONS: Record<string, React.ComponentType<{ size?: number; className?: string }>> = {
  LayoutDashboard,
  Boxes,
  Tags,
  PackagePlus,
  ShoppingCart,
  Wrench,
  Wallet,
  ReceiptText,
  Users,
  Settings,
};

export function Topbar() {
  const pathname = usePathname();
  const router = useRouter();
  const { role, user, logout, can } = useRole();
  const [open, setOpen] = useState<string | null>(null); // menu key đang mở
  const [left, setLeft] = useState(0); // vị trí ngang của dropdown (px, so với barRef)
  const [userMenu, setUserMenu] = useState(false);
  const barRef = useRef<HTMLDivElement>(null);

  const visible = NAV.filter((n) => can(n.key).view);
  const openItem = visible.find((n) => n.key === open);

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

  const toggleMenu = (key: string, hasMenu: boolean, href: string, e: React.MouseEvent<HTMLButtonElement>) => {
    if (!hasMenu) {
      router.push(href);
      return;
    }
    if (open === key) {
      setOpen(null);
      return;
    }
    const bar = barRef.current?.getBoundingClientRect();
    const btn = e.currentTarget.getBoundingClientRect();
    if (bar) {
      // canh trái dropdown theo nút, không tràn khỏi thanh
      const maxLeft = bar.width - 240;
      setLeft(Math.min(btn.left - bar.left, Math.max(0, maxLeft)));
    }
    setUserMenu(false);
    setOpen(key);
  };

  return (
    <header className="sticky top-0 z-40 border-b border-[var(--border)] bg-[var(--surface)]/80 shadow-sm backdrop-blur-xl">
      <div ref={barRef} className="relative mx-auto flex h-15 max-w-[1400px] items-center gap-1 px-4">
        <Link href="/tong-quan" className="flex items-center gap-2.5 pr-3">
          <span className="grid h-9 w-9 place-items-center rounded-xl bg-gradient-to-br from-[var(--primary)] to-[var(--purple)] text-white shadow-md-soft">
            <Laptop size={19} />
          </span>
          <span className="hidden leading-tight sm:block">
            <span className="block text-sm font-bold tracking-tight">Kho Laptop</span>
            <span className="block text-[11px] text-[var(--muted)]">Quản lý nội bộ</span>
          </span>
        </Link>

        <nav className="flex flex-1 items-center gap-0.5 overflow-x-auto">
          {visible.map((item) => {
            const Icon = ICONS[item.icon] ?? Laptop;
            const active = pathname === item.href || pathname.startsWith(item.href + "/");
            const hasMenu = item.children.length > 1;
            const isOpen = open === item.key;
            return (
              <button
                key={item.key}
                onClick={(e) => toggleMenu(item.key, hasMenu, item.href, e)}
                className={`flex items-center gap-1.5 whitespace-nowrap rounded-xl px-3 py-2 text-sm font-medium ${
                  active || isOpen
                    ? "bg-[var(--primary)]/12 text-[var(--primary)]"
                    : "text-[var(--foreground)] hover:bg-[var(--surface-2)]"
                }`}
              >
                <Icon size={16} />
                <span className="hidden lg:inline">{item.label}</span>
                {hasMenu && (
                  <ChevronDown size={13} className={`opacity-60 transition-transform ${isOpen ? "rotate-180" : ""}`} />
                )}
              </button>
            );
          })}
        </nav>

        {/* Dropdown menu con — render ngoài vùng cuộn để không bị cắt */}
        {openItem && (
          <div className="animate-menu absolute top-full z-50 mt-1.5 w-60" style={{ left }}>
            <div className="card shadow-lg-soft overflow-hidden p-1.5">
              <div className="px-2.5 pb-1.5 pt-1 text-[11px] font-semibold uppercase tracking-wide text-[var(--muted)]">
                {openItem.label}
              </div>
              {openItem.children.map((c) => {
                const childActive = pathname === c.href;
                return (
                  <Link
                    key={c.href}
                    href={c.href}
                    onClick={() => setOpen(null)}
                    className={`group flex items-center gap-2.5 rounded-lg px-2.5 py-2 text-sm ${
                      childActive ? "bg-[var(--primary)]/12 text-[var(--primary)]" : "hover:bg-[var(--surface-2)]"
                    }`}
                  >
                    <span
                      className={`h-1.5 w-1.5 rounded-full ${
                        childActive ? "bg-[var(--primary)]" : "bg-[var(--border)] group-hover:bg-[var(--primary)]"
                      }`}
                    />
                    {c.label}
                  </Link>
                );
              })}
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
            className={`flex items-center gap-2 rounded-xl px-2 py-1.5 text-sm ${
              userMenu ? "bg-[var(--surface-2)]" : "hover:bg-[var(--surface-2)]"
            }`}
          >
            <span className="grid h-8 w-8 place-items-center rounded-full bg-gradient-to-br from-[var(--primary)] to-[var(--purple)] text-xs font-semibold text-white">
              {(user?.fullName ?? "?").charAt(0)}
            </span>
            <span className="hidden text-left leading-tight sm:block">
              <span className="block text-sm font-medium">{user?.fullName ?? "Người dùng"}</span>
              <span className="block text-[11px] text-[var(--muted)]">{ROLE_LABEL[role]}</span>
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
