import React from 'react';
import { Activity } from 'lucide-react';

export default function LiveTelemetryLogs({
  isLiveLogsPaused, setIsLiveLogsPaused, liveLogs, liveFeedPage, setLiveFeedPage,
  getHealthColor, getRiskBadge, setSelectedDeviceId, setDeviceData, setActiveTab
}) {
  const pageSize = 10;
  const totalPages = Math.ceil(liveLogs.length / pageSize) || 1;
  const currentPage = Math.min(liveFeedPage, totalPages);
  const paginatedLogs = liveLogs.slice((currentPage - 1) * pageSize, currentPage * pageSize);

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
      <div>
        <h1 style={{ margin: 0, fontSize: '2em' }}>Live Telemetry Logs</h1>
        <p style={{ margin: '5px 0 0 0', color: '#94a3b8' }}>Real-time machine learning predictions & continuous hardware telemetry feed</p>
      </div>

      {/* Live ML Predictions — Full Width Telemetry Table */}
      <div className="glass-card" style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: '1px solid rgba(255,255,255,0.05)', paddingBottom: '12px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            <Activity size={20} color="#10b981" />
            <h3 style={{ margin: 0 }}>Live ML Predictions — Real-time Telemetry Feed</h3>
          </div>
          <div style={{ display: 'flex', gap: '10px', alignItems: 'center' }}>
            {/* Stream Pause / Stop Button */}
            <button
              style={{
                background: isLiveLogsPaused ? 'rgba(16,185,129,0.15)' : 'rgba(239,68,68,0.15)',
                border: `1px solid ${isLiveLogsPaused ? '#10b981' : '#ef4444'}`,
                color: isLiveLogsPaused ? '#34d399' : '#f87171',
                borderRadius: '6px',
                padding: '6px 14px',
                fontSize: '0.82em',
                fontWeight: 700,
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                gap: '6px'
              }}
              onClick={() => setIsLiveLogsPaused(!isLiveLogsPaused)}
            >
              {isLiveLogsPaused ? '▶ RESUME AUTOMATIC STREAM' : '⏹ STOP AUTOMATIC STREAM'}
            </button>

            <span style={{ fontSize: '0.78em', color: '#94a3b8' }}>
              {liveLogs.filter(l => l.risk_level === 'CRITICAL').length > 0 && (
                <span style={{ color: '#ef4444', fontWeight: 700, marginRight: '8px' }}>🔴 {liveLogs.filter(l => l.risk_level === 'CRITICAL').length} CRITICAL</span>
              )}
              {liveLogs.filter(l => l.risk_level === 'HIGH').length > 0 && (
                <span style={{ color: '#f97316', fontWeight: 700, marginRight: '8px' }}>🟠 {liveLogs.filter(l => l.risk_level === 'HIGH').length} HIGH</span>
              )}
              <span style={{ color: '#10b981' }}>🟢 {liveLogs.filter(l => l.risk_level === 'LOW').length} LOW</span>
            </span>
            <span style={{ fontSize: '0.8em', color: '#10b981', background: 'rgba(16,185,129,0.1)', padding: '4px 10px', borderRadius: '6px', fontWeight: 600 }}>
              ● {liveLogs.length} logs received
            </span>
          </div>
        </div>

        {/* Table with Pagination */}
        <div style={{ minHeight: '380px', overflowX: 'auto', fontSize: '0.85em' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse' }}>
            <thead>
              <tr style={{ borderBottom: '1px solid rgba(255,255,255,0.07)', color: '#64748b', fontSize: '0.82em', background: 'rgba(15,23,42,0.95)' }}>
                <th style={{ padding: '10px 8px', textAlign: 'left' }}>Time</th>
                <th style={{ padding: '10px 8px', textAlign: 'left' }}>Device ID</th>
                <th style={{ padding: '10px 8px', textAlign: 'left' }}>Type / Dept</th>
                <th style={{ padding: '10px 8px', textAlign: 'left' }}>Health</th>
                <th style={{ padding: '10px 8px', textAlign: 'left' }}>Risk</th>
                <th style={{ padding: '10px 8px', textAlign: 'left' }}>Anomaly</th>
                <th style={{ padding: '10px 8px', textAlign: 'left' }}>Root Cause (ML)</th>
                <th style={{ padding: '10px 8px', textAlign: 'left' }}>Action</th>
              </tr>
            </thead>
            <tbody>
              {paginatedLogs.map((log, i) => (
                <tr
                  key={log.log_id || i}
                  style={{
                    borderBottom: '1px solid rgba(255,255,255,0.03)',
                    background: log.risk_level === 'CRITICAL' ? 'rgba(239,68,68,0.05)' : log.risk_level === 'HIGH' ? 'rgba(249,115,22,0.04)' : 'transparent',
                    cursor: 'pointer'
                  }}
                  onClick={() => { setSelectedDeviceId(log.device_id); if (log._fullData) setDeviceData(log._fullData); setActiveTab('twin'); }}
                  title="Click to open Digital Twin"
                >
                  <td style={{ padding: '9px 8px', color: '#64748b', whiteSpace: 'nowrap' }}>{log.timestamp}</td>
                  <td style={{ padding: '9px 8px', fontWeight: 700, color: log.risk_level === 'CRITICAL' ? '#f87171' : '#818cf8' }}>{log.device_id}</td>
                  <td style={{ padding: '9px 8px' }}>
                    <div style={{ fontWeight: 600 }}>{log.device_type}</div>
                    <div style={{ fontSize: '0.8em', color: '#64748b' }}>{log.department}</div>
                  </td>
                  <td style={{ padding: '9px 8px', fontWeight: 700, color: getHealthColor(log.overall_health) }}>
                    {log.overall_health != null ? log.overall_health.toFixed(1) + '%' : '—'}
                  </td>
                  <td style={{ padding: '9px 8px' }}>{getRiskBadge(log.risk_level)}</td>
                  <td style={{ padding: '9px 8px' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                      <div style={{ width: '60px', height: '6px', borderRadius: '3px', background: '#1e293b', overflow: 'hidden' }}>
                        <div style={{ width: `${log.anomaly_score || 0}%`, height: '100%', background: (log.anomaly_score || 0) > 60 ? '#ef4444' : (log.anomaly_score || 0) > 35 ? '#f97316' : '#10b981' }}></div>
                      </div>
                      <span style={{ color: '#94a3b8', fontSize: '0.85em' }}>{log.anomaly_score != null ? log.anomaly_score.toFixed(0) : '—'}</span>
                    </div>
                  </td>
                  <td style={{ padding: '9px 8px', color: log.risk_level === 'CRITICAL' ? '#f87171' : log.risk_level === 'HIGH' ? '#fb923c' : '#94a3b8', fontWeight: log.risk_level === 'CRITICAL' ? 700 : 400 }}>
                    {log.root_cause || '—'}
                  </td>
                  <td style={{ padding: '9px 8px', color: log.risk_level === 'CRITICAL' || log.risk_level === 'HIGH' ? '#fbbf24' : '#10b981', maxWidth: '180px', fontSize: '0.82em' }}>
                    {log.risk_level === 'CRITICAL' ? '🚨 ' : log.risk_level === 'HIGH' ? '⚠️ ' : '✔ '}{log.recommended_action || 'Nominal'}
                    {log.rul_days && log.rul_days < 30 ? <span style={{ color: '#ef4444', fontWeight: 700, marginLeft: '4px' }}> [{log.rul_days}d]</span> : null}
                  </td>
                </tr>
              ))}
              {liveLogs.length === 0 && (
                <tr>
                  <td colSpan="8" style={{ padding: '40px', textAlign: 'center', color: '#64748b' }}>
                    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '10px' }}>
                      <Activity size={32} color="#334155" />
                      <div style={{ fontWeight: 600 }}>Listening for live telemetry logs...</div>
                      <div style={{ fontSize: '0.85em' }}>Start the LOGx telemetry generator or stream data to view live ML predictions here</div>
                    </div>
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>

        {/* Pagination Controls Bar */}
        {liveLogs.length > 0 && (
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', paddingTop: '12px', borderTop: '1px solid rgba(255,255,255,0.05)', fontSize: '0.82em' }}>
            <span style={{ color: '#94a3b8' }}>
              Showing {((currentPage - 1) * pageSize) + 1} to {Math.min(currentPage * pageSize, liveLogs.length)} of {liveLogs.length} logs
            </span>
            <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
              <button
                disabled={currentPage === 1}
                onClick={() => setLiveFeedPage(prev => Math.max(1, prev - 1))}
                style={{
                  padding: '5px 12px',
                  borderRadius: '6px',
                  border: '1px solid #334155',
                  background: currentPage === 1 ? 'rgba(30,41,59,0.3)' : '#1e293b',
                  color: currentPage === 1 ? '#64748b' : '#f8fafc',
                  cursor: currentPage === 1 ? 'not-allowed' : 'pointer',
                  fontWeight: 600
                }}
              >
                Previous
              </button>

              <span style={{ padding: '0 8px', fontWeight: 700, color: '#60a5fa' }}>
                Page {currentPage} of {totalPages}
              </span>

              <button
                disabled={currentPage >= totalPages}
                onClick={() => setLiveFeedPage(prev => Math.min(totalPages, prev + 1))}
                style={{
                  padding: '5px 12px',
                  borderRadius: '6px',
                  border: '1px solid #334155',
                  background: currentPage >= totalPages ? 'rgba(30,41,59,0.3)' : '#1e293b',
                  color: currentPage >= totalPages ? '#64748b' : '#f8fafc',
                  cursor: currentPage >= totalPages ? 'not-allowed' : 'pointer',
                  fontWeight: 600
                }}
              >
                Next
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
