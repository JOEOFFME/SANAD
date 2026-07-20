"""
app/routers/dashboard.py
Real-time dashboard WebSocket endpoint.
- Polls sensor_readings every 2 s (matching sensor publish rate).
- On each tick, simulates new readings for all assets (keeps data fresh
  even if no external producer is running), then pushes the batch to
  every connected client as a JSON array.
- Auto-reconnect is handled client-side; this module only manages the
  server-side WebSocket lifecycle.
"""
import asyncio
import json

from fastapi import APIRouter, WebSocket, WebSocketDisconnect
from sqlalchemy.orm import Session
from app.database import SessionLocal
from app.models import Asset, SensorReading
from app.twin.sensor_sim import NORMAL_RANGES
from app.twin.trends import compute_trend, compute_cascade_risk, is_sensor_silent
router = APIRouter(tags=["dashboard"])
POLL_INTERVAL = 2.0  # seconds — must match sensor publish rate
# ── connection registry ────────────────────────────────────────────────────────
class ConnectionManager:
    def __init__(self):
        self.active: list[WebSocket] = []
    async def connect(self, ws: WebSocket):
        await ws.accept()
        self.active.append(ws)
    def disconnect(self, ws: WebSocket):
        if ws in self.active:
            self.active.remove(ws)
    async def broadcast(self, payload: str):
        dead = []
        for ws in self.active:
            try:
                await ws.send_text(payload)
            except Exception:
                dead.append(ws)
        for ws in dead:
            self.disconnect(ws)
manager = ConnectionManager()
# ── background poller ─────────────────────────────────────────────────────────
async def _poll_and_broadcast():
    """
    Runs forever in the background once the first client connects.
    Each cycle:
      1. Opens a DB session.
      2. Simulates one reading per asset × sensor-type (so the DB always has
         fresh rows even without an external MQTT producer).
      3. Fetches the latest reading per asset per sensor type.
      4. Broadcasts the snapshot to all connected clients.
    """
    while True:
        await asyncio.sleep(POLL_INTERVAL)
        if not manager.active:
            continue  # skip work if nobody is watching
        db: Session = SessionLocal()
        try:
            # 2. Fetch latest reading per asset × sensor
            assets = db.query(Asset).all()
            snapshot = []
            for asset in assets:
                for sensor_type in NORMAL_RANGES.keys():
                    reading = (
                        db.query(SensorReading)
                        .filter_by(asset_id=asset.id, sensor_type=sensor_type)
                        .order_by(SensorReading.timestamp.desc())
                        .first()
                    )
                    if reading:
                        low, high = NORMAL_RANGES[sensor_type]
                        snapshot.append({
                            "asset_id":    asset.id,
                            "asset_code":  asset.code,
                            "asset_name":  asset.name,
                            "asset_type":  asset.asset_type,
                            "sensor_type": sensor_type,
                            "value":       reading.value,
                            "unit":        reading.unit,
                            "timestamp":   reading.timestamp.isoformat(),
                            "anomaly":     not (low <= reading.value <= high),
                            "trend":       compute_trend(db, asset.id, sensor_type),
                            "cascade_risk": compute_cascade_risk(db, asset.id),
                            "silent":      is_sensor_silent(db, asset.id, sensor_type),
                        })
            if snapshot:
                await manager.broadcast(json.dumps(snapshot))
        except Exception as exc:
            print(f"[dashboard poller] error: {exc}")
        finally:
            db.close()
_poller_task: asyncio.Task | None = None
# ── WebSocket endpoint ────────────────────────────────────────────────────────
@router.websocket("/ws/live")
async def websocket_live(websocket: WebSocket):
    global _poller_task
    await manager.connect(websocket)
    # Start the background poller the first time a client arrives
    if _poller_task is None or _poller_task.done():
        _poller_task = asyncio.create_task(_poll_and_broadcast())
    # Send an immediate historical snapshot on connect (last 30 per channel)
    db: Session = SessionLocal()
    try:
        assets = db.query(Asset).all()
        history = []
        for asset in assets:
            for sensor_type in NORMAL_RANGES.keys():
                rows = (
                    db.query(SensorReading)
                    .filter_by(asset_id=asset.id, sensor_type=sensor_type)
                    .order_by(SensorReading.timestamp.desc())
                    .limit(30)
                    .all()
                )
                low, high = NORMAL_RANGES[sensor_type]
                for r in reversed(rows):   # oldest→newest
                    history.append({
                        "asset_id":    asset.id,
                        "asset_code":  asset.code,
                        "asset_name":  asset.name,
                        "asset_type":  asset.asset_type,
                        "sensor_type": sensor_type,
                        "value":       r.value,
                        "unit":        r.unit,
                        "timestamp":   r.timestamp.isoformat(),
                        "anomaly":     not (low <= r.value <= high),
                        "trend":       compute_trend(db, asset.id, sensor_type),
                        "cascade_risk": compute_cascade_risk(db, asset.id),
                        "silent":      is_sensor_silent(db, asset.id, sensor_type),
                    })
        if history:
            await websocket.send_text(json.dumps(history))
    finally:
        db.close()
    # Keep alive — client messages are ignored but the loop must run
    try:
        while True:
            await websocket.receive_text()
    except WebSocketDisconnect:
        manager.disconnect(websocket)
