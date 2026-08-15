import os
import sys
import json
import math
import datetime
from fastapi import FastAPI, HTTPException, Query, UploadFile, File, Form, Depends, WebSocket, WebSocketDisconnect, Header
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
from typing import Optional, List

sys.path.append(os.path.dirname(os.path.dirname(os.path.dirname(os.path.abspath(__file__)))))

from backend.database import init_db, get_db_connection, hash_password, log_audit_event
from backend.services.auth import get_current_user, RoleChecker, verify_tenant_access, verify_device_access, create_access_token
from backend.services.inference_worker import ws_manager, inference_worker
from backend.services.mqtt_service import mqtt_service, ingestion_queue
from backend.streaming.replay_engine import replay_engine
from backend.ml.inference import MedicalDeviceInferenceEngine
from backend.knowledge_graph.graph_engine import MedicalDeviceGraphEngine
from backend.ml.dataset_manager import DatasetManager
from backend.rag.knowledge_base_manager import KnowledgeBaseManager

app = FastAPI(
    title="AI-Powered Medical Device Reliability Intelligence Platform API",
    description="Multi-Tenant Predictive Maintenance API with real-time stream ingestion and Grok RAG integration",
    version="3.0.0"
)

# Enable CORS for React frontend connection
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Paths
MODELS_DIR = r"C:\Users\Dhamodaran G\Desktop\CTS\models"
CACHE_PATH = os.path.join(MODELS_DIR, "device_latest_cache.json")

# In-memory caches and global engines
device_cache = {}
inference_engine = None
graph_engine = None

dataset_manager = DatasetManager()
knowledge_manager = KnowledgeBaseManager()

def clean_nans(val):
    if isinstance(val, float):
        if math.isnan(val) or math.isinf(val):
            return 0.0
        return val
    elif isinstance(val, dict):
        return {k: clean_nans(v) for k, v in val.items()}
    elif isinstance(val, list):
        return [clean_nans(x) for x in val]
    return val

@app.on_event("startup")
def startup_event():
    global device_cache, inference_engine, graph_engine
    print("FastAPI server starting up...")
    
    # Initialize SQL database
    init_db()
    
    # Load ML models and inference engines
    inference_engine = MedicalDeviceInferenceEngine()
    graph_engine = MedicalDeviceGraphEngine()
    
    # Load cache
    if os.path.exists(CACHE_PATH):
        try:
            print(f"Loading cached virtual twins from {CACHE_PATH}...")
            with open(CACHE_PATH, "r") as cf:
                raw_cache = json.load(cf)
            device_cache = clean_nans(raw_cache)
            # Default all cached devices to demo-hospital for local mock seeding compatibility
            for d_id, dev in device_cache.items():
                dev["hospital_id"] = "demo-hospital"
            print(f"Loaded {len(device_cache)} devices into memory cache.")
        except Exception as e:
            print(f"Error loading device cache: {e}. Live inference fallback.")
    
    # Start live telemetry background inference worker thread
    inference_worker.start(inference_engine, device_cache)

@app.on_event("shutdown")
def shutdown_event():
    print("Shutting down background services...")
    mqtt_service.stop()
    replay_engine.stop_replay()
    inference_worker.stop()

# Root endpoint
@app.get("/")
def read_root():
    return {
        "status": "online",
        "service": "Medical Device Reliability Intelligence API",
        "cached_devices": len(device_cache)
    }

# ==========================================
# MODULE 0: Authentication APIs
# ==========================================

class LoginPayload(BaseModel):
    username: str
    password: str

@app.post("/api/v1/auth/login")
def auth_login(payload: LoginPayload):
    conn = get_db_connection()
    cursor = conn.cursor()
    cursor.execute("SELECT * FROM users WHERE username = ?", (payload.username,))
    user = cursor.fetchone()
    conn.close()
    
    if not user or user["password_hash"] != hash_password(payload.password):
        log_audit_event(None, payload.username, None, "USER_LOGIN", "users", None, False)
        raise HTTPException(status_code=401, detail="Invalid username or password")
        
    token_data = {
        "sub": user["username"],
        "hospital_id": user["hospital_id"],
        "role": user["role"],
        "department": user["department"]
    }
    token = create_access_token(token_data)
    
    log_audit_event(str(user["user_id"]), user["username"], user["hospital_id"], "USER_LOGIN", "users", str(user["user_id"]), True)
    
    return {
        "access_token": token,
        "token_type": "bearer",
        "user": {
            "username": user["username"],
            "hospital_id": user["hospital_id"],
            "role": user["role"],
            "department": user["department"]
        }
    }

@app.get("/api/v1/auth/me")
def auth_me(current_user: dict = Depends(get_current_user)):
    return current_user

# ==========================================
# MODULE 1: Live Logs, Devices & Heatmap
# ==========================================

@app.get("/api/v1/live/devices")
def get_live_devices(current_user: dict = Depends(get_current_user)):
    h_id = current_user["hospital_id"]
    conn = get_db_connection()
    cursor = conn.cursor()
    
    if current_user["role"] == "DEPARTMENT_OPERATOR":
        cursor.execute("SELECT * FROM devices WHERE hospital_id = ? AND department = ?", (h_id, current_user["department"]))
    else:
        cursor.execute("SELECT * FROM devices WHERE hospital_id = ?", (h_id,))
        
    rows = [dict(r) for r in cursor.fetchall()]
    conn.close()
    
    # Merge with current prediction values from cache
    for d in rows:
        cache_data = device_cache.get(d["device_id"])
        if cache_data:
            d["failure_probability"] = cache_data.get("failure_probability", 0.05)
            d["risk_level"] = cache_data.get("risk_level", "LOW")
            d["overall_health"] = cache_data.get("overall_health", 90.0)
            d["anomaly_score"] = cache_data.get("anomaly", {}).get("score", 10.0)
        else:
            d["failure_probability"] = 0.05
            d["risk_level"] = "LOW"
            d["overall_health"] = 90.0
            d["anomaly_score"] = 10.0
            
    return clean_nans(rows)

@app.get("/api/v1/live/logs")
def get_live_logs(current_user: dict = Depends(get_current_user)):
    h_id = current_user["hospital_id"]
    conn = get_db_connection()
    cursor = conn.cursor()
    
    if current_user["role"] == "DEPARTMENT_OPERATOR":
        # Get logs only for devices in operator's department
        cursor.execute("""
        SELECT l.*, d.device_type
        FROM device_logs l
        JOIN devices d ON l.device_id = d.device_id
        WHERE l.hospital_id = ? AND d.department = ?
        ORDER BY l.log_id DESC LIMIT 200
        """, (h_id, current_user["department"]))
    else:
        cursor.execute("""
        SELECT l.*, d.device_type
        FROM device_logs l
        JOIN devices d ON l.device_id = d.device_id
        WHERE l.hospital_id = ?
        ORDER BY l.log_id DESC LIMIT 200
        """, (h_id,))
        
    rows = [dict(r) for r in cursor.fetchall()]
    conn.close()
    return clean_nans(rows)

@app.get("/api/v1/live/alerts")
def get_live_alerts(current_user: dict = Depends(get_current_user)):
    h_id = current_user["hospital_id"]
    conn = get_db_connection()
    cursor = conn.cursor()
    
    if current_user["role"] == "DEPARTMENT_OPERATOR":
        cursor.execute("SELECT * FROM alerts WHERE hospital_id = ? AND department = ? ORDER BY timestamp DESC", (h_id, current_user["department"]))
    else:
        cursor.execute("SELECT * FROM alerts WHERE hospital_id = ? ORDER BY timestamp DESC", (h_id,))
        
    rows = [dict(r) for r in cursor.fetchall()]
    conn.close()
    return clean_nans(rows)

@app.post("/api/v1/live/alerts/{alert_id}/acknowledge")
def acknowledge_alert(alert_id: int, current_user: dict = Depends(get_current_user)):
    # Operators and engineers can acknowledge alerts
    if current_user["role"] not in ["HOSPITAL_ADMIN", "BIOMEDICAL_ENGINEER", "DEPARTMENT_OPERATOR"]:
        raise HTTPException(status_code=403, detail="Unauthorized action")
        
    conn = get_db_connection()
    cursor = conn.cursor()
    cursor.execute("SELECT hospital_id, device_id FROM alerts WHERE alert_id = ?", (alert_id,))
    row = cursor.fetchone()
    if not row:
        conn.close()
        raise HTTPException(status_code=404, detail="Alert not found")
        
    # Tenant verification
    verify_tenant_access(row["hospital_id"], current_user)
    
    cursor.execute("UPDATE alerts SET status = 'acknowledged' WHERE alert_id = ?", (alert_id,))
    conn.commit()
    conn.close()
    
    # Audit log
    log_audit_event(
        user_id=current_user["username"],
        username=current_user["username"],
        hospital_id=current_user["hospital_id"],
        action="ALERT_ACKNOWLEDGED",
        resource_type="alerts",
        resource_id=str(alert_id),
        success=True
    )
    return {"success": True}

# ==========================================
# MODULE 2: Telemetry Ingest & Replay Controls
# ==========================================

class MQTTConnectPayload(BaseModel):
    host: str
    port: int
    username: Optional[str] = None
    password: Optional[str] = None
    topic: Optional[str] = None

@app.post("/api/v1/stream/mqtt/connect")
def connect_mqtt(payload: MQTTConnectPayload, current_user: dict = Depends(RoleChecker(["HOSPITAL_ADMIN"]))):
    # Overwrite MQTT globals dynamically
    import backend.services.mqtt_service as ms
    ms.MQTT_BROKER_HOST = payload.host
    ms.MQTT_BROKER_PORT = payload.port
    ms.MQTT_USERNAME = payload.username
    ms.MQTT_PASSWORD = payload.password
    if payload.topic:
        ms.MQTT_TOPIC = payload.topic
        
    # Re-initialize client credentials and start subscription client
    mqtt_service.stop()
    mqtt_service.client.username_pw_set(payload.username, payload.password)
    mqtt_service.start()
    
    log_audit_event(
        user_id=current_user["username"],
        username=current_user["username"],
        hospital_id=current_user["hospital_id"],
        action="DATA_SOURCE_CONNECTED",
        resource_type="mqtt",
        resource_id=payload.host,
        success=True
    )
    return {"success": True, "status": "connecting"}

class ReplayStartPayload(BaseModel):
    device_id: str
    scenario: str
    speed: float

@app.post("/api/v1/stream/replay/start")
def start_replay(payload: ReplayStartPayload, current_user: dict = Depends(RoleChecker(["HOSPITAL_ADMIN", "BIOMEDICAL_ENGINEER"]))):
    # Lookup device department and type from database to construct dynamic subscriber topic namespaces
    conn = get_db_connection()
    cursor = conn.cursor()
    cursor.execute("SELECT department, device_type FROM devices WHERE device_id = ?", (payload.device_id,))
    row = cursor.fetchone()
    conn.close()
    
    if not row:
        raise HTTPException(status_code=404, detail="Device not registered in system registry")
        
    # Start background replay thread
    replay_engine.start_replay(
        hospital_id=current_user["hospital_id"],
        device_id=payload.device_id,
        department=row["department"],
        device_type=row["device_type"],
        scenario=payload.scenario,
        speed=payload.speed
    )
    
    log_audit_event(
        user_id=current_user["username"],
        username=current_user["username"],
        hospital_id=current_user["hospital_id"],
        action="DEVICE_CONFIGURATION_CHANGED",
        resource_type="replay",
        resource_id=payload.device_id,
        success=True
    )
    return {"success": True}

@app.post("/api/v1/stream/replay/pause")
def pause_replay(current_user: dict = Depends(RoleChecker(["HOSPITAL_ADMIN", "BIOMEDICAL_ENGINEER"]))):
    replay_engine.pause_replay()
    return {"success": True}

@app.post("/api/v1/stream/replay/stop")
def stop_replay(current_user: dict = Depends(RoleChecker(["HOSPITAL_ADMIN", "BIOMEDICAL_ENGINEER"]))):
    replay_engine.stop_replay()
    return {"success": True}

@app.get("/api/v1/stream/status")
def get_stream_status(current_user: dict = Depends(get_current_user)):
    return {
        "mqtt_connected": mqtt_service.client.is_connected() if mqtt_service.client else False,
        "replay_running": replay_engine.running,
        "replay_paused": replay_engine.paused,
        "replay_device": replay_engine.device_id,
        "replay_scenario": replay_engine.scenario,
        "replay_speed": replay_engine.speed,
        "replay_step": replay_engine.current_step
    }

# ==========================================
# MODULE 3: Grok-powered RAG maintenance advice
# ==========================================

class RAGQueryPayload(BaseModel):
    query: str
    device_type: str

@app.post("/api/v1/rag/query")
def query_rag_manual(payload: RAGQueryPayload, current_user: dict = Depends(get_current_user)):
    # Simple query mapping over local manuals index (tenant scoped)
    advice = inference_engine.rag_advisor.get_maintenance_advice(payload.device_type, payload.query, current_user["hospital_id"])
    
    from backend.services.grok_service import query_grok
    
    system_prompt = (
        "You are an AI Maintenance Advisor for medical devices.\n"
        "Explain the manufacturer procedure and recommendations based strictly on the retrieved document context."
    )
    user_prompt = f"Retrieved Context:\n{advice['evidence']}\n\nUser Query: {payload.query}"
    
    grok_response = query_grok([
        {"role": "system", "content": system_prompt},
        {"role": "user", "content": user_prompt}
    ])
    
    log_audit_event(
        user_id=current_user["username"],
        username=current_user["username"],
        hospital_id=current_user["hospital_id"],
        action="RAG_QUERY",
        resource_type="rag",
        resource_id=payload.device_type,
        success=True
    )
    
    if grok_response:
        return {
            "recommended_action": grok_response,
            "source": advice["source"],
            "evidence": advice["evidence"],
            "confidence": advice["confidence"],
            "relevance_score": advice["relevance_score"],
            "section": advice.get("section", "Troubleshooting"),
            "page": advice.get("page", 1),
            "is_custom": advice.get("is_custom", False),
            "found": advice["found"],
            "using_grok": True
        }
    return advice

class DeviceAdvicePayload(BaseModel):
    device_id: str
    query: str

@app.post("/api/v1/rag/device-advice")
def get_device_advice(payload: DeviceAdvicePayload, current_user: dict = Depends(get_current_user)):
    verify_device_access(payload.device_id, current_user)
    
    dev = device_cache.get(payload.device_id)
    if not dev:
        raise HTTPException(status_code=404, detail="Device twin data not found in live cache.")
        
    device_type = dev.get("device_type", "Medical Device")
    root_cause = dev.get("root_cause", {}).get("primary", "General wear")
    
    # Retrieve manuals matching tenant
    advice = inference_engine.rag_advisor.get_maintenance_advice(device_type, root_cause, current_user["hospital_id"])
    
    from backend.services.grok_service import query_grok
    
    system_prompt = (
        "You are an AI Maintenance Advisor for medical devices.\n"
        "Your task is to explain the prediction, synthesize retrieved maintenance documentation,\n"
        "answer queries, summarize evidence, and generate human-readable recommendations.\n"
        "Follow this hierarchy:\n"
        "1. Use retrieved verified documents as the primary source for procedures.\n"
        "2. Use the current ML device state as context.\n"
        "3. Never invent manufacturer procedures.\n"
        "4. If documentation is insufficient, explicitly say so.\n"
        "5. Distinguish observed telemetry data from model predictions.\n"
        "6. Never claim a device is clinically safe.\n"
        "7. Never override certified biomedical engineering procedures.\n"
        "8. Provide citations to retrieved documents.\n"
        "Your recommendations are decision support and must be verified by certified personnel."
    )
    
    user_prompt = (
        f"Device telemetry state for {payload.device_id} ({device_type}):\n"
        f"- Overall Health: {dev.get('overall_health', 100.0)}%\n"
        f"- Failure Probability: {dev.get('failure_probability', 0.05)*100:.1f}%\n"
        f"- Predicted Failure Horizon (RUL): {dev.get('predicted_failure_time_days', 30.0)} Days\n"
        f"- Anomaly Score: {dev.get('anomaly', {}).get('score', 10.0)}%\n"
        f"- Detected Root Cause: {root_cause}\n"
        f"- Contributing Factors: {', '.join(dev.get('root_cause', {}).get('contributing_factors', []))}\n\n"
        f"Retrieved Document Context:\n"
        f"Source Document: {advice['source']}\n"
        f"Section: {advice.get('section', 'Troubleshooting')}\n"
        f"Content Chunk: {advice['evidence']}\n\n"
        f"User Query: {payload.query}"
    )
    
    messages = [
        {"role": "system", "content": system_prompt},
        {"role": "user", "content": user_prompt}
    ]
    
    grok_response = query_grok(messages)
    
    log_audit_event(
        user_id=current_user["username"],
        username=current_user["username"],
        hospital_id=current_user["hospital_id"],
        action="RAG_QUERY",
        resource_type="devices",
        resource_id=payload.device_id,
        success=True
    )
    
    if grok_response:
        return {
            "recommended_action": grok_response,
            "source": advice["source"],
            "evidence": advice["evidence"],
            "confidence": advice["confidence"],
            "relevance_score": advice["relevance_score"],
            "section": advice.get("section", "Troubleshooting"),
            "page": advice.get("page", 1),
            "is_custom": advice.get("is_custom", False),
            "found": advice["found"],
            "using_grok": True
        }
        
    return {
        "recommended_action": advice["recommended_action"],
        "source": advice["source"],
        "evidence": advice["evidence"],
        "confidence": advice["confidence"],
        "relevance_score": advice["relevance_score"],
        "section": advice.get("section", "Troubleshooting"),
        "page": advice.get("page", 1),
        "is_custom": advice.get("is_custom", False),
        "found": advice["found"],
        "using_grok": False
    }

@app.get("/api/v1/rag/sources")
def list_knowledge_sources(current_user: dict = Depends(get_current_user)):
    # Scoped by user hospital
    return clean_nans(knowledge_manager.get_documents(current_user["hospital_id"]))

# ==========================================
# MODULE 4: Audit Logs API
# ==========================================

@app.get("/api/v1/audit/logs")
def get_audit_logs(current_user: dict = Depends(RoleChecker(["HOSPITAL_ADMIN", "AUDITOR"]))):
    conn = get_db_connection()
    cursor = conn.cursor()
    cursor.execute("SELECT * FROM audit_logs WHERE hospital_id = ? ORDER BY timestamp DESC LIMIT 500", (current_user["hospital_id"],))
    rows = [dict(r) for r in cursor.fetchall()]
    conn.close()
    return clean_nans(rows)

# ==========================================
# MODULE 5: Live Websockets Stream
# ==========================================

@app.websocket("/api/v1/realtime/devices")
async def websocket_realtime_devices(websocket: WebSocket, token: Optional[str] = Query(None)):
    await websocket.accept()

    if not token:
        await websocket.close(code=4001, reason="Authentication Token Missing")
        return
        
    try:
        import jwt
        from backend.services.auth import JWT_SECRET, ALGORITHM
        payload = jwt.decode(token, JWT_SECRET, algorithms=[ALGORITHM])
        user = {
            "username": payload.get("sub"),
            "hospital_id": payload.get("hospital_id"),
            "role": payload.get("role"),
            "department": payload.get("department")
        }
    except Exception as e:
        await websocket.close(code=4002, reason=f"Invalid Authentication: {str(e)}")
        return
        
    ws_manager.connect(websocket, user)
    print(f"WebSocket Connected: User={user['username']} Hospital={user['hospital_id']}")
    
    try:
        while True:
            # Keep connections alive — client sends periodic heartbeat pings
            data = await websocket.receive_text()
    except (WebSocketDisconnect, Exception):
        ws_manager.disconnect(websocket)
        print(f"WebSocket Disconnected: User={user['username']}")

# ==========================================
# Pre-existing routes secured with multi-tenant filters
# ==========================================

@app.get("/api/v1/devices")
def list_devices(
    page: int = 1,
    page_size: int = 25,
    device_type: Optional[str] = None,
    risk_level: Optional[str] = None,
    search: Optional[str] = None,
    current_user: dict = Depends(get_current_user)
):
    h_id = current_user["hospital_id"]
    devices = [d for d in device_cache.values() if d.get("hospital_id", "demo-hospital") == h_id]
    
    # Operator department scoping
    if current_user["role"] == "DEPARTMENT_OPERATOR":
        user_dept = current_user["department"]
        # Deduce department based on device type matching DB mappings
        def is_dept_match(dtype):
            dept = "General Ward"
            if dtype in ["Ventilator", "Defibrillator", "Patient monitor", "Anesthesia machine"]:
                dept = "Intensive Care Unit (ICU)"
            elif dtype in ["CT scanner", "MRI scanner", "Ultrasound machine", "X-ray machine", "Mammography machine"]:
                dept = "Radiology Department"
            elif dtype in ["PCR machine", "Centrifuge", "Blood analyzer", "Hematology analyzer"]:
                dept = "Clinical Laboratory"
            elif dtype in ["Surgical lights", "Surgical operating table", "Robotic surgical system", "Electrosurgical unit"]:
                dept = "Operating Rooms (OR)"
            elif dtype in ["Dialysis machine", "Continuous passive motion machine"]:
                dept = "Therapy & Rehab Center"
            return dept == user_dept
            
        devices = [d for d in devices if is_dept_match(d.get("device_type"))]
        
    if device_type:
        devices = [d for d in devices if d.get("device_type", "").lower() == device_type.lower()]
    if risk_level:
        devices = [d for d in devices if d.get("risk_level", "").lower() == risk_level.lower()]
    if search:
        s_lower = search.lower()
        devices = [d for d in devices if s_lower in d.get("device_id", "").lower() or s_lower in d.get("manufacturer", "").lower()]
        
    risk_order = {"CRITICAL": 0, "HIGH": 1, "MEDIUM": 2, "LOW": 3}
    devices = sorted(devices, key=lambda x: (risk_order.get(x.get("risk_level", "LOW"), 4), -x.get("failure_probability", 0.0)))
    
    total = len(devices)
    start_idx = (page - 1) * page_size
    end_idx = start_idx + page_size
    paginated = devices[start_idx:end_idx]
    
    # Filter types dropdown
    all_types = sorted(list(set(
        str(d.get("device_type")) 
        for d in device_cache.values() 
        if d.get("device_type") and isinstance(d.get("device_type"), str)
    )))
    
    return {
        "total": total,
        "page": page,
        "page_size": page_size,
        "device_types": all_types,
        "devices": paginated
    }

@app.get("/api/v1/devices/{device_id}/health")
def get_device_health(device_id: str, live: bool = False, current_user: dict = Depends(get_current_user)):
    verify_device_access(device_id, current_user)
    
    if not live and device_id in device_cache:
        return device_cache[device_id]
        
    try:
        report = inference_engine.run_device_report(device_id)
        if "error" in report:
            raise HTTPException(status_code=404, detail=report["error"])
        return clean_nans(report)
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Live inference error: {str(e)}")

@app.get("/api/v1/devices/{device_id}/graph")
def get_device_graph(device_id: str, current_user: dict = Depends(get_current_user)):
    verify_device_access(device_id, current_user)
    try:
        subgraph = graph_engine.get_device_subgraph(device_id)
        return clean_nans(subgraph)
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Graph generation error: {str(e)}")

@app.get("/api/v1/departments")
def get_departments_heatmap(current_user: dict = Depends(get_current_user)):
    h_id = current_user["hospital_id"]
    departments = {}
    
    for d_id, dev in device_cache.items():
        if dev.get("hospital_id", "demo-hospital") != h_id:
            continue
            
        dtype = dev.get("device_type", "")
        mfr = dev.get("manufacturer", "")
        risk = dev.get("risk_level", "LOW")
        prob = dev.get("failure_probability", 0.0)
        
        dept = "General Ward"
        if dtype in ["Ventilator", "Defibrillator", "Patient monitor", "Anesthesia machine"]:
            dept = "Intensive Care Unit (ICU)"
        elif dtype in ["CT scanner", "MRI scanner", "Ultrasound machine", "X-ray machine", "Mammography machine"]:
            dept = "Radiology Department"
        elif dtype in ["PCR machine", "Centrifuge", "Blood analyzer", "Hematology analyzer"]:
            dept = "Clinical Laboratory"
        elif dtype in ["Surgical lights", "Surgical operating table", "Robotic surgical system", "Electrosurgical unit"]:
            dept = "Operating Rooms (OR)"
        elif dtype in ["Dialysis machine", "Continuous passive motion machine"]:
            dept = "Therapy & Rehab Center"
            
        # Operator department view block
        if current_user["role"] == "DEPARTMENT_OPERATOR" and current_user["department"] != dept:
            continue
            
        if dept not in departments:
            departments[dept] = {
                "name": dept,
                "device_count": 0,
                "critical_count": 0,
                "high_count": 0,
                "medium_count": 0,
                "low_count": 0,
                "avg_health": 0.0,
                "devices": []
            }
            
        dept_summary = departments[dept]
        dept_summary["device_count"] += 1
        
        if risk == "CRITICAL":
            dept_summary["critical_count"] += 1
        elif risk == "HIGH":
            dept_summary["high_count"] += 1
        elif risk == "MEDIUM":
            dept_summary["medium_count"] += 1
        else:
            dept_summary["low_count"] += 1
            
        dept_summary["avg_health"] += dev.get("overall_health", 100.0)
        dept_summary["devices"].append({
            "device_id": d_id,
            "device_type": dtype,
            "manufacturer": mfr,
            "overall_health": dev.get("overall_health"),
            "risk_level": risk,
            "failure_probability": prob
        })
        
    result = []
    for dept_name, dept_data in departments.items():
        if dept_data["device_count"] > 0:
            dept_data["avg_health"] = round(dept_data["avg_health"] / dept_data["device_count"], 1)
        dept_data["devices"] = sorted(dept_data["devices"], key=lambda x: -x["failure_probability"])
        result.append(dept_data)
        
    return clean_nans(result)

@app.get("/api/v1/alerts")
def get_fleet_alerts(current_user: dict = Depends(get_current_user)):
    h_id = current_user["hospital_id"]
    alerts = []
    for d_id, dev in device_cache.items():
        if dev.get("hospital_id", "demo-hospital") != h_id:
            continue
        risk = dev.get("risk_level", "LOW")
        if risk in ["HIGH", "CRITICAL"]:
            # Operator department scoping
            if current_user["role"] == "DEPARTMENT_OPERATOR":
                dtype = dev.get("device_type", "")
                dept = "General Ward"
                if dtype in ["Ventilator", "Defibrillator", "Patient monitor", "Anesthesia machine"]:
                    dept = "Intensive Care Unit (ICU)"
                elif dtype in ["CT scanner", "MRI scanner", "Ultrasound machine", "X-ray machine", "Mammography machine"]:
                    dept = "Radiology Department"
                elif dtype in ["PCR machine", "Centrifuge", "Blood analyzer", "Hematology analyzer"]:
                    dept = "Clinical Laboratory"
                if current_user["department"] != dept:
                    continue
                    
            alerts.append({
                "device_id": d_id,
                "device_type": dev.get("device_type"),
                "manufacturer": dev.get("manufacturer"),
                "risk_level": risk,
                "overall_health": dev.get("overall_health"),
                "failure_probability": dev.get("failure_probability"),
                "primary_root_cause": dev.get("root_cause", {}).get("primary"),
                "recommended_action": dev.get("maintenance", {}).get("recommended_action")
            })
            
    alerts = sorted(alerts, key=lambda x: -x["failure_probability"])
    return clean_nans(alerts)

# ==========================================
# Dataset Upload & Integration APIs
# ==========================================

class ValidateDatasetPayload(BaseModel):
    dataset_id: str
    column_mapping: dict = {}

@app.get("/api/v1/datasets")
def get_datasets(current_user: dict = Depends(get_current_user)):
    try:
        datasets = dataset_manager.get_datasets()
        return clean_nans(datasets)
    except Exception as e:
        print(f"[DATASETS ERROR] {e}")
        return []

def process_uploaded_dataset_to_devices(filename: str, content: bytes, hospital_id: str):
    import io, uuid, datetime
    import pandas as pd
    file_ext = os.path.splitext(filename)[1].lower()
    try:
        if file_ext == ".csv":
            df = pd.read_csv(io.BytesIO(content))
        elif file_ext in [".xlsx", ".xls"]:
            df = pd.read_excel(io.BytesIO(content))
        elif file_ext == ".json":
            df = pd.read_json(io.BytesIO(content))
        elif file_ext == ".parquet":
            df = pd.read_parquet(io.BytesIO(content))
        else:
            return
    except Exception as e:
        print(f"[DATASET READ ERR] {e}")
        return

    conn = get_db_connection()
    cursor = conn.cursor()

    dev_col = dataset_manager._detect_column(df.columns, ["device_id", "equipment_id", "machine_id", "serial_number", "id", "device"])
    type_col = dataset_manager._detect_column(df.columns, ["device_type", "machine_type", "type", "category"])
    
    added_count = 0
    for idx, row in df.iterrows():
        raw_dev_id = str(row[dev_col]).strip() if dev_col and not pd.isna(row[dev_col]) else f"DEV_{uuid.uuid4().hex[:6].upper()}"
        dev_type = str(row[type_col]).strip() if type_col and not pd.isna(row[type_col]) else "Medical Device"
        
        dept = "General Ward"
        if dev_type in ["Ventilator", "Defibrillator", "Patient monitor", "Anesthesia machine"]:
            dept = "Intensive Care Unit (ICU)"
        elif dev_type in ["CT scanner", "MRI scanner", "Ultrasound machine", "X-ray machine"]:
            dept = "Radiology Department"
        elif dev_type in ["PCR machine", "Centrifuge", "Blood analyzer", "Hematology analyzer"]:
            dept = "Clinical Laboratory"
            
        cursor.execute("SELECT device_id FROM devices WHERE device_id = ?", (raw_dev_id,))
        if not cursor.fetchone():
            cursor.execute("""
            INSERT INTO devices (device_id, hospital_id, department, device_type, manufacturer, model, status)
            VALUES (?, ?, ?, ?, ?, ?, ?)
            """, (raw_dev_id, hospital_id, dept, dev_type, "Uploaded Hospital Log", "Hosp-1", "Monitoring"))
            
            cursor.execute("""
            INSERT INTO predictions (hospital_id, device_id, timestamp, failure_probability, risk_level, anomaly_score, overall_health, model_version)
            VALUES (?, ?, ?, ?, ?, ?, ?, ?)
            """, (
                hospital_id, raw_dev_id, datetime.datetime.now().strftime("%Y-%m-%dT%H:%M:%SZ"),
                0.15, "LOW", 12.0, 85.0, "2.0"
            ))
            
            device_cache[raw_dev_id] = {
                "device_id": raw_dev_id,
                "device_type": dev_type,
                "department": dept,
                "manufacturer": "Uploaded Hospital Log",
                "failure_probability": 0.15,
                "risk_level": "LOW",
                "overall_health": 85.0,
                "anomaly": {"score": 12.0, "status": "Normal"},
                "components": {"Battery": {"health": 85.0, "status": "Good"}},
                "root_cause": {"primary": "None"},
                "maintenance": {"recommended_action": "Routine Monitoring"}
            }
            added_count += 1

    conn.commit()
    conn.close()
    print(f"[DATASET INGESTION] Added {added_count} devices from uploaded log file {filename} into hospital {hospital_id}.")

@app.post("/api/v1/datasets/upload")
async def upload_dataset(
    file: UploadFile = File(...),
    current_user: dict = Depends(RoleChecker(["HOSPITAL_ADMIN", "BIOMEDICAL_ENGINEER"]))
):
    try:
        content = await file.read()
        res = dataset_manager.upload_dataset(file.filename, content)
        if "error" in res:
            raise HTTPException(status_code=400, detail=res["error"])
            
        try:
            process_uploaded_dataset_to_devices(file.filename, content, current_user["hospital_id"])
        except Exception as ingest_err:
            print(f"[DATASET INGEST WARN] {ingest_err}")

        log_audit_event(
            user_id=current_user["username"],
            username=current_user["username"],
            hospital_id=current_user["hospital_id"],
            action="DATASET_UPLOADED",
            resource_type="datasets",
            resource_id=res.get("dataset_id"),
            success=True
        )
        return clean_nans(res)
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Dataset upload failed: {str(e)}")

@app.post("/api/v1/datasets/validate")
def validate_dataset(payload: ValidateDatasetPayload, current_user: dict = Depends(get_current_user)):
    try:
        res = dataset_manager.validate_dataset(payload.dataset_id, payload.column_mapping)
        if "error" in res:
            raise HTTPException(status_code=400, detail=res["error"])
        return clean_nans(res)
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Dataset validation failed: {str(e)}")

@app.delete("/api/v1/datasets/{dataset_id}")
def delete_dataset(dataset_id: str, current_user: dict = Depends(RoleChecker(["HOSPITAL_ADMIN", "BIOMEDICAL_ENGINEER"]))):
    success = dataset_manager.delete_dataset(dataset_id)
    if not success:
        raise HTTPException(status_code=404, detail="Dataset not found")
        
    log_audit_event(
        user_id=current_user["username"],
        username=current_user["username"],
        hospital_id=current_user["hospital_id"],
        action="DATASET_DELETED",
        resource_type="datasets",
        resource_id=dataset_id,
        success=True
    )
    return {"success": True}

# ==========================================
# RAG Document uploads with hospital isolation
# ==========================================

@app.post("/api/v1/knowledge/upload")
async def upload_manual(
    file: UploadFile = File(...),
    device_type: str = Form(default="Medical Device"),
    manufacturer: str = Form(default="Unknown"),
    version: str = Form(default="1.0"),
    current_user: dict = Depends(RoleChecker(["HOSPITAL_ADMIN", "BIOMEDICAL_ENGINEER"]))
):
    import traceback
    try:
        contents = await file.read()
        print(f"[UPLOAD] file={file.filename} size={len(contents)} hospital={current_user['hospital_id']} device={device_type}")
        
        res = knowledge_manager.upload_document(
            file_name=file.filename,
            file_content=contents,
            device_type=device_type,
            manufacturer=manufacturer,
            version=version,
            hospital_id=current_user["hospital_id"],
            uploaded_by=current_user["username"]
        )
        
        if "error" in res:
            print(f"[UPLOAD ERROR] {res['error']}")
            raise HTTPException(status_code=400, detail=res["error"])
        
        print(f"[UPLOAD OK] doc_id={res['document_id']} chunks={res['chunk_count']}")
        
        # Trigger RAG index rebuild for this tenant
        try:
            inference_engine.rag_advisor.build_index(current_user["hospital_id"], force=True)
        except Exception as idx_err:
            print(f"[INDEX WARN] RAG rebuild failed (non-fatal): {idx_err}")
        
        log_audit_event(
            user_id=current_user["username"],
            username=current_user["username"],
            hospital_id=current_user["hospital_id"],
            action="MANUAL_UPLOADED",
            resource_type="documents",
            resource_id=res["document_id"],
            success=True
        )
        return clean_nans(res)
    except HTTPException:
        raise
    except Exception as e:
        tb = traceback.format_exc()
        print(f"[UPLOAD EXCEPTION] {tb}")
        raise HTTPException(status_code=500, detail=f"Manual indexing failed: {str(e)}")

@app.get("/api/v1/knowledge/documents")
def list_documents(current_user: dict = Depends(get_current_user)):
    try:
        docs = knowledge_manager.get_documents(current_user["hospital_id"])
        return clean_nans(docs)
    except Exception as e:
        print(f"[DOCS LIST ERROR] {e}")
        return []

@app.get("/api/v1/knowledge/documents/{document_id}/chunks")
def get_document_chunks(document_id: str, current_user: dict = Depends(get_current_user)):
    try:
        chunks = knowledge_manager.get_document_chunks(document_id, current_user["hospital_id"])
        return clean_nans(chunks)
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to fetch chunks: {str(e)}")

@app.delete("/api/v1/knowledge/documents/{document_id}")
def delete_document(document_id: str, current_user: dict = Depends(RoleChecker(["HOSPITAL_ADMIN", "BIOMEDICAL_ENGINEER"]))):
    success = knowledge_manager.delete_document(document_id, current_user["hospital_id"])
    if not success:
        raise HTTPException(status_code=404, detail="Document not found or access denied")
    try:
        inference_engine.rag_advisor.build_index(current_user["hospital_id"], force=True)
    except Exception:
        pass
    log_audit_event(
        user_id=current_user["username"],
        username=current_user["username"],
        hospital_id=current_user["hospital_id"],
        action="MANUAL_DELETED",
        resource_type="documents",
        resource_id=document_id,
        success=True
    )
    return {"success": True}

class ChatMessage(BaseModel):
    device_id: str
    root_cause: str
    message: Optional[str] = None

class RAGQueryPayload(BaseModel):
    query: str
    device_type: Optional[str] = "Medical Device"

@app.post("/api/v1/rag/query")
def query_rag_knowledge_base(payload: RAGQueryPayload, current_user: dict = Depends(get_current_user)):
    try:
        advice = inference_engine.rag_advisor.get_maintenance_advice(
            device_type=payload.device_type or "Medical Device",
            root_cause=payload.query,
            hospital_id=current_user["hospital_id"]
        )
        return clean_nans(advice)
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"RAG Knowledge Query error: {str(e)}")

@app.post("/api/v1/rag/chat")
def query_rag_advisor(payload: ChatMessage, current_user: dict = Depends(get_current_user)):
    # Chat message endpoint matching chatbot query
    verify_device_access(payload.device_id, current_user)
    try:
        advice = inference_engine.rag_advisor.get_maintenance_advice(
            device_type=device_cache.get(payload.device_id, {}).get("device_type", "Medical Device"),
            root_cause=payload.root_cause,
            hospital_id=current_user["hospital_id"]
        )
        return clean_nans(advice)
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"RAG Advisor error: {str(e)}")

# ==========================================
# External Live Telemetry Ingestion API (LOGx & External Streamers)
# ==========================================

class TelemetryIngestPayload(BaseModel):
    hospital_id: Optional[str] = "demo-hospital"
    device_id: str
    device_type: Optional[str] = "Medical Device"
    department: Optional[str] = "General Ward"
    timestamp: Optional[str] = None
    battery_health: Optional[float] = None
    temperature: Optional[float] = None
    load_percent: Optional[float] = None
    error_code: Optional[str] = "OK"
    operating_hours: Optional[float] = None
    voltage: Optional[float] = None

@app.post("/api/v1/ingest/telemetry")
async def ingest_telemetry_payload(payload: TelemetryIngestPayload, x_api_key: Optional[str] = Header(None), hospital_id: Optional[str] = Header(None)):
    try:
        h_id = hospital_id or payload.hospital_id or "demo-hospital"
        d_id = payload.device_id
        
        # Check API key if provided
        if x_api_key and x_api_key != "aura_live_ingest_key_2026":
            raise HTTPException(status_code=401, detail="Invalid X-API-Key header")
            
        py_payload = payload.dict()
        
        dept = payload.department or "General Ward"
        dtype = payload.device_type or "Medical Device"
        if dtype in ["Ventilator", "Defibrillator", "Patient monitor", "Anesthesia machine"]:
            dept = "Intensive Care Unit (ICU)"
        elif dtype in ["CT scanner", "MRI scanner", "Ultrasound machine", "X-ray machine"]:
            dept = "Radiology Department"
        elif dtype in ["PCR machine", "Centrifuge", "Blood analyzer", "Hematology analyzer"]:
            dept = "Clinical Laboratory"
            
        ingestion_queue.put({
            "hospital_id": h_id,
            "device_id": d_id,
            "department": dept,
            "device_type": dtype,
            "payload": py_payload
        })
        
        try:
            report = inference_engine.run_device_report(d_id, live_payload=py_payload)
        except Exception:
            report = None
            
        if not report or "error" in report:
            report = {
                "device_id": d_id,
                "device_type": dtype,
                "department": dept,
                "manufacturer": "LOGx Streamer",
                "failure_probability": 0.85 if payload.error_code != "OK" else 0.08,
                "risk_level": "CRITICAL" if payload.error_code == "BAT_CRITICAL" else ("HIGH" if payload.error_code != "OK" else "LOW"),
                "overall_health": float(payload.battery_health) if payload.battery_health is not None else 85.0,
                "anomaly": {"score": 75.0 if payload.error_code != "OK" else 12.0, "status": "Abnormal" if payload.error_code != "OK" else "Normal"},
                "components": {"Battery": {"health": float(payload.battery_health or 85.0), "status": "Warning" if payload.error_code != "OK" else "Good"}},
                "root_cause": {"primary": payload.error_code or "None"},
                "maintenance": {"recommended_action": "Schedule Battery Maintenance" if payload.error_code != "OK" else "Routine Monitoring"}
            }
            
        risk = report.get("risk_level", "LOW")
        device_cache[d_id] = report
        
        # Save to SQLite database & update devices, predictions, and alerts table
        try:
            conn = get_db_connection()
            cursor = conn.cursor()
            
            # 1. Ensure device exists in devices table
            cursor.execute("SELECT device_id FROM devices WHERE device_id = ?", (d_id,))
            if not cursor.fetchone():
                cursor.execute("""
                INSERT INTO devices (device_id, hospital_id, department, device_type, manufacturer, model, status)
                VALUES (?, ?, ?, ?, ?, ?, ?)
                """, (d_id, h_id, dept, dtype, report.get("manufacturer", "LOGx Streamer"), "V-100", "Monitoring"))

            # 2. Insert prediction
            cursor.execute("""
            INSERT INTO predictions (hospital_id, device_id, timestamp, failure_probability, risk_level, anomaly_score, overall_health, model_version)
            VALUES (?, ?, ?, ?, ?, ?, ?, ?)
            """, (
                h_id, d_id, datetime.datetime.now().strftime("%Y-%m-%dT%H:%M:%SZ"),
                float(report.get("failure_probability", 0.85)), risk,
                float(report.get("anomaly", {}).get("score", 75.0)),
                float(report.get("overall_health", 15.0)), "2.0"
            ))

            # 3. If risk is HIGH or CRITICAL, insert/update active alert in alerts table
            if risk in ["HIGH", "CRITICAL"]:
                cursor.execute("SELECT alert_id FROM alerts WHERE device_id = ? AND hospital_id = ? AND status = 'active'", (d_id, h_id))
                existing_alert = cursor.fetchone()
                if not existing_alert:
                    cursor.execute("""
                    INSERT INTO alerts (hospital_id, device_id, department, timestamp, risk_level, failure_probability, anomaly_score, root_cause, component, recommended_action, status)
                    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
                    """, (
                        h_id, d_id, dept, datetime.datetime.now().strftime("%Y-%m-%dT%H:%M:%SZ"),
                        risk, float(report.get("failure_probability", 0.85)),
                        float(report.get("anomaly", {}).get("score", 75.0)),
                        report.get("root_cause", {}).get("primary", payload.error_code or "Component Anomaly"),
                        "Battery", report.get("maintenance", {}).get("recommended_action", "Inspect Equipment"),
                        "active"
                    ))

            # 4. Save device log
            cursor.execute("""
            INSERT INTO device_logs (hospital_id, device_id, timestamp, payload, ingestion_timestamp, source, validation_status, anomaly_status, risk_level)
            VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
            """, (
                h_id, d_id, payload.timestamp or datetime.datetime.utcnow().strftime("%Y-%m-%dT%H:%M:%SZ"),
                json.dumps(py_payload), datetime.datetime.utcnow().strftime("%Y-%m-%dT%H:%M:%SZ"),
                "LOGx Streamer", "VALID", report.get("anomaly", {}).get("status", "Normal"), risk
            ))
            conn.commit()
            conn.close()
        except Exception as db_err:
            print(f"[INGEST DB WARN] {db_err}")
            
        # Broadcast real-time update to all connected WebSocket clients
        try:
            report["department"] = dept
            await ws_manager.broadcast_device_update(
                hospital_id=h_id,
                device_id=d_id,
                update_type="DEVICE_UPDATE",
                data=report
            )
        except Exception as ws_err:
            print(f"[WS BROADCAST WARN] {ws_err}")
            
        print(f"[TELEMETRY INGEST OK] device={d_id} type={dtype} risk={risk} err={payload.error_code}")
        
        return clean_nans({
            "status": "success",
            "message": "Telemetry log ingested and processed by ML models",
            "device_id": d_id,
            "risk_level": risk,
            "overall_health": report.get("overall_health"),
            "anomaly_score": report.get("anomaly", {}).get("score")
        })
    except HTTPException:
        raise
    except Exception as e:
        print(f"[TELEMETRY INGEST ERR] {e}")
        raise HTTPException(status_code=500, detail=f"Ingestion processing error: {str(e)}")
