import pandas as pd
import numpy as np
import os
import re
import json
from sklearn.feature_extraction.text import TfidfVectorizer
from sklearn.metrics.pairwise import cosine_similarity
from backend.config import RAW_DIR
from backend.database import get_db_connection

def validate_rag_grounding(query: str, device_type: str, advice: dict) -> dict:
    q_lower = str(query or "").lower().strip()
    evidence_text = str(advice.get("evidence", "") or advice.get("recommended_action", "")).lower()
    
    # 1. Common off-topic patterns (trivia, geography, sports, jokes, general knowledge)
    off_topic_patterns = [
        r"\bcapital\s+of\b", r"\bwho\s+is\b", r"\bwhere\s+is\b", r"\bpresident\s+of\b",
        r"\bpopulation\s+of\b", r"\bprime\s+minister\b", r"\btell\s+me\s+a\s+joke\b",
        r"\bweather\s+in\b", r"\bhow\s+to\s+cook\b", r"\brecipe\s+for\b", r"\bwrite\s+a?\s*code\b",
        r"\bmovie\s+about\b", r"\bsong\s+by\b", r"\bwhat\s+is\s+\d+\s*[\+\-\*\/]\s*\d+",
        r"\bmeaning\s+of\s+life\b", r"\bcapital\s+city\b"
    ]
    
    if "capital expenditure" not in q_lower and "capital cost" not in q_lower:
        for pattern in off_topic_patterns:
            if re.search(pattern, q_lower):
                advice["recommended_action"] = "Non specific content"
                advice["found"] = False
                advice["evidence"] = "Query identified as non-equipment trivia or off-topic."
                return advice

    # 2. Invention / History / Authorship intent verification against retrieved evidence
    invention_words = ["invent", "invented", "inventor", "inventend", "created", "discovered", "founder", "origin"]
    if any(w in q_lower for w in invention_words):
        if not any(w in evidence_text for w in ["invent", "inventor", "created by", "discovered", "einthoven"]):
            advice["recommended_action"] = "Non specific content"
            advice["found"] = False
            advice["evidence"] = "The retrieved manual does not contain information about the invention or history."
            return advice

    author_words = ["author", "writer", "wrote", "compiled by", "prepared by"]
    if any(w in q_lower for w in author_words):
        if not any(w in evidence_text for w in ["author", "written by", "prepared by", "compiled by", "copyright"]):
            advice["recommended_action"] = "Non specific content"
            advice["found"] = False
            advice["evidence"] = "The retrieved manual does not contain author metadata."
            return advice

    # 3. Multi-word intent match: If query has 2+ non-stopwords, ensure at least 2 distinct keywords match evidence
    stopwords = {
        "what", "is", "the", "of", "a", "an", "in", "on", "for", "to", "how", "do", "can",
        "i", "me", "you", "tell", "show", "give", "device", "type", "manual", "who", "when",
        "where", "why", "which", "please", "about", "with"
    }
    query_words = [w for w in re.findall(r'[a-z0-9]+', q_lower) if w not in stopwords and len(w) > 2]
    
    if len(query_words) >= 2:
        def match_stem(w, text):
            stem = w[:5] if len(w) >= 6 else w
            return stem in text

        matched_words = [w for w in query_words if match_stem(w, evidence_text)]
        if len(set(matched_words)) < 2:
            advice["recommended_action"] = "Non specific content"
            advice["found"] = False
            advice["evidence"] = "Partial keyword match insufficient to answer full query intent."
            return advice

    # 4. Domain keyword presence vs relevance score
    domain_keywords = {
        "battery", "power", "temperature", "temp", "sensor", "calibration", "calibrate", 
        "troubleshoot", "troubleshooting", "error", "alarm", "leak", "pressure", "flow", 
        "circuit", "voltage", "fuse", "replacement", "replace", "clean", "cleaning", 
        "valve", "display", "firmware", "software", "occlusion", "noise", "cable", 
        "electrode", "maintenance", "manual", "inspection", "inspect", "repair", "service",
        "health", "degradation", "failure", "recall", "safety", "warning", "bci", "oxygen",
        "ventilator", "pump", "monitor", "defibrillator", "ecg", "ekg", "ultrasound", "ct"
    }

    has_domain_word = any(w in domain_keywords for w in query_words)
    
    if not has_domain_word and advice.get("relevance_score", 0) < 0.35:
        advice["recommended_action"] = "Non specific content"
        advice["found"] = False
        advice["evidence"] = "No medical equipment context matching this query."
        return advice

    return advice

class RAGMaintenanceAdvisor:
    def __init__(self):
        self.data_dir = str(RAW_DIR)
        self.vectorizer = TfidfVectorizer(stop_words='english')
        
        # We will index on demand per hospital_id to enforce multi-tenant isolation
        self.docs = []
        self.metadata = []
        self.current_hospital_id = None
        self.tfidf_matrix = None
        
    def build_index(self, hospital_id: str = None, force: bool = False):
        # Only skip re-indexing if not forced and hospital tenant context hasn't changed
        if not force and self.tfidf_matrix is not None and self.current_hospital_id == hospital_id:
            return
            
        print(f"Indexing safety recalls and tenant-isolated manuals for hospital_id={hospital_id} (force={force})...")
        
        self.docs = []
        self.metadata = []
        self.current_hospital_id = hospital_id
        
        recall_path = os.path.join(self.data_dir, "safety_recall_information_cleaned.csv")
        events_path = os.path.join(self.data_dir, "events-1681209680.csv")
        device_path = os.path.join(self.data_dir, "device_information_cleaned.csv")
        
        # Load registry to match device types
        device_types = {}
        if os.path.exists(device_path):
            try:
                df_dev = pd.read_csv(device_path)
                device_types = df_dev.set_index("Device_ID")["Device_Type"].to_dict()
            except Exception:
                pass
            
        # 1. Load Safety Recall info (Global context)
        if os.path.exists(recall_path):
            try:
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
                            "reason": reason,
                            "is_custom": False
                        })
            except Exception as e:
                print(f"Warning loading safety recall info: {e}")
                    
        # 2. Load Raw ICIJ events (Global context, limit to 1000 rows)
        if os.path.exists(events_path):
            try:
                df_ev = pd.read_csv(events_path, nrows=1000)
                for idx, row in df_ev.iterrows():
                    reason = str(row.get("reason", ""))
                    cause = str(row.get("determined_cause", ""))
                    summary = str(row.get("action_summary", ""))
                    slug = str(row.get("slug", ""))
                    
                    device_name = slug.replace("tur-", "").replace("-", " ").title()
                    
                    if len(reason) > 10 or len(summary) > 10:
                        doc_text = f"Device Name: {device_name}. Reason: {reason}. Cause: {cause}. Action Summary: {summary}."
                        self.docs.append(doc_text)
                        self.metadata.append({
                            "source": "ICIJ Events Registry",
                            "device_type": device_name,
                            "classification": "Safety Alert",
                            "action": summary,
                            "reason": reason,
                            "is_custom": False
                        })
            except Exception as e:
                print(f"Warning loading ICIJ events: {e}")

        # 3. Load Tenant-Isolated Custom Uploaded Document Manuals from SQLite
        if hospital_id:
            try:
                conn = get_db_connection()
                cursor = conn.cursor()
                cursor.execute("""
                SELECT c.text_content, c.section, c.page, d.filename, d.device_type, d.manufacturer
                FROM rag_chunks c
                JOIN maintenance_documents d ON c.document_id = d.document_id
                WHERE c.hospital_id = ? AND d.status = 'enabled'
                """, (hospital_id,))
                
                rows = cursor.fetchall()
                for row in rows:
                    filename = row["filename"]
                    dev_type = row["device_type"]
                    mfr = row["manufacturer"]
                    section = row["section"]
                    chunk_text = row["text_content"]
                    page = row["page"]
                    
                    doc_text = f"Manual Document: {filename}. Device Type: {dev_type}. Manufacturer: {mfr}. Section: {section}. Content: {chunk_text}"
                    self.docs.append(doc_text)
                    self.metadata.append({
                        "source": filename,
                        "device_type": dev_type,
                        "manufacturer": mfr,
                        "classification": "Verified Maintenance Manual",
                        "action": chunk_text,
                        "reason": f"{dev_type} component troubleshooting",
                        "section": section,
                        "page": page,
                        "is_custom": True
                    })
                conn.close()
            except Exception as e:
                print(f"Warning loading custom knowledge manuals from SQLite: {e}")
                
        # 4. Handle Empty Document Store Fallback
        if len(self.docs) == 0:
            print("No documents found. Loading default template knowledge base.")
            self._load_fallback_docs()
            
        # Fit TF-IDF matrix
        self.tfidf_matrix = self.vectorizer.fit_transform(self.docs)
        print(f"Indexed {len(self.docs)} safety and manual documents for tenant {hospital_id}.")
        
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
                "reason": cause,
                "is_custom": False
            })
            
    def get_maintenance_advice(self, device_type, root_cause, hospital_id: str = None):
        # Build or check index
        self.build_index(hospital_id)
        
        # Search query based on user query string directly
        query_text = str(root_cause or "").strip()
        if not query_text:
            query_text = str(device_type or "").strip()
            
        query_vec = self.vectorizer.transform([query_text])
        
        # Compute similarities
        similarities = cosine_similarity(query_vec, self.tfidf_matrix).flatten()
        
        # 1. Filter custom documents by matching device_type first
        target_dev = str(device_type).strip().lower()
        matched_custom_indices = []
        
        for idx, m in enumerate(self.metadata):
            if m.get("is_custom"):
                m_dev = str(m.get("device_type", "")).strip().lower()
                # Check if device_type matches or overlaps
                if target_dev in m_dev or m_dev in target_dev or not target_dev or target_dev == "medical device":
                    matched_custom_indices.append(idx)
                    
        # Fallback to all custom docs if no device_type filter match
        if not matched_custom_indices:
            matched_custom_indices = [idx for idx, m in enumerate(self.metadata) if m.get("is_custom")]
            
        if matched_custom_indices:
            custom_similarities = sorted([(idx, similarities[idx]) for idx in matched_custom_indices], key=lambda x: x[1], reverse=True)
            
            for top_custom_idx, max_custom_score in custom_similarities[:5]:
                if max_custom_score < 0.12:
                    break
                    
                match = self.metadata[top_custom_idx]
                evidence = self.docs[top_custom_idx]
                recommendation = match["action"]
                
                try:
                    from backend.services.grok_service import query_grok
                    prompt = f"System Context: You are a strict Biomedical Engineering Maintenance Advisor.\n" \
                             f"STRICT RULE: Only answer based on the provided document context below.\n" \
                             f"If the query is off-topic, random, or not present in the document excerpt below, respond ONLY with: 'Non specific content'.\n\n" \
                             f"Device: {match['device_type']} ({match.get('manufacturer', 'Approved')})\n" \
                             f"Issue / Query: {root_cause}\n" \
                             f"Manual Source: {match['source']} (Section: {match.get('section', 'General')})\n" \
                             f"Manual Excerpt: {match['action']}\n\n" \
                             f"Provide a clear technical maintenance instruction grounded strictly on the excerpt above. If not answered in excerpt, reply 'Non specific content'."
                    llm_reply = query_grok([{"role": "user", "content": prompt}], max_tokens=250)
                    if llm_reply and len(llm_reply) > 5:
                        clean_llm = llm_reply.strip()
                        if "non specific content" in clean_llm.lower():
                            recommendation = "Non specific content"
                        else:
                            recommendation = clean_llm
                except Exception as e:
                    print(f"Groq LLM synthesis note: {e}")

                if "non specific content" in str(recommendation).lower():
                    continue

                res_custom = {
                    "recommended_action": recommendation,
                    "source": match["source"],
                    "evidence": evidence,
                    "confidence": "High" if max_custom_score > 0.3 else "Medium",
                    "relevance_score": round(float(max_custom_score), 4),
                    "section": match.get("section", "Troubleshooting"),
                    "page": match.get("page", 1),
                    "is_custom": True,
                    "found": True
                }
                validated = validate_rag_grounding(query_text, device_type, res_custom)
                if validated.get("found"):
                    return validated
        
        # General Fallback across all documents
        top_idx = int(np.argmax(similarities))
        max_score = similarities[top_idx]
        
        # Grounding relevance check: if query relevance score is below 0.12, return Non specific content
        if max_score < 0.12:
            return {
                "recommended_action": "Non specific content",
                "source": "None",
                "evidence": f"No specific or relevant content found in the indexed manuals or documents for this query (Relevance Score: {max_score:.4f}).",
                "confidence": "Low",
                "relevance_score": round(float(max_score), 4),
                "found": False,
                "non_specific": True
            }
            
        match = self.metadata[top_idx]
        action_text = str(match.get("action", "")).strip()
        if not action_text or action_text.lower() in ["nan", "none", "null"] or len(action_text) < 5:
            action_text = "Non specific content"

        if "non specific content" in action_text.lower():
            return {
                "recommended_action": "Non specific content",
                "source": "None",
                "evidence": "No relevant content found in the indexed manuals for this query.",
                "confidence": "Low",
                "relevance_score": round(float(max_score), 4),
                "found": False,
                "non_specific": True
            }

        res_general = {
            "recommended_action": action_text,
            "source": match["source"],
            "evidence": self.docs[top_idx],
            "confidence": "High" if max_score > 0.4 else "Medium",
            "relevance_score": round(float(max_score), 4),
            "section": match.get("section", "Recall Notice"),
            "page": match.get("page", 1),
            "is_custom": match.get("is_custom", False),
            "found": True
        }
        return validate_rag_grounding(query_text, device_type, res_general)
