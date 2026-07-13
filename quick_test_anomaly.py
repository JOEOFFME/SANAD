from app.database import SessionLocal
from app.twin.anomaly import check_latest_reading, scan_all_assets
from app.models import Asset

db = SessionLocal()
hp400 = db.query(Asset).filter_by(code="HP400").first()

print("--- Check HP400 vibration (should flag the earlier forced anomaly) ---")
print(check_latest_reading(db, hp400.id, "vibration"))

print("--- Full line anomaly scan ---")
for f in scan_all_assets(db):
    print(f)
