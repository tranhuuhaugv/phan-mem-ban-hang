"use client";

import { createContext, useCallback, useContext, useState } from "react";
import { CheckCircle2, Info, X, AlertTriangle } from "lucide-react";

type ToastKind = "success" | "info" | "warning";
interface ToastItem {
  id: number;
  kind: ToastKind;
  msg: string;
}

const Ctx = createContext<(msg: string, kind?: ToastKind) => void>(() => {});

let seq = 1;

export function ToastProvider({ children }: { children: React.ReactNode }) {
  const [items, setItems] = useState<ToastItem[]>([]);

  const push = useCallback((msg: string, kind: ToastKind = "success") => {
    const id = seq++;
    setItems((s) => [...s, { id, kind, msg }]);
    setTimeout(() => setItems((s) => s.filter((t) => t.id !== id)), 3200);
  }, []);

  const remove = (id: number) => setItems((s) => s.filter((t) => t.id !== id));

  return (
    <Ctx.Provider value={push}>
      {children}
      <div className="pointer-events-none fixed bottom-5 right-5 z-50 flex w-80 flex-col gap-2">
        {items.map((t) => {
          const Icon = t.kind === "success" ? CheckCircle2 : t.kind === "warning" ? AlertTriangle : Info;
          const color =
            t.kind === "success" ? "var(--success)" : t.kind === "warning" ? "var(--warning)" : "var(--primary)";
          return (
            <div
              key={t.id}
              className="card pointer-events-auto flex items-start gap-2.5 p-3 shadow-lg"
              style={{ borderLeft: `3px solid ${color}` }}
            >
              <Icon size={18} style={{ color }} className="mt-0.5 shrink-0" />
              <p className="flex-1 text-sm">{t.msg}</p>
              <button onClick={() => remove(t.id)} className="text-[var(--muted)] hover:text-[var(--foreground)]">
                <X size={15} />
              </button>
            </div>
          );
        })}
      </div>
    </Ctx.Provider>
  );
}

export function useToast() {
  return useContext(Ctx);
}
