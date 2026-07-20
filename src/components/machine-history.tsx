"use client";

import { Boxes, PackagePlus, Wrench, ShoppingCart, ShieldCheck, History } from "lucide-react";
import { formatDateTime } from "@/lib/format";

export interface HistoryEvent {
  at: string; // ISO ngày giờ
  kind: string; // nhap | thu | sua | ban | bh
  label: string;
  detail: string;
}

const META: Record<string, { color: string; Icon: React.ComponentType<{ size?: number }> }> = {
  nhap: { color: "#4f46e5", Icon: Boxes },
  thu: { color: "#0891b2", Icon: PackagePlus },
  sua: { color: "#ea580c", Icon: Wrench },
  ban: { color: "#059669", Icon: ShoppingCart },
  bh: { color: "#7c3aed", Icon: ShieldCheck },
};

export function MachineHistory({ events }: { events: HistoryEvent[] }) {
  if (events.length === 0) return <p className="text-sm text-[var(--muted)]">Chưa có lịch sử cho máy này.</p>;

  return (
    <div className="relative ml-1 space-y-4 border-l border-[var(--border)] pl-5">
      {events.map((e, i) => {
        const { color, Icon } = META[e.kind] ?? { color: "#64748b", Icon: History };
        return (
          <div key={i} className="relative">
            <span
              className="absolute -left-[27px] top-0 grid h-5 w-5 place-items-center rounded-full border-2 border-[var(--surface)] text-white"
              style={{ background: color }}
            >
              <Icon size={11} />
            </span>
            <div className="flex flex-wrap items-center gap-x-2">
              <span className="text-sm font-medium">{e.label}</span>
              <span className="rounded bg-[var(--surface-2)] px-1.5 py-0.5 text-[11px] text-[var(--muted)]">
                {formatDateTime(e.at)}
              </span>
            </div>
            <p className="mt-0.5 text-xs text-[var(--muted)]">{e.detail}</p>
          </div>
        );
      })}
    </div>
  );
}
