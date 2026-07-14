"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useState } from "react";
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
  UserCircle2,
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
  const [open, setOpen] = useState<string | null>(null);
  const [userMenu, setUserMenu] = useState(false);

  const visible = NAV.filter((n) => can(n.key).view);

  return (
    <header className="sticky top-0 z-40 border-b border-[var(--border)] bg-[var(--surface)]/85 backdrop-blur">
      <div className="mx-auto flex h-14 max-w-[1400px] items-center gap-2 px-4">
        <Link href="/tong-quan" className="flex items-center gap-2 pr-2">
          <span className="grid h-8 w-8 place-items-center rounded-lg bg-[var(--primary)] text-white">
            <Laptop size={18} />
          </span>
          <span className="hidden text-sm font-semibold leading-tight sm:block">
            Kho Laptop
            <span className="block text-[11px] font-normal text-[var(--muted)]">Quản lý nội bộ</span>
          </span>
        </Link>

        <nav className="flex flex-1 items-center gap-0.5 overflow-x-auto">
          {visible.map((item) => {
            const Icon = ICONS[item.icon] ?? Laptop;
            const active = pathname === item.href || pathname.startsWith(item.href + "/");
            return (
              <div
                key={item.key}
                className="relative"
                onMouseEnter={() => setOpen(item.key)}
                onMouseLeave={() => setOpen(null)}
              >
                <Link
                  href={item.href}
                  className={`flex items-center gap-1.5 whitespace-nowrap rounded-lg px-2.5 py-2 text-sm font-medium transition-colors ${
                    active
                      ? "bg-[var(--primary)]/12 text-[var(--primary)]"
                      : "text-[var(--foreground)] hover:bg-[var(--surface-2)]"
                  }`}
                >
                  <Icon size={16} />
                  <span className="hidden lg:inline">{item.label}</span>
                  {item.children.length > 1 && <ChevronDown size={13} className="opacity-60" />}
                </Link>

                {open === item.key && item.children.length > 1 && (
                  <div className="absolute left-0 top-full w-56 pt-1">
                    <div className="card overflow-hidden py-1 shadow-lg">
                      {item.children.map((c) => (
                        <Link
                          key={c.href}
                          href={c.href}
                          className="block px-3 py-2 text-sm hover:bg-[var(--surface-2)]"
                        >
                          {c.label}
                        </Link>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            );
          })}
        </nav>

        {/* Người dùng đăng nhập + đăng xuất */}
        <div className="relative" onMouseLeave={() => setUserMenu(false)}>
          <button
            onClick={() => setUserMenu((v) => !v)}
            className="flex items-center gap-2 rounded-lg px-2 py-1.5 text-sm hover:bg-[var(--surface-2)]"
          >
            <UserCircle2 size={24} className="text-[var(--muted)]" />
            <span className="hidden text-left leading-tight sm:block">
              <span className="block text-sm font-medium">{user?.fullName ?? "Người dùng"}</span>
              <span className="block text-[11px] text-[var(--muted)]">{ROLE_LABEL[role]}</span>
            </span>
            <ChevronDown size={14} className="opacity-60" />
          </button>

          {userMenu && (
            <div className="absolute right-0 top-full w-52 pt-1">
              <div className="card overflow-hidden py-1 shadow-lg">
                <div className="border-b border-[var(--border)] px-3 py-2">
                  <div className="text-sm font-medium">{user?.fullName}</div>
                  <div className="font-mono text-xs text-[var(--muted)]">@{user?.username}</div>
                </div>
                <button
                  onClick={() => {
                    logout();
                    router.replace("/login");
                  }}
                  className="flex w-full items-center gap-2 px-3 py-2 text-sm text-[var(--danger)] hover:bg-[var(--surface-2)]"
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
