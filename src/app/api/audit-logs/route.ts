import type { NextRequest } from "next/server";
import { db } from "@/lib/db";
import { requireUser, HttpError } from "@/lib/auth";
import { handler, ok } from "@/lib/api-utils";
import type { Prisma } from "@/generated/prisma/client";

// Nhật ký thao tác — chỉ Admin/Quản lý xem
export const GET = handler(async (req: NextRequest) => {
  const user = await requireUser();
  if (user.role !== "admin") throw new HttpError(403, "Chỉ Admin xem được nhật ký");

  const sp = req.nextUrl.searchParams;
  const entity = sp.get("entity");
  const action = sp.get("action");
  const q = sp.get("q")?.trim();
  const from = sp.get("from");
  const to = sp.get("to");

  const where: Prisma.AuditLogWhereInput = {};
  if (entity) where.entity = entity;
  if (action) where.action = action;
  if (from || to) {
    const at: Prisma.DateTimeFilter = {};
    if (from) {
      const [y, m, d] = from.split("-").map(Number);
      at.gte = new Date(y, m - 1, d);
    }
    if (to) {
      const [y, m, d] = to.split("-").map(Number);
      at.lt = new Date(y, m - 1, d + 1);
    }
    where.at = at;
  }
  if (q) {
    where.OR = [
      { code: { contains: q, mode: "insensitive" } },
      { detail: { contains: q, mode: "insensitive" } },
      { userName: { contains: q, mode: "insensitive" } },
    ];
  }

  const rows = await db.auditLog.findMany({ where, orderBy: { at: "desc" }, take: 300 });
  return ok(
    rows.map((r) => ({
      id: r.id,
      at: r.at.toISOString(),
      userName: r.userName,
      role: r.role ?? undefined,
      action: r.action,
      entity: r.entity,
      code: r.code ?? undefined,
      detail: r.detail ?? undefined,
    })),
  );
});
