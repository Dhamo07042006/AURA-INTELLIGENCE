import React from 'react';
import { Database, Upload, Trash2 } from 'lucide-react';

export default function DatasetUpload({
  handleUploadDataset, uploadProgress, uploadedDatasets, selectedDataset, setSelectedDataset,
  columnMappings, setColumnMappings, setValidationReport, handleDeleteDataset, columnMappingsState,
  handleValidateDataset, validating, handleTrainUploadedDataset, isRetrainingUploaded, validationReport
}) {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
      <div>
        <h1 style={{ margin: 0, fontSize: '2em' }}>Dataset Upload & Integration</h1>
        <p style={{ margin: '5px 0 0 0', color: '#94a3b8' }}>Upload raw medical device logs CSV/Parquet and align telemetry schemas with AURA ML features.</p>
      </div>

      {/* Required Dataset Metrics Banner */}
      <div className="glass-card" style={{ border: '1px solid rgba(99,102,241,0.3)', background: 'linear-gradient(135deg, rgba(15,23,42,0.9) 0%, rgba(30,41,59,0.8) 100%)', borderRadius: '12px', padding: '18px 22px', display: 'flex', flexDirection: 'column', gap: '14px' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: '1px solid rgba(255,255,255,0.08)', paddingBottom: '10px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            <Database size={20} color="#6366f1" />
            <h3 style={{ margin: 0, color: '#f8fafc', fontSize: '1.05em' }}>📋 Required Dataset Columns & Telemetry Metrics for ML Model Retraining</h3>
          </div>
          <span style={{ fontSize: '0.75em', background: 'rgba(16,185,129,0.15)', color: '#34d399', padding: '4px 10px', borderRadius: '20px', fontWeight: 600, border: '1px solid #10b981' }}>
            ✓ Automatic Schema Mapper Enabled
          </span>
        </div>

        <div style={{ fontSize: '0.83em', color: '#94a3b8', lineHeight: '1.5' }}>
          To retrain AURA machine learning models and predict reliability scores on your hospital's internal equipment data, your uploaded CSV/Parquet dataset should include the following metrics:
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '12px' }}>
          {/* Identifier Columns */}
          <div style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.06)', borderRadius: '8px', padding: '12px' }}>
            <div style={{ fontWeight: 700, color: '#60a5fa', fontSize: '0.85em', marginBottom: '6px' }}>🔑 1. Device Identifiers</div>
            <ul style={{ margin: 0, paddingLeft: '16px', color: '#cbd5e1', fontSize: '0.8em', display: 'flex', flexDirection: 'column', gap: '3px' }}>
              <li><code>device_id</code> / <code>equipment_id</code></li>
              <li><code>device_type</code> (e.g. Ventilator)</li>
              <li><code>department</code> (e.g. ICU, Radiology)</li>
            </ul>
          </div>

          {/* Telemetry Sensor Signals */}
          <div style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.06)', borderRadius: '8px', padding: '12px' }}>
            <div style={{ fontWeight: 700, color: '#f59e0b', fontSize: '0.85em', marginBottom: '6px' }}>⚡ 2. Telemetry & Sensor Signals</div>
            <ul style={{ margin: 0, paddingLeft: '16px', color: '#cbd5e1', fontSize: '0.8em', display: 'flex', flexDirection: 'column', gap: '3px' }}>
              <li><code>operating_hours</code></li>
              <li><code>temperature_c</code> / <code>voltage_v</code></li>
              <li><code>vibration_amplitude</code></li>
              <li><code>error_code</code> / <code>battery_level</code></li>
            </ul>
          </div>

          {/* Target Ground-Truth Labels */}
          <div style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.06)', borderRadius: '8px', padding: '12px' }}>
            <div style={{ fontWeight: 700, color: '#ef4444', fontSize: '0.85em', marginBottom: '6px' }}>🎯 3. Target Failure Label</div>
            <ul style={{ margin: 0, paddingLeft: '16px', color: '#cbd5e1', fontSize: '0.8em', display: 'flex', flexDirection: 'column', gap: '3px' }}>
              <li><code>machine_failure</code> (0 = Normal, 1 = Fail)</li>
              <li><code>risk_level</code> (Low, Medium, Critical)</li>
              <li><code>root_cause</code> / <code>failure_mode</code></li>
            </ul>
          </div>
        </div>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1.4fr', gap: '20px' }}>
        <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
          {/* File Upload Box */}
          <div className="glass-card" style={{ border: '2px dashed rgba(99,102,241,0.35)', borderRadius: '12px', padding: '30px', textAlign: 'center', background: 'rgba(99,102,241,0.03)', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '12px' }}>
            <Upload size={36} color="#6366f1" />
            <div>
              <div style={{ fontWeight: 600, fontSize: '1.05em' }}>Drop Hospital Telemetry Dataset</div>
              <div style={{ fontSize: '0.8em', color: '#64748b', marginTop: '4px' }}>Supports .csv, .xlsx, .json, .parquet (Max 50MB)</div>
            </div>
            <input type="file" id="datasetFile" style={{ display: 'none' }} accept=".csv,.xlsx,.xls,.json,.parquet" onChange={handleUploadDataset} />
            <button className="primary" onClick={() => { document.getElementById('datasetFile').value = ''; document.getElementById('datasetFile').click(); }}>
              Select &amp; Upload Dataset
            </button>
            {uploadProgress && (
              <div style={{
                fontSize: '0.85em', padding: '8px 14px', borderRadius: '6px', width: '100%',
                background: uploadProgress.includes('successfully') ? 'rgba(16,185,129,0.15)' : uploadProgress.includes('Error') ? 'rgba(239,68,68,0.15)' : 'rgba(99,102,241,0.15)',
                color: uploadProgress.includes('successfully') ? '#10b981' : uploadProgress.includes('Error') ? '#ef4444' : '#6366f1'
              }}>{uploadProgress}</div>
            )}
          </div>

          {/* Uploaded Datasets Registry */}
          <div className="glass-card" style={{ padding: 0, overflow: 'hidden' }}>
            <div style={{ padding: '14px 18px', borderBottom: '1px solid rgba(255,255,255,0.05)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <h3 style={{ margin: 0, fontSize: '1em' }}>📊 Dataset Registry</h3>
              <span style={{ fontSize: '0.8em', color: '#64748b' }}>{uploadedDatasets.length} uploaded</span>
            </div>
            {uploadedDatasets.length === 0 ? (
              <div style={{ padding: '30px', textAlign: 'center', color: '#64748b', fontSize: '0.9em' }}>
                No datasets uploaded yet.<br />Upload a telemetry CSV to begin mapping.
              </div>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column' }}>
                {uploadedDatasets.map(ds => (
                  <div key={ds.dataset_id}
                    style={{
                      padding: '12px 18px', borderBottom: '1px solid rgba(255,255,255,0.03)',
                      display: 'flex', justifyContent: 'space-between', alignItems: 'center', cursor: 'pointer',
                      background: selectedDataset?.dataset_id === ds.dataset_id ? 'rgba(99,102,241,0.12)' : 'transparent'
                    }}
                    onClick={() => { setSelectedDataset(ds); setColumnMappings(ds.column_mapping || {}); setValidationReport(null); }}
                  >
                    <div>
                      <div style={{ fontWeight: 600, fontSize: '0.9em' }}>📊 {ds.filename}</div>
                      <div style={{ fontSize: '0.75em', color: '#64748b' }}>
                        {ds.row_count} rows • {ds.col_count} cols • {Math.round((ds.filesize || 0) / 1024)} KB
                      </div>
                    </div>
                    <button style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#ef4444' }} onClick={(e) => { e.stopPropagation(); handleDeleteDataset(ds.dataset_id); }}>
                      <Trash2 size={16} />
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Column Mapping & Validation Panel */}
        <div>
          {selectedDataset ? (
            <div className="glass-card" style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <h3 style={{ margin: 0 }}>⚙️ Schema Mapper: <span style={{ color: '#6366f1' }}>{selectedDataset.filename}</span></h3>
                <span style={{ fontSize: '0.75em', color: '#94a3b8', fontFamily: 'monospace' }}>{selectedDataset.dataset_id}</span>
              </div>

              {/* Quick Stats Grid */}
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '10px', fontSize: '0.85em', textAlign: 'center' }}>
                <div style={{ background: 'rgba(255,255,255,0.03)', padding: '10px', borderRadius: '6px' }}>
                  <div style={{ color: '#64748b', fontSize: '0.75em' }}>TOTAL ROWS</div>
                  <div style={{ fontWeight: 700, fontSize: '1.1em', marginTop: '2px' }}>{selectedDataset.row_count}</div>
                </div>
                <div style={{ background: 'rgba(255,255,255,0.03)', padding: '10px', borderRadius: '6px' }}>
                  <div style={{ color: '#64748b', fontSize: '0.75em' }}>DEVICES</div>
                  <div style={{ fontWeight: 700, fontSize: '1.1em', marginTop: '2px' }}>{selectedDataset.device_count || 'N/A'}</div>
                </div>
                <div style={{ background: 'rgba(255,255,255,0.03)', padding: '10px', borderRadius: '6px' }}>
                  <div style={{ color: '#64748b', fontSize: '0.75em' }}>MISSING %</div>
                  <div style={{ fontWeight: 700, fontSize: '1.1em', color: selectedDataset.missing_percent > 10 ? '#ef4444' : '#10b981', marginTop: '2px' }}>{selectedDataset.missing_percent}%</div>
                </div>
                <div style={{ background: 'rgba(255,255,255,0.03)', padding: '10px', borderRadius: '6px' }}>
                  <div style={{ color: '#64748b', fontSize: '0.75em' }}>DUPLICATES</div>
                  <div style={{ fontWeight: 700, fontSize: '1.1em', color: selectedDataset.duplicate_count > 0 ? '#f59e0b' : '#10b981', marginTop: '2px' }}>{selectedDataset.duplicate_count}</div>
                </div>
              </div>

              {/* Column Mapping Selects */}
              <div style={{ fontSize: '0.85em', color: '#94a3b8', marginTop: '4px' }}>Map source file columns to AURA ML Feature Store schemas:</div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', maxHeight: '220px', overflowY: 'auto', paddingRight: '4px' }}>
                {Object.keys(columnMappings).map(col => (
                  <div key={col} style={{ display: 'grid', gridTemplateColumns: '1.2fr 40px 1.5fr', alignItems: 'center', gap: '8px', background: 'rgba(255,255,255,0.02)', padding: '8px 12px', borderRadius: '6px', fontSize: '0.85em' }}>
                    <span style={{ fontWeight: 600, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }} title={col}>{col}</span>
                    <span style={{ textAlign: 'center', color: '#64748b' }}>➔</span>
                    <select
                      value={columnMappings[col]}
                      onChange={(e) => setColumnMappings({ ...columnMappings, [col]: e.target.value })}
                      style={{ background: 'rgba(15,23,42,0.8)', border: '1px solid rgba(255,255,255,0.1)', color: '#f8fafc', padding: '4px 8px', borderRadius: '4px', fontSize: '0.85em' }}
                    >
                      <option value="Ignore">🚫 Ignore Column</option>
                      <option value="Device_ID">🔑 Device_ID (Required)</option>
                      <option value="Snapshot_Date">📅 Snapshot_Date (Required)</option>
                      <option value="Device_Type">🏷️ Device_Type (Required)</option>
                      <option value="Approx_Battery_Health">🔋 Approx_Battery_Health</option>
                      <option value="Errors_Last_30_Days">⚠️ Errors_Last_30_Days</option>
                      <option value="Operating_Hours">⏱️ Operating_Hours</option>
                      <option value="Sensor_Temperature">🌡️ Sensor_Temperature</option>
                    </select>
                  </div>
                ))}
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px', marginTop: '4px' }}>
                <button className="primary" onClick={handleValidateDataset} disabled={validating} style={{ width: '100%', background: 'linear-gradient(135deg, #3b82f6 0%, #1d4ed8 100%)' }}>
                  {validating ? 'Evaluating Compatibility...' : '🔍 Validate Schema Compatibility'}
                </button>

                <button className="primary" onClick={handleTrainUploadedDataset} disabled={isRetrainingUploaded} style={{ width: '100%', background: 'linear-gradient(135deg, #10b981 0%, #059669 100%)' }}>
                  {isRetrainingUploaded ? '⏳ Retraining Model on CSV...' : '🚀 Train Model on Uploaded Dataset'}
                </button>
              </div>

              {/* Validation Results Card */}
              {validationReport && (
                <div style={{
                  background: validationReport.schema_compatibility === 'COMPATIBLE' ? 'rgba(16,185,129,0.1)' : 'rgba(245,158,11,0.1)',
                  border: `1px solid ${validationReport.schema_compatibility === 'COMPATIBLE' ? 'rgba(16,185,129,0.3)' : 'rgba(245,158,11,0.3)'}`,
                  padding: '16px', borderRadius: '8px', fontSize: '0.85em', display: 'flex', flexDirection: 'column', gap: '10px'
                }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <span style={{ fontWeight: 600 }}>Compatibility Rating:</span>
                    <span style={{
                      fontWeight: 700, padding: '3px 10px', borderRadius: '12px', fontSize: '0.85em',
                      background: validationReport.schema_compatibility === 'COMPATIBLE' ? 'rgba(16,185,129,0.2)' : 'rgba(245,158,11,0.2)',
                      color: validationReport.schema_compatibility === 'COMPATIBLE' ? '#10b981' : '#f59e0b'
                    }}>
                      {validationReport.schema_compatibility === 'COMPATIBLE' ? '✅ FULLY COMPATIBLE' : '⚠️ PARTIALLY COMPATIBLE'}
                    </span>
                  </div>

                  <div>Alignment Score: <strong>{validationReport.feature_compatibility_score}%</strong></div>
                  <div style={{ background: 'rgba(255,255,255,0.1)', borderRadius: '4px', height: '8px', overflow: 'hidden' }}>
                    <div style={{ width: `${validationReport.feature_compatibility_score}%`, background: validationReport.feature_compatibility_score >= 70 ? '#10b981' : '#f59e0b', height: '100%' }} />
                  </div>

                  {validationReport.missing_required_columns && validationReport.missing_required_columns.length > 0 && (
                    <div style={{ color: '#ef4444', fontSize: '0.8em' }}>
                      ❌ Missing Required Target Columns: <strong>{validationReport.missing_required_columns.join(', ')}</strong>
                    </div>
                  )}
                </div>
              )}
            </div>
          ) : (
            <div className="glass-card" style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', height: '350px', color: '#64748b', textAlign: 'center', gap: '10px' }}>
              <div style={{ fontSize: '2.5em' }}>📂</div>
              <div>Select a dataset from the Registry on the left to map columns and validate schema compatibility.</div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
