import bcrypt from "bcryptjs";
import { db } from "@/lib/db";
import { requirePermission, requireUser, HttpError } from "@/lib/auth";
import { handler, ok, serializeAccount } from "@/lib/api-utils";
import type { AccountStatus, Role } from "@/generated/prisma/enums";

type Ctx = { params: Promise<{ id: string }> };

// Khoá/mở, đổi vai trò, đặt lại mật khẩu
export const PATCH = handler(async (req: Request, { params }: Ctx) => {
  await requirePermission("cai-dat", "edit");
  const me = await requireUser();
  const { id } = await params;
  const b = await req.json();

  if (b.status === "locked" && me.id === id) throw new HttpError(400, "Không thể tự khoá tài khoản của mình");

  const row = await db.account.update({
    where: { id },
    data: {
      status: b.status !== undefined ? (b.status as AccountStatus) : undefined,
      role: b.role !== undefined ? (b.role as Role) : undefined,
      fullName: b.fullName !== undefined ? String(b.fullName) : undefined,
      passwordHash: b.password ? await bcrypt.hash(String(b.password), 10) : undefined,
    },
  });
  return ok(serializeAccount(row));
});
