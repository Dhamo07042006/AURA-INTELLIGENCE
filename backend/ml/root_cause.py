import pandas as pd
import numpy as np

def analyze_root_cause(feature_row, shap_contributions):
    """
    Ranks the primary root cause and identifies contributing factors with confidence scores.
    """
    # Exclude features that are targets or metadata
    contributing_factors = []
    evidence = []
    
    # Extract top risk features from SHAP
    risk_features = [c for c in shap_contributions if c["shap_value"] > 0]
    
    # Heuristics based on top risk features
    battery_risk = sum(c["shap_value"] for c in risk_features if "battery" in c["feature"].lower() or "cycle" in c["feature"].lower())
    power_risk = sum(c["shap_value"] for c in risk_features if "power" in c["feature"].lower() or "voltage" in c["feature"].lower())
    sensor_risk = sum(c["shap_value"] for c in risk_features if "sensor" in c["feature"].lower() or "abnormal" in c["feature"].lower())
    maint_risk = sum(c["shap_value"] for c in risk_features if "maintenance" in c["feature"].lower() or "maint" in c["feature"].lower())
    age_risk = sum(c["shap_value"] for c in risk_features if "age" in c["feature"].lower() or "hours" in c["feature"].lower())
    
    # Sort risks
    risks = [
        ("Battery Degradation", battery_risk, ["battery", "cycle"]),
        ("Power Unit / Voltage Fluctuation", power_risk, ["power", "voltage"]),
        ("Sensor Miscalibration / Malfunction", sensor_risk, ["sensor", "abnormal"]),
        ("Delayed Preventive Maintenance", maint_risk, ["maintenance", "maint"]),
        ("General Mechanical / Component Aging", age_risk, ["age", "hours"])
    ]
    
    # Sort by risk score descending
    risks = sorted(risks, key=lambda x: x[1], reverse=True)
    primary_cause, top_score, keywords = risks[0]
    
    # If no risk was identified by SHAP, default to wear and tear
    if top_score <= 0:
        primary_cause = "General Wear and Tear"
        confidence = 0.60
        contributing_factors.append("Prolonged operational usage")
        evidence.append(f"Operating Hours: {int(feature_row.get('Approx_Operating_Hours', 0))}")
    else:
        # Calculate confidence from the proportion of the top risk score relative to total risk score
        total_risk = sum(r[1] for r in risks)
        confidence = min(0.98, max(0.50, 0.70 + 0.30 * (top_score / total_risk if total_risk > 0 else 1.0)))
        
        # Pull contributing features as factors and evidence
        for c in risk_features:
            f_name = c["feature"]
            f_val = feature_row.get(f_name)
            
            # Map feature keyword to the primary cause or make it a contributing factor
            if any(k in f_name.lower() for k in keywords):
                # Contributing factor
                # Clean name for readable factors
                clean_name = f_name.replace("_", " ")
                contributing_factors.append(f"{clean_name} (SHAP impact: +{c['shap_value']:.2f})")
                
                # Format evidence nicely
                if isinstance(f_val, float):
                    evidence.append(f"{clean_name}: {f_val:.1f}")
                else:
                    evidence.append(f"{clean_name}: {f_val}")
                    
        # Add other general factors
        if maint_risk > 0 and primary_cause != "Delayed Preventive Maintenance":
            contributing_factors.append("Delayed maintenance intervals")
            evidence.append(f"Days since last maintenance: {int(feature_row.get('Days_Since_Last_Maintenance', 0))}")
            
    # Remove duplicate contributing factors or evidence
    contributing_factors = list(dict.fromkeys(contributing_factors))[:4]
    evidence = list(dict.fromkeys(evidence))[:4]
    
    # Fallbacks if list is empty
    if len(contributing_factors) == 0:
        contributing_factors.append("General component wear")
    if len(evidence) == 0:
        evidence.append("Device age exceeds design threshold.")
        
    return {
        "primary": primary_cause,
        "confidence": round(confidence, 2),
        "contributing_factors": contributing_factors,
        "evidence": evidence
    }
