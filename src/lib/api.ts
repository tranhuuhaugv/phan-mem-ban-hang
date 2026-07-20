"use client";

import { useCallback, useEffect, useState } from "react";

// Gọi API — ném Error với thông báo tiếng Việt từ server
export async function api<T>(path: string, init?: RequestInit): Promise<T> {
  const res = await fetch(path, {
    ...init,
    headers: { "Content-Type": "application/json", ...init?.headers },
  });
  const data = await res.json().catch(() => ({}));
  if (!res.ok) throw new Error((data as { error?: string }).error ?? `Lỗi ${res.status}`);
  return data as T;
}

export const apiPost = <T,>(path: string, body: unknown) =>
  api<T>(path, { method: "POST", body: JSON.stringify(body) });
export const apiPatch = <T,>(path: string, body: unknown) =>
  api<T>(path, { method: "PATCH", body: JSON.stringify(body) });
export const apiDelete = <T,>(path: string) => api<T>(path, { method: "DELETE" });

// Hook tải dữ liệu: { data, loading, error, reload }
export function useApi<T>(path: string | null) {
  const [data, setData] = useState<T | null>(null);
  const [loading, setLoading] = useState(!!path);
  const [error, setError] = useState<string | null>(null);
  const [tick, setTick] = useState(0);

  useEffect(() => {
    if (!path) return;
    let alive = true;
    setLoading(true);
    api<T>(path)
      .then((d) => {
        if (alive) {
          setData(d);
          setError(null);
        }
      })
      .catch((e) => {
        if (alive) setError(e instanceof Error ? e.message : "Lỗi tải dữ liệu");
      })
      .finally(() => {
        if (alive) setLoading(false);
      });
    return () => {
      alive = false;
    };
  }, [path, tick]);

  const reload = useCallback(() => setTick((t) => t + 1), []);
  return { data, loading, error, reload };
}
