import React from 'react';
import {
  Activity, Search, HardDrive, MapPin, Brain,
  HelpCircle, Layers, Upload, FileText, Sliders, AlertOctagon
} from 'lucide-react';

export default function Sidebar({ activeTab, setActiveTab, hasPageAccess, alerts, currentUser, handleLogout }) {
  return (
    <div className="sidebar">
      <div style={{ padding: '0 20px 20px 20px', borderBottom: '1px solid var(--border-light)', marginBottom: '20px' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
          <Activity size={28} color="#3b82f6" />
          <span style={{ fontSize: '1.2em', fontWeight: 700, letterSpacing: '0.05em', color: 'var(--text-primary)' }}>AURA INTELLIGENCE</span>
        </div>
        <span style={{ fontSize: '0.7em', color: 'var(--text-muted)', display: 'block', marginTop: '4px' }}>Medical Reliability Platform</span>
      </div>

      <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: '5px', padding: '0 10px', overflowY: 'auto' }}>
        {hasPageAccess('dashboard') && (
          <button
            style={{ display: 'flex', alignItems: 'center', gap: '12px', background: activeTab === 'dashboard' ? 'var(--active-tab-bg)' : 'transparent', color: activeTab === 'dashboard' ? 'var(--active-tab-color)' : 'var(--inactive-tab-color)', border: 'none', textAlign: 'left', cursor: 'pointer', padding: '12px 16px', borderRadius: '8px', fontWeight: 500 }}
            onClick={() => setActiveTab('dashboard')}
          >
            <Activity size={18} />
            <span>Monitoring Dashboard</span>
          </button>
        )}
        {hasPageAccess('explorer') && (
          <button
            style={{ display: 'flex', alignItems: 'center', gap: '12px', background: activeTab === 'explorer' ? 'var(--active-tab-bg)' : 'transparent', color: activeTab === 'explorer' ? 'var(--active-tab-color)' : 'var(--inactive-tab-color)', border: 'none', textAlign: 'left', cursor: 'pointer', padding: '12px 16px', borderRadius: '8px', fontWeight: 500 }}
            onClick={() => setActiveTab('explorer')}
          >
            <Search size={18} />
            <span>Device Explorer</span>
          </button>
        )}
        {hasPageAccess('twin') && (
          <button
            style={{ display: 'flex', alignItems: 'center', gap: '12px', background: activeTab === 'twin' ? 'var(--active-tab-bg)' : 'transparent', color: activeTab === 'twin' ? 'var(--active-tab-color)' : 'var(--inactive-tab-color)', border: 'none', textAlign: 'left', cursor: 'pointer', padding: '12px 16px', borderRadius: '8px', fontWeight: 500 }}
            onClick={() => setActiveTab('twin')}
          >
            <HardDrive size={18} />
            <span>Digital Twin View</span>
          </button>
        )}
        {hasPageAccess('heatmap') && (
          <button
            style={{ display: 'flex', alignItems: 'center', gap: '12px', background: activeTab === 'heatmap' ? 'var(--active-tab-bg)' : 'transparent', color: activeTab === 'heatmap' ? 'var(--active-tab-color)' : 'var(--inactive-tab-color)', border: 'none', textAlign: 'left', cursor: 'pointer', padding: '12px 16px', borderRadius: '8px', fontWeight: 500 }}
            onClick={() => setActiveTab('heatmap')}
          >
            <MapPin size={18} />
            <span>Hospital Risk Overview</span>
          </button>
        )}
        {hasPageAccess('prediction') && (
          <button
            style={{ display: 'flex', alignItems: 'center', gap: '12px', background: activeTab === 'prediction' ? 'var(--active-tab-bg)' : 'transparent', color: activeTab === 'prediction' ? 'var(--active-tab-color)' : 'var(--inactive-tab-color)', border: 'none', textAlign: 'left', cursor: 'pointer', padding: '12px 16px', borderRadius: '8px', fontWeight: 500 }}
            onClick={() => setActiveTab('prediction')}
          >
            <Brain size={18} />
            <span>Machine Failure ML Predictor</span>
          </button>
        )}
        {hasPageAccess('advisor') && (
          <button
            style={{ display: 'flex', alignItems: 'center', gap: '12px', background: activeTab === 'advisor' ? 'var(--active-tab-bg)' : 'transparent', color: activeTab === 'advisor' ? 'var(--active-tab-color)' : 'var(--inactive-tab-color)', border: 'none', textAlign: 'left', cursor: 'pointer', padding: '12px 16px', borderRadius: '8px', fontWeight: 500 }}
            onClick={() => setActiveTab('advisor')}
          >
            <HelpCircle size={18} />
            <span>RAG Advisor Chat</span>
          </button>
        )}
        {hasPageAccess('explainability') && (
          <button
            style={{ display: 'flex', alignItems: 'center', gap: '12px', background: activeTab === 'explainability' ? 'var(--active-tab-bg)' : 'transparent', color: activeTab === 'explainability' ? 'var(--active-tab-color)' : 'var(--inactive-tab-color)', border: 'none', textAlign: 'left', cursor: 'pointer', padding: '12px 16px', borderRadius: '8px', fontWeight: 500 }}
            onClick={() => setActiveTab('explainability')}
          >
            <Layers size={18} />
            <span>Model Benchmarks</span>
          </button>
        )}

        {/* NEW EXTENSIONS SECTION */}
        <div style={{ margin: '15px 0 5px 12px', fontSize: '0.7em', color: 'var(--text-muted)', fontWeight: 600, letterSpacing: '0.05em' }}>NEW EXTENSIONS</div>

        {hasPageAccess('hospital_connect') && (
          <button
            style={{ display: 'flex', alignItems: 'center', gap: '12px', background: activeTab === 'hospital_connect' ? 'var(--active-tab-bg)' : 'transparent', color: activeTab === 'hospital_connect' ? 'var(--active-tab-color)' : 'var(--inactive-tab-color)', border: 'none', textAlign: 'left', cursor: 'pointer', padding: '12px 16px', borderRadius: '8px', fontWeight: 500 }}
            onClick={() => setActiveTab('hospital_connect')}
          >
            <Activity size={18} />
            <span>Live Telemetry Logs</span>
          </button>
        )}
        {hasPageAccess('dataset_upload') && (
          <button
            style={{ display: 'flex', alignItems: 'center', gap: '12px', background: activeTab === 'dataset_upload' ? 'var(--active-tab-bg)' : 'transparent', color: activeTab === 'dataset_upload' ? 'var(--active-tab-color)' : 'var(--inactive-tab-color)', border: 'none', textAlign: 'left', cursor: 'pointer', padding: '12px 16px', borderRadius: '8px', fontWeight: 500 }}
            onClick={() => setActiveTab('dataset_upload')}
          >
            <Upload size={18} />
            <span>Dataset Upload</span>
          </button>
        )}
        {hasPageAccess('knowledge_base') && (
          <button
            style={{ display: 'flex', alignItems: 'center', gap: '12px', background: activeTab === 'knowledge_base' ? 'var(--active-tab-bg)' : 'transparent', color: activeTab === 'knowledge_base' ? 'var(--active-tab-color)' : 'var(--inactive-tab-color)', border: 'none', textAlign: 'left', cursor: 'pointer', padding: '12px 16px', borderRadius: '8px', fontWeight: 500 }}
            onClick={() => setActiveTab('knowledge_base')}
          >
            <FileText size={18} />
            <span>Knowledge Base</span>
          </button>
        )}
        {hasPageAccess('audit_logs') && (
          <button
            style={{ display: 'flex', alignItems: 'center', gap: '12px', background: activeTab === 'audit_logs' ? 'var(--active-tab-bg)' : 'transparent', color: activeTab === 'audit_logs' ? 'var(--active-tab-color)' : 'var(--inactive-tab-color)', border: 'none', textAlign: 'left', cursor: 'pointer', padding: '12px 16px', borderRadius: '8px', fontWeight: 500 }}
            onClick={() => setActiveTab('audit_logs')}
          >
            <Sliders size={18} />
            <span>Audit Logs</span>
          </button>
        )}

        <button
          style={{ display: 'flex', alignItems: 'center', gap: '12px', background: activeTab === 'alerts' ? 'var(--active-tab-bg)' : 'transparent', color: activeTab === 'alerts' ? '#ef4444' : 'var(--inactive-tab-color)', border: 'none', textAlign: 'left', cursor: 'pointer', padding: '12px 16px', borderRadius: '8px', fontWeight: 500 }}
          onClick={() => setActiveTab('alerts')}
        >
          <AlertOctagon size={18} />
          <span>Fleet Alerts <span style={{ background: '#ef4444', color: 'white', fontSize: '0.8em', padding: '1px 6px', borderRadius: '4px', marginLeft: '5px' }}>{(alerts || []).filter(a => a.status !== 'acknowledged' && a.status !== 'ACKNOWLEDGED').length}</span></span>
        </button>
      </div>

      {/* User Card */}
      <div style={{ padding: '20px', borderTop: '1px solid var(--border-light)', display: 'flex', gap: '10px', alignItems: 'center', justifyContent: 'space-between' }}>
        <div style={{ display: 'flex', gap: '10px', alignItems: 'center' }}>
          <div style={{ width: '38px', height: '38px', background: '#3b82f6', color: '#ffffff', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 'bold' }}>
            {currentUser?.username?.[0]?.toUpperCase() || 'A'}
          </div>
          <div>
            <div style={{ fontSize: '0.9em', fontWeight: 500, color: 'var(--text-primary)' }}>{currentUser?.username}</div>
            <div style={{ fontSize: '0.7em', color: 'var(--text-muted)' }}>{currentUser?.role?.replace('_', ' ')}</div>
          </div>
        </div>
        <button style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#ef4444', fontSize: '0.85em', fontWeight: 'bold' }} onClick={handleLogout}>
          Logout
        </button>
      </div>
    </div>
  );
}
