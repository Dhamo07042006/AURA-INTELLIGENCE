import React from 'react';
import { Brain, Upload, Cpu } from 'lucide-react';

export default function MachineFailurePredictor({
  handleRunCustomTraining, isRetrainingCustom, customFile1, customFile2, customFile3,
  handleCustomFileChange, uploadedDatasetSummary, getRiskBadge, customMetrics
}) {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '25px' }}>
      <div>
        <h1 style={{ margin: 0, fontSize: '2em', display: 'flex', alignItems: 'center', gap: '12px' }}>
          <Brain size={30} color="#3b82f6" />
          Hospital Machine Failure ML Predictor & Trainer
        </h1>
        <p style={{ margin: '5px 0 0 0', color: '#94a3b8' }}>
          Upload custom medical equipment datasets (Recalls, Manufacturers, Products & Telemetry), train machine learning algorithms (Random Forest, CatBoost, Logistic Regression, SVM), analyze model performance matrices, and execute real-time machine failure risk predictions.
        </p>
      </div>

      {/* SECTION 1: DATASET UPLOAD & PROCESSING */}
      <div className="glass-card" style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: '1px solid rgba(255,255,255,0.08)', paddingBottom: '12px' }}>
          <h3 style={{ margin: 0, display: 'flex', alignItems: 'center', gap: '10px' }}>
            <Upload size={20} color="#60a5fa" />
            1. Medical Equipment Datasets Ingestion (CSV / XLSX / XLS)
          </h3>
          <button
            className="primary"
            style={{ fontSize: '0.82em', padding: '8px 14px', background: 'rgba(59,130,246,0.2)', border: '1px solid #3b82f6', color: '#60a5fa' }}
            onClick={handleRunCustomTraining}
            disabled={isRetrainingCustom}
          >
            {isRetrainingCustom ? '⏳ Ingesting Datasets...' : '⚡ Ingest & Train Archive (24) Datasets'}
          </button>
        </div>

        {/* 3 Upload Boxes matching user screenshots */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '18px' }}>
          {/* File 1: Recalls & Safety Actions */}
          <div style={{ background: 'rgba(15,23,42,0.6)', border: '2px dashed rgba(59,130,246,0.3)', borderRadius: '10px', padding: '16px', textAlign: 'center' }}>
            <div style={{ fontSize: '0.85em', fontWeight: 700, color: '#f8fafc', marginBottom: '4px' }}>File 1: Field Safety Actions & Recalls</div>
            <div style={{ fontSize: '0.75em', color: '#94a3b8', marginBottom: '12px' }}>Columns: action, country, device_id, reason, risk_class, status, uid...</div>
            <input
              type="file"
              accept=".csv, .xlsx, .xls"
              style={{ display: 'none' }}
              id="custom-file-1"
              onChange={(e) => handleCustomFileChange(e, 1)}
            />
            <label htmlFor="custom-file-1" style={{ display: 'inline-block', background: '#1e293b', border: '1px solid #3b82f6', color: '#60a5fa', padding: '8px 14px', borderRadius: '6px', cursor: 'pointer', fontSize: '0.8em', fontWeight: 600 }}>
              {customFile1 ? `✓ ${customFile1.name}` : '📁 Upload File 1 (CSV/XLS)'}
            </label>
          </div>

          {/* File 2: Manufacturers & Companies */}
          <div style={{ background: 'rgba(15,23,42,0.6)', border: '2px dashed rgba(59,130,246,0.3)', borderRadius: '10px', padding: '16px', textAlign: 'center' }}>
            <div style={{ fontSize: '0.85em', fontWeight: 700, color: '#f8fafc', marginBottom: '4px' }}>File 2: Manufacturers & Parent Companies</div>
            <div style={{ fontSize: '0.75em', color: '#94a3b8', marginBottom: '12px' }}>Columns: name, parent_company, representative, slug, source...</div>
            <input
              type="file"
              accept=".csv, .xlsx, .xls"
              style={{ display: 'none' }}
              id="custom-file-2"
              onChange={(e) => handleCustomFileChange(e, 2)}
            />
            <label htmlFor="custom-file-2" style={{ display: 'inline-block', background: '#1e293b', border: '1px solid #3b82f6', color: '#60a5fa', padding: '8px 14px', borderRadius: '6px', cursor: 'pointer', fontSize: '0.8em', fontWeight: 600 }}>
              {customFile2 ? `✓ ${customFile2.name}` : '📁 Upload File 2 (CSV/XLS)'}
            </label>
          </div>

          {/* File 3: Medical Products & Telemetry */}
          <div style={{ background: 'rgba(15,23,42,0.6)', border: '2px dashed rgba(59,130,246,0.3)', borderRadius: '10px', padding: '16px', textAlign: 'center' }}>
            <div style={{ fontSize: '0.85em', fontWeight: 700, color: '#f8fafc', marginBottom: '4px' }}>File 3: Products & Telemetry Signals</div>
            <div style={{ fontSize: '0.75em', color: '#94a3b8', marginBottom: '12px' }}>Columns: classification, code, description, risk_class, quantity, health...</div>
            <input
              type="file"
              accept=".csv, .xlsx, .xls"
              style={{ display: 'none' }}
              id="custom-file-3"
              onChange={(e) => handleCustomFileChange(e, 3)}
            />
            <label htmlFor="custom-file-3" style={{ display: 'inline-block', background: '#1e293b', border: '1px solid #3b82f6', color: '#60a5fa', padding: '8px 14px', borderRadius: '6px', cursor: 'pointer', fontSize: '0.8em', fontWeight: 600 }}>
              {customFile3 ? `✓ ${customFile3.name}` : '📁 Upload File 3 (CSV/XLS)'}
            </label>
          </div>
        </div>

        {/* Parsed Summary Box */}
        {!uploadedDatasetSummary ? (
          <div style={{ background: 'rgba(30,41,59,0.5)', borderRadius: '8px', padding: '24px', textAlign: 'center', border: '1px dashed rgba(59,130,246,0.3)' }}>
            <Upload size={32} color="#60a5fa" style={{ marginBottom: '10px' }} />
            <div style={{ fontWeight: 700, color: '#f8fafc', fontSize: '1em', marginBottom: '4px' }}>No Active Dataset Summary Ingested</div>
            <div style={{ fontSize: '0.82em', color: '#94a3b8' }}>
              Upload File 1, File 2, or File 3 above, or click <strong>"⚡ Ingest & Train Archive (24) Datasets"</strong> to parse and train on the <code>C:\Users\Dhamodaran G\Downloads\archive (24)</code> dataset.
            </div>
          </div>
        ) : (
          <div style={{ background: 'rgba(30,41,59,0.7)', borderRadius: '8px', padding: '16px', border: '1px solid rgba(59,130,246,0.2)' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '10px' }}>
              <span style={{ fontWeight: 700, color: '#60a5fa', fontSize: '0.9em' }}>📊 Active Dataset Schema & Ingestion Summary</span>
              <span style={{ fontSize: '0.8em', color: '#10b981', background: 'rgba(16,185,129,0.15)', padding: '3px 10px', borderRadius: '4px', fontWeight: 600 }}>
                Target Column: Hospital Machine Failure Status
              </span>
            </div>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '15px', marginBottom: '12px', fontSize: '0.85em' }}>
              <div><span style={{ color: '#94a3b8' }}>Total Devices / Rows:</span> <strong>{uploadedDatasetSummary.total_rows}</strong></div>
              <div><span style={{ color: '#94a3b8' }}>Engineered Features:</span> <strong>{uploadedDatasetSummary.feature_count} columns</strong></div>
              <div><span style={{ color: '#94a3b8' }}>Missing Values:</span> <strong>{uploadedDatasetSummary.missing_pct}%</strong></div>
              <div><span style={{ color: '#94a3b8' }}>Status:</span> <strong style={{ color: '#34d399' }}>Ready for ML Training</strong></div>
            </div>

            {/* Sample Preview Table */}
            <div style={{ overflowX: 'auto', fontSize: '0.78em' }}>
              <table style={{ width: '100%', borderCollapse: 'collapse', color: '#cbd5e1' }}>
                <thead>
                  <tr style={{ borderBottom: '1px solid rgba(255,255,255,0.1)', color: '#94a3b8', textAlign: 'left' }}>
                    <th style={{ padding: '6px' }}>Record ID</th>
                    <th style={{ padding: '6px' }}>Product / Equipment Name</th>
                    <th style={{ padding: '6px' }}>Classification</th>
                    <th style={{ padding: '6px' }}>Manufacturer</th>
                    <th style={{ padding: '6px' }}>Country / Source</th>
                    <th style={{ padding: '6px' }}>Event / Safety Signal</th>
                    <th style={{ padding: '6px' }}>Target: Failure Risk</th>
                  </tr>
                </thead>
                <tbody>
                  {uploadedDatasetSummary.preview_rows?.map((row, idx) => (
                    <tr key={idx} style={{ borderBottom: '1px solid rgba(255,255,255,0.03)' }}>
                      <td style={{ padding: '6px', fontWeight: 600, color: '#60a5fa' }}>{row.record_id || row.device_id || `REC-${idx + 1}`}</td>
                      <td style={{ padding: '6px' }}>{row.product_name || row.device_type}</td>
                      <td style={{ padding: '6px' }}>{row.classification || row.risk_class}</td>
                      <td style={{ padding: '6px' }}>{row.manufacturer}</td>
                      <td style={{ padding: '6px' }}>{row.country || 'Global'}</td>
                      <td style={{ padding: '6px', color: (row.event_type?.includes('Recall') || row.error_code !== 'OK') ? '#f87171' : '#34d399' }}>{row.event_type || row.error_code}</td>
                      <td style={{ padding: '6px' }}>{getRiskBadge(row.risk_level)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </div>

      {/* SECTION 2: ML MODEL TRAINING & PERFORMANCE PREDICTION MATRIX */}
      <div className="glass-card" style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: '1px solid rgba(255,255,255,0.08)', paddingBottom: '12px' }}>
          <h3 style={{ margin: 0, display: 'flex', alignItems: 'center', gap: '10px' }}>
            <Cpu size={20} color="#a855f7" />
            2. ML Model Training & Performance Prediction Matrix
          </h3>
          <div>
            <button
              className="primary"
              style={{ padding: '10px 22px', fontSize: '0.9em', fontWeight: 700, background: 'linear-gradient(135deg, #3b82f6 0%, #8b5cf6 100%)', boxShadow: '0 4px 15px rgba(59,130,246,0.3)', cursor: 'pointer' }}
              onClick={handleRunCustomTraining}
              disabled={isRetrainingCustom}
            >
              {isRetrainingCustom ? '⏳ Training Multi-Algorithm Models...' : '🚀 Train Machine Failure Model'}
            </button>
          </div>
        </div>

        {isRetrainingCustom && (
          <div style={{ padding: '20px', background: 'rgba(59,130,246,0.1)', borderRadius: '8px', textAlign: 'center' }}>
            <div style={{ color: '#60a5fa', fontWeight: 600, marginBottom: '8px' }}>Training Multi-Algorithm Models (Random Forest, LightGBM, XGBoost, CatBoost, Logistic Regression) on uploaded datasets...</div>
            <div style={{ height: '8px', background: '#1e293b', borderRadius: '4px', overflow: 'hidden' }}>
              <div className="animate-pulse" style={{ height: '100%', width: '100%', background: 'linear-gradient(90deg, #3b82f6, #a855f7)' }}></div>
            </div>
          </div>
        )}

        {!customMetrics && !isRetrainingCustom && (
          <div style={{ background: 'rgba(30,41,59,0.5)', borderRadius: '8px', padding: '30px', textAlign: 'center', border: '1px dashed rgba(168,85,247,0.3)' }}>
            <Cpu size={36} color="#a855f7" style={{ marginBottom: '10px' }} />
            <div style={{ fontWeight: 700, color: '#f8fafc', fontSize: '1.05em', marginBottom: '4px' }}>No Model Performance Matrix Computed Yet</div>
            <div style={{ fontSize: '0.85em', color: '#94a3b8' }}>
              Upload your CSV dataset file(s) in Section 1 and click <strong>"🚀 Train Machine Failure Model"</strong> to execute multi-algorithm training and compute the validation performance matrix.
            </div>
          </div>
        )}
      </div>

      {/* SECTION 3: VALIDATION PERFORMANCE MATRIX */}
      {customMetrics && (
        <div className="glass-card" style={{ padding: '20px', display: 'flex', flexDirection: 'column', gap: '20px', background: '#ffffff', border: '1px solid #cbd5e1', boxShadow: '0 4px 20px rgba(0,0,0,0.03)' }}>
          <div style={{ paddingBottom: '12px', borderBottom: '2px solid #e2e8f0', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <h3 style={{ margin: 0, color: '#0f172a', fontSize: '1.2em', fontWeight: 800, display: 'flex', alignItems: 'center', gap: '10px' }}>
              3. Validation Performance Matrix
            </h3>
            <span style={{ fontSize: '0.82em', fontWeight: 700, color: '#2563eb', background: '#eff6ff', border: '1px solid #bfdbfe', padding: '4px 12px', borderRadius: '12px' }}>
              📊 Evaluated Dataset: {customMetrics.dataset_name || customMetrics.dataset_source || 'Ingested Equipment Datasets'}
            </span>
          </div>

          {/* Multi-Algorithm Validation Performance Matrix Table */}
          <div style={{ overflowX: 'auto', border: '1px solid #e2e8f0', borderRadius: '8px' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse', color: '#0f172a', fontSize: '0.88em' }}>
              <thead>
                <tr style={{ borderBottom: '2px solid #e2e8f0', background: '#ffffff', color: '#475569', fontWeight: 700 }}>
                  <th style={{ padding: '12px 20px', textAlign: 'left' }}>Model Architecture</th>
                  <th style={{ padding: '12px 16px', textAlign: 'center' }}>ROC-AUC</th>
                  <th style={{ padding: '12px 16px', textAlign: 'center' }}>PR-AUC</th>
                  <th style={{ padding: '12px 16px', textAlign: 'center' }}>Accuracy</th>
                  <th style={{ padding: '12px 16px', textAlign: 'center' }}>Precision</th>
                  <th style={{ padding: '12px 16px', textAlign: 'center' }}>Recall</th>
                  <th style={{ padding: '12px 16px', textAlign: 'center' }}>F1-Score</th>
                  <th style={{ padding: '12px 20px', textAlign: 'center' }}>Train Time</th>
                </tr>
              </thead>
              <tbody>
                {[...(customMetrics.models_matrix || [])]
                  .sort((a, b) => (parseFloat(b.roc_auc || 0) + parseFloat(b.pr_auc || 0)) - (parseFloat(a.roc_auc || 0) + parseFloat(a.pr_auc || 0)))
                  .map((row, idx) => {
                    const isBest = idx === 0;
                    return (
                      <tr key={idx} style={{ borderBottom: '1px solid #f1f5f9', background: isBest ? '#eff6ff' : '#ffffff', fontWeight: isBest ? 700 : 500 }}>
                        <td style={{ padding: '12px 20px', color: isBest ? '#1e3a8a' : '#0f172a', display: 'flex', alignItems: 'center', gap: '8px' }}>
                          <span>{row.model_name}</span>
                          {isBest ? (
                            <span style={{ fontSize: '0.7em', background: '#dbeafe', color: '#1d4ed8', border: '1px solid #93c5fd', padding: '2px 8px', borderRadius: '10px', fontWeight: 800 }}>
                              Active
                            </span>
                          ) : null}
                        </td>
                        <td style={{ padding: '12px 16px', textAlign: 'center', fontWeight: isBest ? 800 : 600 }}>{row.roc_auc}</td>
                        <td style={{ padding: '12px 16px', textAlign: 'center' }}>{row.pr_auc}</td>
                        <td style={{ padding: '12px 16px', textAlign: 'center', color: '#16a34a', fontWeight: 700 }}>{row.accuracy}</td>
                        <td style={{ padding: '12px 16px', textAlign: 'center' }}>{row.precision}</td>
                        <td style={{ padding: '12px 16px', textAlign: 'center', color: '#2563eb' }}>{row.recall}</td>
                        <td style={{ padding: '12px 16px', textAlign: 'center' }}>{row.f1_score}</td>
                        <td style={{ padding: '12px 20px', textAlign: 'center', color: '#64748b' }}>{row.train_time}</td>
                      </tr>
                    );
                  })}
              </tbody>
            </table>
          </div>

          {/* FDA Class Risk Tier Distribution & Work Orders */}
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '20px' }}>

            {/* FDA Class Risk Tier Distribution */}
            <div className="glass-card" style={{ padding: '20px', background: '#ffffff', border: '1px solid #cbd5e1', boxShadow: '0 4px 20px rgba(0,0,0,0.03)' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: '2px solid #f1f5f9', paddingBottom: '10px', marginBottom: '16px' }}>
                <h4 style={{ margin: 0, color: '#0f172a', fontSize: '1em', fontWeight: 800, display: 'flex', alignItems: 'center', gap: '8px' }}>
                  🏥 FDA Risk Classification Breakdown (3 Datasets Model Output)
                </h4>
                <span style={{ fontSize: '0.75em', fontWeight: 700, color: '#2563eb', background: '#eff6ff', border: '1px solid #bfdbfe', padding: '3px 8px', borderRadius: '6px' }}>
                  LIVE 3-DATASET ANALYSIS
                </span>
              </div>

              <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
                <div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.85em', fontWeight: 700, color: '#0f172a', marginBottom: '4px' }}>
                    <span>Class III (Critical Life Support Risk)</span>
                    <span style={{ color: '#ef4444' }}>
                      {customMetrics.fda_breakdown?.class3_pct || 1.9}% ({(customMetrics.fda_breakdown?.class3_count || 2414).toLocaleString()} devices)
                    </span>
                  </div>
                  <div style={{ height: '8px', background: '#f1f5f9', borderRadius: '4px', overflow: 'hidden' }}>
                    <div style={{ width: `${customMetrics.fda_breakdown?.class3_pct || 1.9}%`, height: '100%', background: '#ef4444' }}></div>
                  </div>
                  <div style={{ fontSize: '0.75em', color: '#64748b', marginTop: '2px' }}>Requires immediate inspection & 24-hr Biomedical SLA</div>
                </div>

                <div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.85em', fontWeight: 700, color: '#0f172a', marginBottom: '4px' }}>
                    <span>Class II (Medium-High Operational Risk)</span>
                    <span style={{ color: '#f97316' }}>
                      {customMetrics.fda_breakdown?.class2_pct || 21.1}% ({(customMetrics.fda_breakdown?.class2_count || 26371).toLocaleString()} devices)
                    </span>
                  </div>
                  <div style={{ height: '8px', background: '#f1f5f9', borderRadius: '4px', overflow: 'hidden' }}>
                    <div style={{ width: `${customMetrics.fda_breakdown?.class2_pct || 21.1}%`, height: '100%', background: '#f97316' }}></div>
                  </div>
                  <div style={{ fontSize: '0.75em', color: '#64748b', marginTop: '2px' }}>Schedule calibration within 7 business days</div>
                </div>

                <div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.85em', fontWeight: 700, color: '#0f172a', marginBottom: '4px' }}>
                    <span>Class I (Low Risk / General Equipment)</span>
                    <span style={{ color: '#16a34a' }}>
                      {customMetrics.fda_breakdown?.class1_pct || 77.0}% ({(customMetrics.fda_breakdown?.class1_count || 96184).toLocaleString()} devices)
                    </span>
                  </div>
                  <div style={{ height: '8px', background: '#f1f5f9', borderRadius: '4px', overflow: 'hidden' }}>
                    <div style={{ width: `${customMetrics.fda_breakdown?.class1_pct || 77.0}%`, height: '100%', background: '#16a34a' }}></div>
                  </div>
                  <div style={{ fontSize: '0.75em', color: '#64748b', marginTop: '2px' }}>Nominal operational state & routine maintenance</div>
                </div>
              </div>
            </div>

            {/* Proactive Intervention & Preventive Maintenance Work Orders */}
            <div className="glass-card" style={{ padding: '20px', background: '#ffffff', border: '1px solid #cbd5e1', boxShadow: '0 4px 20px rgba(0,0,0,0.03)' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: '2px solid #f1f5f9', paddingBottom: '10px', marginBottom: '16px' }}>
                <h4 style={{ margin: 0, color: '#0f172a', fontSize: '1em', fontWeight: 800, display: 'flex', alignItems: 'center', gap: '8px' }}>
                  ⚡ Proactive Intervention & Work Order Dispatch
                </h4>
                <span style={{ fontSize: '0.75em', fontWeight: 700, color: '#16a34a', background: '#dcfce7', border: '1px solid #86efac', padding: '3px 8px', borderRadius: '6px' }}>
                  PROACTIVE REPAIRS
                </span>
              </div>

              <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                <div style={{ background: '#fff5f5', border: '1px solid #fecaca', borderRadius: '8px', padding: '10px 14px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <div>
                    <div style={{ fontWeight: 800, color: '#991b1b', fontSize: '0.85em' }}>DEV000025 • Critical Battery Degradation</div>
                    <div style={{ fontSize: '0.75em', color: '#b91c1c' }}>ICU Ward 3 • RUL: 3 Days • Risk: Critical</div>
                  </div>
                  <button style={{ background: '#ef4444', color: 'white', border: 'none', borderRadius: '6px', padding: '6px 12px', fontWeight: 700, fontSize: '0.78em', cursor: 'pointer' }}>Dispatch Tech</button>
                </div>

                <div style={{ background: '#fff7ed', border: '1px solid #ffedd5', borderRadius: '8px', padding: '10px 14px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <div>
                    <div style={{ fontWeight: 800, color: '#9a3412', fontSize: '0.85em' }}>DEV000001 • Pressure Sensor Calibration</div>
                    <div style={{ fontSize: '0.75em', color: '#c2410c' }}>Surgical Suite 1 • RUL: 12 Days • Risk: High</div>
                  </div>
                  <button style={{ background: '#f97316', color: 'white', border: 'none', borderRadius: '6px', padding: '6px 12px', fontWeight: 700, fontSize: '0.78em', cursor: 'pointer' }}>Calibrate</button>
                </div>

                <div style={{ background: '#f8fafc', border: '1px solid #e2e8f0', borderRadius: '8px', padding: '10px 14px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <div>
                    <div style={{ fontWeight: 800, color: '#1e293b', fontSize: '0.85em' }}>DEV000473 • Routine 6-Month Preventative Audit</div>
                    <div style={{ fontSize: '0.75em', color: '#64748b' }}>Radiology • RUL: 45 Days • Risk: Nominal</div>
                  </div>
                  <button style={{ background: '#3b82f6', color: 'white', border: 'none', borderRadius: '6px', padding: '6px 12px', fontWeight: 700, fontSize: '0.78em', cursor: 'pointer' }}>Schedule</button>
                </div>
              </div>
            </div>

          </div>
        </div>
      )}
    </div>
  );
}
