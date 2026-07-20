import bcrypt from "bcryptjs";
import { db } from "@/lib/db";
import { requirePermission, HttpError } from "@/lib/auth";
import { handler, ok, serializeAccount } from "@/lib/api-utils";
import type { Role } from "@/generated/prisma/enums";

export const GET = handler(async () => {
  await requirePermission("cai-dat", "view");
  const rows = await db.account.findMany({ orderBy: { createdAt: "asc" } });
  return ok(rows.map(serializeAccount));
});

export const POST = handler(async (req: Request) => {
  await requirePermission("cai-dat", "create");
  const b = await req.json();
  if (!b.username || !b.password || !b.fullName) throw new HttpError(400, "Nhập đủ tên đăng nhập, mật khẩu, họ tên");
  const row = await db.account.create({
    data: {
      username: String(b.username).trim().toLowerCase(),
      passwordHash: await bcrypt.hash(String(b.password), 10),
      fullName: String(b.fullName).trim(),
      role: (b.role ?? "staff") as Role,
    },
  });
  return ok(serializeAccount(row), 201);
});
