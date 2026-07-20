import { db } from "@/lib/db";
import { requirePermission, HttpError } from "@/lib/auth";
import { handler, ok, serializeBuyReceipt, nextCode } from "@/lib/api-utils";

type Ctx = { params: Promise<{ id: string }> };

// Duyệt phiếu thu máy: tạo máy trong kho + ghi phiếu chi + chuyển trạng thái
export const POST = handler(async (req: Request, { params }: Ctx) => {
  await requirePermission("thu-may", "approve");
  const { id } = await params;
  const b = await req.json().catch(() => ({}));

  const receipt = await db.buyReceipt.findUnique({ where: { id } });
  if (!receipt) throw new HttpError(404, "Không tìm thấy phiếu");
  if (receipt.status !== "cho_duyet") throw new HttpError(409, "Phiếu đã được xử lý rồi");

  const serial: string = String(b.serial ?? "").trim().toUpperCase() || (await nextCode("machine", "SP", 4));
  const dup = await db.machine.findUnique({ where: { serial } });
  if (dup) throw new HttpError(409, `Mã SP ${serial} đã tồn tại trong kho`);

  // Tách config "i7/16GB/512GB" (nếu có) để điền cấu hình máy
  const parts = receipt.config.split("/").map((s) => s.trim());
  const cashCode = await nextCode("cashFlow", "PC-", 4);

  const [machine, updated] = await db.$transaction(async (tx) => {
    const machine = await tx.machine.create({
      data: {
        serial,
        brand: receipt.model.split(" ")[0] ?? "",
        model: receipt.model,
        cpu: parts[0] ?? "",
        ram: parts[1] ?? "",
        storage: parts[2] ?? "",
        screen: "",
        condition: "cu",
        purchasePrice: receipt.price,
        source: `Thu cũ - ${receipt.customerName}`,
        note: receipt.condition || null,
      },
    });
    const updated = await tx.buyReceipt.update({
      where: { id },
      data: { status: "da_duyet", machineId: machine.id },
      include: { machine: true },
    });
    await tx.cashFlow.create({
      data: {
        code: cashCode,
        type: "chi",
        amount: receipt.price,
        content: `Chi mua máy - phiếu ${receipt.code}`,
        category: "Thu mua máy",
        partner: receipt.customerName,
      },
    });
    return [machine, updated] as const;
  });

  return ok({ receipt: serializeBuyReceipt(updated), machineSerial: machine.serial });
});
