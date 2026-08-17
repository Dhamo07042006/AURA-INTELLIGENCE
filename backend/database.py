import sqlite3
import os
import json
import hashlib
import datetime
import math

from backend.config import DB_PATH

def get_db_connection():
    conn = sqlite3.connect(str(DB_PATH))
    conn.row_factory = sqlite3.Row
    return conn

def hash_password(password: str) -> str:
    salt = "aura_salt_2026"
    return hashlib.sha256((password + salt).encode('utf-8')).hexdigest()

def sanitize_str(val, default="Unknown") -> str:
    if val is None:
        return default
    if isinstance(val, float):
        if math.isnan(val) or math.isinf(val):
            return default
    s = str(val).strip()
    if s.lower() in ["nan", "null", "none", ""]:
        return default
    return s

def init_db():
    print(f"Initializing SQLite Database at {DB_PATH}...")
    conn = get_db_connection()
    cursor = conn.cursor()
    
    # 1. Hospitals Table
    cursor.execute("""
    CREATE TABLE IF NOT EXISTS hospitals (
        hospital_id TEXT PRIMARY KEY,
        name TEXT NOT NULL
    );
    """)
    
    # 2. Users Table
    cursor.execute("""
    CREATE TABLE IF NOT EXISTS users (
        user_id INTEGER PRIMARY KEY AUTOINCREMENT,
        hospital_id TEXT NOT NULL,
        username TEXT NOT NULL UNIQUE,
        password_hash TEXT NOT NULL,
        role TEXT NOT NULL,
        department TEXT,
        FOREIGN KEY (hospital_id) REFERENCES hospitals(hospital_id)
    );
    """)
    
    # 3. Departments Table
    cursor.execute("""
    CREATE TABLE IF NOT EXISTS departments (
        dept_id INTEGER PRIMARY KEY AUTOINCREMENT,
        hospital_id TEXT NOT NULL,
        name TEXT NOT NULL,
        FOREIGN KEY (hospital_id) REFERENCES hospitals(hospital_id)
    );
    """)
    
    # 4. Devices Table
    cursor.execute("""
    CREATE TABLE IF NOT EXISTS devices (
        device_id TEXT PRIMARY KEY,
        hospital_id TEXT NOT NULL,
        department TEXT NOT NULL,
        device_type TEXT NOT NULL,
        manufacturer TEXT NOT NULL,
        model TEXT NOT NULL,
        status TEXT NOT NULL,
        FOREIGN KEY (hospital_id) REFERENCES hospitals(hospital_id)
    );
    """)
    
    # 5. Device Logs (Telemetry) Table
    cursor.execute("""
    CREATE TABLE IF NOT EXISTS device_logs (
        log_id INTEGER PRIMARY KEY AUTOINCREMENT,
        hospital_id TEXT NOT NULL,
        device_id TEXT NOT NULL,
        timestamp TEXT NOT NULL,
        payload TEXT NOT NULL,
        ingestion_timestamp TEXT NOT NULL,
        source TEXT NOT NULL,
        validation_status TEXT NOT NULL,
        anomaly_status TEXT,
        risk_level TEXT,
        FOREIGN KEY (hospital_id) REFERENCES hospitals(hospital_id),
        FOREIGN KEY (device_id) REFERENCES devices(device_id)
    );
    """)
    
    # 6. Predictions Table
    cursor.execute("""
    CREATE TABLE IF NOT EXISTS predictions (
        pred_id INTEGER PRIMARY KEY AUTOINCREMENT,
        hospital_id TEXT NOT NULL,
        device_id TEXT NOT NULL,
        timestamp TEXT NOT NULL,
        failure_probability REAL NOT NULL,
        risk_level TEXT NOT NULL,
        anomaly_score REAL,
        overall_health REAL NOT NULL,
        model_version TEXT NOT NULL,
        FOREIGN KEY (hospital_id) REFERENCES hospitals(hospital_id),
        FOREIGN KEY (device_id) REFERENCES devices(device_id)
    );
    """)
    
    # 7. Alerts Table
    cursor.execute("""
    CREATE TABLE IF NOT EXISTS alerts (
        alert_id INTEGER PRIMARY KEY AUTOINCREMENT,
        hospital_id TEXT NOT NULL,
        device_id TEXT NOT NULL,
        department TEXT NOT NULL,
        timestamp TEXT NOT NULL,
        risk_level TEXT NOT NULL,
        failure_probability REAL NOT NULL,
        anomaly_score REAL,
        root_cause TEXT,
        component TEXT,
        recommended_action TEXT,
        status TEXT NOT NULL, -- 'active' or 'acknowledged'
        FOREIGN KEY (hospital_id) REFERENCES hospitals(hospital_id),
        FOREIGN KEY (device_id) REFERENCES devices(device_id)
    );
    """)
    
    # 8. Maintenance Documents Table
    cursor.execute("""
    CREATE TABLE IF NOT EXISTS maintenance_documents (
        document_id TEXT PRIMARY KEY,
        hospital_id TEXT NOT NULL,
        filename TEXT NOT NULL,
        filepath TEXT NOT NULL,
        device_type TEXT NOT NULL,
        manufacturer TEXT NOT NULL,
        model TEXT NOT NULL,
        document_version TEXT NOT NULL,
        uploaded_by TEXT NOT NULL,
        upload_timestamp TEXT NOT NULL,
        status TEXT NOT NULL,
        FOREIGN KEY (hospital_id) REFERENCES hospitals(hospital_id)
    );
    """)
    
    # 9. RAG chunks Table
    cursor.execute("""
    CREATE TABLE IF NOT EXISTS rag_chunks (
        chunk_id INTEGER PRIMARY KEY AUTOINCREMENT,
        document_id TEXT NOT NULL,
        hospital_id TEXT NOT NULL,
        section TEXT,
        page INTEGER,
        text_content TEXT NOT NULL,
        FOREIGN KEY (document_id) REFERENCES maintenance_documents(document_id),
        FOREIGN KEY (hospital_id) REFERENCES hospitals(hospital_id)
    );
    """)
    
    # 10. Audit Logs Table
    cursor.execute("""
    CREATE TABLE IF NOT EXISTS audit_logs (
        audit_id INTEGER PRIMARY KEY AUTOINCREMENT,
        user_id TEXT,
        username TEXT,
        hospital_id TEXT,
        action TEXT NOT NULL,
        resource_type TEXT,
        resource_id TEXT,
        timestamp TEXT NOT NULL,
        ip_address TEXT,
        success INTEGER NOT NULL
    );
    """)
    
    conn.commit()
    seed_mock_data(conn)
    conn.close()
    print("Database initialized successfully.")

def seed_mock_data(conn):
    cursor = conn.cursor()
    
    # Clean old values to prevent unique/constraint issues on re-run
    cursor.execute("DELETE FROM predictions")
    cursor.execute("DELETE FROM alerts")
    cursor.execute("DELETE FROM devices")
    cursor.execute("DELETE FROM departments")
    cursor.execute("DELETE FROM users")
    cursor.execute("DELETE FROM hospitals")
    
    # Seed Hospitals
    print("Seeding mock hospitals...")
    cursor.execute("INSERT INTO hospitals (hospital_id, name) VALUES (?, ?)", ("demo-hospital", "Demo General Hospital"))
    cursor.execute("INSERT INTO hospitals (hospital_id, name) VALUES (?, ?)", ("other-hospital", "St. Jude Medical Center"))
        
    # Seed Users
    print("Seeding mock user roles...")
    pw = hash_password("password123")
    cursor.execute("INSERT INTO users (hospital_id, username, password_hash, role, department) VALUES (?, ?, ?, ?, ?)", 
                   ("demo-hospital", "admin", pw, "HOSPITAL_ADMIN", None))
    cursor.execute("INSERT INTO users (hospital_id, username, password_hash, role, department) VALUES (?, ?, ?, ?, ?)", 
                   ("demo-hospital", "biomed", pw, "BIOMEDICAL_ENGINEER", None))
    cursor.execute("INSERT INTO users (hospital_id, username, password_hash, role, department) VALUES (?, ?, ?, ?, ?)", 
                   ("demo-hospital", "operator", pw, "DEPARTMENT_OPERATOR", "Intensive Care Unit (ICU)"))
    cursor.execute("INSERT INTO users (hospital_id, username, password_hash, role, department) VALUES (?, ?, ?, ?, ?)", 
                   ("demo-hospital", "auditor", pw, "AUDITOR", None))
    cursor.execute("INSERT INTO users (hospital_id, username, password_hash, role, department) VALUES (?, ?, ?, ?, ?)", 
                   ("other-hospital", "admin2", pw, "HOSPITAL_ADMIN", None))

    # Seed Departments
    cursor.execute("INSERT INTO departments (hospital_id, name) VALUES (?, ?)", ("demo-hospital", "Intensive Care Unit (ICU)"))
    cursor.execute("INSERT INTO departments (hospital_id, name) VALUES (?, ?)", ("demo-hospital", "Radiology Department"))
    cursor.execute("INSERT INTO departments (hospital_id, name) VALUES (?, ?)", ("demo-hospital", "Clinical Laboratory"))
    cursor.execute("INSERT INTO departments (hospital_id, name) VALUES (?, ?)", ("other-hospital", "Emergency Department"))

    # Seed Devices (from device_latest_cache.json)
    print("Seeding devices from cached registry...")
    cache_path = r"C:\Users\Dhamodaran G\Desktop\CTS\models\device_latest_cache.json"
    if os.path.exists(cache_path):
        try:
            with open(cache_path, "r") as f:
                cache = json.load(f)
            
            # Seed all trained dataset devices from cache into demo-hospital
            count = 0
            for dev_id, dev_data in cache.items():
                
                dtype = sanitize_str(dev_data.get("device_type"), "Ventilator")
                manufacturer = sanitize_str(dev_data.get("manufacturer"), "MedStar")
                
                # Deduce department
                dept = "General Ward"
                if dtype in ["Ventilator", "Defibrillator", "Patient monitor", "Anesthesia machine"]:
                    dept = "Intensive Care Unit (ICU)"
                elif dtype in ["CT scanner", "MRI scanner", "Ultrasound machine", "X-ray machine"]:
                    dept = "Radiology Department"
                elif dtype in ["PCR machine", "Centrifuge", "Blood analyzer", "Hematology analyzer"]:
                    dept = "Clinical Laboratory"
                    
                cursor.execute("""
                INSERT INTO devices (device_id, hospital_id, department, device_type, manufacturer, model, status)
                VALUES (?, ?, ?, ?, ?, ?, ?)
                """, (dev_id, "demo-hospital", dept, dtype, manufacturer, "V-200", "Monitoring"))
                
                # Insert initial prediction
                cursor.execute("""
                INSERT INTO predictions (hospital_id, device_id, timestamp, failure_probability, risk_level, anomaly_score, overall_health, model_version)
                VALUES (?, ?, ?, ?, ?, ?, ?, ?)
                """, (
                    "demo-hospital",
                    dev_id,
                    datetime.datetime.now().strftime("%Y-%m-%dT%H:%M:%SZ"),
                    float(dev_data.get("failure_probability")) if dev_data.get("failure_probability") is not None else 0.05,
                    sanitize_str(dev_data.get("risk_level"), "LOW"),
                    float(dev_data.get("anomaly", {}).get("score")) if dev_data.get("anomaly", {}).get("score") is not None else 10.0,
                    float(dev_data.get("overall_health")) if dev_data.get("overall_health") is not None else 90.0,
                    "1.0"
                ))
                
                # Insert initial alerts if high/critical
                risk = sanitize_str(dev_data.get("risk_level"), "LOW")
                if risk in ["HIGH", "CRITICAL"]:
                    cursor.execute("""
                    INSERT INTO alerts (hospital_id, device_id, department, timestamp, risk_level, failure_probability, anomaly_score, root_cause, component, recommended_action, status)
                    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
                    """, (
                        "demo-hospital",
                        dev_id,
                        dept,
                        datetime.datetime.now().strftime("%Y-%m-%dT%H:%M:%SZ"),
                        risk,
                        float(dev_data.get("failure_probability")) if dev_data.get("failure_probability") is not None else 0.75,
                        float(dev_data.get("anomaly", {}).get("score")) if dev_data.get("anomaly", {}).get("score") is not None else 70.0,
                        sanitize_str(dev_data.get("root_cause", {}).get("primary"), "General Wear") if dev_data.get("root_cause") else "General Wear",
                        list(dev_data.get("components", {}).keys())[0] if dev_data.get("components") else "Battery",
                        sanitize_str(dev_data.get("maintenance", {}).get("recommended_action"), "Check connectors"),
                        "active"
                    ))
                
                count += 1
        except Exception as e:
            print(f"Error seeding cached devices: {e}")
            raise e
    
    # Seed 5 devices into other-hospital to verify multi-tenant isolation
    for i in range(1, 6):
        dev_id = f"DEV_OTHER_0{i}"
        cursor.execute("""
        INSERT INTO devices (device_id, hospital_id, department, device_type, manufacturer, model, status)
        VALUES (?, ?, ?, ?, ?, ?, ?)
        """, (dev_id, "other-hospital", "Emergency Department", "Ventilator", "MedStar", "VM-50", "Monitoring"))
        
        cursor.execute("""
        INSERT INTO predictions (hospital_id, device_id, timestamp, failure_probability, risk_level, anomaly_score, overall_health, model_version)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?)
        """, (
            "other-hospital",
            dev_id,
            datetime.datetime.now().strftime("%Y-%m-%dT%H:%M:%SZ"),
            0.02,
            "LOW",
            5.0,
            98.0,
            "1.0"
        ))
        
    conn.commit()

def log_audit_event(user_id: str, username: str, hospital_id: str, action: str, resource_type: str, resource_id: str, success: bool, ip_address: str = "127.0.0.1"):
    try:
        conn = get_db_connection()
        cursor = conn.cursor()
        cursor.execute("""
        INSERT INTO audit_logs (user_id, username, hospital_id, action, resource_type, resource_id, timestamp, ip_address, success)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
        """, (user_id, username, hospital_id, action, resource_type, resource_id, 
              datetime.datetime.now().strftime("%Y-%m-%dT%H:%M:%SZ"), ip_address, 1 if success else 0))
        conn.commit()
        conn.close()
    except Exception as e:
        print(f"Failed to log audit event: {e}")

if __name__ == "__main__":
    init_db()
