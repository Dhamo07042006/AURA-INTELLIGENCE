import React from 'react';

export default function ModelBenchmarks({
  modelMetadata, trainingStatus, triggerModelRetrain, selectedBenchmarkModel, setSelectedBenchmarkModel
}) {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '25px' }}>
      <style>{`
        @keyframes flashAlert {
          0%, 100% { background-color: rgba(239, 68, 68, 0.08); border-color: rgba(239, 68, 68, 0.35); }
          50% { background-color: rgba(239, 68, 68, 0.25); border-color: rgba(239, 68, 68, 0.85); box-shadow: 0 0 15px rgba(239, 68, 68, 0.3); }
        }
        .flash-alert-banner {
          animation: flashAlert 1.5s infinite;
        }
      `}</style>

      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <div>
          <h1 style={{ margin: 0, fontSize: '2em', color: 'var(--text-primary)' }}>Model Performance & Benchmarking</h1>
          <p style={{ margin: '5px 0 0 0', color: 'var(--text-muted)' }}>Comparative analysis of ML architectures & pipeline training status</p>
        </div>
        <span className="badge badge-low" style={{ fontSize: '0.85em' }}>
          Active Model: {modelMetadata?.selected_model || 'Logistic Regression'}
        </span>
      </div>

      {/* MLOps Training & Pipeline Status */}
      <div className="glass-card" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: '20px', flexWrap: 'wrap' }}>
        <div style={{ flex: 1, minWidth: '280px', display: 'flex', flexDirection: 'column', gap: '8px' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <span style={{ fontSize: '0.9em', color: 'var(--text-secondary)', fontWeight: 600 }}>ML Pipeline Retraining Status</span>
            <span style={{ fontSize: '0.8em', color: trainingStatus.is_training ? '#4f46e5' : '#059669', fontWeight: 'bold' }}>
              {trainingStatus.is_training ? '⏳ ' + trainingStatus.status : '🟢 IDLE (Ready)'}
            </span>
          </div>

          {/* Progress bar */}
          <div style={{ height: '8px', background: 'var(--border-light)', borderRadius: '4px', overflow: 'hidden', position: 'relative' }}>
            <div
              style={{
                width: `${trainingStatus.is_training ? trainingStatus.progress : 100}%`,
                background: trainingStatus.is_training ? 'linear-gradient(90deg, #3b82f6, #60a5fa)' : '#10b981',
                height: '100%',
                transition: 'width 0.5s ease-in-out'
              }}
            />
          </div>

          <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.75em', color: 'var(--text-muted)' }}>
            <span>Last training run: {trainingStatus.last_completed || modelMetadata?.training_date || 'N/A'}</span>
            {trainingStatus.is_training && <span>{trainingStatus.progress}% Complete</span>}
          </div>
        </div>

        <button
          className="primary"
          onClick={triggerModelRetrain}
          disabled={trainingStatus.is_training}
          style={{ padding: '12px 24px', background: trainingStatus.is_training ? '#f1f5f9' : 'var(--btn-primary-bg)', color: trainingStatus.is_training ? 'var(--text-muted)' : 'var(--btn-primary-color)', cursor: trainingStatus.is_training ? 'not-allowed' : 'pointer' }}
        >
          🔄 {trainingStatus.is_training ? 'Training...' : 'Retrain ML Pipeline'}
        </button>
      </div>

      {/* End-User Centric Replacements: Clinical SLA & Maintenance Dispatcher */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '25px' }}>

        {/* Clinical Fleet Risk & SLA Compliance Card */}
        <div className="glass-card" style={{ display: 'flex', flexDirection: 'column', gap: '16px', background: '#ffffff', border: '1px solid #cbd5e1', boxShadow: '0 4px 20px rgba(0,0,0,0.03)' }}>
          <div style={{ borderBottom: '2px solid #f1f5f9', paddingBottom: '12px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <div>
              <h3 style={{ margin: 0, color: '#0f172a', fontSize: '1.05em', fontWeight: 800, display: 'flex', alignItems: 'center', gap: '8px' }}>
                🏥 Clinical Fleet Risk & SLA Compliance
              </h3>
              <span style={{ fontSize: '0.8em', color: '#64748b' }}>Real-time hospital compliance status & uptime guarantees</span>
            </div>
            <span style={{ fontSize: '0.75em', fontWeight: 800, color: '#16a34a', background: '#dcfce7', border: '1px solid #86efac', padding: '3px 10px', borderRadius: '6px' }}>
              SLA: 99.9% ONLINE
            </span>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
            <div style={{ background: '#f8fafc', border: '1px solid #e2e8f0', borderRadius: '8px', padding: '14px', textAlign: 'center' }}>
              <div style={{ fontSize: '0.75em', color: '#64748b', fontWeight: 700 }}>FLEET SAFETY COMPLIANCE</div>
              <div style={{ fontSize: '1.6em', fontWeight: 800, color: '#16a34a', margin: '3px 0' }}>99.4%</div>
              <div style={{ fontSize: '0.7em', color: '#64748b' }}>Regulatory Standards Met</div>
            </div>

            <div style={{ background: '#f8fafc', border: '1px solid #e2e8f0', borderRadius: '8px', padding: '14px', textAlign: 'center' }}>
              <div style={{ fontSize: '0.75em', color: '#64748b', fontWeight: 700 }}>SLA UPTIME TARGET</div>
              <div style={{ fontSize: '1.6em', fontWeight: 800, color: '#2563eb', margin: '3px 0' }}>99.9%</div>
              <div style={{ fontSize: '0.7em', color: '#64748b' }}>Hospital Service Guarantee</div>
            </div>

            <div style={{ background: '#f8fafc', border: '1px solid #e2e8f0', borderRadius: '8px', padding: '14px', textAlign: 'center' }}>
              <div style={{ fontSize: '0.75em', color: '#64748b', fontWeight: 700 }}>CRITICAL PROTOCOL BREACHES</div>
              <div style={{ fontSize: '1.6em', fontWeight: 800, color: '#059669', margin: '3px 0' }}>0</div>
              <div style={{ fontSize: '0.7em', color: '#64748b' }}>Zero Active Safety Alerts</div>
            </div>

            <div style={{ background: '#f8fafc', border: '1px solid #e2e8f0', borderRadius: '8px', padding: '14px', textAlign: 'center' }}>
              <div style={{ fontSize: '0.75em', color: '#64748b', fontWeight: 700 }}>MEAN TIME BETWEEN FAILURES</div>
              <div style={{ fontSize: '1.6em', fontWeight: 800, color: '#7c3aed', margin: '3px 0' }}>1,480 hrs</div>
              <div style={{ fontSize: '0.7em', color: '#64748b' }}>Average MTBF Rating</div>
            </div>
          </div>

          <div style={{ background: '#eff6ff', border: '1px solid #bfdbfe', borderRadius: '8px', padding: '10px 14px', fontSize: '0.82em', color: '#1e40af', fontWeight: 600, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <span>🏥 Biomedical Readiness Status:</span>
            <span style={{ color: '#15803d', fontWeight: 800 }}>🟢 All 6 Wards Operational</span>
          </div>
        </div>

        {/* Automated Maintenance Work Order Dispatcher */}
        <div className="glass-card" style={{ display: 'flex', flexDirection: 'column', gap: '16px', background: '#ffffff', border: '1px solid #cbd5e1', boxShadow: '0 4px 20px rgba(0,0,0,0.03)' }}>
          <div style={{ borderBottom: '2px solid #f1f5f9', paddingBottom: '12px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <div>
              <h3 style={{ margin: 0, color: '#0f172a', fontSize: '1.05em', fontWeight: 800, display: 'flex', alignItems: 'center', gap: '8px' }}>
                ⚡ Automated Maintenance Work Orders
              </h3>
              <span style={{ fontSize: '0.8em', color: '#64748b' }}>Prioritized auto-dispatches for biomedical engineering staff</span>
            </div>
            <span style={{ fontSize: '0.75em', fontWeight: 800, color: '#2563eb', background: '#eff6ff', border: '1px solid #bfdbfe', padding: '3px 10px', borderRadius: '6px' }}>
              AUTO-DISPATCH
            </span>
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '10px', fontSize: '0.85em' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', background: '#fff5f5', border: '1px solid #fecaca', padding: '10px 14px', borderRadius: '8px' }}>
              <div>
                <strong style={{ color: '#0f172a' }}>DEV000025 (Defibrillator)</strong>
                <div style={{ fontSize: '0.78em', color: '#991b1b' }}>ICU • Battery Health: 12.8%</div>
              </div>
              <span style={{ fontSize: '0.78em', fontWeight: 800, color: '#dc2626', background: '#fee2e2', padding: '3px 8px', borderRadius: '4px' }}>
                🚨 Critical Service Needed
              </span>
            </div>

            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', background: '#fffbe6', border: '1px solid #ffe58f', padding: '10px 14px', borderRadius: '8px' }}>
              <div>
                <strong style={{ color: '#0f172a' }}>DEV000001 (Syringe Pump)</strong>
                <div style={{ fontSize: '0.78em', color: '#854d0e' }}>General Ward • Sensor Calibration Overdue</div>
              </div>
              <span style={{ fontSize: '0.78em', fontWeight: 800, color: '#d97706', background: '#fef3c7', padding: '3px 8px', borderRadius: '4px' }}>
                ⚠️ Calibration Priority
              </span>
            </div>

            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', background: '#f0fdf4', border: '1px solid #bbf7d0', padding: '10px 14px', borderRadius: '8px' }}>
              <div>
                <strong style={{ color: '#0f172a' }}>DEV000473 (Ultrasound Machine)</strong>
                <div style={{ fontSize: '0.78em', color: '#166534' }}>Radiology • Routine 90-Day Inspection</div>
              </div>
              <span style={{ fontSize: '0.78em', fontWeight: 800, color: '#16a34a', background: '#dcfce7', padding: '3px 8px', borderRadius: '4px' }}>
                ✔ Scheduled Inspection
              </span>
            </div>

            <button
              className="primary"
              style={{ padding: '12px', fontSize: '0.85em', fontWeight: 700, background: 'linear-gradient(135deg, #10b981 0%, #059669 100%)', marginTop: '4px' }}
              onClick={() => alert("Biomedical Work Orders automatically dispatched to engineering team!")}
            >
              📋 Dispatch Work Orders to Biomedical Team
            </button>
          </div>
        </div>

      </div>

      {/* Validation Performance Matrix Table */}
      <div className="glass-card">
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '15px' }}>
          <h3 style={{ margin: 0, color: 'var(--text-primary)' }}>Validation Performance Matrix</h3>
          <span style={{ fontSize: '0.78em', fontWeight: 700, color: '#2563eb', background: '#eff6ff', border: '1px solid #bfdbfe', padding: '4px 10px', borderRadius: '8px' }}>
            📊 Evaluated Dataset: {modelMetadata?.dataset_version || 'Baseline 8 Datasets Benchmark'}
          </span>
        </div>
        <table style={{ width: '100%', borderCollapse: 'collapse', marginTop: 0 }}>
          <thead>
            <tr style={{ borderBottom: '1px solid var(--border-color)', color: 'var(--text-primary)' }}>
              <th style={{ padding: '12px 18px', textAlign: 'left' }}>Model Architecture</th>
              <th>ROC-AUC</th>
              <th>PR-AUC</th>
              <th>Accuracy</th>
              <th>Precision</th>
              <th>Recall</th>
              <th>F1-Score</th>
              <th>Train Time</th>
            </tr>
          </thead>
          <tbody>
            {(modelMetadata?.metrics_summary || [
              { Model: 'Logistic Regression', 'ROC-AUC': 0.8773, 'PR-AUC': 0.7441, Accuracy: 0.8223, Precision: 0.699, Recall: 0.9597, 'F1-Score': 0.8089, Train_Time_Sec: 1.05 },
              { Model: 'CatBoost', 'ROC-AUC': 0.8755, 'PR-AUC': 0.7383, Accuracy: 0.8306, Precision: 0.7054, Recall: 0.9751, 'F1-Score': 0.8186, Train_Time_Sec: 6.35 },
              { Model: 'LightGBM', 'ROC-AUC': 0.8721, 'PR-AUC': 0.7249, Accuracy: 0.8292, Precision: 0.7048, Recall: 0.9707, 'F1-Score': 0.8166, Train_Time_Sec: 0.41 },
              { Model: 'XGBoost', 'ROC-AUC': 0.8672, 'PR-AUC': 0.7129, Accuracy: 0.8237, Precision: 0.7011, Recall: 0.959, 'F1-Score': 0.81, Train_Time_Sec: 0.5 },
              { Model: 'Random Forest', 'ROC-AUC': 0.8639, 'PR-AUC': 0.7064, Accuracy: 0.8231, Precision: 0.6983, Recall: 0.9663, 'F1-Score': 0.8107, Train_Time_Sec: 0.53 }
            ]).map((item) => (
              <tr
                key={item.Model}
                style={{
                  borderBottom: '1px solid var(--border-light)',
                  background: selectedBenchmarkModel === item.Model ? 'var(--active-tab-bg)' : 'transparent',
                  fontWeight: selectedBenchmarkModel === item.Model ? 600 : 400,
                  cursor: 'pointer',
                  color: 'var(--text-primary)'
                }}
                onClick={() => setSelectedBenchmarkModel(item.Model)}
              >
                <td style={{ padding: '12px 18px', display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <span>{item.Model}</span>
                  {item.Model === modelMetadata?.selected_model && (
                    <span style={{ fontSize: '0.72em', background: 'var(--active-tab-bg)', color: 'var(--active-tab-color)', padding: '2px 6px', borderRadius: '4px', fontWeight: 600 }}>Active</span>
                  )}
                </td>
                <td style={{ textAlign: 'center' }}>{item['ROC-AUC']?.toFixed(4)}</td>
                <td style={{ textAlign: 'center' }}>{item['PR-AUC']?.toFixed(4)}</td>
                <td style={{ textAlign: 'center' }}>{typeof item.Accuracy === 'number' ? (item.Accuracy * 100).toFixed(1) + '%' : item.Accuracy}</td>
                <td style={{ textAlign: 'center' }}>{item.Precision?.toFixed(4)}</td>
                <td style={{ textAlign: 'center' }}>{item.Recall?.toFixed(4)}</td>
                <td style={{ textAlign: 'center' }}>{item['F1-Score']?.toFixed(4) || item.F1?.toFixed(4)}</td>
                <td style={{ textAlign: 'center' }}>{item.Train_Time_Sec || item.train_time || '—'}s</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Model Features list */}
      {modelMetadata?.features_list && (
        <div className="glass-card">
          <h3 style={{ margin: '0 0 12px 0', color: 'var(--text-primary)' }}>Training Features Store Schema ({modelMetadata.features_list.length} total features)</h3>
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px', maxHeight: '180px', overflowY: 'auto', paddingRight: '4px' }}>
            {modelMetadata.features_list.map((feat) => (
              <span
                key={feat}
                style={{ fontSize: '0.76em', background: '#f8fafc', border: '1px solid var(--border-color)', color: 'var(--text-secondary)', padding: '4px 10px', borderRadius: '15px', fontWeight: 500 }}
              >
                {feat}
              </span>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
