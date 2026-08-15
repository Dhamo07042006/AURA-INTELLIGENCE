import datetime
import random

def get_scenario_telemetry(device_id: str, scenario: str, step: int) -> dict:
    """
    Generates simulated device telemetry data based on failure scenarios.
    Ensures parameters degrade predictably with each step.
    """
    timestamp = datetime.datetime.utcnow().strftime("%Y-%m-%dT%H:%M:%SZ")
    
    # Defaults
    battery_health = 92.4
    temperature = 34.1
    pressure = 30.2
    oxygen_flow = 47.5
    error_code = "OK"
    load_percent = 55.0
    
    # Apply scenario adjustments based on simulation steps
    if scenario == "Normal":
        # Keep parameters in normal range
        battery_health = max(80.0, 95.0 - (step * 0.05))
        temperature = 34.0 + random.uniform(-0.5, 0.5)
        pressure = 30.0 + random.uniform(-1.0, 1.0)
        oxygen_flow = 48.0 + random.uniform(-0.8, 0.8)
        error_code = "OK"
        load_percent = 50.0 + random.uniform(-5.0, 5.0)
        
    elif scenario == "Battery Degradation":
        # Decline battery health rapidly
        battery_health = max(5.0, 80.0 - (step * 2.0))
        temperature = 34.5 + min(6.0, step * 0.2) + random.uniform(-0.3, 0.3)
        pressure = 30.0 + random.uniform(-0.8, 0.8)
        oxygen_flow = 47.0 + random.uniform(-0.5, 0.5)
        load_percent = 58.0 + (step * 0.5)
        
        if battery_health < 25.0:
            error_code = "BAT_CRITICAL"
        elif battery_health < 48.0:
            error_code = "BAT_WARN"
        else:
            error_code = "OK"
            
    elif scenario == "Overheating":
        battery_health = max(70.0, 88.0 - (step * 0.1))
        # Escalate temperature
        temperature = min(58.0, 35.0 + (step * 1.2) + random.uniform(-0.2, 0.2))
        pressure = 30.0 + random.uniform(-0.5, 0.5)
        oxygen_flow = 47.0 + random.uniform(-0.5, 0.5)
        
        if temperature > 49.0:
            error_code = "TEMP_CRITICAL"
        elif temperature > 41.0:
            error_code = "TEMP_WARN"
        else:
            error_code = "OK"
            
    elif scenario == "Sensor Failure":
        battery_health = 89.2
        temperature = 34.2
        # Pressure / Flow drop or rise erratically
        pressure = max(5.0, min(80.0, 30.0 - (step * 2.5) if step % 2 == 0 else 30.0 + (step * 3.0)))
        oxygen_flow = max(10.0, 48.0 - (step * 1.5))
        error_code = "SENSOR_ERR"
        
    elif scenario == "Power Instability":
        battery_health = max(50.0, 85.0 - random.uniform(5.0, 15.0))
        temperature = 34.5
        # Fluctuating metrics
        error_code = "POWER_FLUC" if step % 3 == 0 else "POWER_WARN"
        load_percent = max(10.0, min(99.0, 55.0 + random.uniform(-25.0, 25.0)))
        
    elif scenario == "Communication Failure":
        battery_health = 90.1
        temperature = 34.0
        # Trigger communication alarms or resets
        error_code = "SYS_RESET" if step % 4 == 0 else "COMM_ERR"
        
    return {
        "device_id": device_id,
        "timestamp": timestamp,
        "battery_health": round(battery_health, 2),
        "temperature": round(temperature, 2),
        "pressure": round(pressure, 2),
        "oxygen_flow": round(oxygen_flow, 2),
        "load_percent": round(load_percent, 2),
        "error_code": error_code
    }
