"use client";

import { useQuery } from "@tanstack/react-query";
import { Activity, RefreshCw } from "lucide-react";
import { getHealth } from "@/lib/api/system";

export function SystemHealth() {
  const health = useQuery({
    queryKey: ["system", "health"],
    queryFn: getHealth,
    refetchInterval: 30_000,
  });

  const online = health.data?.status === "ok";
  const label = health.isPending
    ? "Checking"
    : online
      ? "Operational"
      : "Unreachable";

  return (
    <div className="flex items-center gap-3" aria-live="polite">
      <span
        className={`flex size-9 items-center justify-center rounded-md border ${
          online
            ? "border-emerald-200 bg-emerald-50 text-brand"
            : health.isPending
              ? "border-line bg-canvas text-muted"
              : "border-red-200 bg-red-50 text-danger"
        }`}
      >
        {health.isPending ? (
          <RefreshCw className="size-4 animate-spin" aria-hidden="true" />
        ) : (
          <Activity className="size-4" aria-hidden="true" />
        )}
      </span>
      <div className="min-w-0">
        <p className="text-xs font-medium text-muted">Backend API</p>
        <p className="truncate text-sm font-semibold text-ink">{label}</p>
      </div>
    </div>
  );
}
