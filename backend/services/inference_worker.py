import time
import threading
import queue
import datetime
import json
from backend.services.mqtt_service import ingestion_queue
from backend.database import get_db_connection

# Global connections manager for WebSockets
class WebSocketConnectionManager:
    def __init__(self):
        # Maps WebSocket connection instance to user info dict
        self.active_connections = {}

    def connect(self, websocket, user: dict):
        self.active_connections[websocket] = user

    def disconnect(self, websocket):
        self.active_connections.pop(websocket, None)

    async def broadcast_device_update(self, hospital_id: str, device_id: str, update_type: str, data: dict):
        # Multi-tenant scoping
        for connection, user in list(self.active_connections.items()):
            if user["hospital_id"] != hospital_id:
                continue
            
            # Department authorization for operators
            if user["role"] == "DEPARTMENT_OPERATOR":
                device_dept = data.get("department")
                if user["department"] != device_dept:
                    continue
            
            try:
                await connection.send_json({
                    "type": update_type,
                    "device_id": device_id,
                    "data": data
                })
            except Exception:
                pass

ws_manager = WebSocketConnectionManager()

# Telemetry features update helper
def update_features_with_telemetry(features_dict, payload):
    if not features_dict or not payload:
        return features_dict
        
    if "battery_health" in payload:
        features_dict["Approx_Battery_Health"] = float(payload["battery_health"])
    if "temperature" in payload:
        features_dict["Average_Temperature_C"] = float(payload["temperature"])
    if "load_percent" in payload:
        features_dict["Peak_Load_Percent"] = float(payload["load_percent"])
        features_dict["Average_Load_Percent"] = float(payload["load_percent"]) * 0.8
        
    error_code = payload.get("error_code", "OK")
    if error_code == "BAT_WARN":
        features_dict["Battery_Errors_Last_7_Days"] = max(features_dict.get("Battery_Errors_Last_7_Days", 0) + 1.0, 5.0)
        features_dict["Warnings_Last_7_Days"] = max(features_dict.get("Warnings_Last_7_Days", 0) + 1.0, 3.0)
    elif error_code == "BAT_CRITICAL":
        features_dict["Battery_Errors_Last_7_Days"] = max(features_dict.get("Battery_Errors_Last_7_Days", 0) + 3.0, 10.0)
        features_dict["Alarms_Last_7_Days"] = max(features_dict.get("Alarms_Last_7_Days", 0) + 2.0, 5.0)
    elif error_code in ["TEMP_WARN", "TEMP_CRITICAL"]:
        features_dict["Alarms_Last_7_Days"] = max(features_dict.get("Alarms_Last_7_Days", 0) + 2.0, 5.0)
    elif error_code == "SENSOR_ERR":
        features_dict["Sensor_Errors_Last_7_Days"] = max(features_dict.get("Sensor_Errors_Last_7_Days", 0) + 3.0, 10.0)
        features_dict["Abnormal_Sensors_Last_7_Days"] = max(features_dict.get("Abnormal_Sensors_Last_7_Days", 0) + 3.0, 10.0)
    elif error_code in ["POWER_WARN", "POWER_FLUC"]:
        features_dict["Power_Errors_Last_7_Days"] = max(features_dict.get("Power_Errors_Last_7_Days", 0) + 3.0, 8.0)
        features_dict["Voltage_Fluctuation_Count"] = max(features_dict.get("Voltage_Fluctuation_Count", 0) + 5.0, 12.0)
    elif error_code in ["COMM_ERR", "SYS_RESET"]:
        features_dict["System_Resets_Last_7_Days"] = max(features_dict.get("System_Resets_Last_7_Days", 0) + 2.0, 5.0)
        
    return features_dict

class LiveInferenceWorker:
    def __init__(self):
        self.running = False
        self.thread = None
        self.last_inference_time = {}
        # 5-second aggregation window by default
        self.inference_window = 5.0
        # Reference to import main's cache dynamically
        self.device_cache = None
        self.inference_engine = None
        
    def start(self, inference_engine, device_cache):
        self.inference_engine = inference_engine
        self.device_cache = device_cache
        self.running = True
        self.thread = threading.Thread(target=self._run_loop, daemon=True)
        self.thread.start()
        print("Live Inference Worker thread started.")
        
    def stop(self):
        self.running = False
        if self.thread:
            self.thread.join(timeout=1.0)
            
    def _run_loop(self):
        import asyncio
        loop = asyncio.new_event_loop()
        asyncio.set_event_loop(loop)
        
        while self.running:
            try:
                # Poll ingestion queue
                item = ingestion_queue.get(timeout=1.0)
            except queue.Empty:
                continue
                
            hospital_id = item["hospital_id"]
            device_id = item["device_id"]
            department = item["department"]
            device_type = item["device_type"]
            payload = item["payload"]
            
            now = time.time()
            last_time = self.last_inference_time.get(device_id, 0.0)
            
            # Check window aggregation (run inference at most once per 5 seconds)
            if now - last_time >= self.inference_window:
                self.last_inference_time[device_id] = now
                
                try:
                    # Run ML prediction via the inference engine
                    report = self.inference_engine.run_device_report(device_id, live_payload=payload)
                    
                    if "error" in report:
                        print(f"Worker Inference Error for {device_id}: {report['error']}")
                        continue
                        
                    # 1. Update in-memory device cache
                    # Keep track of active departments dynamically
                    if self.device_cache is not None:
                        self.device_cache[device_id] = report
                        
                    # 2. Write predictions to SQLite database
                    try:
                        conn = get_db_connection()
                        cursor = conn.cursor()
                        cursor.execute("""
                        INSERT INTO predictions (hospital_id, device_id, timestamp, failure_probability, risk_level, anomaly_score, overall_health, model_version)
                        VALUES (?, ?, ?, ?, ?, ?, ?, ?)
                        """, (
                            hospital_id,
                            device_id,
                            payload.get("timestamp", datetime.datetime.utcnow().strftime("%Y-%m-%dT%H:%M:%SZ")),
                            report["failure_probability"],
                            report["risk_level"],
                            report["anomaly"]["score"],
                            report["overall_health"],
                            "2.0"
                        ))
                        
                        # 3. Generate Alerts if risk level is HIGH or CRITICAL
                        risk = report["risk_level"]
                        if risk in ["HIGH", "CRITICAL"]:
                            # Check if alert already exists active for this device
                            cursor.execute("SELECT alert_id FROM alerts WHERE device_id = ? AND status = 'active'", (device_id,))
                            existing = cursor.fetchone()
                            
                            if not existing:
                                # Save alert to SQLite database
                                cursor.execute("""
                                INSERT INTO alerts (hospital_id, device_id, department, timestamp, risk_level, failure_probability, anomaly_score, root_cause, component, recommended_action, status)
                                VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
                                """, (
                                    hospital_id,
                                    device_id,
                                    department,
                                    payload.get("timestamp", datetime.datetime.utcnow().strftime("%Y-%m-%dT%H:%M:%SZ")),
                                    risk,
                                    report["failure_probability"],
                                    report["anomaly"]["score"],
                                    report["root_cause"]["primary"],
                                    list(report["components"].keys())[0] if report["components"] else "Battery",
                                    report["maintenance"]["recommended_action"],
                                    "active"
                                ))
                                
                        conn.commit()
                        conn.close()
                    except Exception as e:
                        print(f"Worker DB update error for {device_id}: {e}")
                        
                    # 4. Broadcast real-time update using AsyncIO loop
                    # Inject department inside report to perform operator channel validation
                    report["department"] = department
                    loop.run_until_complete(
                        ws_manager.broadcast_device_update(
                            hospital_id=hospital_id,
                            device_id=device_id,
                            update_type="DEVICE_UPDATE",
                            data=report
                        )
                    )
                    
                except Exception as e:
                    print(f"Worker streaming inference engine execution crashed for {device_id}: {e}")
                    
# Singleton inference worker
inference_worker = LiveInferenceWorker()
