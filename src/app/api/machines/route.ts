import { db } from "@/lib/db";
import { requirePermission, HttpError } from "@/lib/auth";
import { handler, ok, serializeMachine, nextCode } from "@/lib/api-utils";
import type { Condition, MachineStatus } from "@/generated/prisma/enums";

export const GET = handler(async () => {
  await requirePermission("kho", "view");
  const rows = await db.machine.findMany({
    orderBy: { createdAt: "desc" },
    include: { branch: true, supplier: true },
  });
  return ok(rows.map(serializeMachine));
});

export const POST = handler(async (req: Request) => {
  const user = await requirePermission("kho", "create");
  const b = await req.json();

  const serial: string = String(b.serial ?? "").trim().toUpperCase() || (await nextCode("machine", "SP", 4));
  const model = String(b.model ?? "").trim();
  if (!model && !b.brand) throw new HttpError(400, "Nhập tên sản phẩm (Model)");
  const dup = await db.machine.findUnique({ where: { serial } });
  if (dup) throw new HttpError(409, `Mã SP ${serial} đã tồn tại`);

  const salePrice =
    b.salePrice !== undefined && b.salePrice !== "" && b.salePrice !== null ? Number(b.salePrice) : null;

  const row = await db.machine.create({
    data: {
      serial,
      createdByName: user.fullName,
      brand: String(b.brand ?? "").trim(),
      model,
      cpu: String(b.cpu ?? "").trim(),
      ram: String(b.ram ?? "").trim(),
      storage: String(b.storage ?? "").trim(),
      screen: String(b.screen ?? "").trim(),
      condition: (b.condition ?? "like_new") as Condition,
      category: b.category ? String(b.category).trim() : null,
      purchasePrice: Number(b.purchasePrice) || 0,
      salePrice,
      source: String(b.source ?? "").trim() || "Nhập nhanh",
      status: (b.status ?? "ton_kho") as MachineStatus,
      note: b.note ? String(b.note) : null,
      branchId: b.branchId ? String(b.branchId) : null,
      supplierId: b.supplierId ? String(b.supplierId) : null,
    },
    include: { branch: true, supplier: true },
  });
  return ok(serializeMachine(row), 201);
});
