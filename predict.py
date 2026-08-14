import argparse
import json
import sys
import os

# Ensure project root is in python path
sys.path.append(os.path.dirname(os.path.abspath(__file__)))

from backend.ml.inference import MedicalDeviceInferenceEngine

def main():
    parser = argparse.ArgumentParser(description="Predictive maintenance intelligence for medical devices")
    parser.add_argument("--device-id", required=True, help="Device ID to query (e.g. DEV000001)")
    parser.add_argument("--date", default=None, help="Prediction date snapshot (YYYY-MM-DD)")
    
    args = parser.parse_args()
    
    engine = MedicalDeviceInferenceEngine()
    try:
        report = engine.run_device_report(args.device_id, args.date)
        print(json.dumps(report, indent=2))
    except Exception as e:
        print(f"Error running inference report: {e}", file=sys.stderr)
        sys.exit(1)

if __name__ == "__main__":
    main()
