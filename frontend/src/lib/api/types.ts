export type IsoDateString = string;
export type SensorType = "vibration" | "temperature" | "throughput";
export type SensorTrend = "rising" | "falling" | "stable";
export type AnomalySeverity = "low" | "medium" | "high";

export interface HealthResponse {
  status: "ok";
}

export interface AssetIn {
  code: string;
  name: string;
  asset_type: string;
  manual_ref?: string | null;
}

export interface AssetOut {
  id: number;
  code: string;
  name: string;
  asset_type: string;
  manual_ref: string | null;
}

export interface SensorReadingIn {
  asset_id: number;
  sensor_type: string;
  value: number;
  unit: string;
}

export interface SensorReadingOut {
  id: number;
  asset_id: number;
  sensor_type: string;
  value: number;
  unit: string;
  timestamp: IsoDateString;
}

export interface TopologyEdgeIn {
  from_asset_id: number;
  to_asset_id: number;
  relation?: string;
}

export interface TopologyEdgeOut {
  id: number;
  from_asset_id: number;
  to_asset_id: number;
  relation: string;
}

export interface IncidentIn {
  asset_id: number;
  symptom_text: string;
}

export interface IncidentOut {
  id: number;
  asset_id: number;
  symptom_text: string;
  diagnosis: string | null;
  fix_steps: string | null;
  risk_level: string;
  resolved: boolean;
  operator_feedback: string | null;
  created_at: IsoDateString;
}

export interface NodeConfidenceOut {
  id: number;
  asset_id: number;
  confidence_score: number;
  updated_at: IsoDateString;
}

export interface RelatedAsset {
  asset_id: number;
  code: string;
  name: string;
  relation: string;
}

export interface CascadeAsset {
  code: string;
  name: string;
}

export interface CascadeHop {
  hop: number;
  affected: CascadeAsset[];
}

export interface CascadeResponse {
  source_asset: string;
  cascade_chain: CascadeHop[];
  total_hops_affected: number;
}

export interface SimulatedReadingResponse {
  asset_id: number;
  sensor_type: SensorType;
  value: number;
  unit: string;
}

export interface SimulateAllResponse {
  count: number;
}

export interface NoDataReadingCheck {
  status: "no_data";
}

export interface NormalReadingCheck {
  status: "normal";
  severity: null;
  asset_id: number;
  sensor_type: SensorType;
  value: number;
  timestamp: IsoDateString;
}

export interface AnomalyReadingCheck {
  status: "anomaly";
  severity: AnomalySeverity;
  deviation_ratio: number;
  asset_id: number;
  sensor_type: SensorType;
  value: number;
  timestamp: IsoDateString;
}

export type ReadingCheck =
  | NoDataReadingCheck
  | NormalReadingCheck
  | AnomalyReadingCheck;

export interface AnomalyScanFinding extends AnomalyReadingCheck {
  asset_code: string;
  asset_name: string;
}

export interface LiveReading {
  asset_id: number;
  asset_code: string;
  asset_name: string;
  asset_type: string;
  sensor_type: SensorType;
  value: number;
  unit: string;
  timestamp: IsoDateString;
  anomaly: boolean;
  trend: SensorTrend;
  cascade_risk: boolean;
}
