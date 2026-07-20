"use client";

import { createContext, useContext, useEffect, useState } from "react";
import type { Role } from "@/lib/types";
import { can, type MenuKey, type Permission } from "@/lib/permissions";
import { api, apiPost } from "@/lib/api";

export interface AuthUser {
  id: string;
  username: string;
  fullName: string;
  role: Role;
}

type PermissionMap = Record<MenuKey, Permission>;

interface AuthCtx {
  ready: boolean; // đã hỏi xong server phiên hiện tại chưa
  user: AuthUser | null;
  role: Role;
  login: (username: string, password: string) => Promise<{ ok: boolean; error?: string }>;
  logout: () => Promise<void>;
  can: (menu: MenuKey) => Permission;
}

const Ctx = createContext<AuthCtx | null>(null);

export function RoleProvider({ children }: { children: React.ReactNode }) {
  const [ready, setReady] = useState(false);
  const [user, setUser] = useState<AuthUser | null>(null);
  const [perms, setPerms] = useState<PermissionMap | null>(null);

  // Hỏi server xem cookie phiên còn hạn không (kèm ma trận quyền hiện hành)
  useEffect(() => {
    api<{ user: AuthUser | null; permissions: PermissionMap | null }>("/api/auth/me")
      .then((d) => {
        setUser(d.user);
        setPerms(d.permissions);
      })
      .catch(() => setUser(null))
      .finally(() => setReady(true));
  }, []);

  const login = async (username: string, password: string) => {
    try {
      const d = await apiPost<{ user: AuthUser; permissions: PermissionMap }>("/api/auth/login", {
        username,
        password,
      });
      setUser(d.user);
      setPerms(d.permissions);
      return { ok: true };
    } catch (e) {
      return { ok: false, error: e instanceof Error ? e.message : "Đăng nhập thất bại" };
    }
  };

  const logout = async () => {
    try {
      await apiPost("/api/auth/logout", {});
    } catch {}
    setUser(null);
    setPerms(null);
  };

  const role: Role = user?.role ?? "staff";
  // Ưu tiên quyền server trả về (đã tính chỉnh sửa động); fallback ma trận mặc định
  const canFn = (menu: MenuKey): Permission => perms?.[menu] ?? can(role, menu);

  return (
    <Ctx.Provider value={{ ready, user, role, login, logout, can: canFn }}>{children}</Ctx.Provider>
  );
}

export function useRole() {
  const ctx = useContext(Ctx);
  if (!ctx) throw new Error("useRole phải dùng trong RoleProvider");
  return ctx;
}
