import os
import sys
import json
import math
from fastapi import FastAPI, HTTPException, Query
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
from typing import Optional, List

sys.path.append(os.path.dirname(os.path.dirname(os.path.dirname(os.path.abspath(__file__)))))

from backend.ml.inference import MedicalDeviceInferenceEngine
from backend.knowledge_graph.graph_engine import MedicalDeviceGraphEngine

app = FastAPI(
    title="AI-Powered Medical Device Reliability Intelligence Platform API",
    description="Hackathon-ready predictive maintenance API for medical device fleets",
    version="1.0.0"
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

# In-memory cache loaded at startup
device_cache = {}
inference_engine = None
graph_engine = None

def clean_nans(val):
    if isinstance(val, float):
        if math.isnan(val) or math.isinf(val):
            return 0.0 # Default to 0.0 to prevent JSON compliance issues
        return val
    elif isinstance(val, dict):
        return {k: clean_nans(v) for k, v in val.items()}
    elif isinstance(val, list):
        return [clean_nans(x) for x in val]
    return val

@app.on_event("startup")
def load_startup_data():
    global device_cache, inference_engine, graph_engine
    print("FastAPI server starting...")
    
    # Initialize engines
    inference_engine = MedicalDeviceInferenceEngine()
    graph_engine = MedicalDeviceGraphEngine()
    
    # Try to load cache
    if os.path.exists(CACHE_PATH):
        try:
            print(f"Loading device cache from {CACHE_PATH}...")
            with open(CACHE_PATH, "r") as cf:
                raw_cache = json.load(cf)
            # Clean NaNs recursively
            device_cache = clean_nans(raw_cache)
            print(f"Loaded {len(device_cache)} devices into memory.")
        except Exception as e:
            print(f"Error loading cache: {e}. Fallback to live inference.")
    else:
        print("No cache found. Running with live inference fallback.")

@app.get("/")
def read_root():
    return {
        "status": "online",
        "service": "Medical Device Reliability Intelligence API",
        "cached_devices": len(device_cache)
    }

@app.get("/api/v1/devices")
def list_devices(
    page: int = 1,
    page_size: int = 25,
    device_type: Optional[str] = None,
    risk_level: Optional[str] = None,
    search: Optional[str] = None
):
    # Get all cached device summaries
    devices = list(device_cache.values())
    
    # Filter
    if device_type:
        devices = [d for d in devices if d.get("device_type", "").lower() == device_type.lower()]
    if risk_level:
        devices = [d for d in devices if d.get("risk_level", "").lower() == risk_level.lower()]
    if search:
        s_lower = search.lower()
        devices = [d for d in devices if s_lower in d.get("device_id", "").lower() or s_lower in d.get("manufacturer", "").lower()]
        
    # Sort by risk severity: CRITICAL > HIGH > MEDIUM > LOW
    risk_order = {"CRITICAL": 0, "HIGH": 1, "MEDIUM": 2, "LOW": 3}
    devices = sorted(devices, key=lambda x: (risk_order.get(x.get("risk_level", "LOW"), 4), -x.get("failure_probability", 0.0)))
    
    # Pagination
    total = len(devices)
    start_idx = (page - 1) * page_size
    end_idx = start_idx + page_size
    paginated = devices[start_idx:end_idx]
    
    # Unique device types for filter dropdowns (ensuring we only sort strings)
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
def get_device_health(device_id: str, live: bool = False):
    # Check cache first (unless live is requested)
    if not live and device_id in device_cache:
        return device_cache[device_id]
        
    # Live inference fallback
    try:
        print(f"Running live inference for {device_id}...")
        report = inference_engine.run_device_report(device_id)
        if "error" in report:
            raise HTTPException(status_code=404, detail=report["error"])
        # Clean any possible NaNs dynamically
        return clean_nans(report)
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Live inference error: {str(e)}")

@app.get("/api/v1/devices/{device_id}/graph")
def get_device_graph(device_id: str):
    try:
        subgraph = graph_engine.get_device_subgraph(device_id)
        return clean_nans(subgraph)
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Graph generation error: {str(e)}")

@app.get("/api/v1/departments")
def get_departments_heatmap():
    """
    Computes summary metrics for each hospital department.
    """
    departments = {}
    
    # Extract department from cached device operating location
    for d_id, dev in device_cache.items():
        dtype = dev.get("device_type", "")
        mfr = dev.get("manufacturer", "")
        risk = dev.get("risk_level", "LOW")
        prob = dev.get("failure_probability", 0.0)
        
        # Determine department based on device type
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
        
        # Add to device list
        dept_summary["devices"].append({
            "device_id": d_id,
            "device_type": dtype,
            "manufacturer": mfr,
            "overall_health": dev.get("overall_health"),
            "risk_level": risk,
            "failure_probability": prob
        })
        
    # Finalize stats
    result = []
    for dept_name, dept_data in departments.items():
        if dept_data["device_count"] > 0:
            dept_data["avg_health"] = round(dept_data["avg_health"] / dept_data["device_count"], 1)
        # Sort devices inside department by failure probability descending
        dept_data["devices"] = sorted(dept_data["devices"], key=lambda x: -x["failure_probability"])
        result.append(dept_data)
        
    return clean_nans(result)

@app.get("/api/v1/alerts")
def get_fleet_alerts():
    """
    Returns critical and high risk alerts.
    """
    alerts = []
    for d_id, dev in device_cache.items():
        risk = dev.get("risk_level", "LOW")
        if risk in ["HIGH", "CRITICAL"]:
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
            
    # Sort alerts by probability descending
    alerts = sorted(alerts, key=lambda x: -x["failure_probability"])
    return clean_nans(alerts)

class ChatMessage(BaseModel):
    device_id: str
    root_cause: str
    message: Optional[str] = None

@app.post("/api/v1/rag/chat")
def query_rag_advisor(payload: ChatMessage):
    try:
        advice = inference_engine.rag_advisor.get_maintenance_advice(
            device_type=device_cache.get(payload.device_id, {}).get("device_type", "Medical Device"),
            root_cause=payload.root_cause
        )
        return clean_nans(advice)
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"RAG Advisor error: {str(e)}")
