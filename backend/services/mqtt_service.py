import json
import os
import time
import threading
import datetime
import paho.mqtt.client as mqtt

from backend.database import get_db_connection

# Environment configs
MQTT_BROKER_HOST = os.getenv("MQTT_BROKER_HOST", "localhost")
try:
    MQTT_BROKER_PORT = int(os.getenv("MQTT_BROKER_PORT", 1883))
except ValueError:
    MQTT_BROKER_PORT = 1883

MQTT_USERNAME = os.getenv("MQTT_USERNAME", None)
MQTT_PASSWORD = os.getenv("MQTT_PASSWORD", None)
MQTT_TLS = os.getenv("MQTT_TLS", "false").lower() == "true"
MQTT_TOPIC = os.getenv("MQTT_TOPIC", "hospital/+/+/+/+")

# Thread-safe queue for incoming logs to be processed by streaming inference
from queue import Queue
ingestion_queue = Queue()

class MQTTSubscriberService:
    def __init__(self):
        # Determine Client API version depending on paho-mqtt version installed
        # paho-mqtt v2.x requires callback_api_version
        try:
            self.client = mqtt.Client(callback_api_version=mqtt.CallbackAPIVersion.VERSION2)
        except AttributeError:
            self.client = mqtt.Client()
            
        if MQTT_USERNAME and MQTT_PASSWORD:
            self.client.username_pw_set(MQTT_USERNAME, MQTT_PASSWORD)
            
        if MQTT_TLS:
            self.client.tls_set()
            
        self.client.on_connect = self.on_connect
        self.client.on_message = self.on_message
        self.client.on_disconnect = self.on_disconnect
        
        self.thread = None
        self.running = False
        
    def on_connect(self, client, userdata, flags, rc, properties=None):
        print(f"MQTT Connected successfully to broker {MQTT_BROKER_HOST}:{MQTT_BROKER_PORT} with result: {rc}")
        self.client.subscribe(MQTT_TOPIC)
        print(f"Subscribed to topic pattern: {MQTT_TOPIC}")
        
    def on_disconnect(self, client, userdata, flags, rc, properties=None):
        print(f"MQTT Disconnected from broker. Result code: {rc}. Reconnecting...")
        # Exponential backoff reconnection loop
        backoff = 1
        while self.running:
            try:
                print(f"Retrying MQTT connection in {backoff}s...")
                time.sleep(backoff)
                self.client.reconnect()
                break
            except Exception:
                backoff = min(backoff * 2, 60)
                
    def on_message(self, client, userdata, msg):
        topic = msg.topic
        payload_str = msg.payload.decode('utf-8')
        
        # Topic schema: hospital/{hospital_id}/{department}/{device_type}/{device_id}
        parts = topic.split('/')
        if len(parts) < 5:
            print(f"Ignored topic message {topic} (invalid namespace depth).")
            return
            
        hospital_id = parts[1]
        department = parts[2]
        device_type = parts[3]
        device_id = parts[4]
        
        validation_status = "VALID"
        payload_dict = {}
        
        try:
            payload_dict = json.loads(payload_str)
            # Basic validation check
            if "device_id" not in payload_dict or "timestamp" not in payload_dict:
                raise ValueError("Missing device_id or timestamp in payload.")
        except Exception as e:
            validation_status = "INVALID"
            print(f"MQTT Ingestion: rejected malformed telemetry payload from {topic}: {e}")
            
        # Store raw telemetry log in SQLite
        try:
            conn = get_db_connection()
            cursor = conn.cursor()
            cursor.execute("""
            INSERT INTO device_logs (hospital_id, device_id, timestamp, payload, ingestion_timestamp, source, validation_status)
            VALUES (?, ?, ?, ?, ?, ?, ?)
            """, (
                hospital_id,
                device_id,
                payload_dict.get("timestamp", datetime.datetime.now().strftime("%Y-%m-%dT%H:%M:%SZ")),
                payload_str,
                datetime.datetime.now().strftime("%Y-%m-%dT%H:%M:%SZ"),
                "MQTT",
                validation_status
            ))
            conn.commit()
            conn.close()
        except Exception as e:
            print(f"Database error writing telemetry log: {e}")
            
        # If valid, push to ingestion queue for streaming ML window aggregation
        if validation_status == "VALID":
            ingestion_queue.put({
                "hospital_id": hospital_id,
                "department": department,
                "device_type": device_type,
                "device_id": device_id,
                "payload": payload_dict,
                "source": "MQTT"
            })
            
    def start(self):
        if self.running:
            return
        self.running = True
        self.thread = threading.Thread(target=self._run_loop, daemon=True)
        self.thread.start()
        
    def _run_loop(self):
        print(f"Starting MQTT background service on {MQTT_BROKER_HOST}:{MQTT_BROKER_PORT}...")
        while self.running:
            try:
                self.client.connect(MQTT_BROKER_HOST, MQTT_BROKER_PORT, 60)
                self.client.loop_forever()
            except Exception as e:
                print(f"MQTT connection error: {e}. Retrying in 5 seconds...")
                time.sleep(5)
                
    def stop(self):
        self.running = False
        self.client.disconnect()
        if self.thread:
            self.thread.join(timeout=2)
            
# Singleton MQTT Service
mqtt_service = MQTTSubscriberService()
