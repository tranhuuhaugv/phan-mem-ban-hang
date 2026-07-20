import { db } from "@/lib/db";
import { requirePermission, getRolePermissionMap, HttpError } from "@/lib/auth";
import { handler, ok } from "@/lib/api-utils";
import { PERMISSIONS, type MenuKey } from "@/lib/permissions";
import type { Role } from "@/lib/types";

// Ma trận quyền hiện hành của manager + staff (admin luôn toàn quyền)
export const GET = handler(async () => {
  await requirePermission("cai-dat", "view");
  const [manager, staff] = await Promise.all([getRolePermissionMap("manager"), getRolePermissionMap("staff")]);
  return ok({ manager, staff });
});

// Cập nhật 1 ô quyền: { role, menu, view/create/edit/remove/approve/seeProfit/seeReport }
export const PATCH = handler(async (req: Request) => {
  await requirePermission("cai-dat", "edit");
  const b = await req.json();
  const role = b.role as Role;
  const menu = b.menu as MenuKey;

  if (role !== "manager" && role !== "staff") throw new HttpError(400, "Chỉ chỉnh được quyền của Quản lý và Nhân viên");
  if (!Object.keys(PERMISSIONS).includes(menu)) throw new HttpError(400, "Menu không hợp lệ");

  // Giá trị hiện hành làm nền, ghi đè các cờ được gửi lên
  const current = (await getRolePermissionMap(role))[menu];
  const flags = {
    view: b.view !== undefined ? !!b.view : current.view,
    create: b.create !== undefined ? !!b.create : (current.create ?? false),
    edit: b.edit !== undefined ? !!b.edit : (current.edit ?? false),
    remove: b.remove !== undefined ? !!b.remove : (current.remove ?? false),
    approve: b.approve !== undefined ? !!b.approve : (current.approve ?? false),
    seeProfit: b.seeProfit !== undefined ? !!b.seeProfit : (current.seeProfit ?? false),
    seeReport: b.seeReport !== undefined ? !!b.seeReport : (current.seeReport ?? false),
  };

  const row = await db.rolePermission.upsert({
    where: { role_menu: { role, menu } },
    update: flags,
    create: { role, menu, ...flags },
  });
  return ok(row);
});
