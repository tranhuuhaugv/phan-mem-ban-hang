import { db } from "@/lib/db";
import { requireUser, requirePermission } from "@/lib/auth";
import { handler, ok } from "@/lib/api-utils";

const ID = "singleton";

const DEFAULTS = {
  name: "",
  phone: "",
  address: "",
  logoUrl: undefined as string | undefined,
  paperSize: "A5",
  defaultBranch: "",
  thankYou: "Cảm ơn quý khách đã mua hàng! Bảo hành theo phiếu đi kèm.",
};

function serialize(c: {
  name: string;
  phone: string;
  address: string;
  logoUrl: string | null;
  paperSize: string;
  defaultBranch: string;
  thankYou: string;
}) {
  return {
    name: c.name,
    phone: c.phone,
    address: c.address,
    logoUrl: c.logoUrl ?? undefined,
    paperSize: c.paperSize,
    defaultBranch: c.defaultBranch,
    thankYou: c.thankYou,
  };
}

// GET — bất kỳ ai đăng nhập (dùng để in hoá đơn)
export const GET = handler(async () => {
  await requireUser();
  const row = await db.storeConfig.findUnique({ where: { id: ID } });
  return ok(row ? serialize(row) : DEFAULTS);
});

// PUT — chỉ vai trò có quyền sửa Cài đặt
export const PUT = handler(async (req: Request) => {
  await requirePermission("cai-dat", "edit");
  const b = await req.json();
  const str = (v: unknown, d = "") => (v !== undefined && v !== null ? String(v) : d);
  const data = {
    name: str(b.name),
    phone: str(b.phone),
    address: str(b.address),
    logoUrl: b.logoUrl ? String(b.logoUrl) : null,
    paperSize: str(b.paperSize, "A5"),
    defaultBranch: str(b.defaultBranch),
    thankYou: str(b.thankYou),
  };
  const row = await db.storeConfig.upsert({ where: { id: ID }, update: data, create: { id: ID, ...data } });
  return ok(serialize(row));
});
