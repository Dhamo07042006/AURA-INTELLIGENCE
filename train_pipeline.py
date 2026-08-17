import os
import sys
import time

# Ensure workspace root is in python path
sys.path.append(os.path.dirname(os.path.abspath(__file__)))

from backend.data_pipeline.data_audit import run_data_audit
from backend.data_pipeline.build_feature_store import run_build_feature_store
from backend.ml.component_ontology import run_component_ontology
from backend.ml.train_classifier import run_train_classifier
from backend.ml.train_rul import run_train_rul
from backend.ml.anomaly_detection import run_anomaly_detection
from backend.ml.shap_explainer import run_shap_explainer

def main():
    print("======================================================================")
    print("STARTING MEDICAL DEVICE RELIABILITY PLATFORM ML TRAINING PIPELINE")
    print("======================================================================")
    
    t_start = time.time()
    
    # Step 1: Audit datasets
    print("\n--- PHASE 1: RUNNING DATA QUALITY AUDIT ---")
    run_data_audit()
    
    # Step 2: Build Feature Store
    print("\n--- PHASE 2: BUILDING TIME-AWARE FEATURE STORE ---")
    # Wait, the background task for build_feature_store might be running if we execute this
    # but we can run it directly in this pipeline command!
    run_build_feature_store()
    
    # Step 3: Build component ontology
    print("\n--- PHASE 3: DISCOVERING DYNAMIC COMPONENT ONTOLOGY ---")
    run_component_ontology()
    
    # Step 4: Train Classifier
    print("\n--- PHASE 4: TRAINING & BENCHMARKING CLASSIFIERS ---")
    run_train_classifier()
    
    # Step 5: Train RUL Regressor
    print("\n--- PHASE 5: TRAINING RUL REGRESSION MODELS ---")
    run_train_rul()
    
    # Step 6: Train Anomaly Detector
    print("\n--- PHASE 6: TRAINING UNSUPERVISED ANOMALY DETECTION ---")
    run_anomaly_detection()
    
    # Step 7: Generate SHAP Explainer
    print("\n--- PHASE 7: BUILDING EXPLAINABLE AI SHAP EXPLAINER ---")
    run_shap_explainer()
    
    print("\n======================================================================")
    print(f"PIPELINE RUN COMPLETED SUCCESSFULLY in {time.time() - t_start:.2f}s!")
    print("All models serialized under models/ and reports saved under artifacts/")
    print("======================================================================")

if __name__ == "__main__":
    main()
