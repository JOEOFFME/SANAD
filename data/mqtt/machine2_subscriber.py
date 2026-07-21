import json
import logging
from datetime import datetime, timezone
import paho.mqtt.client as mqtt
from pydantic import ValidationError
from app.database import SessionLocal
from app.config import settings
from app.models import SensorReading, Asset
from app.schemas import SensorReadingIn

from app.logging_config import setup_logging
log = setup_logging("subscriber")

RECONNECT_DELAY = 5

db = SessionLocal()
pending = 0

def on_connect(client, userdata, flags, reason_code, properties):
    if reason_code == 0:
        log.info("Connected to broker.")
        client.subscribe(settings.mqtt_topic, qos=1)
        log.info(f"Subscribed to {settings.mqtt_topic}.")
    else:
        log.error(f"Connection failed, reason={reason_code}")

def on_disconnect(client, userdata, disconnect_flags, reason_code, properties):
    log.warning(f"Disconnected (reason={reason_code}) — paho will auto-reconnect.")

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
        asset = None
        if raw.get("asset_code"):
            asset = db.query(Asset).filter_by(code=raw["asset_code"]).one_or_none()
        if asset is None:
            asset = db.get(Asset, validated.asset_id)
        if asset is None:
            log.warning(
                f"Unknown asset code={raw.get('asset_code', '?')} "
                f"id={validated.asset_id}, dropped."
            )
            return

        reading = SensorReading(
            asset_id=asset.id,
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

        if pending >= settings.mqtt_commit_batch_size:
            db.commit()
            pending = 0
    except Exception as e:
        log.error(f"Insert failed, rolling back this record only: {e}")
        db.rollback()
        pending = 0

client = mqtt.Client(
    callback_api_version=mqtt.CallbackAPIVersion.VERSION2,
    reconnect_on_failure=True,
)
client.on_connect = on_connect
client.on_disconnect = on_disconnect
client.on_message = on_message

log.info(
    f"Connecting to broker {settings.mqtt_broker_host}:"
    f"{settings.mqtt_broker_port}..."
)
client.username_pw_set(settings.mqtt_username, settings.mqtt_password)
client.reconnect_delay_set(min_delay=1, max_delay=RECONNECT_DELAY)
client.connect(settings.mqtt_broker_host, settings.mqtt_broker_port)

try:
    client.loop_forever(retry_first_connection=True)
except KeyboardInterrupt:
    log.info("Subscriber stopped.")
finally:
    if pending:
        db.commit()
    db.close()
