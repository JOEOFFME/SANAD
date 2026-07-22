"use client";

import Image from "next/image";
import { Handle, Position, type Node, type NodeProps } from "@xyflow/react";
import {
  Box,
  ArrowRightLeft,
  CircleGauge,
  Factory,
  Filter,
  Thermometer,
  Waves,
  type LucideIcon,
} from "lucide-react";
import type { AssetOut, LiveReading, SensorType } from "@/lib/api/types";
import { getMachineImage } from "@/lib/machine-images";
import { formatReading } from "@/lib/telemetry";

export interface ProcessNodeData extends Record<string, unknown> {
  asset: AssetOut;
  readings: Partial<Record<SensorType, LiveReading>>;
  connected: boolean;
}

export type ProcessFlowNode = Node<ProcessNodeData, "process">;

const assetIcons: Record<string, LucideIcon> = {
  hopper: Box,
  conveyor: ArrowRightLeft,
  crusher: Factory,
  screen: Filter,
};

const sensors: Array<{
  type: SensorType;
  label: string;
  icon: LucideIcon;
}> = [
  { type: "vibration", label: "Vibr.", icon: Waves },
  { type: "temperature", label: "Temp.", icon: Thermometer },
  { type: "throughput", label: "Débit", icon: CircleGauge },
];

export function ProcessNode({ data }: NodeProps<ProcessFlowNode>) {
  const { asset, readings, connected } = data;
  const hasData = Object.keys(readings).length > 0;
  const alarm = Object.values(readings).some((reading) => reading?.anomaly);
  const cascadeRisk = Object.values(readings).some(
    (reading) => reading?.cascade_risk,
  );
  const status = !connected
    ? "offline"
    : alarm
      ? "alarm"
      : cascadeRisk
        ? "warning"
        : hasData
          ? "normal"
          : "waiting";
  const Icon = assetIcons[asset.asset_type] ?? Factory;
  const machineImage = getMachineImage(asset.asset_type);

  const statusStyles = {
    normal: "border-blue-400 bg-white shadow-[0_0_0_1px_rgba(59,130,246,0.08)]",
    warning: "border-amber-400 bg-amber-50",
    alarm: "border-red-500 bg-red-50 shadow-[0_0_0_2px_rgba(220,38,38,0.1)]",
    offline: "border-slate-300 bg-slate-50 opacity-80",
    waiting: "border-sky-300 bg-white",
  }[status];

  const indicatorStyles = {
    normal: "bg-blue-500",
    warning: "bg-amber-500",
    alarm: "bg-red-500",
    offline: "bg-slate-400",
    waiting: "bg-sky-400",
  }[status];

  return (
    <article
      className={`h-[254px] w-[228px] overflow-hidden rounded-md border-2 ${statusStyles}`}
    >
      <Handle
        type="target"
        position={Position.Left}
        className="!size-2.5 !border-2 !border-white !bg-slate-500"
      />
      <div className="flex h-12 items-center gap-2.5 border-b border-slate-200 px-3">
        <span className="flex size-7 items-center justify-center rounded bg-slate-100 text-slate-700">
          <Icon className="size-4" aria-hidden="true" />
        </span>
        <div className="min-w-0 flex-1">
          <p className="truncate text-[11px] font-bold text-slate-500">
            {asset.code}
          </p>
          <h3 className="truncate text-xs font-bold text-slate-900">
            {asset.name}
          </h3>
        </div>
        <span className={`size-2.5 rounded-full ${indicatorStyles}`} />
      </div>

      <div className="relative h-[88px] border-b border-slate-200 bg-[#edf3f8]">
        {machineImage ? (
          <Image
            src={machineImage}
            alt={`Illustration de ${asset.name}`}
            fill
            sizes="228px"
            className="object-contain px-3 py-1.5"
          />
        ) : (
          <div className="flex h-full items-center justify-center text-slate-300">
            <Icon className="size-10" aria-hidden="true" />
          </div>
        )}
      </div>

      <div className="grid h-[114px] grid-rows-3 px-3 py-1.5">
        {sensors.map(({ type, label, icon: SensorIcon }) => {
          const reading = readings[type];
          return (
            <div
              key={type}
              className="flex items-center gap-2 border-b border-slate-100 text-[11px] last:border-0"
            >
              <SensorIcon
                className={`size-3.5 ${reading?.anomaly ? "text-red-600" : "text-slate-400"}`}
                aria-hidden="true"
              />
              <span className="w-9 text-slate-500">{label}</span>
              <span
                className={`ml-auto font-mono font-semibold ${reading?.anomaly ? "text-red-700" : "text-slate-800"}`}
              >
                {formatReading(reading)}
              </span>
            </div>
          );
        })}
      </div>
      <Handle
        type="source"
        position={Position.Right}
        className="!size-2.5 !border-2 !border-white !bg-slate-500"
      />
    </article>
  );
}
