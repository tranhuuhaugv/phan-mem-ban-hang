import { db } from "@/lib/db";
import { requirePermission, HttpError } from "@/lib/auth";
import { handler, ok } from "@/lib/api-utils";

// Danh sách phiếu chuyển kho
export const GET = handler(async () => {
  await requirePermission("chuyen-kho", "view");
  const rows = await db.stockTransfer.findMany({
    orderBy: { createdAt: "desc" },
    include: { fromBranch: true, toBranch: true, _count: { select: { items: true } } },
  });
  return ok(
    rows.map((r) => ({
      id: r.id,
      code: r.code,
      date: r.createdAt.toISOString(),
      fromBranch: r.fromBranch?.name ?? undefined,
      toBranch: r.toBranch?.name ?? undefined,
      status: r.status,
      qtySent: r._count.items,
      qtyReceived: r.status === "da_nhan" ? r._count.items : 0,
      createdByName: r.createdByName ?? undefined,
      receivedByName: r.receivedByName ?? undefined,
      receivedAt: r.receivedAt?.toISOString(),
      senderNote: r.senderNote ?? undefined,
    })),
  );
});

interface ItemInput {
  serial?: string;
  note?: string;
}

// Tạo phiếu chuyển: chuyển máy từ chi nhánh này sang chi nhánh khác
export const POST = handler(async (req: Request) => {
  const user = await requirePermission("chuyen-kho", "create");
  const b = await req.json();

  const fromBranchId = b.fromBranchId ? String(b.fromBranchId) : null;
  const toBranchId = b.toBranchId ? String(b.toBranchId) : null;
  if (!fromBranchId || !toBranchId) throw new HttpError(400, "Chọn chi nhánh gửi và chi nhánh nhận");
  if (fromBranchId === toBranchId) throw new HttpError(400, "Chi nhánh gửi và nhận phải khác nhau");

  const rawItems: ItemInput[] = Array.isArray(b.items) ? b.items : [];
  const items = rawItems
    .map((it) => ({ serial: String(it.serial ?? "").trim().toUpperCase(), note: it.note ? String(it.note).trim() : null }))
    .filter((it) => it.serial);
  if (items.length === 0) throw new HttpError(400, "Thêm ít nhất 1 máy để chuyển");

  const serials = items.map((i) => i.serial);
  const dup = serials.find((s, i) => serials.indexOf(s) !== i);
  if (dup) throw new HttpError(400, `Máy ${dup} bị lặp trong phiếu`);

  const machines = await db.machine.findMany({ where: { serial: { in: serials } } });
  const missing = serials.filter((s) => !machines.find((m) => m.serial === s));
  if (missing.length) throw new HttpError(404, `Không tìm thấy máy: ${missing.join(", ")}`);
  const notStock = machines.filter((m) => m.status !== "ton_kho");
  if (notStock.length) throw new HttpError(409, `Máy không tồn kho, không thể chuyển: ${notStock.map((m) => m.serial).join(", ")}`);

  // Không cho chuyển máy đang nằm trong phiếu chuyển khác chưa nhận
  const openItems = await db.stockTransferItem.findMany({
    where: { machineId: { in: machines.map((m) => m.id) }, transfer: { status: "dang_chuyen" } },
    include: { machine: true },
  });
  if (openItems.length)
    throw new HttpError(409, `Máy đang trong phiếu chuyển khác: ${openItems.map((i) => i.machine.serial).join(", ")}`);

  const branches = await db.branch.findMany({ where: { id: { in: [fromBranchId, toBranchId] } } });
  if (branches.length !== 2) throw new HttpError(404, "Chi nhánh không hợp lệ");

  const receipt = await db.$transaction(async (tx) => {
    const last = await tx.stockTransfer.findFirst({ where: { code: { startsWith: "CK-" } }, orderBy: { code: "desc" } });
    const n = last ? (parseInt(last.code.slice(3), 10) || 0) + 1 : 1;
    const code = `CK-${String(n).padStart(4, "0")}`;
    return tx.stockTransfer.create({
      data: {
        code,
        status: "dang_chuyen",
        senderNote: b.senderNote ? String(b.senderNote).trim() : null,
        createdByName: user.fullName,
        fromBranchId,
        toBranchId,
        items: {
          create: items.map((it) => ({
            note: it.note,
            machineId: machines.find((m) => m.serial === it.serial)!.id,
          })),
        },
      },
    });
  });

  return ok({ id: receipt.id, code: receipt.code }, 201);
});
