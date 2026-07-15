"""
Sensor simulation layer.
Single point of abstraction — swapping to real IoT later means
changing only generate_reading(), nothing else in the system.
"""
import random
from datetime import datetime
from sqlalchemy.orm import Session
from app.models import Asset, SensorReading

NORMAL_RANGES = {
    "vibration": (2.0, 6.0),      # mm/s
    "temperature": (40.0, 75.0),  # °C
    "throughput": (80.0, 150.0),  # t/h
}

SENSOR_UNITS = {
    "vibration": "mm/s",
    "temperature": "C",
    "throughput": "t/h",
}

def generate_reading(asset_type: str, sensor_type: str, anomaly: bool = False) -> float:
    """
    Core abstraction point. Real IoT integration later replaces
    ONLY this function's internals — callers never change.
    """
    low, high = NORMAL_RANGES[sensor_type]
    if anomaly:
        spike = (high - low) * random.uniform(1.5, 3.0)
        return round(high + spike, 2)
    return round(random.uniform(low, high), 2)


def simulate_and_log(db: Session, asset_id: int, sensor_type: str, anomaly: bool = False) -> SensorReading:
    """Generates one reading and writes it to the DB."""
    asset = db.query(Asset).get(asset_id)
    value = generate_reading(asset.asset_type, sensor_type, anomaly)

    reading = SensorReading(
        asset_id=asset_id,
        sensor_type=sensor_type,
        value=value,
        unit=SENSOR_UNITS[sensor_type],
        timestamp=datetime.utcnow(),
    )
    db.add(reading)
    db.commit()
    db.refresh(reading)
    return reading


def simulate_all_assets(db: Session, sensor_types: list = None):
    """Generates one reading per asset per sensor type — for a quick full-line snapshot."""
    if sensor_types is None:
        sensor_types = ["vibration", "temperature", "throughput"]

    assets = db.query(Asset).all()
    results = []
    for asset in assets:
        for stype in sensor_types:
            reading = simulate_and_log(db, asset.id, stype)
            results.append(reading)
    return results
