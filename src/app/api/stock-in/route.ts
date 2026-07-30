import { db } from "@/lib/db";
import { requirePermission, HttpError } from "@/lib/auth";
import { handler, ok, serializeMachine } from "@/lib/api-utils";
import type { Condition } from "@/generated/prisma/enums";

// Nhập kho: tạo 1 hoặc nhiều máy vào kho từ 1 mặt hàng.
// Body: { date?, branchId?, supplierId?, category?, name, serial?, salePrice?, description?, quantity?, unitPrice? }
export const POST = handler(async (req: Request) => {
  await requirePermission("nhap-kho", "create");
  const b = await req.json();

  const name = String(b.name ?? "").trim();
  if (!name) throw new HttpError(400, "Nhập Tên sản phẩm (Mặt hàng)");

  const serialInput = String(b.serial ?? "").trim().toUpperCase();
  const quantity = Math.max(1, Math.floor(Number(b.quantity) || 1));
  if (serialInput && quantity > 1) throw new HttpError(400, "Đã nhập Serial thì số lượng phải là 1");

  const unitPrice = Number(b.unitPrice) || 0;
  const salePrice = b.salePrice !== undefined && b.salePrice !== "" && b.salePrice !== null ? Number(b.salePrice) : null;
  const category = b.category ? String(b.category).trim() : null;
  const description = b.description ? String(b.description).trim() : null;
  const branchId = b.branchId ? String(b.branchId) : null;
  const supplierId = b.supplierId ? String(b.supplierId) : null;
  const createdAt = b.date ? new Date(b.date) : undefined;
  if (createdAt && isNaN(createdAt.getTime())) throw new HttpError(400, "Ngày không hợp lệ");

  // Nguồn nhập = tên nhà cung cấp (nếu có)
  let source = "Nhập kho";
  if (supplierId) {
    const sup = await db.supplier.findUnique({ where: { id: supplierId } });
    if (!sup) throw new HttpError(404, "Không tìm thấy nhà cung cấp");
    source = `NCC: ${sup.name}`;
  }

  // Sinh danh sách serial cần tạo
  const serials: string[] = [];
  if (serialInput) {
    const dup = await db.machine.findUnique({ where: { serial: serialInput } });
    if (dup) throw new HttpError(409, `Mã SP ${serialInput} đã tồn tại trong kho`);
    serials.push(serialInput);
  } else {
    const prefix = "SP";
    const pad = 4;
    const last = await db.machine.findFirst({
      where: { serial: { startsWith: prefix } },
      orderBy: { serial: "desc" },
    });
    let n = last ? parseInt(last.serial.slice(prefix.length), 10) || 0 : 0;
    for (let i = 0; i < quantity; i++) {
      n += 1;
      serials.push(`${prefix}${String(n).padStart(pad, "0")}`);
    }
  }

  const base = {
    brand: "",
    model: name,
    cpu: "",
    ram: "",
    storage: "",
    screen: "",
    condition: "like_new" as Condition,
    category,
    purchasePrice: unitPrice,
    salePrice,
    source,
    note: description,
    branchId,
    supplierId,
    ...(createdAt ? { createdAt } : {}),
  };

  const created = await db.$transaction(
    serials.map((serial) => db.machine.create({ data: { serial, ...base } })),
  );

  return ok(
    {
      count: created.length,
      serials: created.map((m) => m.serial),
      machines: created.map(serializeMachine),
    },
    201,
  );
});
