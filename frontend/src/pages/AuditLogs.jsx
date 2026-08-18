import React from 'react';

export default function AuditLogs({ currentUser, auditLogs, auditPage, setAuditPage }) {
  const isAdmin = currentUser?.role === 'HOSPITAL_ADMIN' || currentUser?.role === 'ADMIN' || currentUser?.role === 'AUDITOR';
  const userAuditLogs = auditLogs.filter(log => {
    if (isAdmin) return true;
    return log.username === currentUser?.username || log.username?.toLowerCase() === currentUser?.role?.toLowerCase();
  });

  const totalAuditCount = userAuditLogs.length;
  const totalAuditPages = Math.ceil(totalAuditCount / 10) || 1;
  const paginatedAuditLogs = userAuditLogs.slice((auditPage - 1) * 10, auditPage * 10);

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <div>
          <h1 style={{ margin: 0, fontSize: '2em' }}>Security & Audit Logs</h1>
          <p style={{ margin: '5px 0 0 0', color: '#94a3b8' }}>
            {isAdmin
              ? 'System-wide chronological audit trail of all user actions across all hospital roles'
              : `Personal security audit trail for user: ${currentUser?.username || currentUser?.role}`}
          </p>
        </div>

        <span
          style={{
            fontSize: '0.85em',
            fontWeight: 700,
            padding: '6px 14px',
            borderRadius: '20px',
            background: isAdmin ? 'rgba(59,130,246,0.15)' : 'rgba(16,185,129,0.15)',
            color: isAdmin ? '#60a5fa' : '#34d399',
            border: `1px solid ${isAdmin ? '#3b82f6' : '#10b981'}`
          }}
        >
          {isAdmin ? '🛡️ ADMIN VIEW (ALL ROLES)' : `👤 PERSONAL AUDIT TRAIL (${currentUser?.username?.toUpperCase() || 'USER'})`}
        </span>
      </div>

      <div className="glass-card" style={{ padding: 0, overflow: 'hidden' }}>
        <table style={{ width: '100%', borderCollapse: 'collapse', marginTop: 0 }}>
          <thead>
            <tr style={{ borderBottom: '1px solid rgba(255,255,255,0.05)' }}>
              <th style={{ padding: '14px 20px', textAlign: 'left' }}>Timestamp</th>
              <th style={{ padding: '14px 20px', textAlign: 'left' }}>User</th>
              <th style={{ padding: '14px 20px', textAlign: 'left' }}>Action</th>
              <th style={{ padding: '14px 20px', textAlign: 'left' }}>Resource</th>
              <th style={{ padding: '14px 20px', textAlign: 'left' }}>Resource ID</th>
              <th style={{ padding: '14px 20px', textAlign: 'left' }}>IP Address</th>
              <th style={{ padding: '14px 20px', textAlign: 'left' }}>Result</th>
            </tr>
          </thead>
          <tbody>
            {paginatedAuditLogs.map((log, idx) => (
              <tr key={log.audit_id || idx} style={{ borderBottom: '1px solid rgba(255,255,255,0.02)', fontSize: '0.85em' }}>
                <td style={{ padding: '12px 20px' }}>{log.timestamp}</td>
                <td style={{ padding: '12px 20px', fontWeight: 600, color: log.username === 'admin' ? '#60a5fa' : '#f8fafc' }}>
                  {log.username}
                </td>
                <td style={{ padding: '12px 20px', fontFamily: 'monospace' }}>{log.action}</td>
                <td style={{ padding: '12px 20px' }}>{log.resource_type}</td>
                <td style={{ padding: '12px 20px', fontFamily: 'monospace' }}>{log.resource_id || '-'}</td>
                <td style={{ padding: '12px 20px' }}>{log.ip_address}</td>
                <td style={{ padding: '12px 20px' }}>
                  {log.success === 1 || log.success === true ? (
                    <span style={{ color: '#10b981', fontWeight: 600 }}>🟢 SUCCESS</span>
                  ) : (
                    <span style={{ color: '#ef4444', fontWeight: 600 }}>🔴 FAILED</span>
                  )}
                </td>
              </tr>
            ))}
            {paginatedAuditLogs.length === 0 && (
              <tr>
                <td colSpan={7} style={{ padding: '30px', textAlign: 'center', color: '#64748b' }}>No audit trails recorded for this role.</td>
              </tr>
            )}
          </tbody>
        </table>

        {/* 10-Item Pagination Controls */}
        {totalAuditCount > 0 && (
          <div style={{ display: 'flex', justifyContent: 'space-between', padding: '14px 20px', alignItems: 'center', borderTop: '1px solid rgba(255,255,255,0.05)', fontSize: '0.82em' }}>
            <span style={{ color: '#94a3b8' }}>
              Showing {((auditPage - 1) * 10) + 1} to {Math.min(auditPage * 10, totalAuditCount)} of {totalAuditCount} audit entries
            </span>
            <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
              <button
                disabled={auditPage === 1}
                onClick={() => setAuditPage(prev => Math.max(1, prev - 1))}
                style={{
                  padding: '5px 12px',
                  borderRadius: '6px',
                  border: '1px solid #334155',
                  background: auditPage === 1 ? 'rgba(30,41,59,0.3)' : '#1e293b',
                  color: auditPage === 1 ? '#64748b' : '#f8fafc',
                  cursor: auditPage === 1 ? 'not-allowed' : 'pointer',
                  fontWeight: 600
                }}
              >
                Previous
              </button>

              <span style={{ padding: '0 8px', fontWeight: 700, color: '#60a5fa' }}>
                Page {auditPage} of {totalAuditPages}
              </span>

              <button
                disabled={auditPage * 10 >= totalAuditCount}
                onClick={() => setAuditPage(prev => prev + 1)}
                style={{
                  padding: '5px 12px',
                  borderRadius: '6px',
                  border: '1px solid #334155',
                  background: auditPage * 10 >= totalAuditCount ? 'rgba(30,41,59,0.3)' : '#1e293b',
                  color: auditPage * 10 >= totalAuditCount ? '#64748b' : '#f8fafc',
                  cursor: auditPage * 10 >= totalAuditCount ? 'not-allowed' : 'pointer',
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
