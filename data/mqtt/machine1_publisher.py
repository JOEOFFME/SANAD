import json, time
import logging
from datetime import datetime, timezone
import paho.mqtt.client as mqtt
from app.twin.sensor_sim import generate_reading, SENSOR_UNITS
from app.database import SessionLocal
from app.config import settings
from app.models import Asset

from app.logging_config import setup_logging
log = setup_logging("publisher")

BROKER_IP = "localhost"
SENSOR_TYPES = ["vibration", "temperature", "throughput"]

db = SessionLocal()
assets_db = db.query(Asset).all()
ASSETS = {a.code: (a.id, a.asset_type) for a in assets_db}
db.close()

if not ASSETS:
    raise RuntimeError("Aucun asset en DB — lance seed.py d'abord")

log.info(f"Assets chargés: {list(ASSETS.keys())}")

def on_connect(client, userdata, flags, rc):
    if rc == 0:
        log.info("Connected to broker.")
    else:
        log.error(f"Connection failed, rc={rc}")

def on_disconnect(client, userdata, rc):
    log.warning(f"Disconnected (rc={rc}) — paho will auto-reconnect.")

client = mqtt.Client(reconnect_on_failure=True)
client.on_connect = on_connect
client.on_disconnect = on_disconnect

log.info("Connecting to broker...")
client.username_pw_set(settings.mqtt_username, settings.mqtt_password)
client.connect(BROKER_IP, 1883)
client.loop_start()

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
                client.publish(f"sensors/{asset_id}", json.dumps(payload), qos=1)
                log.info(f"Published: {code} / {sensor_type} = {value}")
        time.sleep(2)
except KeyboardInterrupt:
    log.info("Stopping publisher.")
    client.loop_stop()
    client.disconnect()
