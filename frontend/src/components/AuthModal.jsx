import React from 'react';
import { Activity } from 'lucide-react';

export default function AuthModal({
  loginError,
  loginUsername,
  setLoginUsername,
  loginPassword,
  setLoginPassword,
  handleLogin,
  selectedRole,
  setSelectedRole
}) {
  const roles = [
    { key: 'admin', title: '👑 Admin', color: '#2563eb' },
    { key: 'biomed', title: '🔧 BioMed Eng', color: '#4f46e5' },
    { key: 'operator', title: '🏥 Operator', color: '#ea580c' },
    { key: 'auditor', title: '📄 Auditor', color: '#059669' }
  ];

  return (
    <div className="app-container" style={{ justifyContent: 'center', alignItems: 'center', height: '100vh', background: 'radial-gradient(circle at center, #f8fafc 0%, #cbd5e1 100%)' }}>
      <div className="glass-card" style={{ width: '460px', padding: '40px', display: 'flex', flexDirection: 'column', gap: '25px', border: '1px solid var(--border-color)', boxShadow: '0 10px 25px -5px rgba(0,0,0,0.05)' }}>
        <div style={{ textAlign: 'center' }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '10px', marginBottom: '10px' }}>
            <Activity size={36} color="#3b82f6" />
            <span style={{ fontSize: '1.6em', fontWeight: 800, letterSpacing: '0.05em', color: 'var(--text-primary)' }}>AURA INTELLIGENCE</span>
          </div>
          <span style={{ fontSize: '0.85em', color: 'var(--text-muted)' }}>AI-Powered Reliability &amp; Multi-Tenant Predictive Platform</span>
        </div>

        {loginError && (
          <div style={{ background: 'rgba(239,68,68,0.1)', border: '1px solid rgba(239,68,68,0.2)', color: '#dc2626', padding: '12px', borderRadius: '6px', fontSize: '0.85em', textAlign: 'center', fontWeight: 500 }}>
            {loginError}
          </div>
        )}

        <form onSubmit={handleLogin} style={{ display: 'flex', flexDirection: 'column', gap: '15px' }}>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
            <label style={{ fontSize: '0.8em', color: 'var(--text-secondary)', fontWeight: 500 }}>Email Address</label>
            <input
              type="email"
              value={loginUsername}
              placeholder="abc@gmail.com"
              style={{ background: 'var(--input-bg)', border: '1px solid var(--input-border)', color: 'var(--text-primary)' }}
              onChange={e => setLoginUsername(e.target.value)}
              required
            />
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
            <label style={{ fontSize: '0.8em', color: 'var(--text-secondary)', fontWeight: 500 }}>Password</label>
            <input
              type="password"
              value={loginPassword}
              placeholder="Enter password"
              style={{ background: 'var(--input-bg)', border: '1px solid var(--input-border)', color: 'var(--text-primary)' }}
              onChange={e => setLoginPassword(e.target.value)}
              required
            />
          </div>

          <button className="primary" type="submit" style={{ padding: '12px', fontWeight: 'bold', fontSize: '1em', marginTop: '10px' }}>
            Authenticate &amp; Login
          </button>
        </form>

        {/* Quick Profiles */}
        <div style={{ borderTop: '1px solid var(--border-light)', paddingTop: '20px' }}>
          <span style={{ fontSize: '0.75em', color: 'var(--text-muted)', display: 'block', marginBottom: '10px', fontWeight: 600 }}>SELECT ROLE PROFILE</span>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px', fontSize: '0.8em' }}>
            {roles.map(r => {
              const isSelected = selectedRole === r.key;
              return (
                <button
                  key={r.key}
                  type="button"
                  style={{
                    padding: '10px',
                    background: isSelected ? `${r.color}15` : '#f8fafc',
                    border: isSelected ? `2px solid ${r.color}` : '1px solid var(--border-color)',
                    borderRadius: '8px',
                    color: r.color,
                    cursor: 'pointer',
                    textAlign: 'left',
                    fontWeight: isSelected ? 700 : 500,
                    boxShadow: isSelected ? `0 0 12px ${r.color}40` : 'none',
                    transition: 'all 0.2s ease-in-out'
                  }}
                  onClick={() => setSelectedRole(prev => prev === r.key ? null : r.key)}
                >
                  {r.title}
                </button>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
}
