"use client";

import { Clock3, Radio, RefreshCw } from "lucide-react";
import { useEffect, useMemo, useState } from "react";
import type { LiveConnectionStatus } from "@/stores/live-store";

const UPDATE_INTERVAL_MS = 2_000;

interface NextUpdateSectionProps {
  lastMessageAt: string | null;
  connectionStatus: LiveConnectionStatus;
  channelCount: number;
}

export function NextUpdateSection({
  lastMessageAt,
  connectionStatus,
  channelCount,
}: NextUpdateSectionProps) {
  const [now, setNow] = useState(() => Date.now());

  useEffect(() => {
    const timer = window.setInterval(() => setNow(Date.now()), 100);
    return () => window.clearInterval(timer);
  }, []);

  const lastMessageTime = lastMessageAt ? Date.parse(lastMessageAt) : null;
  const remaining = lastMessageTime
    ? Math.max(0, lastMessageTime + UPDATE_INTERVAL_MS - now)
    : 0;
  const progress = lastMessageTime
    ? Math.min(100, Math.max(0, ((UPDATE_INTERVAL_MS - remaining) / UPDATE_INTERVAL_MS) * 100))
    : 0;
  const connected = connectionStatus === "connected";

  const countdown = !connected
    ? "Suspendue"
    : !lastMessageTime
      ? "En attente"
      : remaining > 0
        ? `${(remaining / 1_000).toLocaleString("fr-FR", {
            minimumFractionDigits: 1,
            maximumFractionDigits: 1,
          })} s`
        : "Imminente";

  const lastReception = useMemo(
    () =>
      lastMessageAt
        ? new Intl.DateTimeFormat("fr-FR", {
            hour: "2-digit",
            minute: "2-digit",
            second: "2-digit",
          }).format(new Date(lastMessageAt))
        : "--:--:--",
    [lastMessageAt],
  );

  return (
    <section
      className="mt-7 border-y border-slate-300 bg-white"
      aria-labelledby="next-update-heading"
    >
      <div className="grid min-h-36 lg:grid-cols-[minmax(280px,0.8fr)_1.7fr]">
        <div className="flex flex-col justify-center border-b border-slate-200 px-5 py-5 lg:border-b-0 lg:border-r">
          <div className="flex items-center gap-2 text-xs font-bold uppercase text-brand">
            <RefreshCw className="size-3.5" aria-hidden="true" />
            Cycle télémétrique
          </div>
          <h2
            id="next-update-heading"
            className="mt-1 text-lg font-bold text-slate-950"
          >
            Prochaine mise à jour
          </h2>
          <div className="mt-3 flex items-end justify-between gap-4">
            <p className="text-2xl font-bold text-slate-950">{countdown}</p>
            <p className="pb-1 text-xs font-semibold text-slate-500">Cycle 2 s</p>
          </div>
          <div
            className="mt-2 h-1.5 overflow-hidden rounded-full bg-slate-200"
            role="progressbar"
            aria-label="Progression vers la prochaine mise à jour"
            aria-valuemin={0}
            aria-valuemax={100}
            aria-valuenow={Math.round(progress)}
          >
            <div
              className={`h-full rounded-full transition-[width] duration-100 ${
                connected ? "bg-brand" : "bg-slate-400"
              }`}
              style={{ width: `${progress}%` }}
            />
          </div>
        </div>

        <div className="grid sm:grid-cols-3">
          <UpdateMetric
            icon={Radio}
            label="Synchronisation"
            value={
              connectionStatus === "connected"
                ? "Active"
                : connectionStatus === "connecting"
                  ? "Connexion…"
                  : "Interrompue"
            }
            active={connected}
          />
          <UpdateMetric
            icon={Clock3}
            label="Dernière réception"
            value={lastReception}
          />
          <UpdateMetric
            icon={RefreshCw}
            label="Canaux attendus"
            value={String(channelCount)}
          />
        </div>
      </div>
    </section>
  );
}

interface UpdateMetricProps {
  icon: typeof Radio;
  label: string;
  value: string;
  active?: boolean;
}

function UpdateMetric({ icon: Icon, label, value, active = false }: UpdateMetricProps) {
  return (
    <div className="flex min-h-28 items-center gap-3 border-b border-slate-200 px-5 py-4 last:border-b-0 sm:border-b-0 sm:border-r sm:last:border-r-0">
      <span
        className={`flex size-9 shrink-0 items-center justify-center rounded-md ${
          active ? "bg-blue-50 text-blue-700" : "bg-slate-100 text-slate-500"
        }`}
      >
        <Icon className="size-4" aria-hidden="true" />
      </span>
      <div className="min-w-0">
        <p className="truncate text-xs font-medium text-slate-500">{label}</p>
        <p className="mt-0.5 truncate text-sm font-bold text-slate-950">{value}</p>
      </div>
    </div>
  );
}
