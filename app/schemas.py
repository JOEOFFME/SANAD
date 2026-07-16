from pydantic import BaseModel, Field
from datetime import datetime
from typing import Optional

# ── Asset ────────────────────────────────────────────────────────────────────
class AssetOut(BaseModel):
    id: int
    code: str
    name: str
    asset_type: str
    manual_ref: Optional[str] = None
    class Config:
        from_attributes = True

class AssetIn(BaseModel):
    code: str
    name: str
    asset_type: str
    manual_ref: Optional[str] = None

# ── SensorReading ────────────────────────────────────────────────────────────
class SensorReadingIn(BaseModel):
    asset_id: int
    sensor_type: str
    value: float
    unit: str

class SensorReadingOut(BaseModel):
    id: int
    asset_id: int
    sensor_type: str
    value: float
    unit: str
    timestamp: datetime
    class Config:
        from_attributes = True

# ── TopologyEdge ─────────────────────────────────────────────────────────────
class TopologyEdgeIn(BaseModel):
    from_asset_id: int
    to_asset_id: int
    relation: str = "feeds_into"

class TopologyEdgeOut(BaseModel):
    id: int
    from_asset_id: int
    to_asset_id: int
    relation: str
    class Config:
        from_attributes = True

# ── Incident ─────────────────────────────────────────────────────────────────
class IncidentIn(BaseModel):
    asset_id: int
    symptom_text: str

class IncidentOut(BaseModel):
    id: int
    asset_id: int
    symptom_text: str
    diagnosis: Optional[str] = None
    fix_steps: Optional[str] = None
    risk_level: str
    resolved: bool
    operator_feedback: Optional[str] = None
    created_at: datetime
    class Config:
        from_attributes = True

# ── NodeConfidence ───────────────────────────────────────────────────────────
class NodeConfidenceOut(BaseModel):
    id: int
    asset_id: int
    confidence_score: float
    updated_at: datetime
    class Config:
        from_attributes = True
