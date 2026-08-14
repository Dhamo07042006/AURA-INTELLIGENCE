import pandas as pd
import numpy as np
import os
import re
from sklearn.feature_extraction.text import TfidfVectorizer
from sklearn.metrics.pairwise import cosine_similarity

class RAGMaintenanceAdvisor:
    def __init__(self):
        self.data_dir = r"C:\Users\Dhamodaran G\Desktop\CTS\data\raw"
        self.vectorizer = TfidfVectorizer(stop_words='english')
        self.docs = []
        self.metadata = []
        self.is_indexed = False
        
    def build_index(self):
        if self.is_indexed:
            return
            
        print("Indexing safety and recall documents for RAG Advisor...")
        
        recall_path = os.path.join(self.data_dir, "safety_recall_information_cleaned.csv")
        events_path = os.path.join(self.data_dir, "events-1681209680.csv")
        device_path = os.path.join(self.data_dir, "device_information_cleaned.csv")
        
        # Load registry to match device types
        device_types = {}
        if os.path.exists(device_path):
            df_dev = pd.read_csv(device_path)
            device_types = df_dev.set_index("Device_ID")["Device_Type"].to_dict()
            
        # 1. Load Safety Recall info
        if os.path.exists(recall_path):
            df_rec = pd.read_csv(recall_path)
            for idx, row in df_rec.iterrows():
                d_id = row.get("Device_ID")
                d_type = device_types.get(d_id, "Medical Device")
                reason = str(row.get("Recall_Reason", ""))
                action = str(row.get("Corrective_Action", ""))
                classification = str(row.get("Recall_Classification", "Class II"))
                
                if len(reason) > 5 or len(action) > 5:
                    doc_text = f"Device Type: {d_type}. Classification: {classification}. Recall Reason: {reason}. Corrective Action: {action}."
                    self.docs.append(doc_text)
                    self.metadata.append({
                        "source": "Safety Recall Database",
                        "device_type": d_type,
                        "classification": classification,
                        "action": action,
                        "reason": reason
                    })
                    
        # 2. Load Raw ICIJ events for extra coverage (first 2000 rows to keep indexing instant)
        if os.path.exists(events_path):
            try:
                df_ev = pd.read_csv(events_path, nrows=2000)
                for idx, row in df_ev.iterrows():
                    reason = str(row.get("reason", ""))
                    cause = str(row.get("determined_cause", ""))
                    summary = str(row.get("action_summary", ""))
                    slug = str(row.get("slug", ""))
                    
                    # Clean slug to extract potential device name
                    device_name = slug.replace("tur-", "").replace("-", " ").title()
                    
                    if len(reason) > 10 or len(summary) > 10:
                        doc_text = f"Device Name: {device_name}. Reason: {reason}. Cause: {cause}. Action Summary: {summary}."
                        self.docs.append(doc_text)
                        self.metadata.append({
                            "source": "ICIJ Events Registry",
                            "device_type": device_name,
                            "classification": "Safety Alert",
                            "action": summary,
                            "reason": reason
                        })
            except Exception as e:
                print(f"Warning loading ICIJ events: {e}")
                
        # 3. Handle Empty Document Store Fallback
        if len(self.docs) == 0:
            print("No documents found. Loading default template knowledge base.")
            self._load_fallback_docs()
            
        # Fit TF-IDF matrix
        self.tfidf_matrix = self.vectorizer.fit_transform(self.docs)
        self.is_indexed = True
        print(f"Indexed {len(self.docs)} safety reference documents.")
        
    def _load_fallback_docs(self):
        fallback_data = [
            ("Ventilator", "Battery Degradation", "Inspect battery backup modules. Replace degraded battery pack with approved manufacturer replacement cell. Calibrate power sensors.", "Class I Recall"),
            ("Ventilator", "Oxygen System Flow Sensor", "Inspect oxygen intake valves. Calibrate O2 flow sensors. Perform circuit leak test before returning to service.", "Field Safety Notice"),
            ("CT scanner", "Cooling System Leak", "Inspect gantry heat exchanger lines for blockages. Flush coolant system. Replace sealing rings and torque fittings.", "Class II Recall"),
            ("Infusion pump", "Software Fault / Occlusion Alert", "Update firmware to current revision. Re-verify occlusion pressure thresholds. Run self-diagnostic routine.", "Software Alert"),
            ("ECG/EKG machine", "Lead Cable / Electrode Noise", "Replace worn lead cables. Clean patient connections. Run validation tests against external wave simulator.", "Maintenance Alert")
        ]
        for dtype, cause, action, classification in fallback_data:
            doc_text = f"Device Type: {dtype}. Failure Cause: {cause}. Recommended Action: {action}. Alert Type: {classification}."
            self.docs.append(doc_text)
            self.metadata.append({
                "source": "Approved Maintenance Manual",
                "device_type": dtype,
                "classification": classification,
                "action": action,
                "reason": cause
            })
            
    def get_maintenance_advice(self, device_type, root_cause):
        self.build_index()
        
        # Search query matching device type and root cause
        query = f"{device_type} {root_cause}"
        query_vec = self.vectorizer.transform([query])
        
        # Compute similarities
        similarities = cosine_similarity(query_vec, self.tfidf_matrix).flatten()
        
        # Get top match
        top_idx = np.argmax(similarities)
        max_score = similarities[top_idx]
        
        if max_score < 0.1:
            # Fallback if no relevant documents match
            return {
                "recommended_action": f"Perform standard visual inspection and functional diagnostic checks for {root_cause} on the {device_type}.",
                "source": "General Maintenance Guideline",
                "evidence": f"No specific recall or manufacturer alert matches found in the knowledge base (Score: {max_score:.4f}).",
                "confidence": "Low"
            }
            
        match = self.metadata[top_idx]
        
        # Refined action text
        action_text = match["action"]
        if pd.isna(action_text) or str(action_text).lower() in ["", "nan", "unknown"]:
            action_text = f"Inspect and replace degraded sub-components related to {root_cause} according to standard manufacturer guidelines."
            
        return {
            "recommended_action": action_text,
            "source": match["source"],
            "evidence": self.docs[top_idx],
            "confidence": "High" if max_score > 0.4 else "Medium",
            "relevance_score": round(float(max_score), 4)
        }
