// Nạp quyền mặc định vào bảng RolePermission (không đụng dữ liệu khác)
// Chạy: npx tsx scripts/seed-permissions.ts
import "dotenv/config";
import { PrismaPg } from "@prisma/adapter-pg";
import { PrismaClient } from "../src/generated/prisma/client";
import { PERMISSIONS, type MenuKey } from "../src/lib/permissions";

const db = new PrismaClient({ adapter: new PrismaPg({ connectionString: process.env.DATABASE_URL }) });

async function main() {
  for (const role of ["manager", "staff"] as const) {
    for (const menu of Object.keys(PERMISSIONS) as MenuKey[]) {
      const p = PERMISSIONS[menu][role];
      const flags = {
        view: p.view,
        create: p.create,
        edit: p.edit,
        remove: p.remove,
        approve: p.approve ?? false,
        seeProfit: p.seeProfit ?? false,
        seeReport: p.seeReport ?? false,
      };
      await db.rolePermission.upsert({
        where: { role_menu: { role, menu } },
        update: {},
        create: { role, menu, ...flags },
      });
    }
  }
  console.log("Đã nạp quyền mặc định:", await db.rolePermission.count(), "dòng");
}

main()
  .catch((e) => {
    console.error(e);
    process.exitCode = 1;
  })
  .finally(async () => {
    await db.$disconnect();
    process.exit();
  });
