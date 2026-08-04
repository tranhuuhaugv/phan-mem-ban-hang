import { db } from "@/lib/db";
import type { SessionUser } from "@/lib/auth";

export type AuditAction = "create" | "update" | "delete" | "pay" | "approve" | "status";
export type AuditEntity = "invoice" | "cashflow" | "stockin" | "order" | "repair" | "buy" | "machine";

// Ghi nhật ký thao tác — không để lỗi ghi log làm hỏng thao tác chính
export async function logAudit(
  user: SessionUser,
  action: AuditAction,
  entity: AuditEntity,
  code?: string | null,
  detail?: string,
): Promise<void> {
  try {
    await db.auditLog.create({
      data: {
        userId: user.id,
        userName: user.fullName,
        role: user.role,
        action,
        entity,
        code: code ?? null,
        detail: detail ?? null,
      },
    });
  } catch {
    // bỏ qua lỗi ghi log
  }
}

const fmt = (n: number) => n.toLocaleString("vi-VN") + "₫";
export { fmt as auditVnd };
