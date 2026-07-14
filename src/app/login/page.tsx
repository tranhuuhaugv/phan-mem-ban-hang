"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Laptop, Lock, User, LogIn, Boxes, ShieldCheck, Wallet } from "lucide-react";
import { Button, Field, Input } from "@/components/ui";
import { useToast } from "@/components/toast";
import { useRole } from "@/components/role-context";
import { ROLE_LABEL } from "@/lib/types";

const QUICK = [
  { username: "admin", label: "Admin", desc: "Toàn quyền" },
  { username: "quanly01", label: "Quản lý", desc: "Không vào Cài đặt" },
  { username: "nhanvien01", label: "Nhân viên", desc: "Quyền hạn chế" },
];

export default function LoginPage() {
  const { login } = useRole();
  const router = useRouter();
  const toast = useToast();
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");

  const doLogin = (u: string, p: string) => {
    const res = login(u, p);
    if (!res.ok) {
      setError(res.error ?? "Đăng nhập thất bại");
      return;
    }
    setError("");
    toast(`Xin chào ${u}!`);
    router.replace("/tong-quan");
  };

  return (
    <div className="grid min-h-screen lg:grid-cols-2">
      {/* Cột giới thiệu */}
      <div className="relative hidden overflow-hidden bg-[var(--primary)] p-12 text-white lg:flex lg:flex-col lg:justify-between">
        <div className="flex items-center gap-2.5">
          <span className="grid h-10 w-10 place-items-center rounded-xl bg-white/15">
            <Laptop size={22} />
          </span>
          <span className="text-lg font-semibold">Kho Laptop</span>
        </div>

        <div>
          <h1 className="text-3xl font-bold leading-tight">
            Phần mềm quản lý
            <br />
            kho laptop nội bộ
          </h1>
          <p className="mt-3 max-w-sm text-white/80">
            Quản lý tồn kho theo Mã SP, thu máy, đặt hàng, sửa chữa, thu chi và báo cáo lãi/lỗ — tất cả trong một nơi.
          </p>
          <div className="mt-8 space-y-3">
            {[
              { icon: <Boxes size={18} />, t: "Quản lý kho theo từng Mã SP" },
              { icon: <Wallet size={18} />, t: "Sổ quỹ & báo cáo lãi/lỗ tự động" },
              { icon: <ShieldCheck size={18} />, t: "Phân quyền 3 vai trò rõ ràng" },
            ].map((f, i) => (
              <div key={i} className="flex items-center gap-3 text-sm text-white/90">
                <span className="grid h-8 w-8 place-items-center rounded-lg bg-white/15">{f.icon}</span>
                {f.t}
              </div>
            ))}
          </div>
        </div>

        <p className="text-xs text-white/60">© 2026 Kho Laptop · Bản demo giao diện</p>
      </div>

      {/* Cột form */}
      <div className="flex items-center justify-center p-6">
        <div className="w-full max-w-sm">
          <div className="mb-6 flex items-center gap-2.5 lg:hidden">
            <span className="grid h-10 w-10 place-items-center rounded-xl bg-[var(--primary)] text-white">
              <Laptop size={22} />
            </span>
            <span className="text-lg font-semibold">Kho Laptop</span>
          </div>

          <h2 className="text-2xl font-semibold tracking-tight">Đăng nhập</h2>
          <p className="mt-1 text-sm text-[var(--muted)]">Nhập tài khoản để vào phần mềm quản lý.</p>

          <form
            onSubmit={(e) => {
              e.preventDefault();
              doLogin(username, password);
            }}
            className="mt-6 space-y-4"
          >
            <Field label="Tên đăng nhập">
              <div className="relative">
                <User size={16} className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-[var(--muted)]" />
                <Input value={username} onChange={(e) => setUsername(e.target.value)} placeholder="VD: admin" className="pl-9" autoFocus />
              </div>
            </Field>
            <Field label="Mật khẩu">
              <div className="relative">
                <Lock size={16} className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-[var(--muted)]" />
                <Input
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••"
                  className="pl-9"
                />
              </div>
            </Field>

            {error && (
              <p className="rounded-lg bg-[var(--danger-bg)] px-3 py-2 text-sm text-[var(--danger)]">{error}</p>
            )}

            <Button type="submit" className="w-full">
              <LogIn size={16} /> Đăng nhập
            </Button>
          </form>

          <div className="my-6 flex items-center gap-3 text-xs text-[var(--muted)]">
            <div className="h-px flex-1 bg-[var(--border)]" />
            Đăng nhập nhanh (demo)
            <div className="h-px flex-1 bg-[var(--border)]" />
          </div>

          <div className="grid grid-cols-3 gap-2">
            {QUICK.map((q) => (
              <button
                key={q.username}
                onClick={() => doLogin(q.username, "demo")}
                className="card p-3 text-center transition-colors hover:border-[var(--primary)] hover:bg-[var(--surface-2)]"
              >
                <div className="text-sm font-medium">{q.label}</div>
                <div className="mt-0.5 text-[11px] text-[var(--muted)]">{q.desc}</div>
              </button>
            ))}
          </div>

          <p className="mt-6 text-center text-xs text-[var(--muted)]">
            Bản demo: mật khẩu nhập bất kỳ. Xác thực thật sẽ thêm khi làm backend.
          </p>
        </div>
      </div>
    </div>
  );
}
