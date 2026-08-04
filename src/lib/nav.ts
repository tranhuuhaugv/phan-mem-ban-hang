import type { MenuKey } from "./permissions";

export interface NavLink {
  label: string;
  href: string;
  menu?: MenuKey; // nếu link thuộc một menu khác → ẩn/hiện theo quyền của menu đó
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
  "nhap-kho": "Nhập kho",
  "chuyen-kho": "Chuyển kho",
  "danh-muc": "Danh mục sản phẩm",
  "thu-may": "Thu máy",
  "dat-hang": "Đặt hàng",
  "sua-chua": "Sửa chữa",
  "thu-chi": "Thu - Chi",
  "hoa-don": "Hoá đơn",
  "khach-hang": "Khách hàng",
  "nha-cung-cap": "Nhà cung cấp",
  "chi-nhanh": "Chi nhánh",
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
      { label: "Biểu đồ doanh thu", href: "/tong-quan" },
      { label: "Báo cáo bán hàng", href: "/tong-quan/ban-hang" },
      { label: "Danh mục sản phẩm", href: "/danh-muc", menu: "danh-muc" },
      { label: "Nhà cung cấp", href: "/nha-cung-cap", menu: "nha-cung-cap" },
      { label: "Chi nhánh", href: "/chi-nhanh", menu: "chi-nhanh" },
    ],
  },
  {
    key: "kho",
    label: "Kho sản phẩm",
    icon: "Boxes",
    color: "#4f46e5",
    href: "/kho",
    links: [{ label: "Danh sách tồn kho", href: "/kho" }],
  },
  {
    key: "nhap-kho",
    label: "Nhập kho",
    icon: "Warehouse",
    color: "#0284c7",
    href: "/kho/phieu-nhap",
    links: [
      { label: "Tạo phiếu nhập", href: "/kho/nhap" },
      { label: "Danh sách phiếu nhập", href: "/kho/phieu-nhap" },
    ],
  },
  {
    key: "chuyen-kho",
    label: "Chuyển kho",
    icon: "ArrowRightLeft",
    color: "#7c3aed",
    href: "/kho/chuyen-kho",
    links: [
      { label: "Tạo phiếu chuyển", href: "/kho/chuyen-kho/tao" },
      { label: "Danh sách phiếu chuyển", href: "/kho/chuyen-kho" },
    ],
  },
  {
    key: "thu-may",
    label: "Thu máy",
    icon: "PackagePlus",
    color: "#0891b2",
    href: "/thu-may",
    links: [
      { label: "Tạo phiếu thu máy", href: "/thu-may/tao" },
      { label: "Danh sách phiếu", href: "/thu-may" },
    ],
  },
  {
    key: "dat-hang",
    label: "Đặt hàng",
    icon: "ShoppingCart",
    color: "#059669",
    href: "/dat-hang",
    links: [
      { label: "Tạo đơn đặt hàng", href: "/dat-hang/tao" },
      { label: "Danh sách đơn hàng", href: "/dat-hang" },
    ],
  },
  {
    key: "sua-chua",
    label: "Sửa chữa",
    icon: "Wrench",
    color: "#ea580c",
    href: "/sua-chua",
    links: [
      { label: "Tạo phiếu sửa chữa", href: "/sua-chua/tao" },
      { label: "Danh sách phiếu", href: "/sua-chua" },
    ],
  },
  {
    key: "thu-chi",
    label: "Thu - Chi",
    icon: "Wallet",
    color: "#e11d48",
    href: "/thu-chi/thu",
    links: [
      { label: "Danh sách phiếu thu", href: "/thu-chi/thu" },
      { label: "Danh sách phiếu chi", href: "/thu-chi/chi" },
    ],
  },
  {
    key: "hoa-don",
    label: "Hoá đơn",
    icon: "ReceiptText",
    color: "#db2777",
    href: "/hoa-don",
    links: [
      { label: "Tạo hoá đơn", href: "/hoa-don/tao" },
      { label: "Danh sách hoá đơn", href: "/hoa-don" },
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
      { label: "Nhật ký thao tác", href: "/cai-dat/nhat-ky" },
      { label: "Cấu hình cửa hàng", href: "/cai-dat/cua-hang" },
    ],
  },
];
