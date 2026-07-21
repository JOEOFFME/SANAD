import { WS_BASE_URL } from "@/lib/config";
import type { LiveReading } from "./types";

export const LIVE_READINGS_URL = `${WS_BASE_URL}/ws/live`;

export function parseLiveReadings(message: string): LiveReading[] {
  const payload: unknown = JSON.parse(message);
  if (!Array.isArray(payload)) {
    throw new TypeError("Live readings payload must be an array");
  }
  return payload as LiveReading[];
}
