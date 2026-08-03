import { db } from "@/lib/db";
import { requirePermission, HttpError } from "@/lib/auth";
import { handler, ok, serializeRepair, nextCode, upsertCustomer } from "@/lib/api-utils";

export const GET = handler(async () => {
  await requirePermission("sua-chua", "view");
  const rows = await db.repair.findMany({ include: { machine: true, branch: true }, orderBy: { receiveDate: "desc" } });
  return ok(rows.map(serializeRepair));
});

export const POST = handler(async (req: Request) => {
  const user = await requirePermission("sua-chua", "create");
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
  const customerName = b.customerName ? String(b.customerName).trim() : null;
  const customerPhone = b.customerPhone ? String(b.customerPhone).trim() : null;
  const branchId = b.branchId ? String(b.branchId) : null;

  // Khách lấy liền: hoàn tất + thu tiền ngay khi tạo phiếu
  const completeNow = !!b.completeNow;
  const actualCost = completeNow ? Number(b.actualCost) || 0 : null;
  const partsNote = b.note ? String(b.note).trim() : null; // mặt hàng / linh kiện đã thay
  const amountPaid = completeNow ? Math.max(0, Math.round(Number(b.amountPaid) || 0)) : 0;
  const payMethod = b.payMethod === "the" || b.payMethod === "chuyen_khoan" ? b.payMethod : "tien_mat";

  const row = await db.$transaction(async (tx) => {
    // Tự lưu khách vào danh bạ (nếu có SĐT)
    if (customerPhone) await upsertCustomer(tx, customerName ?? "", customerPhone);

    const repair = await tx.repair.create({
      data: {
        code,
        createdByName: user.fullName,
        machineName,
        customerName,
        customerPhone,
        errorDesc: String(b.errorDesc).trim(),
        estCost: Number(b.estCost) || 0,
        actualCost: completeNow ? actualCost : undefined,
        note: partsNote,
        technician: b.technician ? String(b.technician).trim() : null,
        receiveDate: b.receiveDate ? new Date(b.receiveDate) : new Date(),
        returnDate: completeNow ? new Date() : undefined,
        status: completeNow ? "hoan_tat" : b.status === "cho_linh_kien" ? "cho_linh_kien" : "dang_sua",
        machineId,
        branchId,
      },
      include: { machine: true, branch: true },
    });
    if (machineId) {
      // Lấy liền → máy trả về Tồn kho; còn lại → Đang sửa
      await tx.machine.update({ where: { id: machineId }, data: { status: completeNow ? "ton_kho" : "dang_sua" } });
    }
    // Thu tiền ngay
    if (completeNow && amountPaid > 0) {
      const cashCode = await nextCode("cashFlow", "PT-", 4);
      await tx.cashFlow.create({
        data: {
          code: cashCode,
          type: "thu",
          amount: amountPaid,
          content: `Thu tiền sửa chữa - phiếu ${code}`,
          category: "Sửa chữa",
          partner: customerName,
          method: payMethod,
        },
      });
    }
    return repair;
  });
  return ok(serializeRepair(row), 201);
});
