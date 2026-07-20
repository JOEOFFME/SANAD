"""
Retention policy: deletes sensor_readings older than RETENTION_DAYS.
Run manually or schedule via cron (e.g., daily at 2am).
"""
import logging
from datetime import datetime, timezone, timedelta
from app.database import SessionLocal
from app.models import SensorReading

from app.logging_config import setup_logging
log = setup_logging("purge")

RETENTION_DAYS = 30

def purge_old_readings():
    cutoff = datetime.now(timezone.utc) - timedelta(days=RETENTION_DAYS)
    db = SessionLocal()
    try:
        deleted = (
            db.query(SensorReading)
            .filter(SensorReading.timestamp < cutoff)
            .delete(synchronize_session=False)
        )
        db.commit()
        log.info(f"Purged {deleted} readings older than {cutoff.isoformat()}")
    except Exception as e:
        db.rollback()
        log.error(f"Purge failed: {e}")
    finally:
        db.close()

if __name__ == "__main__":
    purge_old_readings()
