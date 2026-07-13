from pydantic import BaseModel
from datetime import datetime
from typing import Optional

class AssetOut(BaseModel):
    id: int
    code: str
    name: str
    asset_type: str
    class Config:
        from_attributes = True

class SensorReadingIn(BaseModel):
    asset_id: int
    sensor_type: str
    value: float
    unit: str

class IncidentIn(BaseModel):
    asset_id: int
    symptom_text: str

class IncidentOut(BaseModel):
    id: int
    asset_id: int
    symptom_text: str
    diagnosis: Optional[str]
    fix_steps: Optional[str]
    risk_level: str
    resolved: bool
    created_at: datetime
    class Config:
        from_attributes = True

