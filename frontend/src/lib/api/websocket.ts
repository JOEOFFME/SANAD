import { WS_BASE_URL } from "@/lib/config";
import type { LiveReading } from "./types";

export const LIVE_READINGS_URL = `${WS_BASE_URL}/ws/live`;

export function parseLiveReadings(message: string): LiveReading[] {
  const payload: unknown = JSON.parse(message);
  if (!Array.isArray(payload) || !payload.every(isLiveReading)) {
    throw new TypeError("Live readings payload must be an array");
  }
  return payload;
}

function isLiveReading(value: unknown): value is LiveReading {
  if (typeof value !== "object" || value === null) return false;

  const reading = value as Record<string, unknown>;
  return (
    typeof reading.asset_id === "number" &&
    typeof reading.asset_code === "string" &&
    typeof reading.asset_name === "string" &&
    typeof reading.asset_type === "string" &&
    ["vibration", "temperature", "throughput"].includes(
      reading.sensor_type as string,
    ) &&
    typeof reading.value === "number" &&
    typeof reading.unit === "string" &&
    typeof reading.timestamp === "string" &&
    typeof reading.anomaly === "boolean" &&
    ["rising", "falling", "stable"].includes(reading.trend as string) &&
    typeof reading.cascade_risk === "boolean"
  );
}
