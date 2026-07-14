"use client";

import { useState } from "react";
import Link from "next/link";
import { Plus, Lock, Unlock, KeyRound, ShieldCheck, Store } from "lucide-react";
import { AccessGuard } from "@/components/parts";
import { Button, PageHeader, Table, Tr, Td, Badge, Field, Input, Select, Card } from "@/components/ui";
import { Modal } from "@/components/modal";
import { useToast } from "@/components/toast";
import { accounts } from "@/lib/mock-data";
import { ROLE_LABEL, type Role } from "@/lib/types";
import { formatDateTime } from "@/lib/format";

export default function Page() {
  return (
    <AccessGuard menu="cai-dat">
      <Inner />
    </AccessGuard>
  );
}

function Inner() {
  const toast = useToast();
  const [openForm, setOpenForm] = useState(false);

  return (
    <div>
      <PageHeader
        title="Cài đặt"
        subtitle="Quản lý tài khoản nhân viên, phân quyền và cấu hình cửa hàng"
        actions={
          <Button onClick={() => setOpenForm(true)}>
            <Plus size={16} /> Tạo tài khoản
          </Button>
        }
      />

      <div className="mb-5 grid grid-cols-1 gap-4 sm:grid-cols-2">
        <Link href="/cai-dat/phan-quyen" className="card flex items-center gap-3 p-4 transition-colors hover:bg-[var(--surface-2)]">
          <span className="grid h-10 w-10 place-items-center rounded-lg bg-[var(--purple-bg)] text-[var(--purple)]">
            <ShieldCheck size={20} />
          </span>
          <div>
            <div className="font-medium">Phân quyền</div>
            <div className="text-sm text-[var(--muted)]">Ma trận quyền theo vai trò & menu</div>
          </div>
        </Link>
        <Link href="/cai-dat/cua-hang" className="card flex items-center gap-3 p-4 transition-colors hover:bg-[var(--surface-2)]">
          <span className="grid h-10 w-10 place-items-center rounded-lg bg-[var(--info-bg)] text-[var(--info)]">
            <Store size={20} />
          </span>
          <div>
            <div className="font-medium">Cấu hình cửa hàng</div>
            <div className="text-sm text-[var(--muted)]">Tên shop, địa chỉ, logo, mẫu in</div>
          </div>
        </Link>
      </div>

      <Card className="mb-2 px-4 py-3 font-medium">Danh sách tài khoản</Card>
      <Table head={["Tên đăng nhập", "Họ tên", "Vai trò", "Trạng thái", "Đăng nhập cuối", ""]}>
        {accounts.map((a) => (
          <Tr key={a.id}>
            <Td className="font-mono text-xs font-medium">{a.username}</Td>
            <Td>{a.fullName}</Td>
            <Td>
              <Badge tone={a.role === "admin" ? "primary" : a.role === "manager" ? "info" : "muted"}>{ROLE_LABEL[a.role]}</Badge>
            </Td>
            <Td>
              <Badge tone={a.status === "active" ? "success" : "danger"}>{a.status === "active" ? "Hoạt động" : "Đã khoá"}</Badge>
            </Td>
            <Td className="whitespace-nowrap text-xs text-[var(--muted)]">{a.lastLogin ? formatDateTime(a.lastLogin) : "—"}</Td>
            <Td>
              <div className="flex items-center justify-end gap-1">
                <Button size="sm" variant="ghost" onClick={() => toast("Đã đặt lại mật khẩu (demo)")}>
                  <KeyRound size={15} />
                </Button>
                <Button
                  size="sm"
                  variant="ghost"
                  className={a.status === "active" ? "text-[var(--danger)]" : "text-[var(--success)]"}
                  onClick={() => toast(a.status === "active" ? "Đã khoá tài khoản (demo)" : "Đã mở khoá (demo)")}
                >
                  {a.status === "active" ? <Lock size={15} /> : <Unlock size={15} />}
                </Button>
              </div>
            </Td>
          </Tr>
        ))}
      </Table>

      <Modal
        open={openForm}
        onClose={() => setOpenForm(false)}
        title="Tạo tài khoản nhân viên"
        footer={
          <>
            <Button variant="outline" onClick={() => setOpenForm(false)}>
              Huỷ
            </Button>
            <Button
              onClick={() => {
                setOpenForm(false);
                toast("Đã tạo tài khoản (demo)");
              }}
            >
              Tạo tài khoản
            </Button>
          </>
        }
      >
        <div className="space-y-3">
          <Field label="Tên đăng nhập">
            <Input placeholder="VD: nhanvien03" />
          </Field>
          <Field label="Mật khẩu">
            <Input type="password" placeholder="••••••••" />
          </Field>
          <Field label="Họ tên">
            <Input placeholder="VD: Trần Văn B" />
          </Field>
          <Field label="Vai trò">
            <Select defaultValue="staff">
              {(Object.keys(ROLE_LABEL) as Role[]).map((r) => (
                <option key={r} value={r}>
                  {ROLE_LABEL[r]}
                </option>
              ))}
            </Select>
          </Field>
        </div>
      </Modal>
    </div>
  );
}
