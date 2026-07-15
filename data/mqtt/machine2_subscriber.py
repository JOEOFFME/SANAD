import json
from datetime import datetime, timezone
import paho.mqtt.client as mqtt
from app.database import SessionLocal
from app.models import SensorReading

BROKER_IP = "localhost"
BATCH_SIZE = 5

db = SessionLocal()
pending = 0

def on_connect(client, userdata, flags, rc):
    print(f"Connected: {rc}")
    client.subscribe("sensors/#")

def on_message(client, userdata, msg):
    global pending
    try:
        data = json.loads(msg.payload.decode())

        received_at = datetime.now(timezone.utc)
        sent_at = datetime.fromisoformat(data["timestamp"])
        latency_ms = (received_at - sent_at).total_seconds() * 1000

        reading = SensorReading(
            asset_id=data["asset_id"],
            sensor_type=data["sensor_type"],
            value=data["value"],
            unit=data["unit"],
            timestamp=sent_at,
        )
        db.add(reading)
        pending += 1

        if pending >= BATCH_SIZE:
            db.commit()
            pending = 0

        print(f"Queued: {data['asset_code']} / {data['sensor_type']} = {data['value']} | latency: {latency_ms:.1f}ms")
    except Exception as e:
        print(f"Erreur insertion: {e}")
        db.rollback()

client = mqtt.Client()
client.on_connect = on_connect
client.on_message = on_message
client.connect(BROKER_IP, 1883)

print("Subscriber en écoute sur sensors/#...")
try:
    client.loop_forever()
except KeyboardInterrupt:
    db.commit()
    db.close()
