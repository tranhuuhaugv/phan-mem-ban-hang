import type {
  Account,
  BuyReceipt,
  CashFlow,
  Category,
  Customer,
  Invoice,
  Machine,
  Order,
  Repair,
  Warranty,
} from "./types";

export const machines: Machine[] = [
  { id: "m1", serial: "DL5420-A1001", brand: "Dell", model: "Latitude 5420", cpu: "i5-1135G7", ram: "16GB", storage: "512GB SSD", screen: "14 FHD", condition: "like_new", purchasePrice: 8500000, source: "Cửa hàng An Phát", status: "ton_kho", createdAt: "2026-06-28" },
  { id: "m2", serial: "HP840-G8-2210", brand: "HP", model: "EliteBook 840 G8", cpu: "i7-1165G7", ram: "16GB", storage: "512GB SSD", screen: "14 FHD", condition: "like_new", purchasePrice: 11200000, source: "Thu cũ - Anh Tuấn", status: "ton_kho", createdAt: "2026-06-30" },
  { id: "m3", serial: "TP-X1C9-3391", brand: "Lenovo", model: "ThinkPad X1 Carbon Gen9", cpu: "i7-1165G7", ram: "16GB", storage: "1TB SSD", screen: "14 WUXGA", condition: "like_new", purchasePrice: 15500000, source: "Nhập lô HN", status: "dat_coc", createdAt: "2026-07-01" },
  { id: "m4", serial: "AS-VIVO-4402", brand: "Asus", model: "Vivobook 15", cpu: "i3-1115G4", ram: "8GB", storage: "256GB SSD", screen: "15.6 FHD", condition: "cu", purchasePrice: 5200000, source: "Thu cũ - Chị Hoa", status: "dang_sua", createdAt: "2026-07-02" },
  { id: "m5", serial: "MBA-M1-5567", brand: "Apple", model: "MacBook Air M1", cpu: "Apple M1", ram: "8GB", storage: "256GB SSD", screen: "13.3 Retina", condition: "like_new", purchasePrice: 13800000, source: "Nhập lô HCM", status: "da_ban", createdAt: "2026-06-20" },
  { id: "m6", serial: "DL7420-6612", brand: "Dell", model: "Latitude 7420", cpu: "i7-1185G7", ram: "16GB", storage: "512GB SSD", screen: "14 FHD Touch", condition: "like_new", purchasePrice: 12500000, source: "Nhập lô HN", status: "ton_kho", createdAt: "2026-07-03" },
  { id: "m7", serial: "HP450-G9-7788", brand: "HP", model: "ProBook 450 G9", cpu: "i5-1235U", ram: "8GB", storage: "256GB SSD", screen: "15.6 FHD", condition: "cu", purchasePrice: 7800000, source: "Thu cũ - Anh Nam", status: "bao_hanh", createdAt: "2026-05-15" },
  { id: "m8", serial: "AS-ZEN-8890", brand: "Asus", model: "Zenbook 14", cpu: "i5-1240P", ram: "16GB", storage: "512GB SSD", screen: "14 OLED", condition: "like_new", purchasePrice: 14200000, source: "Nhập lô HCM", status: "ton_kho", createdAt: "2026-07-05" },
];

export const categories: Category[] = [
  { id: "c1", brand: "Dell", model: "Latitude 5420", cpu: "i5-1135G7", ram: "16GB", storage: "512GB SSD", type: "like_new", machineCount: 1 },
  { id: "c2", brand: "HP", model: "EliteBook 840 G8", cpu: "i7-1165G7", ram: "16GB", storage: "512GB SSD", type: "like_new", machineCount: 1 },
  { id: "c3", brand: "Lenovo", model: "ThinkPad X1 Carbon Gen9", cpu: "i7-1165G7", ram: "16GB", storage: "1TB SSD", type: "like_new", machineCount: 1 },
  { id: "c4", brand: "Asus", model: "Vivobook 15", cpu: "i3-1115G4", ram: "8GB", storage: "256GB SSD", type: "cu", machineCount: 1 },
  { id: "c5", brand: "Apple", model: "MacBook Air M1", cpu: "Apple M1", ram: "8GB", storage: "256GB SSD", type: "like_new", machineCount: 1 },
];

export const buyReceipts: BuyReceipt[] = [
  { id: "b1", code: "TM-0042", customerName: "Nguyễn Văn Tuấn", phone: "0901234567", model: "HP EliteBook 840 G8", config: "i7/16GB/512GB", condition: "Đẹp 98%, pin tốt", price: 11200000, status: "da_duyet", serial: "HP840-G8-2210", date: "2026-06-30" },
  { id: "b2", code: "TM-0043", customerName: "Trần Thị Hoa", phone: "0912345678", model: "Asus Vivobook 15", config: "i3/8GB/256GB", condition: "Xước nhẹ, cần vệ sinh", price: 5200000, status: "da_duyet", serial: "AS-VIVO-4402", date: "2026-07-02" },
  { id: "b3", code: "TM-0044", customerName: "Lê Minh Nam", phone: "0987654321", model: "Dell XPS 13", config: "i5/8GB/256GB", condition: "Máy đẹp, còn BH hãng", price: 9500000, status: "cho_duyet", date: "2026-07-08" },
  { id: "b4", code: "TM-0045", customerName: "Phạm Quốc Anh", phone: "0977111222", model: "Lenovo ThinkBook 14", config: "i5/16GB/512GB", condition: "Like new", price: 10800000, status: "cho_duyet", date: "2026-07-09" },
];

export const orders: Order[] = [
  { id: "o1", code: "DH-0128", customerName: "Công ty TNHH Sao Việt", phone: "0281234567", serial: "TP-X1C9-3391", model: "Lenovo ThinkPad X1 Carbon Gen9", sellPrice: 18500000, deposit: 5000000, status: "da_coc", date: "2026-07-06" },
  { id: "o2", code: "DH-0127", customerName: "Nguyễn Hải Đăng", phone: "0905556677", serial: "MBA-M1-5567", model: "MacBook Air M1", sellPrice: 16500000, deposit: 16500000, status: "da_giao", date: "2026-06-25" },
  { id: "o3", code: "DH-0129", customerName: "Vũ Thị Lan", phone: "0933444555", serial: "", model: "Dell Latitude 5420", sellPrice: 10500000, deposit: 0, status: "cho_coc", date: "2026-07-09" },
];

export const repairs: Repair[] = [
  { id: "r1", code: "SC-0071", serial: "AS-VIVO-4402", model: "Asus Vivobook 15", errorDesc: "Bàn phím liệt vài phím, cần thay", estCost: 450000, actualCost: 400000, technician: "KTV Hùng", receiveDate: "2026-07-03", status: "dang_sua" },
  { id: "r2", code: "SC-0072", serial: "HP450-G9-7788", model: "HP ProBook 450 G9", errorDesc: "Chai pin, thay pin mới", estCost: 850000, technician: "KTV Sơn", receiveDate: "2026-07-07", status: "cho_linh_kien" },
  { id: "r3", code: "SC-0070", serial: "DL5420-A1001", model: "Dell Latitude 5420", errorDesc: "Vệ sinh, tra keo tản nhiệt", estCost: 200000, actualCost: 200000, technician: "KTV Hùng", receiveDate: "2026-06-29", returnDate: "2026-06-30", status: "hoan_tat" },
];

export const cashFlows: CashFlow[] = [
  { id: "f1", code: "PT-0201", type: "thu", date: "2026-07-06", amount: 5000000, content: "Cọc đơn DH-0128", category: "Bán hàng", partner: "Công ty Sao Việt" },
  { id: "f2", code: "PT-0202", type: "thu", date: "2026-06-25", amount: 16500000, content: "Thanh toán đơn DH-0127", category: "Bán hàng", partner: "Nguyễn Hải Đăng" },
  { id: "f3", code: "PC-0155", type: "chi", date: "2026-07-01", amount: 46500000, content: "Nhập lô 3 máy từ HN", category: "Nhập hàng", partner: "NCC Minh Long" },
  { id: "f4", code: "PC-0156", type: "chi", date: "2026-07-05", amount: 12000000, content: "Tiền mặt bằng tháng 7", category: "Mặt bằng" },
  { id: "f5", code: "PC-0157", type: "chi", date: "2026-07-08", amount: 2500000, content: "Chạy quảng cáo Facebook", category: "Quảng cáo" },
  { id: "f6", code: "PT-0203", type: "thu", date: "2026-07-09", amount: 400000, content: "Thu phí sửa máy SC-0071", category: "Sửa chữa", partner: "Trần Thị Hoa" },
];

export const invoices: Invoice[] = [
  { id: "i1", code: "HD-0098", orderCode: "DH-0127", customerName: "Nguyễn Hải Đăng", value: 16500000, date: "2026-06-25" },
];

export const warranties: Warranty[] = [
  { id: "w1", serial: "MBA-M1-5567", invoiceCode: "HD-0098", months: 6, condition: "BH phần cứng, lỗi NSX 1 đổi 1 trong 15 ngày", startDate: "2026-06-25" },
];

export const customers: Customer[] = [
  { id: "cu1", name: "Công ty TNHH Sao Việt", phone: "0281234567", address: "12 Nguyễn Huệ, Q1, TP.HCM", note: "Khách doanh nghiệp, mua số lượng", totalSpent: 18500000, orderCount: 1 },
  { id: "cu2", name: "Nguyễn Hải Đăng", phone: "0905556677", address: "45 Lê Lợi, Hải Châu, Đà Nẵng", totalSpent: 16500000, orderCount: 1 },
  { id: "cu3", name: "Vũ Thị Lan", phone: "0933444555", address: "88 Trần Phú, Hà Đông, Hà Nội", totalSpent: 0, orderCount: 1 },
  { id: "cu4", name: "Trần Thị Hoa", phone: "0912345678", note: "Từng bán máy cũ + sửa máy", totalSpent: 400000, orderCount: 0 },
];

export const accounts: Account[] = [
  { id: "a1", username: "admin", fullName: "Trần Quản Trị", role: "admin", status: "active", lastLogin: "2026-07-10" },
  { id: "a2", username: "quanly01", fullName: "Lê Thị Quản Lý", role: "manager", status: "active", lastLogin: "2026-07-09" },
  { id: "a3", username: "nhanvien01", fullName: "Phạm Văn Nhân", role: "staff", status: "active", lastLogin: "2026-07-10" },
  { id: "a4", username: "nhanvien02", fullName: "Đỗ Thị Viên", role: "staff", status: "locked", lastLogin: "2026-06-20" },
];

// ===== Số liệu tổng hợp cho Dashboard =====
export const dashboardStats = {
  revenueToday: 400000,
  revenueMonth: 21900000,
  expenseMonth: 61000000,
  profitMonth: 21900000 - 0, // demo — thực tế tính từ giá vốn
  stockCount: machines.filter((m) => m.status === "ton_kho").length,
  pendingBuy: buyReceipts.filter((b) => b.status === "cho_duyet").length,
  pendingOrders: orders.filter((o) => o.status === "cho_coc").length,
  repairing: repairs.filter((r) => r.status !== "hoan_tat").length,
};

// Doanh thu 7 ngày gần nhất (demo biểu đồ)
export const revenueSeries = [
  { day: "04/07", revenue: 0, profit: 0 },
  { day: "05/07", revenue: 0, profit: 0 },
  { day: "06/07", revenue: 5000000, profit: 1200000 },
  { day: "07/07", revenue: 0, profit: 0 },
  { day: "08/07", revenue: 0, profit: 0 },
  { day: "09/07", revenue: 0, profit: 0 },
  { day: "10/07", revenue: 400000, profit: 200000 },
];
