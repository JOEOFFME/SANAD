import pytest
from app.twin.sensor_sim import generate_reading, NORMAL_RANGES, simulate_and_log
from app.database import SessionLocal

def test_generate_reading_within_normal_range():
    for sensor_type, (low, high) in NORMAL_RANGES.items():
        value = generate_reading("crusher", sensor_type)
        assert low <= value <= high

def test_generate_reading_anomaly_exceeds_range():
    for sensor_type, (low, high) in NORMAL_RANGES.items():
        value = generate_reading("crusher", sensor_type, anomaly=True)
        assert value > high

def test_simulate_and_log_raises_on_invalid_asset():
    db = SessionLocal()
    try:
        with pytest.raises(ValueError):
            simulate_and_log(db, asset_id=999999, sensor_type="vibration")
    finally:
        db.close()
