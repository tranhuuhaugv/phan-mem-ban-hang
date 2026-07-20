// Kiểm tra nhanh dữ liệu trong Neon — chạy: npx tsx scripts/dbcheck.ts
import "dotenv/config";
import { PrismaPg } from "@prisma/adapter-pg";
import { PrismaClient } from "../src/generated/prisma/client";

const db = new PrismaClient({ adapter: new PrismaPg({ connectionString: process.env.DATABASE_URL }) });

async function main() {
  const machines = await db.machine.findMany({
    select: { serial: true, model: true, status: true },
    orderBy: { serial: "asc" },
  });
  const accounts = await db.account.findMany({ select: { username: true, role: true } });
  const invoice = await db.invoice.findFirst({ include: { items: true } });
  console.log(
    JSON.stringify(
      {
        machines: machines.length,
        firstMachine: machines[0],
        lastMachine: machines[machines.length - 1],
        accounts: accounts.map((a) => `${a.username}(${a.role})`),
        invoiceItems: invoice?.items.length,
      },
      null,
      1,
    ),
  );
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
