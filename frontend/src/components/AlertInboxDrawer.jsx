import React from 'react';
import { ShieldAlert, CheckCircle, Eye } from 'lucide-react';

export default function AlertInboxDrawer({
  alertPanelOpen,
  setAlertPanelOpen,
  notificationInbox,
  setNotificationInbox,
  setAlerts,
  setDeviceData,
  setSelectedDeviceId,
  setActiveTab,
  fetchDeviceDetails
}) {
  const unresolvedCount = notificationInbox.filter(n => !n.resolved).length;

  return (
    <>
      {/* Persistent Alert Notification Inbox Panel */}
      <div style={{ position: 'fixed', top: 0, right: alertPanelOpen ? 0 : '-460px', width: '440px', height: '100vh', zIndex: 9999, background: 'var(--drawer-bg)', backdropFilter: 'blur(20px)', borderLeft: '1px solid rgba(239,68,68,0.3)', boxShadow: '-8px 0 40px rgba(0,0,0,0.06)', transition: 'right 0.35s cubic-bezier(0.4,0,0.2,1)', display: 'flex', flexDirection: 'column' }}>
        {/* Panel Header */}
        <div style={{ padding: '20px', borderBottom: '1px solid var(--border-light)', display: 'flex', justifyContent: 'space-between', alignItems: 'center', background: 'rgba(239,68,68,0.03)' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            <ShieldAlert size={20} color="#ef4444" />
            <div>
              <div style={{ fontWeight: 700, fontSize: '1em', color: 'var(--text-primary)' }}>Failure Alert Inbox</div>
              <div style={{ fontSize: '0.75em', color: 'var(--text-muted)' }}>{unresolvedCount} unresolved alerts</div>
            </div>
          </div>
          <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
            {unresolvedCount > 0 && (
              <button
                style={{ fontSize: '0.75em', color: 'var(--text-secondary)', background: 'none', border: '1px solid var(--border-color)', borderRadius: '4px', padding: '4px 10px', cursor: 'pointer' }}
                onClick={() => {
                  setNotificationInbox(prev => prev.map(n => ({ ...n, resolved: true })));
                  setAlerts(prev => prev.map(a => ({ ...a, status: 'acknowledged' })));
                }}
              >Resolve All</button>
            )}
            <button style={{ background: 'none', border: 'none', color: 'var(--text-muted)', cursor: 'pointer', fontSize: '1.2em', padding: '4px 8px' }} onClick={() => setAlertPanelOpen(false)}>✕</button>
          </div>
        </div>

        {/* Alert Cards List */}
        <div style={{ flex: 1, overflowY: 'auto', padding: '16px', display: 'flex', flexDirection: 'column', gap: '12px' }}>
          {notificationInbox.length === 0 && (
            <div style={{ textAlign: 'center', color: 'var(--text-muted)', padding: '40px 20px' }}>
              <CheckCircle size={32} color="#10b981" style={{ marginBottom: '10px' }} />
              <p>No active failure alerts. All systems nominal.</p>
            </div>
          )}
          {notificationInbox.map(n => (
            <div
              key={n.id}
              style={{
                background: n.resolved ? '#f8fafc' : (n.risk_level === 'CRITICAL' ? 'rgba(239,68,68,0.04)' : 'rgba(249,115,22,0.04)'),
                border: `1px solid ${n.resolved ? 'var(--border-light)' : (n.risk_level === 'CRITICAL' ? 'rgba(239,68,68,0.2)' : 'rgba(249,115,22,0.2)')}`,
                borderLeft: `4px solid ${n.resolved ? 'var(--border-color)' : (n.risk_level === 'CRITICAL' ? '#ef4444' : '#f97316')}`,
                borderRadius: '10px',
                padding: '14px',
                opacity: n.resolved ? 0.45 : 1,
                transition: 'opacity 0.3s'
              }}
            >
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '8px' }}>
                <span style={{ fontWeight: 'bold', fontSize: '0.82em', color: n.resolved ? 'var(--text-muted)' : (n.risk_level === 'CRITICAL' ? '#ef4444' : '#f97316'), display: 'flex', alignItems: 'center', gap: '5px' }}>
                  <ShieldAlert size={13} />
                  {n.resolved ? '✓ RESOLVED' : `${n.risk_level} FAILURE ALERT`}
                </span>
                <span style={{ fontSize: '0.72em', color: 'var(--text-muted)' }}>{n.timestamp}</span>
              </div>
              <div style={{ fontWeight: 700, fontSize: '0.98em', color: 'var(--text-primary)', marginBottom: '4px' }}>{n.device_id}</div>
              <div style={{ fontSize: '0.78em', color: 'var(--text-secondary)', marginBottom: '4px' }}>{n.device_type} • {n.department}</div>
              <div style={{ display: 'flex', gap: '10px', marginBottom: '6px', flexWrap: 'wrap' }}>
                <span style={{ fontSize: '0.72em', background: 'rgba(239,68,68,0.15)', color: '#dc2626', padding: '2px 8px', borderRadius: '4px', fontWeight: 600 }}>
                  Health: {n.overall_health?.toFixed(1) ?? '—'}%
                </span>
                <span style={{ fontSize: '0.72em', background: 'rgba(249,115,22,0.15)', color: '#ea580c', padding: '2px 8px', borderRadius: '4px', fontWeight: 600 }}>
                  Fail Prob: {n.failure_probability ? Math.round(n.failure_probability * 100) : '—'}%
                </span>
                {n.anomaly_score > 0 && (
                  <span style={{ fontSize: '0.72em', background: 'rgba(168,85,247,0.15)', color: '#7c3aed', padding: '2px 8px', borderRadius: '4px', fontWeight: 600 }}>
                    Anomaly: {n.anomaly_score?.toFixed(1)}
                  </span>
                )}
              </div>
              <div style={{ fontSize: '0.78em', color: '#ef4444', marginBottom: '2px', fontWeight: 600 }}>⚠ Root Cause: {n.root_cause || '—'}</div>
              <div style={{ fontSize: '0.78em', color: 'var(--text-secondary)', marginBottom: '10px' }}>⚕️ {n.recommended_action}</div>
              {!n.resolved && (
                <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
                  <button
                    style={{ flex: 1, background: 'rgba(99,102,241,0.15)', border: '1px solid #6366f1', color: '#818cf8', borderRadius: '6px', padding: '6px 10px', cursor: 'pointer', fontSize: '0.78em', fontWeight: 600, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '4px' }}
                    onClick={() => {
                      const realData = n._fullData;
                      const previewData = realData ? {
                        ...realData,
                        device_id: n.device_id,
                        department: realData.department || n.department || 'General Ward',
                        _fromLiveStream: true
                      } : {
                        device_id: n.device_id,
                        device_type: n.device_type || 'Medical Device',
                        department: n.department || 'General Ward',
                        manufacturer: 'LOGx External Streamer',
                        risk_level: n.risk_level,
                        overall_health: n.overall_health || 14.2,
                        failure_probability: n.failure_probability || 0.85,
                        anomaly: { score: n.anomaly_score || 75.0, status: 'Abnormal' },
                        root_cause: { primary: n.root_cause || 'Component Drift', confidence: 0.88 },
                        maintenance: { recommended_action: n.recommended_action || 'Inspect Equipment' },
                        components: { Battery: { health: n.overall_health || 14.2, status: 'Critical' } },
                        rul_days: 7,
                        last_updated: new Date().toISOString(),
                        _synthetic: true
                      };
                      setDeviceData(previewData);
                      setSelectedDeviceId(n.device_id);
                      setActiveTab('twin');
                      setAlertPanelOpen(false);
                      fetchDeviceDetails(n.device_id);
                    }}
                  >
                    <Eye size={12} /> Inspect Twin
                  </button>
                  <button
                    style={{ flex: 1, background: 'rgba(16,185,129,0.15)', border: '1px solid #10b981', color: '#34d399', borderRadius: '6px', padding: '6px 10px', cursor: 'pointer', fontSize: '0.78em', fontWeight: 600 }}
                    onClick={() => {
                      setNotificationInbox(prev => prev.map(x => x.id === n.id ? { ...x, resolved: true } : x));
                      setAlerts(prev => prev.map(a => a.device_id === n.device_id ? { ...a, status: 'acknowledged' } : a));
                    }}
                  >
                    ✓ Resolve
                  </button>
                </div>
              )}
            </div>
          ))}
        </div>
      </div>

      {/* Alert Bell Trigger Button */}
      {unresolvedCount > 0 && !alertPanelOpen && (
        <button
          onClick={() => setAlertPanelOpen(true)}
          style={{ position: 'fixed', bottom: '30px', right: '30px', zIndex: 9998, width: '60px', height: '60px', borderRadius: '50%', background: 'linear-gradient(135deg, #ef4444, #dc2626)', border: '2px solid rgba(239,68,68,0.5)', boxShadow: '0 0 20px rgba(239,68,68,0.5), 0 4px 20px rgba(0,0,0,0.4)', cursor: 'pointer', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: '2px', animation: 'pulse 2s infinite' }}
        >
          <ShieldAlert size={22} color="white" />
          <span style={{ color: 'white', fontSize: '0.65em', fontWeight: 700 }}>{unresolvedCount}</span>
        </button>
      )}
    </>
  );
}
