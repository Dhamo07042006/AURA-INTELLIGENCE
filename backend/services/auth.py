import jwt
import datetime
from fastapi import Depends, HTTPException, Security
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials
import sqlite3
import os

from backend.database import get_db_connection, hash_password

JWT_SECRET = os.getenv("JWT_SECRET", "aura_reliability_intelligence_secret_2026")
ALGORITHM = "HS256"
ACCESS_TOKEN_EXPIRE_MINUTES = 120

security = HTTPBearer()

def create_access_token(data: dict) -> str:
    to_encode = data.copy()
    expire = datetime.datetime.utcnow() + datetime.timedelta(minutes=ACCESS_TOKEN_EXPIRE_MINUTES)
    to_encode.update({"exp": expire})
    encoded_jwt = jwt.encode(to_encode, JWT_SECRET, algorithm=ALGORITHM)
    return encoded_jwt

def get_current_user(credentials: HTTPAuthorizationCredentials = Security(security)) -> dict:
    token = credentials.credentials
    try:
        payload = jwt.decode(token, JWT_SECRET, algorithms=[ALGORITHM])
        username: str = payload.get("sub")
        hospital_id: str = payload.get("hospital_id")
        role: str = payload.get("role")
        department: str = payload.get("department")
        
        if username is None or hospital_id is None or role is None:
            raise HTTPException(status_code=401, detail="Invalid authorization credentials")
            
        return {
            "username": username,
            "hospital_id": hospital_id,
            "role": role,
            "department": department
        }
    except jwt.PyJWTError:
        raise HTTPException(status_code=401, detail="Could not validate credentials")

class RoleChecker:
    def __init__(self, allowed_roles: list):
        self.allowed_roles = allowed_roles
        
    def __call__(self, user: dict = Depends(get_current_user)) -> dict:
        if user["role"] not in self.allowed_roles:
            raise HTTPException(
                status_code=403, 
                detail=f"Operation not permitted. Required roles: {self.allowed_roles}"
            )
        return user

# Helper to verify hospital data access
def verify_tenant_access(hospital_id: str, user: dict):
    if user["hospital_id"] != hospital_id:
        raise HTTPException(status_code=403, detail="Hospital data isolation violation. Cannot access other tenant data.")

# Helper to check device access based on department permissions
def verify_device_access(device_id: str, user: dict):
    conn = get_db_connection()
    cursor = conn.cursor()
    cursor.execute("SELECT hospital_id, department FROM devices WHERE device_id = ?", (device_id,))
    row = cursor.fetchone()
    conn.close()
    
    if not row:
        raise HTTPException(status_code=404, detail="Device not found")
        
    # Check hospital tenant isolation
    verify_tenant_access(row["hospital_id"], user)
    
    # Check department-level operator constraints
    if user["role"] == "DEPARTMENT_OPERATOR":
        if user["department"] != row["department"]:
            raise HTTPException(status_code=403, detail=f"Access denied. You are only authorized to view department: {user['department']}")
