import type { MenuKey } from "./permissions";

export interface NavLink {
  label: string;
  href: string;
}
export interface NavSection {
  key: MenuKey; // dùng để kiểm tra quyền
  title: string;
  links: NavLink[];
}
export interface NavGroup {
  id: string;
  label: string;
  icon: string;
  href: string; // trang chính khi bấm
  sections: NavSection[];
}

// Tên hiển thị theo từng quyền (dùng ở trang Phân quyền)
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

// Menu ngang — đã gom nhóm cho gọn (6 nhóm thay vì 10)
export const NAV: NavGroup[] = [
  {
    id: "tong-quan",
    label: "Tổng quan",
    icon: "LayoutDashboard",
    href: "/tong-quan",
    sections: [
      {
        key: "tong-quan",
        title: "Tổng quan",
        links: [
          { label: "Dashboard", href: "/tong-quan" },
          { label: "Biểu đồ doanh thu", href: "/tong-quan#bieu-do" },
        ],
      },
    ],
  },
  {
    id: "kho-hang",
    label: "Kho hàng",
    icon: "Boxes",
    href: "/kho",
    sections: [
      {
        key: "kho",
        title: "Tồn kho",
        links: [
          { label: "Danh sách tồn kho", href: "/kho" },
          { label: "Thêm máy mới", href: "/kho/them" },
          { label: "Tra cứu Serial", href: "/kho/tra-cuu" },
          { label: "Kiểm kê", href: "/kho/kiem-ke" },
        ],
      },
      {
        key: "danh-muc",
        title: "Danh mục",
        links: [{ label: "Danh mục sản phẩm", href: "/danh-muc" }],
      },
      {
        key: "thu-may",
        title: "Thu máy",
        links: [
          { label: "Danh sách phiếu", href: "/thu-may" },
          { label: "Tạo phiếu thu máy", href: "/thu-may/tao" },
        ],
      },
    ],
  },
  {
    id: "ban-hang",
    label: "Bán hàng",
    icon: "ShoppingCart",
    href: "/dat-hang",
    sections: [
      {
        key: "dat-hang",
        title: "Đặt hàng",
        links: [
          { label: "Danh sách đơn hàng", href: "/dat-hang" },
          { label: "Tạo đơn đặt hàng", href: "/dat-hang/tao" },
        ],
      },
      {
        key: "hoa-don",
        title: "Hoá đơn",
        links: [
          { label: "Danh sách hoá đơn", href: "/hoa-don" },
          { label: "Tạo hoá đơn", href: "/hoa-don/tao" },
        ],
      },
      {
        key: "khach-hang",
        title: "Khách hàng",
        links: [{ label: "Danh sách khách hàng", href: "/khach-hang" }],
      },
    ],
  },
  {
    id: "sua-chua",
    label: "Sửa chữa",
    icon: "Wrench",
    href: "/sua-chua",
    sections: [
      {
        key: "sua-chua",
        title: "Sửa chữa",
        links: [
          { label: "Danh sách phiếu", href: "/sua-chua" },
          { label: "Tạo phiếu sửa chữa", href: "/sua-chua/tao" },
        ],
      },
    ],
  },
  {
    id: "thu-chi",
    label: "Thu - Chi",
    icon: "Wallet",
    href: "/thu-chi",
    sections: [
      {
        key: "thu-chi",
        title: "Thu - Chi",
        links: [
          { label: "Sổ quỹ", href: "/thu-chi" },
          { label: "Tạo phiếu thu", href: "/thu-chi/thu" },
          { label: "Tạo phiếu chi", href: "/thu-chi/chi" },
          { label: "Báo cáo lãi/lỗ", href: "/thu-chi/bao-cao" },
        ],
      },
    ],
  },
  {
    id: "cai-dat",
    label: "Cài đặt",
    icon: "Settings",
    href: "/cai-dat",
    sections: [
      {
        key: "cai-dat",
        title: "Cài đặt",
        links: [
          { label: "Tài khoản", href: "/cai-dat" },
          { label: "Phân quyền", href: "/cai-dat/phan-quyen" },
          { label: "Cấu hình cửa hàng", href: "/cai-dat/cua-hang" },
        ],
      },
    ],
  },
];
