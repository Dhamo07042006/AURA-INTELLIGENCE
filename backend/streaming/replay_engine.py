import json
import time
import threading
import datetime
import paho.mqtt.client as mqtt

from backend.services.mqtt_service import ingestion_queue, MQTT_BROKER_HOST, MQTT_BROKER_PORT
from backend.streaming.simulator import get_scenario_telemetry # we will write this next!

class ReplayEngine:
    def __init__(self):
        self.running = False
        self.paused = False
        self.speed = 1.0 # Speed multiplier
        self.thread = None
        
        self.hospital_id = "demo-hospital"
        self.device_id = "DEV000001"
        self.department = "Intensive Care Unit (ICU)"
        self.device_type = "Ventilator"
        self.scenario = "Normal"
        
        # Internal step count to track degradation progress
        self.current_step = 0
        self.mqtt_client = None
        
    def setup_mqtt_client(self):
        try:
            # Try to connect a temporary publisher client
            self.mqtt_client = mqtt.Client()
            self.mqtt_client.connect(MQTT_BROKER_HOST, MQTT_BROKER_PORT, 10)
            self.mqtt_client.loop_start()
        except Exception as e:
            print(f"Replay Engine: MQTT broker connection bypassed ({e}). Operating in direct internal queue ingestion.")
            self.mqtt_client = None

    def start_replay(self, hospital_id, device_id, department, device_type, scenario="Normal", speed=1.0):
        self.stop_replay()
        
        self.hospital_id = hospital_id
        self.device_id = device_id
        self.department = department
        self.device_type = device_type
        self.scenario = scenario
        self.speed = speed
        
        self.running = True
        self.paused = False
        self.current_step = 0
        
        self.setup_mqtt_client()
        
        self.thread = threading.Thread(target=self._replay_loop, daemon=True)
        self.thread.start()
        print(f"Replay Engine: Started replay for {device_id} ({scenario} scenario) at {speed}x speed.")

    def pause_replay(self):
        self.paused = True
        print("Replay Engine: Paused.")

    def resume_replay(self):
        self.paused = False
        print("Replay Engine: Resumed.")

    def stop_replay(self):
        self.running = False
        self.paused = False
        if self.mqtt_client:
            self.mqtt_client.loop_stop()
            self.mqtt_client.disconnect()
            self.mqtt_client = None
            
        if self.thread:
            self.thread.join(timeout=1.0)
            self.thread = None
        print("Replay Engine: Stopped.")

    def set_speed(self, speed):
        self.speed = speed
        print(f"Replay Engine: Speed changed to {speed}x.")

    def _replay_loop(self):
        base_interval = 2.0 # Stream a log every 2 seconds by default
        
        while self.running:
            if self.paused:
                time.sleep(0.5)
                continue
                
            # Get telemetry payload based on the selected failure scenario
            payload = get_scenario_telemetry(self.device_id, self.scenario, self.current_step)
            
            # Construct MQTT topic
            # hospital/{hospital_id}/{department}/{device_type}/{device_id}
            topic = f"hospital/{self.hospital_id}/{self.department}/{self.device_type}/{self.device_id}"
            
            payload_str = json.dumps(payload)
            
            # 1. Publish to real MQTT broker if available
            if self.mqtt_client:
                try:
                    self.mqtt_client.publish(topic, payload_str)
                except Exception as e:
                    print(f"MQTT Publish error in replay: {e}")
                    
            # 2. Push directly to pipeline ingestion queue to guarantee delivery in fallback/demo setups
            try:
                # Store raw telemetry log in SQLite
                from backend.database import get_db_connection
                conn = get_db_connection()
                cursor = conn.cursor()
                cursor.execute("""
                INSERT INTO device_logs (hospital_id, device_id, timestamp, payload, ingestion_timestamp, source, validation_status)
                VALUES (?, ?, ?, ?, ?, ?, ?)
                """, (
                    self.hospital_id,
                    self.device_id,
                    payload["timestamp"],
                    payload_str,
                    datetime.datetime.now().strftime("%Y-%m-%dT%H:%M:%SZ"),
                    "Replay Engine",
                    "VALID"
                ))
                conn.commit()
                conn.close()
                
                # Push payload to queue
                ingestion_queue.put({
                    "hospital_id": self.hospital_id,
                    "department": self.department,
                    "device_type": self.device_type,
                    "device_id": self.device_id,
                    "payload": payload,
                    "source": "Replay Engine"
                })
            except Exception as e:
                print(f"Replay Ingestion DB Error: {e}")
                
            self.current_step += 1
            
            # Apply speed multiplier
            sleep_time = max(0.01, base_interval / self.speed)
            time.sleep(sleep_time)

# Singleton replay instance
replay_engine = ReplayEngine()
