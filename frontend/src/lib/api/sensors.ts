import { apiRequest } from "./client";
import type {
  AnomalyScanFinding,
  ReadingCheck,
  SensorType,
  SimulateAllResponse,
  SimulatedReadingResponse,
} from "./types";

export const simulateReading = (
  assetId: number,
  sensorType: SensorType,
  anomaly = false,
): Promise<SimulatedReadingResponse> => {
  const params = new URLSearchParams({
    sensor_type: sensorType,
    anomaly: String(anomaly),
  });
  return apiRequest<SimulatedReadingResponse>(
    `/sensors/${assetId}/simulate?${params}`,
    { method: "POST" },
  );
};

export const simulateAllReadings = (): Promise<SimulateAllResponse> =>
  apiRequest<SimulateAllResponse>("/sensors/simulate-all", { method: "POST" });

export const checkLatestReading = (
  assetId: number,
  sensorType: SensorType,
): Promise<ReadingCheck> => {
  const params = new URLSearchParams({ sensor_type: sensorType });
  return apiRequest<ReadingCheck>(`/sensors/${assetId}/check?${params}`);
};

export const scanForAnomalies = (): Promise<AnomalyScanFinding[]> =>
  apiRequest<AnomalyScanFinding[]>("/sensors/scan");
