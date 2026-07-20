import bcrypt from "bcryptjs";
import { db } from "@/lib/db";
import { setSessionCookie, getRolePermissionMap, HttpError, type SessionUser } from "@/lib/auth";
import { handler, ok } from "@/lib/api-utils";

export const POST = handler(async (req: Request) => {
  const { username, password } = await req.json();
  if (!username || !password) throw new HttpError(400, "Nhập tên đăng nhập và mật khẩu");

  const acc = await db.account.findUnique({ where: { username: String(username).trim().toLowerCase() } });
  if (!acc) throw new HttpError(401, "Tài khoản không tồn tại");
  if (acc.status === "locked") throw new HttpError(403, "Tài khoản đã bị khoá");

  const okPass = await bcrypt.compare(String(password), acc.passwordHash);
  if (!okPass) throw new HttpError(401, "Sai mật khẩu");

  await db.account.update({ where: { id: acc.id }, data: { lastLogin: new Date() } });

  const user: SessionUser = { id: acc.id, username: acc.username, fullName: acc.fullName, role: acc.role };
  await setSessionCookie(user);
  const permissions = await getRolePermissionMap(acc.role);
  return ok({ user, permissions });
});
