import type { MenuKey } from "./permissions";

export interface NavItem {
  key: MenuKey;
  label: string;
  href: string;
  icon: string; // tên icon lucide
  children: { label: string; href: string }[];
}

// Thanh menu ngang — đúng theo sheet "SƠ ĐỒ"
export const NAV: NavItem[] = [
  {
    key: "tong-quan",
    label: "Tổng quan",
    href: "/tong-quan",
    icon: "LayoutDashboard",
    children: [
      { label: "Dashboard", href: "/tong-quan" },
      { label: "Biểu đồ", href: "/tong-quan#bieu-do" },
    ],
  },
  {
    key: "kho",
    label: "Kho sản phẩm",
    href: "/kho",
    icon: "Boxes",
    children: [
      { label: "Danh sách tồn kho", href: "/kho" },
      { label: "Thêm máy mới", href: "/kho/them" },
      { label: "Tra cứu Serial", href: "/kho/tra-cuu" },
      { label: "Kiểm kê", href: "/kho/kiem-ke" },
    ],
  },
  {
    key: "danh-muc",
    label: "Danh mục SP",
    href: "/danh-muc",
    icon: "Tags",
    children: [
      { label: "Danh sách danh mục", href: "/danh-muc" },
      { label: "Tạo danh mục", href: "/danh-muc/tao" },
    ],
  },
  {
    key: "thu-may",
    label: "Thu máy",
    href: "/thu-may",
    icon: "PackagePlus",
    children: [
      { label: "Danh sách phiếu", href: "/thu-may" },
      { label: "Tạo phiếu thu máy", href: "/thu-may/tao" },
    ],
  },
  {
    key: "dat-hang",
    label: "Đặt hàng",
    href: "/dat-hang",
    icon: "ShoppingCart",
    children: [
      { label: "Danh sách đơn hàng", href: "/dat-hang" },
      { label: "Tạo đơn đặt hàng", href: "/dat-hang/tao" },
    ],
  },
  {
    key: "sua-chua",
    label: "Sửa chữa",
    href: "/sua-chua",
    icon: "Wrench",
    children: [
      { label: "Danh sách phiếu", href: "/sua-chua" },
      { label: "Tạo phiếu sửa chữa", href: "/sua-chua/tao" },
    ],
  },
  {
    key: "thu-chi",
    label: "Thu - Chi",
    href: "/thu-chi",
    icon: "Wallet",
    children: [
      { label: "Sổ quỹ", href: "/thu-chi" },
      { label: "Tạo phiếu thu", href: "/thu-chi/thu" },
      { label: "Tạo phiếu chi", href: "/thu-chi/chi" },
      { label: "Báo cáo lãi/lỗ", href: "/thu-chi/bao-cao" },
    ],
  },
  {
    key: "hoa-don",
    label: "Hoá đơn",
    href: "/hoa-don",
    icon: "ReceiptText",
    children: [
      { label: "Danh sách hoá đơn", href: "/hoa-don" },
      { label: "Tạo hoá đơn", href: "/hoa-don/tao" },
    ],
  },
  {
    key: "khach-hang",
    label: "Khách hàng",
    href: "/khach-hang",
    icon: "Users",
    children: [{ label: "Danh sách khách hàng", href: "/khach-hang" }],
  },
  {
    key: "cai-dat",
    label: "Cài đặt",
    href: "/cai-dat",
    icon: "Settings",
    children: [
      { label: "Tài khoản", href: "/cai-dat" },
      { label: "Phân quyền", href: "/cai-dat/phan-quyen" },
      { label: "Cấu hình cửa hàng", href: "/cai-dat/cua-hang" },
    ],
  },
];
