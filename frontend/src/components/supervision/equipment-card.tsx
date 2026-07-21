"use client";

import {
  ArrowRightLeft,
  Box,
  CircleGauge,
  Clock3,
  Factory,
  Filter,
  Minus,
  ShieldAlert,
  Thermometer,
  TrendingDown,
  TrendingUp,
  Waves,
  type LucideIcon,
} from "lucide-react";
import type { AssetOut, LiveReading, SensorType } from "@/lib/api/types";
import { formatReading } from "@/lib/telemetry";

interface EquipmentCardProps {
  asset: AssetOut;
  readings: Partial<Record<SensorType, LiveReading>>;
  connected: boolean;
}

const assetPresentation: Record<
  string,
  { icon: LucideIcon; label: string }
> = {
  hopper: { icon: Box, label: "Trémie" },
  conveyor: { icon: ArrowRightLeft, label: "Convoyeur" },
  crusher: { icon: Factory, label: "Concasseur" },
  screen: { icon: Filter, label: "Crible" },
};

const sensorPresentation: Array<{
  type: SensorType;
  label: string;
  icon: LucideIcon;
}> = [
  { type: "vibration", label: "Vibration", icon: Waves },
  { type: "temperature", label: "Température", icon: Thermometer },
  { type: "throughput", label: "Débit", icon: CircleGauge },
];

const trendPresentation = {
  rising: { icon: TrendingUp, label: "En hausse" },
  falling: { icon: TrendingDown, label: "En baisse" },
  stable: { icon: Minus, label: "Stable" },
} as const;

export function EquipmentCard({ asset, readings, connected }: EquipmentCardProps) {
  const liveReadings = Object.values(readings).filter(
    (reading): reading is LiveReading => Boolean(reading),
  );
  const hasData = liveReadings.length > 0;
  const alarm = liveReadings.some((reading) => reading.anomaly);
  const cascadeRisk = liveReadings.some((reading) => reading.cascade_risk);
  const status = !connected
    ? "offline"
    : alarm
      ? "alarm"
      : cascadeRisk
        ? "warning"
        : hasData
          ? "normal"
          : "waiting";

  const statusPresentation = {
    normal: {
      label: "Nominal",
      dot: "bg-blue-500",
      border: "border-t-blue-500",
      badge: "bg-blue-50 text-blue-800",
    },
    warning: {
      label: "Risque cascade",
      dot: "bg-amber-500",
      border: "border-t-amber-500",
      badge: "bg-amber-50 text-amber-800",
    },
    alarm: {
      label: "Alarme",
      dot: "bg-red-500",
      border: "border-t-red-500",
      badge: "bg-red-50 text-red-800",
    },
    offline: {
      label: "Hors connexion",
      dot: "bg-slate-400",
      border: "border-t-slate-400",
      badge: "bg-slate-100 text-slate-700",
    },
    waiting: {
      label: "En attente",
      dot: "bg-sky-500",
      border: "border-t-sky-500",
      badge: "bg-sky-50 text-sky-800",
    },
  }[status];

  const assetType = assetPresentation[asset.asset_type] ?? {
    icon: Factory,
    label: asset.asset_type,
  };
  const AssetIcon = assetType.icon;
  const latestTimestamp = liveReadings
    .map((reading) => reading.timestamp)
    .sort()
    .at(-1);

  return (
    <article
      className={`flex min-h-[286px] flex-col overflow-hidden rounded-md border border-t-[3px] border-slate-200 bg-white shadow-panel ${statusPresentation.border}`}
    >
      <header className="flex min-h-[72px] items-center gap-3 border-b border-slate-200 px-4 py-3">
        <span className="flex size-10 shrink-0 items-center justify-center rounded-md bg-slate-100 text-slate-700">
          <AssetIcon className="size-5" aria-hidden="true" />
        </span>
        <div className="min-w-0 flex-1">
          <div className="flex items-center gap-2">
            <p className="truncate text-xs font-bold text-slate-500">{asset.code}</p>
            <span className="text-[10px] text-slate-300">/</span>
            <p className="truncate text-[11px] text-slate-500">{assetType.label}</p>
          </div>
          <h3 className="mt-0.5 truncate text-sm font-bold text-slate-950">
            {asset.name}
          </h3>
        </div>
        <span
          className={`inline-flex shrink-0 items-center gap-1.5 rounded px-2 py-1 text-[10px] font-bold ${statusPresentation.badge}`}
        >
          <span className={`size-1.5 rounded-full ${statusPresentation.dot}`} />
          {statusPresentation.label}
        </span>
      </header>

      <div className="flex-1 divide-y divide-slate-100 px-4">
        {sensorPresentation.map(({ type, label, icon: SensorIcon }) => {
          const reading = readings[type];
          const trend = reading ? trendPresentation[reading.trend] : null;
          const TrendIcon = trend?.icon ?? Minus;

          return (
            <div key={type} className="grid min-h-14 grid-cols-[1fr_auto] items-center gap-3">
              <div className="flex min-w-0 items-center gap-2.5">
                <SensorIcon
                  className={`size-4 shrink-0 ${reading?.anomaly ? "text-red-600" : "text-slate-400"}`}
                  aria-hidden="true"
                />
                <span className="truncate text-xs font-medium text-slate-600">
                  {label}
                </span>
              </div>
              <div className="flex items-center gap-2">
                <span
                  className={`whitespace-nowrap font-mono text-xs font-bold ${reading?.anomaly ? "text-red-700" : "text-slate-900"}`}
                >
                  {formatReading(reading)}
                </span>
                <span
                  className={`flex size-6 items-center justify-center rounded ${
                    reading?.anomaly
                      ? "bg-red-100 text-red-700"
                      : "bg-slate-100 text-slate-500"
                  }`}
                  title={trend?.label ?? "Tendance indisponible"}
                >
                  <TrendIcon className="size-3.5" aria-hidden="true" />
                </span>
              </div>
            </div>
          );
        })}
      </div>

      <footer className="flex min-h-10 items-center justify-between gap-3 border-t border-slate-200 bg-slate-50 px-4 text-[10px] text-slate-500">
        <span className="flex min-w-0 items-center gap-1.5">
          <Clock3 className="size-3.5 shrink-0" aria-hidden="true" />
          <span className="truncate">
            Source {latestTimestamp?.slice(11, 19) ?? "--:--:--"}
          </span>
        </span>
        {cascadeRisk ? (
          <span className="flex shrink-0 items-center gap-1 font-bold text-amber-700">
            <ShieldAlert className="size-3.5" aria-hidden="true" />
            Impact aval
          </span>
        ) : (
          <span className="shrink-0">3 capteurs</span>
        )}
      </footer>
    </article>
  );
}
