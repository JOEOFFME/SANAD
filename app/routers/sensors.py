from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session
from app.database import get_db
from app.twin.sensor_sim import simulate_and_log, simulate_all_assets
from app.twin.anomaly import check_latest_reading, scan_all_assets

router = APIRouter(prefix="/sensors", tags=["sensors"])

@router.post("/{asset_id}/simulate")
def simulate_reading(asset_id: int, sensor_type: str, anomaly: bool = False, db: Session = Depends(get_db)):
    reading = simulate_and_log(db, asset_id, sensor_type, anomaly)
    return {"asset_id": reading.asset_id, "sensor_type": reading.sensor_type, "value": reading.value, "unit": reading.unit}

@router.post("/simulate-all")
def simulate_all(db: Session = Depends(get_db)):
    readings = simulate_all_assets(db)
    return {"count": len(readings)}

@router.get("/{asset_id}/check")
def check_asset(asset_id: int, sensor_type: str, db: Session = Depends(get_db)):
    return check_latest_reading(db, asset_id, sensor_type)

@router.get("/scan")
def scan(db: Session = Depends(get_db)):
    return scan_all_assets(db)
