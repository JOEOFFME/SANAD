import { create } from "zustand";
import type { LiveReading } from "@/lib/api/types";

export type LiveConnectionStatus =
  | "connecting"
  | "connected"
  | "disconnected";

interface LiveState {
  readings: LiveReading[];
  connectionStatus: LiveConnectionStatus;
  lastMessageAt: string | null;
  mergeReadings: (readings: LiveReading[]) => void;
  setConnectionStatus: (status: LiveConnectionStatus) => void;
  reset: () => void;
}

export const useLiveStore = create<LiveState>((set) => ({
  readings: [],
  connectionStatus: "connecting",
  lastMessageAt: null,
  mergeReadings: (incoming) =>
    set((state) => {
      const byReading = new Map<string, LiveReading>();

      for (const reading of [...state.readings, ...incoming]) {
        const key = `${reading.asset_id}:${reading.sensor_type}:${reading.timestamp}`;
        byReading.set(key, reading);
      }

      const readings = [...byReading.values()]
        .sort((left, right) => left.timestamp.localeCompare(right.timestamp))
        .slice(-900);

      return { readings, lastMessageAt: new Date().toISOString() };
    }),
  setConnectionStatus: (connectionStatus) => set({ connectionStatus }),
  reset: () =>
    set({
      readings: [],
      connectionStatus: "disconnected",
      lastMessageAt: null,
    }),
}));
