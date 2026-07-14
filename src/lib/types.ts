// ===== Kiểu dữ liệu nghiệp vụ — Phần mềm quản lý kho laptop nội bộ =====

export type Role = "admin" | "manager" | "staff";

export const ROLE_LABEL: Record<Role, string> = {
  admin: "Admin",
  manager: "Quản lý",
  staff: "Nhân viên",
};

// Vòng đời máy trong kho
export type MachineStatus =
  | "ton_kho" // Tồn kho
  | "dat_coc" // Đặt cọc
  | "dang_sua" // Đang sửa
  | "da_ban" // Đã bán
  | "bao_hanh"; // Bảo hành

export const MACHINE_STATUS_LABEL: Record<MachineStatus, string> = {
  ton_kho: "Tồn kho",
  dat_coc: "Đặt cọc",
  dang_sua: "Đang sửa",
  da_ban: "Đã bán",
  bao_hanh: "Bảo hành",
};

export type Condition = "cu" | "like_new" | "new";
export const CONDITION_LABEL: Record<Condition, string> = {
  cu: "Cũ",
  like_new: "Like new",
  new: "Mới",
};

// Kho sản phẩm — Số Serial là khoá duy nhất
export interface Machine {
  id: string;
  serial: string; // khoá duy nhất, không trùng
  brand: string; // Hãng
  model: string;
  cpu: string;
  ram: string;
  storage: string; // Ổ cứng
  screen: string; // Màn hình
  condition: Condition; // Ngoại hình / loại
  purchasePrice: number; // Giá nhập
  source: string; // Nguồn nhập
  status: MachineStatus;
  note?: string;
  createdAt: string; // ngày nhập
}

// Danh mục sản phẩm (Hãng / Model / Cấu hình chuẩn hoá)
export interface Category {
  id: string;
  brand: string;
  model: string;
  cpu: string;
  ram: string;
  storage: string;
  type: Condition; // Cũ / Like new
  machineCount: number; // số máy đang dùng danh mục này (chặn xoá)
}

// Thu máy — mua lại máy cũ từ khách
export type BuyReceiptStatus = "cho_duyet" | "da_duyet" | "tu_choi";
export const BUY_STATUS_LABEL: Record<BuyReceiptStatus, string> = {
  cho_duyet: "Chờ duyệt",
  da_duyet: "Đã duyệt",
  tu_choi: "Từ chối",
};

export interface BuyReceipt {
  id: string;
  code: string; // Mã phiếu
  customerName: string;
  phone: string;
  model: string;
  config: string; // Cấu hình
  condition: string; // Tình trạng máy
  price: number; // Giá thu
  status: BuyReceiptStatus;
  serial?: string; // Serial gán khi duyệt → đẩy vào kho
  date: string;
}

// Đặt hàng — đơn bán, gán Serial cụ thể
export type OrderStatus = "cho_coc" | "da_coc" | "da_giao" | "huy";
export const ORDER_STATUS_LABEL: Record<OrderStatus, string> = {
  cho_coc: "Chờ cọc",
  da_coc: "Đã cọc",
  da_giao: "Đã giao",
  huy: "Huỷ",
};

export interface Order {
  id: string;
  code: string; // Mã đơn
  customerName: string;
  phone: string;
  serial: string; // Serial máy bán (chống bán trùng)
  model: string;
  sellPrice: number; // Giá bán
  deposit: number; // Tiền cọc
  status: OrderStatus;
  date: string;
}

// Sửa chữa
export type RepairStatus = "dang_sua" | "cho_linh_kien" | "hoan_tat";
export const REPAIR_STATUS_LABEL: Record<RepairStatus, string> = {
  dang_sua: "Đang sửa",
  cho_linh_kien: "Chờ linh kiện",
  hoan_tat: "Hoàn tất",
};

export interface Repair {
  id: string;
  code: string; // Mã phiếu
  serial: string;
  model: string;
  errorDesc: string; // Mô tả lỗi
  estCost: number; // Chi phí dự kiến
  actualCost?: number; // Chi phí thực tế
  technician?: string; // Kỹ thuật viên
  receiveDate: string; // Ngày nhận máy
  returnDate?: string; // Ngày trả
  status: RepairStatus;
}

// Thu - Chi
export type CashType = "thu" | "chi";
export interface CashFlow {
  id: string;
  code: string;
  type: CashType;
  date: string;
  amount: number;
  content: string; // Nội dung
  category: string; // Loại chi phí / nguồn thu
  partner?: string; // Người nộp / nhận
}

// Hoá đơn
export interface Invoice {
  id: string;
  code: string; // Mã hoá đơn
  orderCode: string; // Mã đơn hàng liên kết
  customerName: string;
  value: number; // Giá trị
  date: string; // Ngày lập
}

// Bảo hành
export interface Warranty {
  id: string;
  serial: string;
  invoiceCode: string;
  months: number; // Thời hạn bảo hành (tháng)
  condition: string; // Điều kiện bảo hành
  startDate: string;
}

// Khách hàng
export interface Customer {
  id: string;
  name: string;
  phone: string;
  address?: string;
  note?: string;
  totalSpent: number; // tổng đã mua
  orderCount: number;
}

// Tài khoản nhân viên
export type AccountStatus = "active" | "locked";
export interface Account {
  id: string;
  username: string;
  fullName: string;
  role: Role;
  status: AccountStatus;
  lastLogin?: string;
}
