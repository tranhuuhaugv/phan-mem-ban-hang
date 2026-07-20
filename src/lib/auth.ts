// Phiên đăng nhập bằng cookie ký HMAC — dùng cho API routes (server)
import { createHmac, timingSafeEqual } from "node:crypto";
import { cookies } from "next/headers";
import { can, type MenuKey, type Permission } from "./permissions";
import type { Role } from "./types";

const COOKIE_NAME = "session";
const MAX_AGE = 60 * 60 * 24 * 7; // 7 ngày

export interface SessionUser {
  id: string;
  username: string;
  fullName: string;
  role: Role;
}

// Khoá ký lấy từ AUTH_SECRET, fallback dẫn xuất từ DATABASE_URL (có sẵn cả local lẫn Vercel)
function secret(): string {
  return process.env.AUTH_SECRET ?? `kho-laptop:${process.env.DATABASE_URL ?? "dev"}`;
}

function sign(data: string): string {
  return createHmac("sha256", secret()).update(data).digest("base64url");
}

export function createToken(user: SessionUser): string {
  const payload = Buffer.from(JSON.stringify({ ...user, exp: Date.now() + MAX_AGE * 1000 })).toString("base64url");
  return `${payload}.${sign(payload)}`;
}

export function verifyToken(token: string): SessionUser | null {
  const dot = token.lastIndexOf(".");
  if (dot < 0) return null;
  const payload = token.slice(0, dot);
  const sig = token.slice(dot + 1);
  const expected = sign(payload);
  const a = Buffer.from(sig);
  const b = Buffer.from(expected);
  if (a.length !== b.length || !timingSafeEqual(a, b)) return null;
  try {
    const data = JSON.parse(Buffer.from(payload, "base64url").toString());
    if (typeof data.exp !== "number" || data.exp < Date.now()) return null;
    return { id: data.id, username: data.username, fullName: data.fullName, role: data.role };
  } catch {
    return null;
  }
}

export async function setSessionCookie(user: SessionUser) {
  const store = await cookies();
  store.set(COOKIE_NAME, createToken(user), {
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    maxAge: MAX_AGE,
    path: "/",
  });
}

export async function clearSessionCookie() {
  const store = await cookies();
  store.delete(COOKIE_NAME);
}

export async function getSessionUser(): Promise<SessionUser | null> {
  const store = await cookies();
  const token = store.get(COOKIE_NAME)?.value;
  if (!token) return null;
  return verifyToken(token);
}

// ===== Guard dùng trong API route =====

export class HttpError extends Error {
  constructor(
    public status: number,
    message: string,
  ) {
    super(message);
  }
}

export async function requireUser(): Promise<SessionUser> {
  const user = await getSessionUser();
  if (!user) throw new HttpError(401, "Chưa đăng nhập");
  return user;
}

// ===== Quyền động: admin luôn toàn quyền; manager/staff đọc từ DB (fallback ma trận mặc định) =====

export const FULL_PERMISSION: Permission = {
  view: true,
  create: true,
  edit: true,
  remove: true,
  approve: true,
  seeProfit: true,
  seeReport: true,
};

export async function getRolePermission(role: Role, menu: MenuKey): Promise<Permission> {
  if (role === "admin") return FULL_PERMISSION;
  // import động để tránh vòng lặp import (db → không cần ở client)
  const { db } = await import("./db");
  const row = await db.rolePermission.findUnique({ where: { role_menu: { role, menu } } });
  if (!row) return can(role, menu); // chưa cấu hình → dùng mặc định
  return {
    view: row.view,
    create: row.create,
    edit: row.edit,
    remove: row.remove,
    approve: row.approve,
    seeProfit: row.seeProfit,
    seeReport: row.seeReport,
  };
}

// Toàn bộ ma trận quyền của 1 vai trò (trả về cho client render menu)
export async function getRolePermissionMap(role: Role): Promise<Record<MenuKey, Permission>> {
  const menus = Object.keys(
    (await import("./permissions")).PERMISSIONS,
  ) as MenuKey[];
  if (role === "admin") {
    return Object.fromEntries(menus.map((m) => [m, FULL_PERMISSION])) as Record<MenuKey, Permission>;
  }
  const { db } = await import("./db");
  const rows = await db.rolePermission.findMany({ where: { role } });
  const map = {} as Record<MenuKey, Permission>;
  for (const menu of menus) {
    const row = rows.find((r) => r.menu === menu);
    map[menu] = row
      ? {
          view: row.view,
          create: row.create,
          edit: row.edit,
          remove: row.remove,
          approve: row.approve,
          seeProfit: row.seeProfit,
          seeReport: row.seeReport,
        }
      : can(role, menu);
  }
  return map;
}

// Yêu cầu quyền cụ thể trên 1 menu
export async function requirePermission(menu: MenuKey, action: keyof Permission): Promise<SessionUser> {
  const user = await requireUser();
  const p = await getRolePermission(user.role, menu);
  if (!p[action]) throw new HttpError(403, "Không có quyền thực hiện thao tác này");
  return user;
}
