from app.database import SessionLocal
from app.twin.sensor_sim import simulate_and_log
from app.twin.anomaly import check_latest_reading
from app.models import Asset

db = SessionLocal()
hp400 = db.query(Asset).filter_by(code="HP400").first()

# Force anomaly LAST, so it's genuinely the most recent reading
simulate_and_log(db, hp400.id, "vibration", anomaly=True)

print(check_latest_reading(db, hp400.id, "vibration"))
