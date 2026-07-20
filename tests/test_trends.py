from unittest.mock import MagicMock
from app.twin.trends import compute_trend

def make_reading(value):
    r = MagicMock()
    r.value = value
    return r

def test_compute_trend_rising():
    db = MagicMock()
    # 10 readings, oldest→newest after reversal: clearly increasing
    ascending = [make_reading(v) for v in [2.0, 2.2, 2.4, 2.6, 2.8, 4.0, 4.2, 4.4, 4.6, 4.8]]
    db.query().filter_by().order_by().limit().all.return_value = list(reversed(ascending))
    result = compute_trend(db, asset_id=1, sensor_type="vibration")
    assert result == "rising"

def test_compute_trend_stable():
    db = MagicMock()
    flat = [make_reading(v) for v in [3.0, 3.1, 2.9, 3.0, 3.1, 3.0, 2.9, 3.1, 3.0, 3.0]]
    db.query().filter_by().order_by().limit().all.return_value = list(reversed(flat))
    result = compute_trend(db, asset_id=1, sensor_type="vibration")
    assert result == "stable"

def test_compute_trend_insufficient_history():
    db = MagicMock()
    short = [make_reading(v) for v in [3.0, 3.1, 3.2]]
    db.query().filter_by().order_by().limit().all.return_value = list(reversed(short))
    result = compute_trend(db, asset_id=1, sensor_type="vibration")
    assert result == "stable"
