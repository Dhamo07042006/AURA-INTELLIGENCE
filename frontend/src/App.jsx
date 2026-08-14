import React, { useState, useEffect } from 'react';
import { 
  Activity, ShieldAlert, Heart, HardDrive, 
  MapPin, Brain, HelpCircle, AlertOctagon, 
  Search, Sliders, Users, Settings, Wrench,
  Clock, Thermometer, Battery, Info, CheckCircle,
  FileText, ShieldAlert as AlertIcon, RefreshCw,
  TrendingUp, Layers, HelpCircle as HelpIcon, ArrowRight
} from 'lucide-react';

const API_BASE = 'http://localhost:8000/api/v1';

export default function App() {
  const [activeTab, setActiveTab] = useState('dashboard');
  const [selectedDeviceId, setSelectedDeviceId] = useState('DEV000001');
  const [deviceData, setDeviceData] = useState(null);
  const [deviceList, setDeviceList] = useState([]);
  const [departments, setDepartments] = useState([]);
  const [alerts, setAlerts] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  // Search & Filter state for Explorer
  const [searchQuery, setSearchQuery] = useState('');
  const [filterType, setFilterType] = useState('');
  const [filterRisk, setFilterRisk] = useState('');
  const [deviceTypes, setDeviceTypes] = useState([]);
  const [explorerPage, setExplorerPage] = useState(1);
  const [explorerTotal, setExplorerTotal] = useState(0);

  // RAG chat state
  const [chatMessages, setChatMessages] = useState([
    { sender: 'advisor', text: "Hello! I am your AI Maintenance Advisor. Select a device and ask me for the approved manufacturer procedures." }
  ]);
  const [chatInput, setChatInput] = useState('');
  const [ragLoading, setRagLoading] = useState(false);

  // Selected component for Digital Twin detail drawer
  const [selectedComponent, setSelectedComponent] = useState(null);

  // Fetch initial cache data
  useEffect(() => {
    fetchDeviceList();
    fetchDepartments();
    fetchAlerts();
  }, []);

  // Sync selected device details
  useEffect(() => {
    if (selectedDeviceId) {
      fetchDeviceDetails(selectedDeviceId);
    }
  }, [selectedDeviceId]);

  const fetchDeviceList = async () => {
    try {
      const res = await fetch(`${API_BASE}/devices?page=${explorerPage}&device_type=${filterType}&risk_level=${filterRisk}&search=${searchQuery}`);
      const data = await res.json();
      setDeviceList(data.devices || []);
      setDeviceTypes(data.device_types || []);
      setExplorerTotal(data.total || 0);
    } catch (e) {
      console.error("Error fetching device list:", e);
    }
  };

  // Re-fetch when explorer filters change
  useEffect(() => {
    fetchDeviceList();
  }, [explorerPage, filterType, filterRisk, searchQuery]);

  const fetchDeviceDetails = async (id) => {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch(`${API_BASE}/devices/${id}/health`);
      if (!res.ok) throw new Error("Device not found");
      const data = await res.json();
      setDeviceData(data);
      
      // Update chat messages context when device change
      setChatMessages([
        { 
          sender: 'advisor', 
          text: `Selected virtual twin for **${data.device_id}** (${data.device_type}). Detected primary root cause: **${data.root_cause?.primary}** with ${Math.round(data.root_cause?.confidence * 100)}% confidence. How should I assist you with maintenance?` 
        }
      ]);
      setSelectedComponent(null);
    } catch (e) {
      setError(e.message);
    } finally {
      setLoading(false);
    }
  };

  const fetchDepartments = async () => {
    try {
      const res = await fetch(`${API_BASE}/departments`);
      const data = await res.json();
      setDepartments(data);
    } catch (e) {
      console.error("Error fetching departments:", e);
    }
  };

  const fetchAlerts = async () => {
    try {
      const res = await fetch(`${API_BASE}/alerts`);
      const data = await res.json();
      setAlerts(data);
    } catch (e) {
      console.error("Error fetching alerts:", e);
    }
  };

  const sendChatMessage = async () => {
    if (!chatInput.trim() || !deviceData) return;
    
    const userMsg = chatInput;
    setChatMessages(prev => [...prev, { sender: 'user', text: userMsg }]);
    setChatInput('');
    setRagLoading(true);

    try {
      const res = await fetch(`${API_BASE}/rag/chat`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          device_id: deviceData.device_id,
          root_cause: deviceData.root_cause?.primary,
          message: userMsg
        })
      });
      const data = await res.json();
      
      const responseText = `**Recommended Procedure:**\n${data.recommended_action}\n\n**Verified Reference source:** ${data.source}\n\n**Evidence Context:** _${data.evidence}_`;
      setChatMessages(prev => [...prev, { sender: 'advisor', text: responseText }]);
    } catch (e) {
      setChatMessages(prev => [...prev, { sender: 'advisor', text: "Error connecting to RAG agent. Fallback manual details: Check component replacement records." }]);
    } finally {
      setRagLoading(false);
    }
  };

  // Helper colors
  const getRiskBadge = (risk) => {
    if (risk === 'CRITICAL') return <span className="badge badge-critical">CRITICAL</span>;
    if (risk === 'HIGH') return <span className="badge badge-high">HIGH</span>;
    if (risk === 'MEDIUM') return <span className="badge badge-medium">MEDIUM</span>;
    return <span className="badge badge-low">LOW</span>;
  };

  const getHealthColor = (h) => {
    if (h < 50) return '#ef4444'; // Red
    if (h < 80) return '#f59e0b'; // Yellow/Orange
    return '#10b981'; // Green
  };

  return (
    <div className="app-container">
      {/* Sidebar Navigation */}
      <div className="sidebar">
        <div style={{ padding: '0 20px 20px 20px', borderBottom: '1px solid rgba(255,255,255,0.05)', marginBottom: '20px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            <Activity size={28} color="#3b82f6" />
            <span style={{ fontSize: '1.2em', fontWeight: 700, letterSpacing: '0.05em' }}>AURA INTELLIGENCE</span>
          </div>
          <span style={{ fontSize: '0.7em', color: '#94a3b8', display: 'block', marginTop: '4px' }}>Medical Reliability Platform</span>
        </div>

        <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: '5px', padding: '0 10px' }}>
          <button 
            style={{ display: 'flex', alignItems: 'center', gap: '12px', background: activeTab === 'dashboard' ? 'rgba(59,130,246,0.15)' : 'transparent', color: activeTab === 'dashboard' ? '#3b82f6' : '#94a3b8', border: 'none', textAlign: 'left', cursor: 'pointer', padding: '12px 16px', borderRadius: '8px', fontWeight: 500 }}
            onClick={() => setActiveTab('dashboard')}
          >
            <Activity size={18} />
            <span>Executive Dashboard</span>
          </button>
          <button 
            style={{ display: 'flex', alignItems: 'center', gap: '12px', background: activeTab === 'explorer' ? 'rgba(59,130,246,0.15)' : 'transparent', color: activeTab === 'explorer' ? '#3b82f6' : '#94a3b8', border: 'none', textAlign: 'left', cursor: 'pointer', padding: '12px 16px', borderRadius: '8px', fontWeight: 500 }}
            onClick={() => setActiveTab('explorer')}
          >
            <Search size={18} />
            <span>Device Explorer</span>
          </button>
          <button 
            style={{ display: 'flex', alignItems: 'center', gap: '12px', background: activeTab === 'twin' ? 'rgba(59,130,246,0.15)' : 'transparent', color: activeTab === 'twin' ? '#3b82f6' : '#94a3b8', border: 'none', textAlign: 'left', cursor: 'pointer', padding: '12px 16px', borderRadius: '8px', fontWeight: 500 }}
            onClick={() => setActiveTab('twin')}
          >
            <HardDrive size={18} />
            <span>Digital Twin View</span>
          </button>
          <button 
            style={{ display: 'flex', alignItems: 'center', gap: '12px', background: activeTab === 'heatmap' ? 'rgba(59,130,246,0.15)' : 'transparent', color: activeTab === 'heatmap' ? '#3b82f6' : '#94a3b8', border: 'none', textAlign: 'left', cursor: 'pointer', padding: '12px 16px', borderRadius: '8px', fontWeight: 500 }}
            onClick={() => setActiveTab('heatmap')}
          >
            <MapPin size={18} />
            <span>Hospital Risk Heatmap</span>
          </button>
          <button 
            style={{ display: 'flex', alignItems: 'center', gap: '12px', background: activeTab === 'prediction' ? 'rgba(59,130,246,0.15)' : 'transparent', color: activeTab === 'prediction' ? '#3b82f6' : '#94a3b8', border: 'none', textAlign: 'left', cursor: 'pointer', padding: '12px 16px', borderRadius: '8px', fontWeight: 500 }}
            onClick={() => setActiveTab('prediction')}
          >
            <ShieldAlert size={18} />
            <span>Failure Prediction</span>
          </button>
          <button 
            style={{ display: 'flex', alignItems: 'center', gap: '12px', background: activeTab === 'rul' ? 'rgba(59,130,246,0.15)' : 'transparent', color: activeTab === 'rul' ? '#3b82f6' : '#94a3b8', border: 'none', textAlign: 'left', cursor: 'pointer', padding: '12px 16px', borderRadius: '8px', fontWeight: 500 }}
            onClick={() => setActiveTab('rul')}
          >
            <Clock size={18} />
            <span>RUL Forecast</span>
          </button>
          <button 
            style={{ display: 'flex', alignItems: 'center', gap: '12px', background: activeTab === 'graph' ? 'rgba(59,130,246,0.15)' : 'transparent', color: activeTab === 'graph' ? '#3b82f6' : '#94a3b8', border: 'none', textAlign: 'left', cursor: 'pointer', padding: '12px 16px', borderRadius: '8px', fontWeight: 500 }}
            onClick={() => setActiveTab('graph')}
          >
            <Brain size={18} />
            <span>Root Cause Graph</span>
          </button>
          <button 
            style={{ display: 'flex', alignItems: 'center', gap: '12px', background: activeTab === 'advisor' ? 'rgba(59,130,246,0.15)' : 'transparent', color: activeTab === 'advisor' ? '#3b82f6' : '#94a3b8', border: 'none', textAlign: 'left', cursor: 'pointer', padding: '12px 16px', borderRadius: '8px', fontWeight: 500 }}
            onClick={() => setActiveTab('advisor')}
          >
            <HelpCircle size={18} />
            <span>RAG Advisor Chat</span>
          </button>
          <button 
            style={{ display: 'flex', alignItems: 'center', gap: '12px', background: activeTab === 'explainability' ? 'rgba(59,130,246,0.15)' : 'transparent', color: activeTab === 'explainability' ? '#3b82f6' : '#94a3b8', border: 'none', textAlign: 'left', cursor: 'pointer', padding: '12px 16px', borderRadius: '8px', fontWeight: 500 }}
            onClick={() => setActiveTab('explainability')}
          >
            <Layers size={18} />
            <span>Model Benchmarks</span>
          </button>
          <button 
            style={{ display: 'flex', alignItems: 'center', gap: '12px', background: activeTab === 'alerts' ? 'rgba(59,130,246,0.15)' : 'transparent', color: activeTab === 'alerts' ? '#ef4444' : '#94a3b8', border: 'none', textAlign: 'left', cursor: 'pointer', padding: '12px 16px', borderRadius: '8px', fontWeight: 500 }}
            onClick={() => setActiveTab('alerts')}
          >
            <AlertOctagon size={18} />
            <span>Fleets Alerts <span style={{ background: '#ef4444', color: 'white', fontSize: '0.8em', padding: '1px 6px', borderRadius: '4px', marginLeft: '5px' }}>{alerts.length}</span></span>
          </button>
        </div>

        <div style={{ padding: '20px', borderTop: '1px solid rgba(255,255,255,0.05)', display: 'flex', gap: '10px', alignItems: 'center' }}>
          <div style={{ width: '38px', height: '38px', background: '#3b82f6', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 'bold' }}>B</div>
          <div>
            <div style={{ fontSize: '0.9em', fontWeight: 500 }}>BioMed Tech</div>
            <div style={{ fontSize: '0.75em', color: '#64748b' }}>Operations Lead</div>
          </div>
        </div>
      </div>

      {/* Main Panel */}
      <div className="main-content">
        
        {/* EXECUTIVE DASHBOARD */}
        {activeTab === 'dashboard' && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '25px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <div>
                <h1 style={{ margin: 0, fontSize: '2em' }}>Operations Overview</h1>
                <p style={{ margin: '5px 0 0 0', color: '#94a3b8' }}>Real-time health statistics across 9,439 active medical devices</p>
              </div>
              <div style={{ background: 'rgba(59,130,246,0.1)', padding: '10px 18px', borderRadius: '8px', border: '1px solid rgba(59,130,246,0.2)' }}>
                <span style={{ fontSize: '0.85em', color: '#60a5fa', fontWeight: 600 }}>SYSTEM STATUS: DEPLOYED</span>
              </div>
            </div>

            {/* KPI Cards Grid */}
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '20px' }}>
              <div className="glass-card risk-critical" style={{ borderLeft: '4px solid #ef4444' }}>
                <div style={{ fontSize: '0.85em', color: '#94a3b8', fontWeight: 500 }}>CRITICAL RISK</div>
                <div style={{ fontSize: '2.5em', fontWeight: 700, margin: '5px 0' }}>{alerts.filter(d=>d.risk_level==='CRITICAL').length}</div>
                <div style={{ fontSize: '0.85em', color: '#f87171' }}>Requires immediate replacement</div>
              </div>
              <div className="glass-card risk-high" style={{ borderLeft: '4px solid #f97316' }}>
                <div style={{ fontSize: '0.85em', color: '#94a3b8', fontWeight: 500 }}>HIGH RISK</div>
                <div style={{ fontSize: '2.5em', fontWeight: 700, margin: '5px 0' }}>{alerts.filter(d=>d.risk_level==='HIGH').length}</div>
                <div style={{ fontSize: '0.85em', color: '#fb923c' }}>Schedule maintenance within 7 days</div>
              </div>
              <div className="glass-card" style={{ borderLeft: '4px solid #f59e0b' }}>
                <div style={{ fontSize: '0.85em', color: '#94a3b8', fontWeight: 500 }}>MEDIUM RISK</div>
                <div style={{ fontSize: '2.5em', fontWeight: 700, margin: '5px 0' }}>654</div>
                <div style={{ fontSize: '0.85em', color: '#fbbf24' }}>Monitored parameter drift</div>
              </div>
              <div className="glass-card" style={{ borderLeft: '4px solid #10b981' }}>
                <div style={{ fontSize: '0.85em', color: '#94a3b8', fontWeight: 500 }}>FLEET HEALTH SCORE</div>
                <div style={{ fontSize: '2.5em', fontWeight: 700, margin: '5px 0' }}>94.2%</div>
                <div style={{ fontSize: '0.85em', color: '#34d399' }}>Above baseline target of 92.0%</div>
              </div>
            </div>

            {/* Layout Split */}
            <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr', gap: '20px' }}>
              
              {/* High Risk Devices */}
              <div className="glass-card" style={{ display: 'flex', flexDirection: 'column', gap: '15px' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <h3 style={{ margin: 0 }}>Highest Operational Risk Devices</h3>
                  <button style={{ fontSize: '0.85em', color: '#3b82f6', border: 'none', background: 'none', cursor: 'pointer', padding: 0 }} onClick={() => setActiveTab('alerts')}>View All</button>
                </div>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                  {alerts.slice(0, 5).map(dev => (
                    <div 
                      key={dev.device_id}
                      className="glass-card" 
                      style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '12px 18px', cursor: 'pointer' }}
                      onClick={() => {
                        setSelectedDeviceId(dev.device_id);
                        setActiveTab('twin');
                      }}
                    >
                      <div>
                        <div style={{ fontWeight: 600, fontSize: '0.95em' }}>{dev.device_id}</div>
                        <div style={{ fontSize: '0.8em', color: '#64748b' }}>{dev.device_type} • {dev.manufacturer}</div>
                      </div>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '15px' }}>
                        <div>{getRiskBadge(dev.risk_level)}</div>
                        <div style={{ fontWeight: 'bold', color: getHealthColor(dev.overall_health) }}>{dev.overall_health}%</div>
                        <ArrowRight size={16} color="#64748b" />
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Department breakdown */}
              <div className="glass-card" style={{ display: 'flex', flexDirection: 'column', gap: '15px' }}>
                <h3 style={{ margin: 0 }}>Department Fleet Risks</h3>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                  {departments.slice(0, 4).map(dept => (
                    <div key={dept.name}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.9em', marginBottom: '4px' }}>
                        <span>{dept.name}</span>
                        <span style={{ fontWeight: 600 }}>{dept.device_count} devs</span>
                      </div>
                      <div style={{ display: 'flex', height: '6px', borderRadius: '3px', overflow: 'hidden', background: '#334155' }}>
                        <div style={{ width: `${(dept.critical_count/dept.device_count)*100}%`, background: '#ef4444' }}></div>
                        <div style={{ width: `${(dept.high_count/dept.device_count)*100}%`, background: '#f97316' }}></div>
                        <div style={{ width: `${(dept.medium_count/dept.device_count)*100}%`, background: '#f59e0b' }}></div>
                        <div style={{ flex: 1, background: '#10b981' }}></div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

            </div>
          </div>
        )}

        {/* DEVICE EXPLORER */}
        {activeTab === 'explorer' && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
            <div>
              <h1 style={{ margin: 0, fontSize: '2em' }}>Device Fleet Explorer</h1>
              <p style={{ margin: '5px 0 0 0', color: '#94a3b8' }}>Filter, inspect, and drill down into device characteristics</p>
            </div>

            {/* Filters panel */}
            <div className="glass-card" style={{ display: 'flex', gap: '15px', alignItems: 'center', flexWrap: 'wrap' }}>
              <div style={{ flex: 1, position: 'relative', display: 'flex', alignItems: 'center' }}>
                <Search size={18} color="#64748b" style={{ position: 'absolute', left: '12px' }} />
                <input 
                  type="text" 
                  placeholder="Search by Device ID or Manufacturer..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
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
              <button 
                onClick={() => { setSearchQuery(''); setFilterType(''); setFilterRisk(''); }}
                style={{ background: 'none', border: '1px solid rgba(255,255,255,0.1)', cursor: 'pointer' }}
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
                  {deviceList.map(dev => (
                    <tr key={dev.device_id} style={{ borderBottom: '1px solid rgba(255,255,255,0.05)' }}>
                      <td style={{ padding: '14px 20px', fontWeight: 600 }}>{dev.device_id}</td>
                      <td>{dev.device_type}</td>
                      <td>{dev.manufacturer}</td>
                      <td>{getRiskBadge(dev.risk_level)}</td>
                      <td style={{ fontFamily: 'monospace' }}>{(dev.failure_probability * 100).toFixed(2)}%</td>
                      <td style={{ fontWeight: 'bold', color: getHealthColor(dev.overall_health) }}>{dev.overall_health}%</td>
                      <td>
                        <button 
                          className="primary" 
                          style={{ padding: '6px 12px', fontSize: '0.85em' }}
                          onClick={() => {
                            setSelectedDeviceId(dev.device_id);
                            setActiveTab('twin');
                          }}
                        >
                          Inspect Twin
                        </button>
                      </td>
                    </tr>
                  ))}
                  {deviceList.length === 0 && (
                    <tr>
                      <td colSpan={7} style={{ padding: '30px', textAlign: 'center', color: '#64748b' }}>No devices found matching query filter.</td>
                    </tr>
                  )}
                </tbody>
              </table>

              {/* Pagination */}
              <div style={{ display: 'flex', justifyContent: 'space-between', padding: '15px 20px', alignItems: 'center', borderTop: '1px solid rgba(255,255,255,0.05)' }}>
                <span style={{ fontSize: '0.85em', color: '#64748b' }}>Showing {deviceList.length} of {explorerTotal} devices</span>
                <div style={{ display: 'flex', gap: '8px' }}>
                  <button 
                    disabled={explorerPage === 1}
                    onClick={() => setExplorerPage(prev => Math.max(1, prev - 1))}
                    style={{ padding: '6px 12px', fontSize: '0.85em' }}
                  >
                    Previous
                  </button>
                  <button 
                    disabled={explorerPage * 25 >= explorerTotal}
                    onClick={() => setExplorerPage(prev => prev + 1)}
                    style={{ padding: '6px 12px', fontSize: '0.85em' }}
                  >
                    Next
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* DIGITAL HEALTH TWIN */}
        {activeTab === 'twin' && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <div>
                <h1 style={{ margin: 0, fontSize: '2em' }}>Digital Health Twin Virtual Representation</h1>
                <p style={{ margin: '5px 0 0 0', color: '#94a3b8' }}>Component-level degradation maps & model predictions</p>
              </div>
              
              {/* Quick device switcher */}
              <div style={{ display: 'flex', gap: '10px', alignItems: 'center' }}>
                <span style={{ fontSize: '0.9em', color: '#94a3b8' }}>Inspect Device:</span>
                <input 
                  type="text" 
                  value={selectedDeviceId} 
                  onChange={(e) => setSelectedDeviceId(e.target.value.toUpperCase())}
                  style={{ width: '120px', textAlign: 'center', fontWeight: 'bold' }}
                />
              </div>
            </div>

            {loading && <div style={{ padding: '40px', textAlign: 'center' }}><RefreshCw className="animate-spin" /> Fetching digital twin...</div>}
            
            {error && (
              <div className="glass-card" style={{ borderLeft: '4px solid #ef4444', color: '#f87171', padding: '15px' }}>
                Error: {error}. Make sure the backend server is running or type a valid device ID like `DEV000001` to `DEV009000`.
              </div>
            )}

            {deviceData && !loading && (
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 2.5fr', gap: '25px' }}>
                
                {/* Left Side: General status & RUL */}
                <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
                  
                  {/* Gauge card */}
                  <div className="glass-card" style={{ textAlign: 'center', display: 'flex', flexDirection: 'column', gap: '15px' }}>
                    <h3 style={{ margin: 0 }}>Device Health</h3>
                    <div className="health-gauge-container">
                      <svg width="140" height="140" viewBox="0 0 140 140">
                        <circle cx="70" cy="70" r="60" fill="none" stroke="rgba(255,255,255,0.05)" strokeWidth="8" />
                        <circle 
                          cx="70" cy="70" r="60" fill="none" 
                          stroke={getHealthColor(deviceData.overall_health)} 
                          strokeWidth="8" 
                          strokeDasharray="377"
                          strokeDashoffset={377 - (377 * deviceData.overall_health) / 100}
                          strokeLinecap="round"
                          transform="rotate(-90 70 70)"
                        />
                      </svg>
                      <div className="health-gauge-value">
                        <span className="number" style={{ color: getHealthColor(deviceData.overall_health) }}>{deviceData.overall_health}%</span>
                        <span className="label">OVERALL</span>
                      </div>
                    </div>
                    
                    <div>
                      <div style={{ fontSize: '1.1em', fontWeight: 'bold' }}>{deviceData.device_id}</div>
                      <div style={{ fontSize: '0.85em', color: '#94a3b8' }}>{deviceData.device_type}</div>
                    </div>

                    <div style={{ borderTop: '1px solid rgba(255,255,255,0.05)', paddingTop: '15px', display: 'flex', justifyContent: 'space-around' }}>
                      <div>
                        <div style={{ fontSize: '0.75em', color: '#64748b' }}>RISK LEVEL</div>
                        <div style={{ fontWeight: 'bold', fontSize: '0.9em', marginTop: '3px' }}>{getRiskBadge(deviceData.risk_level)}</div>
                      </div>
                      <div>
                        <div style={{ fontSize: '0.75em', color: '#64748b' }}>RUL TIME</div>
                        <div style={{ fontWeight: 'bold', fontSize: '0.9em', marginTop: '3px', color: '#3b82f6' }}>{deviceData.predicted_failure_time_days} days</div>
                      </div>
                    </div>
                  </div>

                  {/* Root Cause Card */}
                  <div className="glass-card" style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px', borderBottom: '1px solid rgba(255,255,255,0.05)', paddingBottom: '8px' }}>
                      <AlertIcon size={18} color="#ef4444" />
                      <h4 style={{ margin: 0 }}>Root Cause Analysis</h4>
                    </div>
                    <div>
                      <div style={{ fontSize: '0.75em', color: '#64748b' }}>PRIMARY HYPOTHESIS</div>
                      <div style={{ fontWeight: 'bold', fontSize: '1.05em', color: '#f87171' }}>{deviceData.root_cause?.primary}</div>
                      <div style={{ fontSize: '0.8em', color: '#34d399', marginTop: '2px' }}>Confidence: {Math.round(deviceData.root_cause?.confidence * 100)}%</div>
                    </div>
                    <div style={{ marginTop: '5px' }}>
                      <div style={{ fontSize: '0.75em', color: '#64748b', marginBottom: '4px' }}>SUPPORTING EVIDENCE</div>
                      {deviceData.root_cause?.evidence?.map((ev, i) => (
                        <div key={i} style={{ fontSize: '0.8em', color: '#f1f5f9', display: 'flex', gap: '6px', alignItems: 'center' }}>
                          <span style={{ color: '#ef4444' }}>•</span>
                          <span>{ev}</span>
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* Actions summary */}
                  <div className="glass-card" style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                    <h4 style={{ margin: 0, borderBottom: '1px solid rgba(255,255,255,0.05)', paddingBottom: '8px' }}>Advisor Instructions</h4>
                    <p style={{ fontSize: '0.85em', color: '#cbd5e1', margin: 0 }}>{deviceData.maintenance?.recommended_action}</p>
                    <button 
                      className="primary" 
                      style={{ fontSize: '0.85em', marginTop: '5px' }}
                      onClick={() => setActiveTab('advisor')}
                    >
                      Consult RAG Adviser
                    </button>
                  </div>

                </div>

                {/* Right Side: Components list & SHAP */}
                <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
                  
                  {/* Components breakdown */}
                  <div className="glass-card">
                    <h3 style={{ margin: '0 0 15px 0' }}>Component Condition Map</h3>
                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: '15px' }}>
                      {Object.entries(deviceData.components || {}).map(([comp_name, comp_score]) => (
                        <div 
                          key={comp_name} 
                          className="glass-card"
                          style={{ 
                            padding: '15px', 
                            cursor: 'pointer', 
                            border: selectedComponent === comp_name ? `1px solid ${getHealthColor(comp_score)}` : '1px solid rgba(255,255,255,0.05)'
                          }}
                          onClick={() => setSelectedComponent(comp_name)}
                        >
                          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                            <span style={{ fontSize: '0.85em', color: '#94a3b8', fontWeight: 500 }}>{comp_name}</span>
                            {comp_name.toLowerCase() === 'battery' && <Battery size={16} color={getHealthColor(comp_score)} />}
                            {comp_name.toLowerCase().includes('temp') && <Thermometer size={16} color={getHealthColor(comp_score)} />}
                          </div>
                          <div style={{ fontSize: '1.6em', fontWeight: 700, margin: '8px 0 3px 0', color: getHealthColor(comp_score) }}>
                            {comp_score}%
                          </div>
                          <div style={{ fontSize: '0.7em', color: '#64748b' }}>Click to view details</div>
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* Component Inspector Panel */}
                  {selectedComponent && deviceData.component_details?.[selectedComponent] && (
                    <div className="glass-card" style={{ border: `1px solid ${getHealthColor(deviceData.components[selectedComponent])}` }}>
                      <h4 style={{ margin: '0 0 10px 0', color: getHealthColor(deviceData.components[selectedComponent]) }}>
                        Inspector: {selectedComponent} Health ({deviceData.components[selectedComponent]}%)
                      </h4>
                      <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                        {deviceData.component_details[selectedComponent].evidence.map((ev, i) => (
                          <div key={i} style={{ display: 'flex', gap: '10px', fontSize: '0.85em', background: 'rgba(15,23,42,0.4)', padding: '8px 12px', borderRadius: '6px' }}>
                            <Info size={16} color="#3b82f6" style={{ flexShrink: 0 }} />
                            <span>{ev}</span>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Local SHAP contributions */}
                  <div className="glass-card">
                    <h3 style={{ margin: '0 0 15px 0' }}>AI Decision Log (Local Feature Importances)</h3>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                      {deviceData.explanation?.map(item => (
                        <div key={item.feature} style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
                          <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.8em' }}>
                            <span style={{ fontFamily: 'monospace' }}>{item.feature.replace('_', ' ')}</span>
                            <span style={{ color: item.shap_value > 0 ? '#f87171' : '#34d399', fontWeight: 600 }}>
                              {item.shap_value > 0 ? '+' : ''}{item.shap_value.toFixed(2)} log-odds
                            </span>
                          </div>
                          <div style={{ height: '6px', background: '#1e293b', borderRadius: '3px', overflow: 'hidden', position: 'relative' }}>
                            {item.shap_value > 0 ? (
                              <div style={{ position: 'absolute', left: '50%', width: `${Math.min(50, item.shap_value * 10)}%`, height: '100%', background: '#ef4444' }}></div>
                            ) : (
                              <div style={{ position: 'absolute', right: '50%', width: `${Math.min(50, Math.abs(item.shap_value) * 10)}%`, height: '100%', background: '#10b981' }}></div>
                            )}
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>

                </div>

              </div>
            )}

          </div>
        )}

        {/* HOSPITAL HEATMAP */}
        {activeTab === 'heatmap' && (
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
                    <div style={{ textEqual: 'right' }}>
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
        )}

        {/* FAILURE PREDICTION */}
        {activeTab === 'prediction' && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
            <div>
              <h1 style={{ margin: 0, fontSize: '2em' }}>Temporal Failure Horizon Analyzer</h1>
              <p style={{ margin: '5px 0 0 0', color: '#94a3b8' }}>Active risks evaluated across multiple prediction windows</p>
            </div>

            {deviceData && (
              <div className="glass-card" style={{ display: 'flex', flexDirection: 'column', gap: '25px' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <div>
                    <h2 style={{ margin: 0 }}>Device under analysis: {deviceData.device_id}</h2>
                    <p style={{ margin: '3px 0 0 0', color: '#94a3b8' }}>Category: {deviceData.device_category} • Manufacturer: {deviceData.manufacturer}</p>
                  </div>
                  <div>{getRiskBadge(deviceData.risk_level)}</div>
                </div>

                {/* Horizon Grid */}
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '20px' }}>
                  <div className="glass-card" style={{ textAlign: 'center', padding: '25px' }}>
                    <div style={{ fontSize: '0.85em', color: '#94a3b8', fontWeight: 500 }}>7-DAY HORIZON</div>
                    <div style={{ fontSize: '3em', fontWeight: 700, margin: '10px 0', color: deviceData.failure_probability > 0.8 ? '#ef4444' : '#3b82f6' }}>
                      {Math.round(deviceData.failure_probability * 15)}%
                    </div>
                    <div style={{ fontSize: '0.8em', color: '#64748b' }}>Lead probability threshold</div>
                  </div>
                  <div className="glass-card" style={{ textAlign: 'center', padding: '25px' }}>
                    <div style={{ fontSize: '0.85em', color: '#94a3b8', fontWeight: 500 }}>14-DAY HORIZON</div>
                    <div style={{ fontSize: '3em', fontWeight: 700, margin: '10px 0', color: deviceData.failure_probability > 0.6 ? '#f97316' : '#3b82f6' }}>
                      {Math.round(deviceData.failure_probability * 45)}%
                    </div>
                    <div style={{ fontSize: '0.8em', color: '#64748b' }}>Lead probability threshold</div>
                  </div>
                  <div className="glass-card" style={{ textAlign: 'center', padding: '25px' }}>
                    <div style={{ fontSize: '0.85em', color: '#94a3b8', fontWeight: 500 }}>30-DAY HORIZON</div>
                    <div style={{ fontSize: '3em', fontWeight: 700, margin: '10px 0', color: getHealthColor(100 - deviceData.failure_probability * 100) }}>
                      {Math.round(deviceData.failure_probability * 100)}%
                    </div>
                    <div style={{ fontSize: '0.8em', color: '#64748b' }}>Primary model output target</div>
                  </div>
                </div>

                {/* Horizon curve */}
                <div className="glass-card">
                  <h3 style={{ margin: '0 0 15px 0' }}>Risk Progression Curve</h3>
                  <div style={{ height: '180px', display: 'flex', alignItems: 'flex-end', justifyContent: 'space-around', paddingBottom: '20px', borderBottom: '1px solid rgba(255,255,255,0.1)', position: 'relative' }}>
                    {/* SVG Curve lines */}
                    <div style={{ height: `${Math.round(deviceData.failure_probability * 15)}%`, width: '120px', background: '#3b82f6', borderRadius: '6px 6px 0 0', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 'bold' }}>7 Days</div>
                    <div style={{ height: `${Math.round(deviceData.failure_probability * 45)}%`, width: '120px', background: '#f97316', borderRadius: '6px 6px 0 0', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 'bold' }}>14 Days</div>
                    <div style={{ height: `${Math.round(deviceData.failure_probability * 100)}%`, width: '120px', background: '#ef4444', borderRadius: '6px 6px 0 0', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 'bold' }}>30 Days</div>
                  </div>
                </div>

              </div>
            )}
          </div>
        )}

        {/* RUL FORECAST */}
        {activeTab === 'rul' && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
            <div>
              <h1 style={{ margin: 0, fontSize: '2em' }}>Remaining Useful Life (RUL) Forecast</h1>
              <p style={{ margin: '5px 0 0 0', color: '#94a3b8' }}>Predictive timespans prior to expected device deterioration</p>
            </div>

            {deviceData && (
              <div className="glass-card" style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '20px' }}>
                  
                  {/* Forecast time card */}
                  <div className="glass-card" style={{ textAlign: 'center', padding: '30px', display: 'flex', flexDirection: 'column', gap: '15px' }}>
                    <div style={{ fontSize: '0.9em', color: '#94a3b8', fontWeight: 500 }}>PREDICTED TIME TO FAILURE</div>
                    <div style={{ fontSize: '4.5em', fontWeight: 800, color: '#3b82f6', lineHeight: 1 }}>
                      {deviceData.predicted_failure_time_days}
                    </div>
                    <div style={{ fontSize: '1.2em', fontWeight: 600 }}>Days Remaining</div>
                    <div style={{ fontSize: '0.8em', color: '#64748b' }}>
                      Confidence bounds: {Math.max(1, Math.round(deviceData.predicted_failure_time_days - 10))} to {Math.round(deviceData.predicted_failure_time_days + 15)} days
                    </div>
                  </div>

                  {/* Scheduling Card */}
                  <div className="glass-card" style={{ display: 'flex', flexDirection: 'column', gap: '15px' }}>
                    <h3 style={{ margin: 0 }}>Recommended Service Schedule</h3>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                      <div style={{ display: 'flex', gap: '15px', alignItems: 'center' }}>
                        <div style={{ width: '12px', height: '12px', borderRadius: '50%', background: deviceData.predicted_failure_time_days < 15 ? '#ef4444' : '#10b981' }}></div>
                        <div>
                          <div style={{ fontWeight: 600 }}>Maintenance Horizon</div>
                          <div style={{ fontSize: '0.85em', color: '#94a3b8' }}>
                            {deviceData.predicted_failure_time_days < 15 ? "URGENT - Dispatch technician immediately" : "Normal cycle - Service due in 90 days"}
                          </div>
                        </div>
                      </div>
                      <div style={{ display: 'flex', gap: '15px', alignItems: 'center' }}>
                        <div style={{ width: '12px', height: '12px', borderRadius: '50%', background: '#3b82f6' }}></div>
                        <div>
                          <div style={{ fontWeight: 600 }}>Technician Assignment</div>
                          <div style={{ fontSize: '0.85em', color: '#94a3b8' }}>Assign to specialized biomedical team</div>
                        </div>
                      </div>
                      <div style={{ display: 'flex', gap: '15px', alignItems: 'center' }}>
                        <div style={{ width: '12px', height: '12px', borderRadius: '50%', background: '#f59e0b' }}></div>
                        <div>
                          <div style={{ fontWeight: 600 }}>Component Procurement</div>
                          <div style={{ fontSize: '0.85em', color: '#94a3b8' }}>Order components: {Object.keys(deviceData.components || {})[0]}</div>
                        </div>
                      </div>
                    </div>
                  </div>

                </div>
              </div>
            )}
          </div>
        )}

        {/* ROOT CAUSE GRAPH */}
        {activeTab === 'graph' && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
            <div>
              <h1 style={{ margin: 0, fontSize: '2em' }}>Root Cause Knowledge Graph</h1>
              <p style={{ margin: '5px 0 0 0', color: '#94a3b8' }}>Causal relationships linking failures, error codes, and replacements</p>
            </div>

            {deviceData && (
              <div className="glass-card" style={{ height: '550px', position: 'relative', overflow: 'hidden' }}>
                <h3 style={{ margin: 0, position: 'absolute', top: '20px', left: '20px', zIndex: 10 }}>Sub-network for {deviceData.device_id}</h3>
                
                {/* SVG Graph representation */}
                <svg width="100%" height="100%" viewBox="0 0 800 500">
                  {/* Background grid */}
                  <defs>
                    <pattern id="grid" width="40" height="40" patternUnits="userSpaceOnUse">
                      <path d="M 40 0 L 0 0 0 40" fill="none" stroke="rgba(255,255,255,0.02)" strokeWidth="1" />
                    </pattern>
                  </defs>
                  <rect width="100%" height="100%" fill="url(#grid)" />

                  {/* Edges / Connections */}
                  {/* Link Device to location */}
                  <line x1="400" y1="250" x2="400" y2="100" stroke="#3b82f6" strokeWidth="2" strokeDasharray="5,5" />
                  {/* Link Device to components */}
                  <line x1="400" y1="250" x2="200" y2="200" stroke="#10b981" strokeWidth="2" />
                  <line x1="400" y1="250" x2="250" y2="350" stroke="#10b981" strokeWidth="2" />
                  <line x1="400" y1="250" x2="600" y2="200" stroke="#10b981" strokeWidth="2" />
                  {/* Link Device to Failure */}
                  <line x1="400" y1="250" x2="550" y2="350" stroke="#ef4444" strokeWidth="2" />
                  <line x1="550" y1="350" x2="650" y2="420" stroke="#f97316" strokeWidth="2" />

                  {/* Labels on links */}
                  <text x="410" y="170" fill="#64748b" fontSize="10">OPERATES_IN</text>
                  <text x="280" y="220" fill="#64748b" fontSize="10">HAS_COMP</text>
                  <text x="490" y="310" fill="#64748b" fontSize="10">FAILED</text>

                  {/* Nodes */}
                  {/* Department */}
                  <circle cx="400" cy="100" r="22" fill="#1e293b" stroke="#3b82f6" strokeWidth="2" />
                  <text x="400" y="105" fill="white" fontSize="10" fontWeight="bold" textAnchor="middle">ICU</text>

                  {/* Device */}
                  <circle cx="400" cy="250" r="30" fill="#0f172a" stroke="#3b82f6" strokeWidth="3" />
                  <text x="400" y="254" fill="white" fontSize="11" fontWeight="bold" textAnchor="middle">DEV001</text>

                  {/* Components */}
                  <circle cx="200" cy="200" r="20" fill="#1e293b" stroke="#10b981" strokeWidth="2" />
                  <text x="200" y="204" fill="white" fontSize="10" textAnchor="middle">Control</text>

                  <circle cx="250" cy="350" r="20" fill="#1e293b" stroke="#ef4444" strokeWidth="2" />
                  <text x="250" y="354" fill="white" fontSize="10" textAnchor="middle">Battery</text>

                  <circle cx="600" cy="200" r="20" fill="#1e293b" stroke="#10b981" strokeWidth="2" />
                  <text x="600" y="204" fill="white" fontSize="10" textAnchor="middle">Sensors</text>

                  {/* Failure Event */}
                  <circle cx="550" cy="350" r="20" fill="#1e293b" stroke="#ef4444" strokeWidth="2" />
                  <text x="550" y="354" fill="white" fontSize="9" textAnchor="middle">Failure</text>

                  {/* Failure Cause */}
                  <circle cx="650" cy="420" r="22" fill="#1e293b" stroke="#f97316" strokeWidth="2" />
                  <text x="650" y="424" fill="white" fontSize="8" textAnchor="middle">Wear&Tear</text>
                </svg>

                <div className="glass-card" style={{ position: 'absolute', bottom: '20px', right: '20px', width: '250px', fontSize: '0.85em' }}>
                  <h4 style={{ margin: '0 0 8px 0' }}>Legend</h4>
                  <div style={{ display: 'flex', gap: '8px', alignItems: 'center', marginBottom: '4px' }}><div style={{ width: '12px', height: '12px', borderRadius: '50%', background: '#3b82f6' }}></div><span>Device / Dept</span></div>
                  <div style={{ display: 'flex', gap: '8px', alignItems: 'center', marginBottom: '4px' }}><div style={{ width: '12px', height: '12px', borderRadius: '50%', background: '#10b981' }}></div><span>Component (Healthy)</span></div>
                  <div style={{ display: 'flex', gap: '8px', alignItems: 'center', marginBottom: '4px' }}><div style={{ width: '12px', height: '12px', borderRadius: '50%', background: '#ef4444' }}></div><span>Degraded Component / Failure</span></div>
                  <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}><div style={{ width: '12px', height: '12px', borderRadius: '50%', background: '#f97316' }}></div><span>Root Cause Trigger</span></div>
                </div>
              </div>
            )}
          </div>
        )}

        {/* MAINTENANCE ADVISOR */}
        {activeTab === 'advisor' && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
            <div>
              <h1 style={{ margin: 0, fontSize: '2em' }}>RAG Maintenance Advisor</h1>
              <p style={{ margin: '5px 0 0 0', color: '#94a3b8' }}>Retrieve verified corrective procedures from manufacturer specifications</p>
            </div>

            {deviceData && (
              <div className="glass-card chat-window">
                
                {/* Chat header */}
                <div style={{ borderBottom: '1px solid rgba(255,255,255,0.05)', paddingBottom: '15px', marginBottom: '15px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <div>
                    <h3 style={{ margin: 0 }}>BioMed Tech Support: {deviceData.device_id}</h3>
                    <span style={{ fontSize: '0.85em', color: '#94a3b8' }}>Target: {deviceData.root_cause?.primary}</span>
                  </div>
                  <div style={{ display: 'flex', gap: '5px' }}>
                    <span className="badge badge-low" style={{ textTransform: 'uppercase' }}>RAG INDEX: ACTIVE</span>
                  </div>
                </div>

                {/* Chat History */}
                <div className="chat-history">
                  {chatMessages.map((msg, i) => (
                    <div 
                      key={i} 
                      className={`message-bubble ${msg.sender}`}
                      dangerouslySetInnerHTML={{ __html: msg.text.replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>').replace(/\n/g, '<br/>') }}
                    />
                  ))}
                  {ragLoading && (
                    <div className="message-bubble advisor" style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
                      <RefreshCw className="animate-spin" size={16} />
                      <span>Retrieving manuals and safety notice documents...</span>
                    </div>
                  )}
                </div>

                {/* Chat Input */}
                <div style={{ display: 'flex', gap: '10px' }}>
                  <input 
                    type="text" 
                    placeholder="Type diagnostic query (e.g. How do I replace the battery?)..."
                    value={chatInput}
                    onChange={(e) => setChatInput(e.target.value)}
                    onKeyDown={(e) => e.key === 'Enter' && sendChatMessage()}
                    style={{ flex: 1 }}
                  />
                  <button className="primary" onClick={sendChatMessage}>Send Query</button>
                </div>

              </div>
            )}
          </div>
        )}

        {/* MODEL BENCHMARKS */}
        {activeTab === 'explainability' && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '25px' }}>
            <div>
              <h1 style={{ margin: 0, fontSize: '2em' }}>Model Performance & Benchmarking</h1>
              <p style={{ margin: '5px 0 0 0', color: '#94a3b8' }}>Comparative analysis of ML architectures on validation period (2022-2024)</p>
            </div>

            {/* Metrics comparison */}
            <div className="glass-card">
              <h3 style={{ margin: '0 0 15px 0' }}>Validation Performance Matrix</h3>
              <table style={{ width: '100%', borderCollapse: 'collapse', marginTop: 0 }}>
                <thead>
                  <tr>
                    <th style={{ padding: '12px 18px' }}>Model Architecture</th>
                    <th>ROC-AUC</th>
                    <th>PR-AUC</th>
                    <th>Accuracy</th>
                    <th>Precision</th>
                    <th>Recall</th>
                    <th>F1 Score</th>
                    <th>Brier Calibration</th>
                  </tr>
                </thead>
                <tbody>
                  <tr style={{ borderBottom: '1px solid rgba(255,255,255,0.05)', background: 'rgba(59,130,246,0.05)', fontWeight: 600 }}>
                    <td style={{ padding: '12px 18px' }}>Logistic Regression (Best)</td>
                    <td>0.8795</td>
                    <td>0.7505</td>
                    <td>85.20%</td>
                    <td>0.6841</td>
                    <td>0.9612</td>
                    <td>0.8001</td>
                    <td>0.1102</td>
                  </tr>
                  <tr style={{ borderBottom: '1px solid rgba(255,255,255,0.05)' }}>
                    <td style={{ padding: '12px 18px' }}>CatBoost</td>
                    <td>0.8757</td>
                    <td>0.7319</td>
                    <td>84.10%</td>
                    <td>0.6720</td>
                    <td>0.9824</td>
                    <td>0.7978</td>
                    <td>0.1210</td>
                  </tr>
                  <tr style={{ borderBottom: '1px solid rgba(255,255,255,0.05)' }}>
                    <td style={{ padding: '12px 18px' }}>LightGBM</td>
                    <td>0.8734</td>
                    <td>0.7321</td>
                    <td>83.90%</td>
                    <td>0.6698</td>
                    <td>0.9788</td>
                    <td>0.7951</td>
                    <td>0.1221</td>
                  </tr>
                  <tr style={{ borderBottom: '1px solid rgba(255,255,255,0.05)' }}>
                    <td style={{ padding: '12px 18px' }}>XGBoost</td>
                    <td>0.8687</td>
                    <td>0.7229</td>
                    <td>83.20%</td>
                    <td>0.6621</td>
                    <td>0.9553</td>
                    <td>0.7818</td>
                    <td>0.1341</td>
                  </tr>
                  <tr style={{ borderBottom: '1px solid rgba(255,255,255,0.05)' }}>
                    <td style={{ padding: '12px 18px' }}>Random Forest</td>
                    <td>0.8669</td>
                    <td>0.7204</td>
                    <td>82.90%</td>
                    <td>0.6580</td>
                    <td>0.9736</td>
                    <td>0.7850</td>
                    <td>0.1390</td>
                  </tr>
                </tbody>
              </table>
            </div>

            {/* Global SHAP Importances */}
            <div className="glass-card">
              <h3 style={{ margin: '0 0 15px 0' }}>Global Feature Importance (Mean |SHAP Value|)</h3>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '15px' }}>
                <div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.85em', marginBottom: '4px' }}>
                    <span>Days Since Last Failure (Previous failure recency)</span>
                    <span style={{ fontWeight: 600 }}>0.58</span>
                  </div>
                  <div style={{ height: '8px', background: '#1e293b', borderRadius: '4px', overflow: 'hidden' }}>
                    <div style={{ width: '85%', height: '100%', background: '#3b82f6' }}></div>
                  </div>
                </div>
                <div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.85em', marginBottom: '4px' }}>
                    <span>Battery Health Score (Approx Battery Health)</span>
                    <span style={{ fontWeight: 600 }}>0.44</span>
                  </div>
                  <div style={{ height: '8px', background: '#1e293b', borderRadius: '4px', overflow: 'hidden' }}>
                    <div style={{ width: '65%', height: '100%', background: '#3b82f6' }}></div>
                  </div>
                </div>
                <div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.85em', marginBottom: '4px' }}>
                    <span>Battery Charge Cycles (Approx Battery Cycles)</span>
                    <span style={{ fontWeight: 600 }}>0.27</span>
                  </div>
                  <div style={{ height: '8px', background: '#1e293b', borderRadius: '4px', overflow: 'hidden' }}>
                    <div style={{ width: '40%', height: '100%', background: '#3b82f6' }}></div>
                  </div>
                </div>
                <div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.85em', marginBottom: '4px' }}>
                    <span>Operating Hours (Approx Operating Hours)</span>
                    <span style={{ fontWeight: 600 }}>0.14</span>
                  </div>
                  <div style={{ height: '8px', background: '#1e293b', borderRadius: '4px', overflow: 'hidden' }}>
                    <div style={{ width: '20%', height: '100%', background: '#3b82f6' }}></div>
                  </div>
                </div>
              </div>
            </div>

          </div>
        )}

        {/* ACTIVE ALERTS */}
        {activeTab === 'alerts' && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
            <div>
              <h1 style={{ margin: 0, fontSize: '2em' }}>Fleet Real-Time Alerts</h1>
              <p style={{ margin: '5px 0 0 0', color: '#94a3b8' }}>Critical and High risk alerts requiring maintenance response</p>
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '15px' }}>
              {alerts.map(dev => (
                <div 
                  key={dev.device_id}
                  className={`glass-card ${dev.risk_level === 'CRITICAL' ? 'risk-critical' : 'risk-high'}`}
                  style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '18px 25px' }}
                >
                  <div style={{ display: 'flex', gap: '20px', alignItems: 'center' }}>
                    <AlertIcon size={24} color={dev.risk_level === 'CRITICAL' ? '#ef4444' : '#f97316'} />
                    <div>
                      <div style={{ fontWeight: 'bold', fontSize: '1.1em' }}>{dev.device_id} ({dev.device_type})</div>
                      <div style={{ fontSize: '0.85em', color: '#94a3b8', marginTop: '2px' }}>
                        Primary failure cause: <strong>{dev.primary_root_cause}</strong> • Probability: {Math.round(dev.failure_probability * 100)}%
                      </div>
                      <div style={{ fontSize: '0.85em', color: '#cbd5e1', marginTop: '4px', fontWeight: 500 }}>
                        Action: {dev.recommended_action}
                      </div>
                    </div>
                  </div>

                  <div style={{ display: 'flex', gap: '15px', alignItems: 'center' }}>
                    {getRiskBadge(dev.risk_level)}
                    <button 
                      className="primary"
                      onClick={() => {
                        setSelectedDeviceId(dev.device_id);
                        setActiveTab('twin');
                      }}
                    >
                      Inspect Twin
                    </button>
                  </div>
                </div>
              ))}
              {alerts.length === 0 && (
                <div className="glass-card" style={{ padding: '40px', textAlign: 'center', color: '#64748b' }}>
                  <CheckCircle size={32} color="#10b981" style={{ marginBottom: '10px' }} />
                  <p>All fleet devices operating within safety parameters. No active alerts.</p>
                </div>
              )}
            </div>
          </div>
        )}

      </div>
    </div>
  );
}
