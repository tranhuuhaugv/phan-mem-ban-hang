import { db } from "@/lib/db";
import { requirePermission, HttpError } from "@/lib/auth";
import { handler, ok, serializeRepair, nextCode } from "@/lib/api-utils";

export const GET = handler(async () => {
  await requirePermission("sua-chua", "view");
  const rows = await db.repair.findMany({ include: { machine: true }, orderBy: { receiveDate: "desc" } });
  return ok(rows.map(serializeRepair));
});

export const POST = handler(async (req: Request) => {
  await requirePermission("sua-chua", "create");
  const b = await req.json();
  if (!b.errorDesc) throw new HttpError(400, "Nhập mô tả lỗi");

  // source = "kho" (máy trong kho) | "khach" (máy khách mang tới)
  let machineId: string | null = null;
  let machineName: string | null = null;

  if (b.serial) {
    const machine = await db.machine.findFirst({
      where: { serial: { equals: String(b.serial).trim(), mode: "insensitive" } },
    });
    if (!machine) throw new HttpError(404, "Không tìm thấy máy với Mã SP này");
    machineId = machine.id;
  } else {
    // Máy khách mang tới → bắt buộc có tên máy
    machineName = String(b.machineName ?? "").trim();
    if (!machineName) throw new HttpError(400, "Nhập tên máy khách mang tới (hoặc chọn máy trong kho)");
  }

  const code = await nextCode("repair", "SC-", 4);
  const row = await db.$transaction(async (tx) => {
    const repair = await tx.repair.create({
      data: {
        code,
        machineName,
        customerName: b.customerName ? String(b.customerName).trim() : null,
        customerPhone: b.customerPhone ? String(b.customerPhone).trim() : null,
        errorDesc: String(b.errorDesc).trim(),
        estCost: Number(b.estCost) || 0,
        technician: b.technician ? String(b.technician).trim() : null,
        receiveDate: b.receiveDate ? new Date(b.receiveDate) : new Date(),
        status: b.status === "cho_linh_kien" ? "cho_linh_kien" : "dang_sua",
        machineId,
      },
      include: { machine: true },
    });
    if (machineId) await tx.machine.update({ where: { id: machineId }, data: { status: "dang_sua" } });
    return repair;
  });
  return ok(serializeRepair(row), 201);
});
