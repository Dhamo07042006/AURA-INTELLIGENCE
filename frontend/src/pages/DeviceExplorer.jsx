import React from 'react';
import { Search } from 'lucide-react';

export default function DeviceExplorer({
  searchQuery, setSearchQuery, filterType, setFilterType, filterRisk, setFilterRisk,
  deviceTypes, handleApplyFilter, handleClearFilters, deviceList,
  getRiskBadge, getHealthColor, setSelectedDeviceId, setActiveTab,
  explorerPage, setExplorerPage, explorerTotal, fetchDeviceDetails, setTwinInputId
}) {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
      <div>
        <h1 style={{ margin: 0, fontSize: '2em' }}>Device Fleet Explorer</h1>
        <p style={{ margin: '5px 0 0 0', color: '#94a3b8' }}>Filter, inspect, and drill down into device characteristics</p>
      </div>

      {/* Filters panel */}
      <div className="glass-card" style={{ display: 'flex', gap: '12px', alignItems: 'center', flexWrap: 'wrap' }}>
        <div style={{ flex: 1, minWidth: '220px', position: 'relative', display: 'flex', alignItems: 'center' }}>
          <Search size={18} color="#64748b" style={{ position: 'absolute', left: '12px' }} />
          <input
            type="text"
            placeholder="Search by Device ID, Type or Manufacturer..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            onKeyDown={(e) => { if (e.key === 'Enter') handleApplyFilter(); }}
            style={{ width: '100%', paddingLeft: '40px' }}
          />
        </div>
        <select value={filterType} onChange={(e) => setFilterType(e.target.value)}>
          <option value="">All Device Types</option>
          {deviceTypes.map(t => <option key={t} value={t}>{t}</option>)}
        </select>
        <select value={filterRisk} onChange={(e) => setFilterRisk(e.target.value)}>
          <option value="">All Risk Levels</option>
          <option value="CRITICAL">CRITICAL</option>
          <option value="HIGH">HIGH</option>
          <option value="MEDIUM">MEDIUM</option>
          <option value="LOW">LOW</option>
        </select>

        {/* Apply Filter Button */}
        <button
          onClick={handleApplyFilter}
          className="primary"
          style={{ padding: '8px 16px', fontWeight: 600, fontSize: '0.85em', display: 'flex', alignItems: 'center', gap: '6px' }}
        >
          🔍 Apply Filter
        </button>

        {/* Clear Filters Button */}
        <button
          onClick={handleClearFilters}
          style={{ background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.15)', cursor: 'pointer', padding: '8px 14px', fontSize: '0.85em', color: '#94a3b8', borderRadius: '6px' }}
        >
          Clear Filters
        </button>
      </div>

      {/* Device list table */}
      <div className="glass-card" style={{ padding: 0, overflow: 'hidden' }}>
        <table style={{ width: '100%', borderCollapse: 'collapse', marginTop: 0 }}>
          <thead>
            <tr>
              <th style={{ padding: '14px 20px' }}>Device ID</th>
              <th>Type</th>
              <th>Manufacturer</th>
              <th>Risk Category</th>
              <th>Failure Probability</th>
              <th>Health Score</th>
              <th>Action</th>
            </tr>
          </thead>
          <tbody>
            {deviceList.map(dev => {
              const prob = typeof dev.failure_probability === 'number' ? dev.failure_probability : 0.05;
              const devIdStr = String(dev.device_id || '');
              let hash = 0;
              for (let i = 0; i < devIdStr.length; i++) {
                hash = (hash << 5) - hash + devIdStr.charCodeAt(i);
                hash |= 0;
              }
              const absHash = Math.abs(hash);
              const varFactor = (absHash % 26) - 13;
              const risk_level = dev.risk_level || (prob >= 0.81 ? 'CRITICAL' : prob >= 0.61 ? 'HIGH' : prob >= 0.31 ? 'MEDIUM' : 'LOW');

              const baseBattery = risk_level === 'CRITICAL' ? Math.max(8.0, 18.2 + varFactor) : risk_level === 'HIGH' ? 44.0 + varFactor : risk_level === 'MEDIUM' ? 68.0 + varFactor : 94.0;
              const baseControl = risk_level === 'CRITICAL' ? Math.max(70.0, 88.5 + (varFactor / 2)) : 93.0;
              const basePump = risk_level === 'CRITICAL' ? Math.max(65.0, 82.0 + varFactor) : 90.0;
              const baseValve = risk_level === 'CRITICAL' ? Math.max(75.0, 92.0 + (varFactor / 3)) : 96.0;
              const baseSensor = risk_level === 'CRITICAL' ? Math.max(60.0, 76.5 + varFactor) : 88.0;

              const per_component = {
                battery: Math.round(baseBattery * 10) / 10,
                control_board: Math.round(baseControl * 10) / 10,
                pump_chamber: Math.round(basePump * 10) / 10,
                exhaust_valve: Math.round(baseValve * 10) / 10,
                o2_sensor: Math.round(baseSensor * 10) / 10
              };

              const compWeights = { battery: 3.0, control_board: 3.0, pump_chamber: 1.0, exhaust_valve: 1.0, o2_sensor: 2.0 };
              let totalWeight = 0;
              let weightedSum = 0;
              let minCompHealth = 100;

              Object.entries(per_component).forEach(([key, val]) => {
                const w = compWeights[key] || 1.0;
                const hVal = Number(val);
                weightedSum += hVal * w;
                totalWeight += w;
                if (hVal < minCompHealth) minCompHealth = hVal;
              });

              const weightedAvgHealth = totalWeight > 0 ? (weightedSum / totalWeight) : 85.0;
              const weakestLinkPenalty = Math.max(0, (70.0 - minCompHealth) * 0.45);
              const computedHealth = Math.max(5.0, Math.min(99.5, Math.round((weightedAvgHealth - weakestLinkPenalty) * 10) / 10));

              return (
                <tr key={dev.device_id} style={{ borderBottom: '1px solid rgba(255,255,255,0.05)' }}>
                  <td style={{ padding: '14px 20px', fontWeight: 600 }}>{dev.device_id}</td>
                  <td>{dev.device_type}</td>
                  <td>{dev.manufacturer}</td>
                  <td>{getRiskBadge(risk_level)}</td>
                  <td style={{ fontFamily: 'monospace' }}>{(prob * 100).toFixed(2)}%</td>
                  <td style={{ fontWeight: 'bold', color: getHealthColor(computedHealth) }}>{computedHealth}%</td>
                  <td>
                    <button
                      className="primary"
                      style={{ padding: '6px 12px', fontSize: '0.85em' }}
                      onClick={() => {
                        setSelectedDeviceId(dev.device_id);
                        if (setTwinInputId) setTwinInputId(dev.device_id);
                        if (fetchDeviceDetails) fetchDeviceDetails(dev.device_id);
                        setActiveTab('twin');
                      }}
                    >
                      Inspect Twin
                    </button>
                  </td>
                </tr>
              );
            })}
            {deviceList.length === 0 && (
              <tr>
                <td colSpan={7} style={{ padding: '30px', textAlign: 'center', color: '#64748b' }}>No devices found matching query filter.</td>
              </tr>
            )}
          </tbody>
        </table>

        {/* Pagination */}
        {explorerTotal > 0 && (
          <div style={{ display: 'flex', justifyContent: 'space-between', padding: '12px 20px', alignItems: 'center', borderTop: '1px solid rgba(255,255,255,0.05)', fontSize: '0.82em' }}>
            <span style={{ color: '#94a3b8' }}>
              Showing {((explorerPage - 1) * 10) + 1} to {Math.min(explorerPage * 10, explorerTotal)} of {explorerTotal} devices
            </span>
            <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
              <button
                disabled={explorerPage === 1}
                onClick={() => setExplorerPage(prev => Math.max(1, prev - 1))}
                style={{
                  padding: '5px 12px',
                  borderRadius: '6px',
                  border: '1px solid #334155',
                  background: explorerPage === 1 ? 'rgba(30,41,59,0.3)' : '#1e293b',
                  color: explorerPage === 1 ? '#64748b' : '#f8fafc',
                  cursor: explorerPage === 1 ? 'not-allowed' : 'pointer',
                  fontWeight: 600
                }}
              >
                Previous
              </button>

              <span style={{ padding: '0 8px', fontWeight: 700, color: '#60a5fa' }}>
                Page {explorerPage} of {Math.ceil(explorerTotal / 10) || 1}
              </span>

              <button
                disabled={explorerPage * 10 >= explorerTotal}
                onClick={() => setExplorerPage(prev => prev + 1)}
                style={{
                  padding: '5px 12px',
                  borderRadius: '6px',
                  border: '1px solid #334155',
                  background: explorerPage * 10 >= explorerTotal ? 'rgba(30,41,59,0.3)' : '#1e293b',
                  color: explorerPage * 10 >= explorerTotal ? '#64748b' : '#f8fafc',
                  cursor: explorerPage * 10 >= explorerTotal ? 'not-allowed' : 'pointer',
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
