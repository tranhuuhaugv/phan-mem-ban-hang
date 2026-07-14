import { Badge } from "./ui";
import {
  BUY_STATUS_LABEL,
  MACHINE_STATUS_LABEL,
  ORDER_STATUS_LABEL,
  REPAIR_STATUS_LABEL,
  type BuyReceiptStatus,
  type MachineStatus,
  type OrderStatus,
  type RepairStatus,
} from "@/lib/types";

export function MachineStatusBadge({ status }: { status: MachineStatus }) {
  const tone = {
    ton_kho: "success",
    dat_coc: "warning",
    dang_sua: "info",
    da_ban: "muted",
    bao_hanh: "purple",
  }[status] as "success" | "warning" | "info" | "muted" | "purple";
  return <Badge tone={tone}>{MACHINE_STATUS_LABEL[status]}</Badge>;
}

export function BuyStatusBadge({ status }: { status: BuyReceiptStatus }) {
  const tone = { cho_duyet: "warning", da_duyet: "success", tu_choi: "danger" }[status] as
    | "warning"
    | "success"
    | "danger";
  return <Badge tone={tone}>{BUY_STATUS_LABEL[status]}</Badge>;
}

export function OrderStatusBadge({ status }: { status: OrderStatus }) {
  const tone = { cho_coc: "warning", da_coc: "info", da_giao: "success", huy: "danger" }[status] as
    | "warning"
    | "info"
    | "success"
    | "danger";
  return <Badge tone={tone}>{ORDER_STATUS_LABEL[status]}</Badge>;
}

export function RepairStatusBadge({ status }: { status: RepairStatus }) {
  const tone = { dang_sua: "info", cho_linh_kien: "warning", hoan_tat: "success" }[status] as
    | "info"
    | "warning"
    | "success";
  return <Badge tone={tone}>{REPAIR_STATUS_LABEL[status]}</Badge>;
}
