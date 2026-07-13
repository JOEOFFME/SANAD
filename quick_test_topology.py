from app.database import SessionLocal
from app.twin.topology import get_downstream, get_upstream, simulate_cascade_failure
from app.models import Asset

db = SessionLocal()
hp400 = db.query(Asset).filter_by(code="HP400").first()

if not hp400:
    print("HP400 not found — did you run the seed script?")
else:
    print("--- Downstream from HP400 ---")
    print(get_downstream(db, hp400.id, hops=2))
    print("--- Upstream from HP400 ---")
    print(get_upstream(db, hp400.id, hops=1))
    print("--- Cascade failure sim ---")
    print(simulate_cascade_failure(db, hp400.id))
