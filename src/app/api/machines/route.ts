import { db } from "@/lib/db";
import { requirePermission, HttpError } from "@/lib/auth";
import { handler, ok, serializeMachine, nextCode } from "@/lib/api-utils";
import type { Condition, MachineStatus } from "@/generated/prisma/enums";

export const GET = handler(async () => {
  await requirePermission("kho", "view");
  const rows = await db.machine.findMany({ orderBy: { createdAt: "desc" } });
  return ok(rows.map(serializeMachine));
});

export const POST = handler(async (req: Request) => {
  await requirePermission("kho", "create");
  const b = await req.json();

  const serial: string = String(b.serial ?? "").trim().toUpperCase() || (await nextCode("machine", "SP", 4));
  if (!b.brand || !b.model) throw new HttpError(400, "Nhập Hãng và Model");

  const row = await db.machine.create({
    data: {
      serial,
      brand: String(b.brand).trim(),
      model: String(b.model).trim(),
      cpu: String(b.cpu ?? "").trim(),
      ram: String(b.ram ?? "").trim(),
      storage: String(b.storage ?? "").trim(),
      screen: String(b.screen ?? "").trim(),
      condition: (b.condition ?? "like_new") as Condition,
      category: b.category ? String(b.category).trim() : null,
      purchasePrice: Number(b.purchasePrice) || 0,
      source: String(b.source ?? "").trim(),
      status: (b.status ?? "ton_kho") as MachineStatus,
      note: b.note ? String(b.note) : null,
    },
  });
  return ok(serializeMachine(row), 201);
});
