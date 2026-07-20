import type { MenuKey } from "./permissions";

export interface NavLink {
  label: string;
  href: string;
}
export interface NavItem {
  key: MenuKey;
  label: string;
  icon: string;
  color: string; // màu riêng của mục (hex 6 số)
  href: string;
  links: NavLink[];
}

export const MENU_LABEL: Record<MenuKey, string> = {
  "tong-quan": "Tổng quan",
  kho: "Kho sản phẩm",
  "danh-muc": "Danh mục sản phẩm",
  "thu-may": "Thu máy",
  "dat-hang": "Đặt hàng",
  "sua-chua": "Sửa chữa",
  "thu-chi": "Thu - Chi",
  "hoa-don": "Hoá đơn",
  "khach-hang": "Khách hàng",
  "cai-dat": "Cài đặt",
};

// Menu ngang 10 mục — mỗi mục 1 màu riêng cho sinh động, hiện đại
export const NAV: NavItem[] = [
  {
    key: "tong-quan",
    label: "Tổng quan",
    icon: "LayoutDashboard",
    color: "#2563eb",
    href: "/tong-quan",
    links: [
      { label: "Dashboard", href: "/tong-quan" },
      { label: "Biểu đồ doanh thu", href: "/tong-quan#bieu-do" },
    ],
  },
  {
    key: "kho",
    label: "Kho sản phẩm",
    icon: "Boxes",
    color: "#4f46e5",
    href: "/kho",
    links: [
      { label: "Danh sách tồn kho", href: "/kho" },
      { label: "Thêm máy mới", href: "/kho/them" },
      { label: "Kiểm kê", href: "/kho/kiem-ke" },
    ],
  },
  {
    key: "danh-muc",
    label: "Danh mục",
    icon: "Tags",
    color: "#7c3aed",
    href: "/danh-muc",
    links: [{ label: "Danh mục sản phẩm", href: "/danh-muc" }],
  },
  {
    key: "thu-may",
    label: "Thu máy",
    icon: "PackagePlus",
    color: "#0891b2",
    href: "/thu-may",
    links: [
      { label: "Danh sách phiếu", href: "/thu-may" },
      { label: "Tạo phiếu thu máy", href: "/thu-may/tao" },
    ],
  },
  {
    key: "dat-hang",
    label: "Đặt hàng",
    icon: "ShoppingCart",
    color: "#059669",
    href: "/dat-hang",
    links: [
      { label: "Danh sách đơn hàng", href: "/dat-hang" },
      { label: "Tạo đơn đặt hàng", href: "/dat-hang/tao" },
    ],
  },
  {
    key: "sua-chua",
    label: "Sửa chữa",
    icon: "Wrench",
    color: "#ea580c",
    href: "/sua-chua",
    links: [
      { label: "Danh sách phiếu", href: "/sua-chua" },
      { label: "Tạo phiếu sửa chữa", href: "/sua-chua/tao" },
    ],
  },
  {
    key: "thu-chi",
    label: "Thu - Chi",
    icon: "Wallet",
    color: "#e11d48",
    href: "/thu-chi",
    links: [
      { label: "Sổ quỹ", href: "/thu-chi" },
      { label: "Tạo phiếu thu", href: "/thu-chi/thu" },
      { label: "Tạo phiếu chi", href: "/thu-chi/chi" },
      { label: "Báo cáo lãi/lỗ", href: "/thu-chi/bao-cao" },
    ],
  },
  {
    key: "hoa-don",
    label: "Hoá đơn",
    icon: "ReceiptText",
    color: "#db2777",
    href: "/hoa-don",
    links: [
      { label: "Danh sách hoá đơn", href: "/hoa-don" },
      { label: "Tạo hoá đơn", href: "/hoa-don/tao" },
    ],
  },
  {
    key: "khach-hang",
    label: "Khách hàng",
    icon: "Users",
    color: "#0d9488",
    href: "/khach-hang",
    links: [{ label: "Danh sách khách hàng", href: "/khach-hang" }],
  },
  {
    key: "cai-dat",
    label: "Cài đặt",
    icon: "Settings",
    color: "#64748b",
    href: "/cai-dat",
    links: [
      { label: "Tài khoản", href: "/cai-dat" },
      { label: "Phân quyền", href: "/cai-dat/phan-quyen" },
      { label: "Cấu hình cửa hàng", href: "/cai-dat/cua-hang" },
    ],
  },
];
