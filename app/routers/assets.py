from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session
from app.database import get_db
from app import models, schemas
from app.twin.topology import get_downstream, get_upstream, simulate_cascade_failure

router = APIRouter(prefix="/assets", tags=["assets"])

@router.get("/", response_model=list[schemas.AssetOut])
def list_assets(db: Session = Depends(get_db)):
    return db.query(models.Asset).all()

@router.get("/{asset_id}/downstream")
def downstream(asset_id: int, hops: int = 1, db: Session = Depends(get_db)):
    return get_downstream(db, asset_id, hops)

@router.get("/{asset_id}/upstream")
def upstream(asset_id: int, hops: int = 1, db: Session = Depends(get_db)):
    return get_upstream(db, asset_id, hops)

@router.get("/{asset_id}/cascade")
def cascade(asset_id: int, db: Session = Depends(get_db)):
    return simulate_cascade_failure(db, asset_id)
