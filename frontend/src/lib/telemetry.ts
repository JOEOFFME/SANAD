import type { LiveReading, SensorType } from "./api/types";

export type LatestReadings = Map<number, Partial<Record<SensorType, LiveReading>>>;

export function selectLatestReadings(readings: LiveReading[]): LatestReadings {
  const latest: LatestReadings = new Map();

  for (const reading of readings) {
    const assetReadings = latest.get(reading.asset_id) ?? {};
    const current = assetReadings[reading.sensor_type];

    if (!current || current.timestamp < reading.timestamp) {
      assetReadings[reading.sensor_type] = reading;
      latest.set(reading.asset_id, assetReadings);
    }
  }

  return latest;
}

export function formatReading(reading: LiveReading | undefined): string {
  if (!reading) return "--";
  return `${reading.value.toLocaleString("fr-FR", { maximumFractionDigits: 1 })} ${reading.unit}`;
}
