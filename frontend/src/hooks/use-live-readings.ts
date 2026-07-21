"use client";

import { useEffect } from "react";
import { LIVE_READINGS_URL, parseLiveReadings } from "@/lib/api/websocket";
import { useLiveStore } from "@/stores/live-store";

const RECONNECT_DELAY_MS = 3_000;
const HEARTBEAT_INTERVAL_MS = 15_000;

export function useLiveReadings(): void {
  const mergeReadings = useLiveStore((state) => state.mergeReadings);
  const setConnectionStatus = useLiveStore(
    (state) => state.setConnectionStatus,
  );

  useEffect(() => {
    let socket: WebSocket | null = null;
    let reconnectTimer: ReturnType<typeof setTimeout> | null = null;
    let heartbeatTimer: ReturnType<typeof setInterval> | null = null;
    let disposed = false;

    const clearHeartbeat = () => {
      if (heartbeatTimer) clearInterval(heartbeatTimer);
      heartbeatTimer = null;
    };

    const connect = () => {
      if (disposed) return;
      setConnectionStatus("connecting");
      socket = new WebSocket(LIVE_READINGS_URL);

      socket.addEventListener("open", () => {
        setConnectionStatus("connected");
        clearHeartbeat();
        heartbeatTimer = setInterval(() => {
          if (socket?.readyState === WebSocket.OPEN) socket.send("ping");
        }, HEARTBEAT_INTERVAL_MS);
      });

      socket.addEventListener("message", (event: MessageEvent<string>) => {
        try {
          mergeReadings(parseLiveReadings(event.data));
        } catch {
          // Ignore malformed frames while keeping the telemetry channel alive.
        }
      });

      socket.addEventListener("close", () => {
        clearHeartbeat();
        setConnectionStatus("disconnected");
        if (!disposed) reconnectTimer = setTimeout(connect, RECONNECT_DELAY_MS);
      });

      socket.addEventListener("error", () => socket?.close());
    };

    connect();

    return () => {
      disposed = true;
      clearHeartbeat();
      if (reconnectTimer) clearTimeout(reconnectTimer);
      socket?.close();
    };
  }, [mergeReadings, setConnectionStatus]);
}
