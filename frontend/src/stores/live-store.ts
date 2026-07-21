import { create } from "zustand";
import type { LiveReading } from "@/lib/api/types";

interface LiveState {
  readings: LiveReading[];
  connected: boolean;
  setReadings: (readings: LiveReading[]) => void;
  setConnected: (connected: boolean) => void;
  reset: () => void;
}

export const useLiveStore = create<LiveState>((set) => ({
  readings: [],
  connected: false,
  setReadings: (readings) => set({ readings }),
  setConnected: (connected) => set({ connected }),
  reset: () => set({ readings: [], connected: false }),
}));
