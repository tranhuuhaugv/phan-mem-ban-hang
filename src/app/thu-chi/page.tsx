import { redirect } from "next/navigation";

// Thu - Chi tách thành 2 danh sách: phiếu thu (/thu-chi/thu) và phiếu chi (/thu-chi/chi)
export default function Page() {
  redirect("/thu-chi/thu");
}
