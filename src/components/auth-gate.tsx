"use client";

import { useEffect } from "react";
import { usePathname, useRouter } from "next/navigation";
import { Loader2 } from "lucide-react";
import { useRole } from "./role-context";
import { Topbar } from "./topbar";

export function AuthGate({ children }: { children: React.ReactNode }) {
  const { ready, user } = useRole();
  const pathname = usePathname();
  const router = useRouter();
  const isLogin = pathname === "/login";

  useEffect(() => {
    if (!ready) return;
    if (!user && !isLogin) router.replace("/login");
    if (user && isLogin) router.replace("/tong-quan");
  }, [ready, user, isLogin, router]);

  // Đang đọc trạng thái đăng nhập
  if (!ready) {
    return (
      <div className="grid min-h-screen place-items-center">
        <Loader2 className="animate-spin text-[var(--muted)]" />
      </div>
    );
  }

  // Trang đăng nhập: toàn màn hình, không topbar
  if (isLogin) return <>{children}</>;

  // Chưa đăng nhập mà vào trang khác → đang chuyển hướng
  if (!user) {
    return (
      <div className="grid min-h-screen place-items-center">
        <Loader2 className="animate-spin text-[var(--muted)]" />
      </div>
    );
  }

  // Đã đăng nhập
  return (
    <>
      <Topbar />
      <main className="mx-auto max-w-[1400px] px-4 py-6">{children}</main>
    </>
  );
}
