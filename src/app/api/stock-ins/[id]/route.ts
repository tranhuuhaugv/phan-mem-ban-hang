import { db } from "@/lib/db";
import { requirePermission, HttpError } from "@/lib/auth";
import { handler, ok } from "@/lib/api-utils";

type Ctx = { params: Promise<{ id: string }> };

// Chi tiết 1 phiếu nhập: thông tin + danh sách máy trong phiếu
export const GET = handler(async (_req: Request, { params }: Ctx) => {
  await requirePermission("nhap-kho", "view");
  const { id } = await params;

  const r = await db.stockIn.findUnique({
    where: { id },
    include: { supplier: true, branch: true, machines: { orderBy: { serial: "asc" } } },
  });
  if (!r) throw new HttpError(404, "Không tìm thấy phiếu nhập");

  return ok({
    id: r.id,
    code: r.code,
    date: r.date.toISOString(),
    supplierId: r.supplierId ?? undefined,
    supplierName: r.supplier?.name ?? undefined,
    branchName: r.branch?.name ?? undefined,
    note: r.note ?? undefined,
    total: r.total,
    paid: r.paid,
    debt: r.debt,
    payMethod: r.payMethod ?? undefined,
    items: r.machines.map((m) => ({
      id: m.id,
      serial: m.serial,
      name: m.model,
      category: m.category ?? undefined,
      purchasePrice: m.purchasePrice,
      salePrice: m.salePrice ?? undefined,
      status: m.status,
    })),
  });
});
