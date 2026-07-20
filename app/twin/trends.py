"""
Trend & cascade analysis — pattern-level, no ML.
Operates on data already in DB; doesn't generate or store anything new.
"""
from sqlalchemy.orm import Session
from app.models import SensorReading, TopologyEdge
from app.twin.sensor_sim import NORMAL_RANGES

DRIFT_THRESHOLD_RATIO = 0.15  # 15% of the sensor's normal range

def compute_trend(db: Session, asset_id: int, sensor_type: str, window: int = 10) -> str:
    """
    Returns 'rising', 'falling', or 'stable' based on the last `window` readings,
    regardless of whether values are within normal range.
    """
    rows = (
        db.query(SensorReading)
        .filter_by(asset_id=asset_id, sensor_type=sensor_type)
        .order_by(SensorReading.timestamp.desc())
        .limit(window)
        .all()
    )
    if len(rows) < window:
        return "stable"

    values = [r.value for r in reversed(rows)]
    half = window // 2
    early_avg = sum(values[:half]) / half
    late_avg = sum(values[half:]) / (window - half)

    low, high = NORMAL_RANGES[sensor_type]
    threshold = (high - low) * DRIFT_THRESHOLD_RATIO

    delta = late_avg - early_avg
    if delta > threshold:
        return "rising"
    if delta < -threshold:
        return "falling"
    return "stable"

def get_upstream_assets(db: Session, asset_id: int) -> list[int]:
    """Assets that feed INTO this one (upstream neighbors)."""
    edges = db.query(TopologyEdge).filter_by(to_asset_id=asset_id).all()
    return [e.from_asset_id for e in edges]

def has_recent_anomaly(db: Session, asset_id: int) -> bool:
    """Checks if any sensor on this asset is currently out of normal range."""
    for sensor_type, (low, high) in NORMAL_RANGES.items():
        reading = (
            db.query(SensorReading)
            .filter_by(asset_id=asset_id, sensor_type=sensor_type)
            .order_by(SensorReading.timestamp.desc())
            .first()
        )
        if reading and not (low <= reading.value <= high):
            return True
    return False

def compute_cascade_risk(db: Session, asset_id: int) -> bool:
    """True if any upstream neighbor currently shows an anomaly."""
    upstream_ids = get_upstream_assets(db, asset_id)
    return any(has_recent_anomaly(db, uid) for uid in upstream_ids)
