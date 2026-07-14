import type { Metadata } from "next";
import { Be_Vietnam_Pro } from "next/font/google";
import "./globals.css";
import { RoleProvider } from "@/components/role-context";
import { ToastProvider } from "@/components/toast";
import { AuthGate } from "@/components/auth-gate";

const font = Be_Vietnam_Pro({
  variable: "--font-sans",
  subsets: ["latin", "vietnamese"],
  weight: ["400", "500", "600", "700"],
});

export const metadata: Metadata = {
  title: "Kho Laptop — Quản lý nội bộ",
  description: "Phần mềm quản lý kho laptop nội bộ",
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="vi" className={`${font.variable} h-full antialiased`}>
      <body className="min-h-full">
        <RoleProvider>
          <ToastProvider>
            <AuthGate>{children}</AuthGate>
          </ToastProvider>
        </RoleProvider>
      </body>
    </html>
  );
}
