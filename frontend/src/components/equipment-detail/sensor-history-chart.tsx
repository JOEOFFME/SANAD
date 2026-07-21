"use client";

import { Activity, CircleGauge, Thermometer, Waves } from "lucide-react";
import { useMemo, useState } from "react";
import {
  CartesianGrid,
  Line,
  LineChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import type { LiveReading, SensorType } from "@/lib/api/types";

interface SensorHistoryChartProps {
  readings: LiveReading[];
}

const sensors = [
  { type: "vibration" as const, label: "Vibration", icon: Waves },
  { type: "temperature" as const, label: "Température", icon: Thermometer },
  { type: "throughput" as const, label: "Débit", icon: CircleGauge },
];

export function SensorHistoryChart({ readings }: SensorHistoryChartProps) {
  const [sensorType, setSensorType] = useState<SensorType>("vibration");
  const sensorReadings = useMemo(
    () =>
      readings
        .filter((reading) => reading.sensor_type === sensorType)
        .sort((left, right) => left.timestamp.localeCompare(right.timestamp))
        .slice(-30),
    [readings, sensorType],
  );
  const latest = sensorReadings.at(-1);
  const chartData = sensorReadings.map((reading, index) => ({
    sample: index,
    time: reading.timestamp.slice(11, 19),
    value: reading.value,
    anomaly: reading.anomaly,
  }));

  return (
    <section className="overflow-hidden rounded-md border border-slate-200 bg-white shadow-panel">
      <div className="flex min-h-14 flex-wrap items-center justify-between gap-3 border-b border-slate-200 px-4 py-2">
        <div>
          <div className="flex items-center gap-2">
            <Activity className="size-4 text-brand" aria-hidden="true" />
            <h2 className="text-sm font-bold text-slate-950">Historique capteur</h2>
          </div>
          <p className="mt-0.5 text-xs text-slate-500">30 dernières mesures disponibles</p>
        </div>
        <div className="flex rounded-md border border-slate-200 bg-slate-50 p-1">
          {sensors.map(({ type, label, icon: Icon }) => (
            <button
              key={type}
              type="button"
              onClick={() => setSensorType(type)}
              className={`flex size-8 items-center justify-center rounded text-xs font-semibold sm:h-8 sm:w-auto sm:gap-1.5 sm:px-2.5 ${
                sensorType === type
                  ? "bg-white text-brand shadow-sm"
                  : "text-slate-500 hover:text-slate-900"
              }`}
              title={label}
              aria-label={label}
              aria-pressed={sensorType === type}
            >
              <Icon className="size-3.5" aria-hidden="true" />
              <span className="hidden sm:inline">{label}</span>
            </button>
          ))}
        </div>
      </div>

      <div className="flex min-h-16 items-center justify-between border-b border-slate-100 px-4">
        <div>
          <p className="text-xs font-medium text-slate-500">Dernière valeur</p>
          <p className={`mt-0.5 text-xl font-bold ${latest?.anomaly ? "text-red-700" : "text-slate-950"}`}>
            {latest ? `${latest.value.toLocaleString("fr-FR")} ${latest.unit}` : "--"}
          </p>
        </div>
        <div className="text-right">
          <p className="text-xs font-medium text-slate-500">Tendance</p>
          <p className="mt-0.5 text-sm font-bold capitalize text-slate-800">
            {latest?.trend === "rising"
              ? "En hausse"
              : latest?.trend === "falling"
                ? "En baisse"
                : latest?.trend === "stable"
                  ? "Stable"
                  : "--"}
          </p>
        </div>
      </div>

      <div className="h-[270px] px-2 pb-3 pt-4 sm:px-4">
        {chartData.length > 1 ? (
          <ResponsiveContainer width="100%" height="100%">
            <LineChart data={chartData} margin={{ top: 5, right: 10, left: -16, bottom: 0 }}>
              <CartesianGrid stroke="#e2e8f0" strokeDasharray="3 3" vertical={false} />
              <XAxis
                dataKey="sample"
                type="number"
                domain={["dataMin", "dataMax"]}
                tick={{ fontSize: 10, fill: "#64748b" }}
                axisLine={{ stroke: "#cbd5e1" }}
                tickLine={false}
                minTickGap={28}
                tickFormatter={(value) => chartData[Number(value)]?.time ?? ""}
              />
              <YAxis
                tick={{ fontSize: 10, fill: "#64748b" }}
                axisLine={false}
                tickLine={false}
                domain={["auto", "auto"]}
              />
              <Tooltip
                contentStyle={{
                  border: "1px solid #cbd5e1",
                  borderRadius: 6,
                  fontSize: 12,
                  boxShadow: "0 2px 6px rgba(15, 23, 42, 0.08)",
                }}
                labelStyle={{ color: "#64748b" }}
                labelFormatter={(value) => chartData[Number(value)]?.time ?? ""}
                formatter={(value) => [
                  `${Number(value).toLocaleString("fr-FR")} ${latest?.unit ?? ""}`,
                  sensors.find((sensor) => sensor.type === sensorType)?.label ?? sensorType,
                ]}
              />
              <Line
                type="monotone"
                dataKey="value"
                stroke="#2563eb"
                strokeWidth={2}
                dot={false}
                activeDot={{ r: 4, fill: "#2563eb", stroke: "#ffffff", strokeWidth: 2 }}
                isAnimationActive={false}
              />
            </LineChart>
          </ResponsiveContainer>
        ) : (
          <div className="flex h-full items-center justify-center text-sm text-slate-500">
            Pas assez de mesures pour tracer l’historique.
          </div>
        )}
      </div>
    </section>
  );
}
