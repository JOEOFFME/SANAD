import json, time
from datetime import datetime, timezone
import paho.mqtt.client as mqtt
from app.twin.sensor_sim import generate_reading, SENSOR_UNITS
from app.database import SessionLocal
from app.models import Asset

BROKER_IP = "localhost"
SENSOR_TYPES = ["vibration", "temperature", "throughput"]

db = SessionLocal()
assets_db = db.query(Asset).all()
ASSETS = {a.code: (a.id, a.asset_type) for a in assets_db}
db.close()

if not ASSETS:
    raise RuntimeError("Aucun asset en DB — lance seed.py d'abord")

print(f"Assets chargés: {list(ASSETS.keys())}")

client = mqtt.Client()
client.connect(BROKER_IP, 1883)

try:
    while True:
        for code, (asset_id, asset_type) in ASSETS.items():
            for sensor_type in SENSOR_TYPES:
                value = generate_reading(asset_type, sensor_type)
                payload = {
                    "asset_id": asset_id,
                    "asset_code": code,
                    "sensor_type": sensor_type,
                    "value": value,
                    "unit": SENSOR_UNITS[sensor_type],
                    "timestamp": datetime.now(timezone.utc).isoformat(),
                }
                client.publish(f"sensors/{asset_id}", json.dumps(payload))
                print(f"Published: {code} / {sensor_type} = {value}")
        time.sleep(2)
except KeyboardInterrupt:
    print("\nArrêt publisher.")
    client.disconnect()
