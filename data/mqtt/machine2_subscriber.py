import json
import logging
from datetime import datetime, timezone
import paho.mqtt.client as mqtt
from pydantic import ValidationError
from app.database import SessionLocal
from app.config import settings
from app.models import SensorReading, Asset
from app.schemas import SensorReadingIn

logging.basicConfig(level=logging.INFO, format="%(asctime)s | %(levelname)s | %(message)s")
log = logging.getLogger("subscriber")

BROKER_IP = "localhost"
BATCH_SIZE = 5
RECONNECT_DELAY = 5

db = SessionLocal()
pending = 0

def on_connect(client, userdata, flags, rc):
    if rc == 0:
        log.info("Connected to broker.")
        client.subscribe("sensors/#", qos=1)
    else:
        log.error(f"Connection failed, rc={rc}")

def on_disconnect(client, userdata, rc):
    log.warning(f"Disconnected (rc={rc}) — paho will auto-reconnect.")

def on_message(client, userdata, msg):
    global pending
    try:
        raw = json.loads(msg.payload.decode())
    except json.JSONDecodeError:
        log.warning(f"Malformed JSON on {msg.topic}, dropped.")
        return

    try:
        validated = SensorReadingIn(
            asset_id=raw["asset_id"],
            sensor_type=raw["sensor_type"],
            value=raw["value"],
            unit=raw["unit"],
        )
        sent_at = datetime.fromisoformat(raw["timestamp"])
    except (ValidationError, KeyError, ValueError) as e:
        log.warning(f"Invalid payload dropped: {e}")
        return

    try:
        if db.get(Asset, validated.asset_id) is None:
            log.warning(f"Unknown asset_id={validated.asset_id}, dropped.")
            return

        reading = SensorReading(
            asset_id=validated.asset_id,
            sensor_type=validated.sensor_type,
            value=validated.value,
            unit=validated.unit,
            timestamp=sent_at,
        )
        db.add(reading)
        db.flush()
        pending += 1

        latency_ms = (datetime.now(timezone.utc) - sent_at).total_seconds() * 1000
        log.info(f"Queued: {raw.get('asset_code','?')} / {validated.sensor_type} = {validated.value} | latency: {latency_ms:.1f}ms")

        if pending >= BATCH_SIZE:
            db.commit()
            pending = 0
    except Exception as e:
        log.error(f"Insert failed, rolling back this record only: {e}")
        db.rollback()

client = mqtt.Client(reconnect_on_failure=True)
client.on_connect = on_connect
client.on_disconnect = on_disconnect
client.on_message = on_message

log.info("Connecting to broker...")
client.username_pw_set(settings.mqtt_username, settings.mqtt_password)
client.connect(BROKER_IP, 1883)

try:
    client.loop_forever(retry_first_connection=True)
except KeyboardInterrupt:
    if pending:
        db.commit()
    db.close()
    log.info("Subscriber stopped.")
