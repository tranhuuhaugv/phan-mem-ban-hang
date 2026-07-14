import type { Role } from "./types";

// Khoá menu = đường dẫn route
export type MenuKey =
  | "tong-quan"
  | "kho"
  | "danh-muc"
  | "thu-may"
  | "dat-hang"
  | "sua-chua"
  | "thu-chi"
  | "hoa-don"
  | "khach-hang"
  | "cai-dat";

export interface Permission {
  view: boolean;
  create: boolean;
  edit: boolean;
  remove: boolean;
  approve?: boolean; // duyệt phiếu (thu máy)
  seeProfit?: boolean; // thấy lợi nhuận (dashboard)
  seeReport?: boolean; // xem báo cáo lãi/lỗ (thu-chi)
}

const FULL: Permission = { view: true, create: true, edit: true, remove: true };
const NONE: Permission = { view: false, create: false, edit: false, remove: false };

// Ma trận phân quyền — trích đúng từ sheet "PHÂN QUYỀN"
export const PERMISSIONS: Record<MenuKey, Record<Role, Permission>> = {
  "tong-quan": {
    admin: { ...FULL, seeProfit: true },
    manager: { ...FULL, seeProfit: true },
    staff: { view: true, create: false, edit: false, remove: false, seeProfit: false },
  },
  kho: {
    admin: FULL,
    manager: FULL,
    staff: { view: true, create: true, edit: true, remove: false }, // không xoá
  },
  "danh-muc": {
    admin: FULL,
    manager: { view: true, create: true, edit: true, remove: false }, // không xoá gốc
    staff: { view: true, create: false, edit: false, remove: false }, // chỉ xem
  },
  "thu-may": {
    admin: { ...FULL, approve: true },
    manager: { ...FULL, approve: true },
    staff: { view: true, create: true, edit: true, remove: false, approve: false }, // không duyệt
  },
  "dat-hang": {
    admin: FULL,
    manager: FULL,
    staff: { view: true, create: true, edit: true, remove: false },
  },
  "sua-chua": {
    admin: FULL,
    manager: FULL,
    staff: { view: true, create: true, edit: true, remove: false },
  },
  "thu-chi": {
    admin: { ...FULL, seeReport: true },
    manager: { ...FULL, seeReport: true },
    staff: NONE, // không truy cập
  },
  "hoa-don": {
    admin: FULL,
    manager: FULL,
    staff: { view: true, create: true, edit: false, remove: false },
  },
  "khach-hang": {
    admin: FULL,
    manager: FULL,
    staff: { view: true, create: true, edit: false, remove: false },
  },
  "cai-dat": {
    admin: FULL,
    manager: NONE, // chỉ Admin
    staff: NONE,
  },
};

export function can(role: Role, menu: MenuKey): Permission {
  return PERMISSIONS[menu][role];
}
