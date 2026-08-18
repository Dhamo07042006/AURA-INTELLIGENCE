import React from 'react';

export default function HospitalRiskHeatmap({ departments, getHealthColor, getRiskBadge, setSelectedDeviceId, setActiveTab }) {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
      <div>
        <h1 style={{ margin: 0, fontSize: '2em' }}>Hospital Department Risk Heatmap</h1>
        <p style={{ margin: '5px 0 0 0', color: '#94a3b8' }}>Fleet operational status grouped by physical locations</p>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))', gap: '20px' }}>
        {departments.map(dept => (
          <div key={dept.name} className="glass-card" style={{ display: 'flex', flexDirection: 'column', gap: '15px' }}>
            <div style={{ borderBottom: '1px solid rgba(255,255,255,0.05)', paddingBottom: '10px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <div>
                <h3 style={{ margin: 0 }}>{dept.name}</h3>
                <span style={{ fontSize: '0.85em', color: '#64748b' }}>{dept.device_count} total devices</span>
              </div>
              <div style={{ textAlign: 'right' }}>
                <div style={{ fontSize: '1.4em', fontWeight: 700, color: getHealthColor(dept.avg_health) }}>{dept.avg_health}%</div>
                <div style={{ fontSize: '0.7em', color: '#64748b' }}>AVG HEALTH</div>
              </div>
            </div>

            {/* Risk breakdown numbers */}
            <div style={{ display: 'flex', justifyContent: 'space-between', background: 'rgba(15,23,42,0.4)', padding: '10px', borderRadius: '8px', fontSize: '0.85em' }}>
              <span style={{ color: '#ef4444' }}>CRIT: {dept.critical_count}</span>
              <span style={{ color: '#f97316' }}>HIGH: {dept.high_count}</span>
              <span style={{ color: '#f59e0b' }}>MED: {dept.medium_count}</span>
              <span style={{ color: '#10b981' }}>LOW: {dept.low_count}</span>
            </div>

            {/* Device list in department */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', maxHeight: '180px', overflowY: 'auto' }}>
              {dept.devices.slice(0, 10).map(d => (
                <div
                  key={d.device_id}
                  style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.85em', background: 'rgba(255,255,255,0.02)', padding: '6px 12px', borderRadius: '4px', cursor: 'pointer' }}
                  onClick={() => {
                    setSelectedDeviceId(d.device_id);
                    setActiveTab('twin');
                  }}
                >
                  <span style={{ fontWeight: 600 }}>{d.device_id}</span>
                  <span style={{ color: '#94a3b8' }}>{d.device_type}</span>
                  <span>{getRiskBadge(d.risk_level)}</span>
                </div>
              ))}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
