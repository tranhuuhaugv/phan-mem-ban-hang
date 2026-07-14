"use client";

import { createContext, useContext, useEffect, useState } from "react";
import type { Account, Role } from "@/lib/types";
import { can, type MenuKey, type Permission } from "@/lib/permissions";
import { accounts } from "@/lib/mock-data";

interface AuthCtx {
  ready: boolean; // đã đọc xong localStorage chưa (tránh nháy màn hình)
  user: Account | null;
  role: Role;
  login: (username: string, password: string) => { ok: boolean; error?: string };
  logout: () => void;
  can: (menu: MenuKey) => Permission;
}

const Ctx = createContext<AuthCtx | null>(null);
const STORAGE_KEY = "auth-user";

export function RoleProvider({ children }: { children: React.ReactNode }) {
  const [ready, setReady] = useState(false);
  const [user, setUser] = useState<Account | null>(null);

  useEffect(() => {
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      if (raw) {
        const saved = JSON.parse(raw) as Account;
        // đối chiếu lại với danh sách tài khoản
        const match = accounts.find((a) => a.username === saved.username);
        if (match && match.status === "active") setUser(match);
      }
    } catch {}
    setReady(true);
  }, []);

  const login = (username: string, password: string) => {
    const acc = accounts.find((a) => a.username.toLowerCase() === username.trim().toLowerCase());
    if (!acc) return { ok: false, error: "Tài khoản không tồn tại" };
    if (acc.status === "locked") return { ok: false, error: "Tài khoản đã bị khoá" };
    if (!password.trim()) return { ok: false, error: "Vui lòng nhập mật khẩu" };
    // Demo: chấp nhận mọi mật khẩu — sẽ thay bằng xác thực thật khi làm backend
    setUser(acc);
    localStorage.setItem(STORAGE_KEY, JSON.stringify(acc));
    return { ok: true };
  };

  const logout = () => {
    setUser(null);
    localStorage.removeItem(STORAGE_KEY);
  };

  const role: Role = user?.role ?? "staff";

  return (
    <Ctx.Provider value={{ ready, user, role, login, logout, can: (menu) => can(role, menu) }}>
      {children}
    </Ctx.Provider>
  );
}

export function useRole() {
  const ctx = useContext(Ctx);
  if (!ctx) throw new Error("useRole phải dùng trong RoleProvider");
  return ctx;
}
