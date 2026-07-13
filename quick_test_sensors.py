from app.database import SessionLocal
from app.twin.sensor_sim import simulate_and_log, simulate_all_assets
from app.models import Asset

db = SessionLocal()
hp400 = db.query(Asset).filter_by(code="HP400").first()

print("--- Single reading (forced anomaly) ---")
r = simulate_and_log(db, hp400.id, "vibration", anomaly=True)
print(r.asset_id, r.sensor_type, r.value, r.unit)

print("--- Full line snapshot ---")
for r in simulate_all_assets(db):
    print(r.asset_id, r.sensor_type, r.value, r.unit)
