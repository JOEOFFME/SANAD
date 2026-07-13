# app/twin/anomaly.py
"""
Anomaly detection layer.
Threshold-based for now — swappable later for the XGBoost Predictor
from the architecture (same pattern as sensor_sim.py's single-point-swap idea).
"""

from sqlalchemy.orm import Session
from app.models import SensorReading, Asset
from app.twin.sensor_sim import NORMAL_RANGES


def check_reading(sensor_type: str, value: float) -> dict:
    """
    Core check — is this single value inside the normal range?
    Returns severity so callers (Router Agent later) can decide urgency.
    """
    low, high = NORMAL_RANGES[sensor_type]

    if low <= value <= high:
        return {"status": "normal", "severity": None}

    # how far outside the range, as a ratio — used for severity tiering
    if value > high:
        deviation = (value - high) / (high - low)
    else:
        deviation = (low - value) / (high - low)

    if deviation < 0.5:
        severity = "low"
    elif deviation < 1.5:
        severity = "medium"
    else:
        severity = "high"

    return {"status": "anomaly", "severity": severity, "deviation_ratio": round(deviation, 2)}


def check_latest_reading(db: Session, asset_id: int, sensor_type: str) -> dict:
    """Pulls the most recent reading for an asset+sensor and checks it."""
    reading = (
        db.query(SensorReading)
        .filter_by(asset_id=asset_id, sensor_type=sensor_type)
        .order_by(SensorReading.timestamp.desc())
        .first()
    )
    if not reading:
        return {"status": "no_data"}

    result = check_reading(sensor_type, reading.value)
    result["asset_id"] = asset_id
    result["sensor_type"] = sensor_type
    result["value"] = reading.value
    result["timestamp"] = reading.timestamp
    return result


def scan_all_assets(db: Session) -> list:
    """Full-line health scan — one anomaly check per asset per sensor type."""
    assets = db.query(Asset).all()
    findings = []
    for asset in assets:
        for sensor_type in NORMAL_RANGES.keys():
            result = check_latest_reading(db, asset.id, sensor_type)
            if result.get("status") == "anomaly":
                result["asset_code"] = asset.code
                result["asset_name"] = asset.name
                findings.append(result)
    return findings
