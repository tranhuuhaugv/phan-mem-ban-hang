"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useEffect, useRef, useState } from "react";
import {
  LayoutDashboard,
  Boxes,
  Warehouse,
  ArrowRightLeft,
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
  Menu,
  X,
} from "lucide-react";
import { NAV, type NavItem } from "@/lib/nav";
import { ROLE_LABEL } from "@/lib/types";
import { useRole } from "./role-context";

const ICONS: Record<string, React.ComponentType<{ size?: number; className?: string; style?: React.CSSProperties }>> = {
  LayoutDashboard,
  Boxes,
  Warehouse,
  ArrowRightLeft,
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
  const [left, setLeft] = useState(0);
  const [userMenu, setUserMenu] = useState(false);
  const [drawer, setDrawer] = useState(false);
  const [expanded, setExpanded] = useState<string | null>(null);
  const barRef = useRef<HTMLDivElement>(null);

  const items = NAV.filter((n) => can(n.key).view);
  const openItem = items.find((n) => n.key === open);

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
    setDrawer(false);
  }, [pathname]);

  const isActive = (n: NavItem) =>
    pathname === n.href ||
    pathname.startsWith(n.href + "/") ||
    n.links.some((l) => l.menu && (pathname === l.href || pathname.startsWith(l.href + "/")));

  const toggle = (n: NavItem, e: React.MouseEvent<HTMLButtonElement>) => {
    if (n.links.length <= 1) {
      router.push(n.href);
      return;
    }
    if (open === n.key) {
      setOpen(null);
      return;
    }
    const bar = barRef.current?.getBoundingClientRect();
    const btn = e.currentTarget.getBoundingClientRect();
    if (bar) setLeft(Math.max(0, Math.min(btn.left - bar.left, bar.width - 248)));
    setUserMenu(false);
    setOpen(n.key);
  };

  return (
    <header className="glass sticky top-0 z-40 border-b border-[var(--border)] shadow-sm backdrop-blur-xl">
      <div ref={barRef} className="relative flex h-14 items-center gap-1 px-3 md:px-5">
        {/* Hamburger — chỉ mobile/tablet */}
        <button
          onClick={() => {
            setExpanded(items.find(isActive)?.key ?? null);
            setDrawer(true);
          }}
          className="mr-1 grid h-9 w-9 shrink-0 place-items-center rounded-lg hover:bg-[var(--surface-2)] lg:hidden"
          aria-label="Mở menu"
        >
          <Menu size={20} />
        </button>

        <Link href="/tong-quan" className="flex items-center gap-2.5 pr-2">
          <span className="grid h-8 w-8 place-items-center rounded-lg brand-gradient text-white shadow-md-soft">
            <Laptop size={18} />
          </span>
          <span className="hidden leading-tight sm:block">
            <span className="block text-[13px] font-bold tracking-tight">Kho Laptop</span>
            <span className="block text-[10px] text-[var(--muted)]">Quản lý nội bộ</span>
          </span>
        </Link>

        {/* Đẩy user menu sang phải trên mobile (nav ngang bị ẩn) */}
        <div className="flex-1 lg:hidden" />

        <nav className="hidden flex-1 items-center gap-0.5 overflow-x-auto lg:flex">
          {items.map((n) => {
            const Icon = ICONS[n.icon] ?? Laptop;
            const active = isActive(n) || open === n.key;
            return (
              <button
                key={n.key}
                onClick={(e) => toggle(n, e)}
                style={active ? { backgroundColor: `${n.color}18`, color: n.color } : undefined}
                className={`group flex items-center gap-1.5 whitespace-nowrap rounded-lg px-2.5 py-2 text-[13px] font-medium ${
                  active ? "" : "text-[var(--foreground)] hover:bg-[var(--surface-2)]"
                }`}
              >
                <Icon size={16} className="shrink-0 transition-transform group-hover:scale-110" style={{ color: n.color }} />
                <span className="hidden lg:inline">{n.label}</span>
                {n.links.length > 1 && (
                  <ChevronDown
                    size={13}
                    className={`opacity-50 transition-transform ${open === n.key ? "rotate-180" : ""}`}
                  />
                )}
              </button>
            );
          })}
        </nav>

        {/* Dropdown mục con — render ngoài vùng cuộn, bám màu của mục */}
        {openItem && openItem.links.length > 1 && (
          <div className="animate-menu absolute top-full z-50 mt-1.5 w-60" style={{ left }}>
            <div className="card shadow-lg-soft overflow-hidden p-1.5">
              <div
                className="mb-0.5 flex items-center gap-1.5 px-2.5 pb-1.5 pt-1 text-[10px] font-semibold uppercase tracking-wide"
                style={{ color: openItem.color }}
              >
                <span className="h-2 w-2 rounded-full" style={{ backgroundColor: openItem.color }} />
                {openItem.label}
              </div>
              {openItem.links
                .filter((l) => !l.menu || can(l.menu).view)
                .map((l) => {
                const childActive = pathname === l.href;
                return (
                  <Link
                    key={l.href}
                    href={l.href}
                    onClick={() => setOpen(null)}
                    style={childActive ? { backgroundColor: `${openItem.color}16`, color: openItem.color } : undefined}
                    className={`group flex items-center gap-2.5 rounded-lg px-2.5 py-2 text-[13px] ${
                      childActive ? "" : "hover:bg-[var(--surface-2)]"
                    }`}
                  >
                    <span
                      className="h-1.5 w-1.5 shrink-0 rounded-full transition-colors"
                      style={{ backgroundColor: childActive ? openItem.color : "var(--border)" }}
                    />
                    <span className="truncate">{l.label}</span>
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
            className={`flex items-center gap-2 rounded-lg px-1.5 py-1.5 text-sm ${
              userMenu ? "bg-[var(--surface-2)]" : "hover:bg-[var(--surface-2)]"
            }`}
          >
            <span className="grid h-8 w-8 place-items-center rounded-full brand-gradient text-xs font-semibold text-white">
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
                  <span className="grid h-9 w-9 place-items-center rounded-full brand-gradient text-sm font-semibold text-white">
                    {(user?.fullName ?? "?").charAt(0)}
                  </span>
                  <div className="min-w-0">
                    <div className="truncate text-sm font-medium">{user?.fullName}</div>
                    <div className="truncate font-mono text-xs text-[var(--muted)]">@{user?.username}</div>
                  </div>
                </div>
                <button
                  onClick={async () => {
                    await logout();
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

      {/* Drawer menu — mobile/tablet */}
      {drawer && (
        <div className="fixed inset-0 z-50 lg:hidden">
          <div className="absolute inset-0 bg-black/40 backdrop-blur-sm" onClick={() => setDrawer(false)} />
          <div className="animate-menu absolute left-0 top-0 flex h-full w-[84%] max-w-xs flex-col bg-[var(--surface)] shadow-xl">
            <div className="flex h-14 shrink-0 items-center justify-between border-b border-[var(--border)] px-4">
              <span className="flex items-center gap-2">
                <span className="grid h-8 w-8 place-items-center rounded-lg brand-gradient text-white">
                  <Laptop size={18} />
                </span>
                <span className="text-[13px] font-bold tracking-tight">Kho Laptop</span>
              </span>
              <button onClick={() => setDrawer(false)} className="rounded-lg p-1.5 hover:bg-[var(--surface-2)]" aria-label="Đóng menu">
                <X size={20} />
              </button>
            </div>

            <nav className="flex-1 overflow-y-auto p-2">
              {items.map((n) => {
                const Icon = ICONS[n.icon] ?? Laptop;
                const links = n.links.filter((l) => !l.menu || can(l.menu).view);
                const single = links.length <= 1;
                const active = isActive(n);
                const isOpen = expanded === n.key;
                return (
                  <div key={n.key} className="mb-0.5">
                    <button
                      onClick={() => {
                        if (single) {
                          router.push(n.href);
                          setDrawer(false);
                        } else {
                          setExpanded(isOpen ? null : n.key);
                        }
                      }}
                      style={active ? { backgroundColor: `${n.color}14`, color: n.color } : undefined}
                      className={`flex w-full items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium ${
                        active ? "" : "hover:bg-[var(--surface-2)]"
                      }`}
                    >
                      <Icon size={19} className="shrink-0" style={{ color: n.color }} />
                      <span className="flex-1 text-left">{n.label}</span>
                      {!single && (
                        <ChevronDown size={15} className={`opacity-60 transition-transform ${isOpen ? "rotate-180" : ""}`} />
                      )}
                    </button>
                    {!single && isOpen && (
                      <div className="mb-1 ml-5 border-l border-[var(--border)] pl-2">
                        {links.map((l) => {
                          const childActive = pathname === l.href;
                          return (
                            <Link
                              key={l.href}
                              href={l.href}
                              onClick={() => setDrawer(false)}
                              style={childActive ? { color: n.color } : undefined}
                              className={`flex items-center gap-2.5 rounded-lg px-3 py-2 text-[13px] ${
                                childActive ? "font-medium" : "text-[var(--foreground)] hover:bg-[var(--surface-2)]"
                              }`}
                            >
                              <span
                                className="h-1.5 w-1.5 shrink-0 rounded-full"
                                style={{ backgroundColor: childActive ? n.color : "var(--border)" }}
                              />
                              {l.label}
                            </Link>
                          );
                        })}
                      </div>
                    )}
                  </div>
                );
              })}
            </nav>
          </div>
        </div>
      )}
    </header>
  );
}
