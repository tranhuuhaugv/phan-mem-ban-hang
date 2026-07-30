import { redirect } from "next/navigation";

// Form "Thêm máy mới" chi tiết đã được thay bằng màn Nhập kho (/kho/nhap)
export default function Page() {
  redirect("/kho/nhap");
}
