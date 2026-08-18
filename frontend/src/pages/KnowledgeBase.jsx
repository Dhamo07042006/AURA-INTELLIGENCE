import React, { useState } from 'react';
import { Upload, Eye, FileText, ChevronDown, ChevronUp } from 'lucide-react';

export default function KnowledgeBase({
  currentUser, kbDeviceType, setKbDeviceType, kbManufacturer, setKbManufacturer, kbVersion, setKbVersion,
  handleUploadManual, kbUploadProgress, knowledgeDocs, fetchDocChunks, handleDeleteDoc,
  selectedDocForChunks, setSelectedDocForChunks, chunksLoading, docChunks,
  kbChatLog, setViewedSourceChunk, kbChatLoading, kbChatInput, setKbChatInput, sendKbChatMessage
}) {
  const [expandedChunkIndex, setExpandedChunkIndex] = useState(null);
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
      <div>
        <h1 style={{ margin: 0, fontSize: '2em' }}>Knowledge Base - Manual Vault</h1>
        <p style={{ margin: '5px 0 0 0', color: '#94a3b8' }}>Upload maintenance manuals. Each manual is chunked, vector-indexed and accessible only to your hospital ({currentUser?.hospital_id || 'demo-hospital'}).</p>
      </div>

      {/* Upload Card */}
      <div className="glass-card" style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
        <h3 style={{ margin: 0 }}>📄 Upload Service Manual</h3>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '12px' }}>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
            <label style={{ fontSize: '0.75em', color: '#94a3b8', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Device Type</label>
            <input type="text" placeholder="e.g. Ventilator" value={kbDeviceType} onChange={e => setKbDeviceType(e.target.value)} />
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
            <label style={{ fontSize: '0.75em', color: '#94a3b8', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Manufacturer</label>
            <input type="text" placeholder="e.g. MedStar" value={kbManufacturer} onChange={e => setKbManufacturer(e.target.value)} />
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
            <label style={{ fontSize: '0.75em', color: '#94a3b8', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Version</label>
            <input type="text" placeholder="e.g. 2.1" value={kbVersion} onChange={e => setKbVersion(e.target.value)} />
          </div>
        </div>

        <div style={{ border: '2px dashed rgba(99,102,241,0.35)', borderRadius: '10px', padding: '24px', textAlign: 'center', background: 'rgba(99,102,241,0.04)', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '10px' }}>
          <Upload size={28} color="#6366f1" />
          <div style={{ fontSize: '0.9em', color: '#94a3b8' }}>Accepts <strong>.txt</strong>, <strong>.pdf</strong>, <strong>.docx</strong>, <strong>.csv</strong></div>
          <input type="file" id="manualFile" style={{ display: 'none' }} accept=".txt,.pdf,.docx,.doc,.csv" onChange={handleUploadManual} />
          <button className="primary" onClick={() => { document.getElementById('manualFile').value = ''; document.getElementById('manualFile').click(); }}>
            Select & Upload Manual
          </button>
          {kbUploadProgress && (
            <div style={{
              fontSize: '0.85em',
              padding: '8px 14px',
              borderRadius: '6px',
              background: kbUploadProgress.startsWith('✅') ? 'rgba(16,185,129,0.15)'
                : kbUploadProgress.startsWith('❌') ? 'rgba(239,68,68,0.15)'
                  : 'rgba(99,102,241,0.15)',
              color: kbUploadProgress.startsWith('✅') ? '#10b981'
                : kbUploadProgress.startsWith('❌') ? '#ef4444'
                  : '#6366f1',
              width: '100%'
            }}>{kbUploadProgress}</div>
          )}
        </div>
      </div>

      {/* Manuals Database Table */}
      <div className="glass-card" style={{ padding: 0, overflow: 'hidden' }}>
        <div style={{ padding: '16px 20px', borderBottom: '1px solid rgba(255,255,255,0.05)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <h3 style={{ margin: 0 }}>📚 Manuals Database - Hospital: <span style={{ color: '#6366f1' }}>{currentUser?.hospital_id || 'demo-hospital'}</span></h3>
          <span style={{ fontSize: '0.8em', color: '#64748b' }}>{knowledgeDocs.length} manual{knowledgeDocs.length !== 1 ? 's' : ''} indexed</span>
        </div>
        {knowledgeDocs.length === 0 ? (
          <div style={{ padding: '40px', textAlign: 'center', color: '#64748b' }}>
            <div style={{ fontSize: '2em', marginBottom: '8px' }}>📂</div>
            <div>No manuals uploaded yet for <strong>{currentUser?.hospital_id || 'demo-hospital'}</strong>.</div>
            <div style={{ fontSize: '0.8em', marginTop: '4px' }}>Upload a .txt, .pdf, or .docx manual above to get started.</div>
          </div>
        ) : (
          <table style={{ width: '100%', borderCollapse: 'collapse' }}>
            <thead>
              <tr style={{ borderBottom: '1px solid rgba(255,255,255,0.05)', fontSize: '0.75em', color: '#64748b', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                <th style={{ padding: '12px 20px', textAlign: 'left' }}>Filename</th>
                <th style={{ padding: '12px 20px', textAlign: 'left' }}>Device Type</th>
                <th style={{ padding: '12px 20px', textAlign: 'left' }}>Manufacturer</th>
                <th style={{ padding: '12px 20px', textAlign: 'left' }}>Version</th>
                <th style={{ padding: '12px 20px', textAlign: 'center' }}>Chunks</th>
                <th style={{ padding: '12px 20px', textAlign: 'left' }}>Uploaded</th>
                <th style={{ padding: '12px 20px', textAlign: 'left' }}>By</th>
                <th style={{ padding: '12px 20px', textAlign: 'center' }}>Status</th>
                <th style={{ padding: '12px 20px', textAlign: 'center' }}>Action</th>
              </tr>
            </thead>
            <tbody>
              {knowledgeDocs.map(doc => (
                <tr key={doc.document_id} style={{ borderBottom: '1px solid rgba(255,255,255,0.03)', fontSize: '0.85em' }}>
                  <td style={{ padding: '12px 20px' }}>
                    <div style={{ fontWeight: 600, maxWidth: '180px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }} title={doc.filename}>📄 {doc.filename}</div>
                    <div style={{ fontSize: '0.75em', color: '#64748b', fontFamily: 'monospace' }}>{doc.document_id}</div>
                  </td>
                  <td style={{ padding: '12px 20px' }}>{doc.device_type || '-'}</td>
                  <td style={{ padding: '12px 20px' }}>{doc.manufacturer || '-'}</td>
                  <td style={{ padding: '12px 20px' }}>v{doc.model_version || doc.document_version || '1.0'}</td>
                  <td style={{ padding: '12px 20px', textAlign: 'center' }}>
                    <button
                      style={{ background: 'rgba(99,102,241,0.15)', border: '1px solid rgba(99,102,241,0.3)', color: '#6366f1', padding: '4px 12px', borderRadius: '12px', fontWeight: 700, fontSize: '0.85em', cursor: 'pointer', display: 'inline-flex', alignItems: 'center', gap: '6px' }}
                      onClick={() => fetchDocChunks(doc)}
                      title="Click to view all segmented text chunks in SQL database"
                    >
                      <Eye size={13} /> {doc.chunk_count ?? 0} Chunks
                    </button>
                  </td>
                  <td style={{ padding: '12px 20px', fontSize: '0.8em', color: '#94a3b8' }}>{doc.upload_timestamp ? doc.upload_timestamp.replace('T', ' ').replace('Z', '') : '-'}</td>
                  <td style={{ padding: '12px 20px' }}>{doc.uploaded_by || '-'}</td>
                  <td style={{ padding: '12px 20px', textAlign: 'center' }}>
                    <span style={{
                      padding: '2px 10px', borderRadius: '12px', fontSize: '0.8em', fontWeight: 600,
                      background: doc.status === 'enabled' ? 'rgba(16,185,129,0.15)' : 'rgba(239,68,68,0.15)',
                      color: doc.status === 'enabled' ? '#10b981' : '#ef4444'
                    }}>
                      {doc.status === 'enabled' ? '✅ Active' : '⛔ Disabled'}
                    </span>
                  </td>
                  <td style={{ padding: '12px 20px', textAlign: 'center' }}>
                    <button
                      style={{ background: 'rgba(239,68,68,0.1)', border: '1px solid rgba(239,68,68,0.3)', borderRadius: '6px', padding: '4px 10px', cursor: 'pointer', color: '#ef4444', fontSize: '0.8em' }}
                      onClick={() => { if (window.confirm('Delete this manual and all its chunks?')) handleDeleteDoc(doc.document_id); }}
                    >
                      🗑 Delete
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>

      {/* SQL Document Chunks Inspection Viewer */}
      {selectedDocForChunks && (
        <div className="glass-card" style={{ border: '1px solid rgba(99,102,241,0.3)', display: 'flex', flexDirection: 'column', gap: '14px', background: 'rgba(15,23,42,0.95)' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: '1px solid rgba(255,255,255,0.05)', paddingBottom: '10px' }}>
            <div>
              <h3 style={{ margin: 0, color: '#6366f1' }}>🔍 SQL Vector Chunks: {selectedDocForChunks.filename}</h3>
              <div style={{ fontSize: '0.75em', color: '#64748b', marginTop: '2px' }}>Document ID: {selectedDocForChunks.document_id} • Device: {selectedDocForChunks.device_type} • Hospital: {selectedDocForChunks.hospital_id}</div>
            </div>
            <button
              style={{ background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.1)', color: '#94a3b8', borderRadius: '6px', padding: '4px 10px', cursor: 'pointer' }}
              onClick={() => setSelectedDocForChunks(null)}
            >
              ✕ Close Viewer
            </button>
          </div>

          {chunksLoading ? (
            <div style={{ padding: '20px', textAlign: 'center', color: '#6366f1' }}>Loading SQL chunks...</div>
          ) : docChunks.length === 0 ? (
            <div style={{ padding: '20px', textAlign: 'center', color: '#64748b' }}>No chunks found for this document.</div>
          ) : (
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px', maxHeight: '320px', overflowY: 'auto' }}>
              {docChunks.map((c, idx) => (
                <div key={idx} style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.05)', borderRadius: '8px', padding: '12px', display: 'flex', flexDirection: 'column', gap: '6px', fontSize: '0.85em' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.75em', color: '#6366f1', fontWeight: 600 }}>
                    <span>📌 Chunk #{idx + 1} — {c.section}</span>
                    <span>Page {c.page}</span>
                  </div>
                  <div style={{ color: '#e2e8f0', fontFamily: 'monospace', fontSize: '0.8em', background: 'rgba(0,0,0,0.3)', padding: '8px', borderRadius: '4px', whiteSpace: 'pre-wrap', maxHeight: '120px', overflowY: 'auto' }}>
                    {c.text_content}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* RAG Chat */}
      <div className="glass-card" style={{ display: 'flex', flexDirection: 'column', height: '480px' }}>
        <h3 style={{ margin: '0 0 10px 0' }}>💬 Grounded Knowledge QA — Ask your uploaded manuals</h3>
        <div className="chat-history" style={{ flex: 1, overflowY: 'auto' }}>
          {kbChatLog.map((msg, i) => (
            <div key={i} className={`message-bubble ${msg.sender}`} style={{ position: 'relative' }}>
              <div dangerouslySetInnerHTML={{ __html: msg.text }} />
              {msg.rawSource && (
                <div style={{ marginTop: '8px' }}>
                  <button
                    style={{
                      background: expandedChunkIndex === i ? 'rgba(99,102,241,0.2)' : 'rgba(255,255,255,0.05)',
                      border: '1px solid rgba(99,102,241,0.4)',
                      color: expandedChunkIndex === i ? '#818cf8' : 'var(--text-secondary)',
                      padding: '4px 10px',
                      fontSize: '0.78em',
                      fontWeight: 600,
                      cursor: 'pointer',
                      borderRadius: '6px',
                      display: 'inline-flex',
                      alignItems: 'center',
                      gap: '5px'
                    }}
                    onClick={() => setExpandedChunkIndex(expandedChunkIndex === i ? null : i)}
                  >
                    <FileText size={13} />
                    <span>{expandedChunkIndex === i ? 'Hide Source Chunk' : 'View Source Chunk'}</span>
                    {expandedChunkIndex === i ? <ChevronUp size={13} /> : <ChevronDown size={13} />}
                  </button>

                  {expandedChunkIndex === i && (
                    <div
                      style={{
                        marginTop: '8px',
                        background: 'rgba(15,23,42,0.95)',
                        border: '1px solid rgba(99,102,241,0.4)',
                        borderRadius: '8px',
                        padding: '12px',
                        display: 'flex',
                        flexDirection: 'column',
                        gap: '8px',
                        fontSize: '0.82em',
                        animation: 'fadeIn 0.2s ease-in-out'
                      }}
                    >
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: '1px solid rgba(255,255,255,0.08)', paddingBottom: '6px' }}>
                        <span style={{ fontWeight: 700, color: '#818cf8', display: 'flex', alignItems: 'center', gap: '6px' }}>
                          📌 Retrieved Manual Chunk
                        </span>
                        {typeof msg.rawSource === 'object' && msg.rawSource.score && (
                          <span style={{ fontSize: '0.72em', background: 'rgba(16,185,129,0.15)', color: '#34d399', border: '1px solid #10b981', padding: '2px 8px', borderRadius: '10px', fontWeight: 700 }}>
                            {msg.rawSource.score} Match
                          </span>
                        )}
                      </div>

                      {typeof msg.rawSource === 'object' ? (
                        <>
                          <div style={{ display: 'flex', gap: '15px', fontSize: '0.78em', color: '#94a3b8', flexWrap: 'wrap' }}>
                            <span>📄 Document: <strong style={{ color: '#f8fafc' }}>{msg.rawSource.source}</strong></span>
                            <span>📁 Section: <strong style={{ color: '#f8fafc' }}>{msg.rawSource.section}</strong></span>
                            <span>📖 Page: <strong style={{ color: '#f8fafc' }}>{msg.rawSource.page}</strong></span>
                          </div>
                          <div style={{ color: '#cbd5e1', fontFamily: 'monospace', fontSize: '0.8em', background: 'rgba(0,0,0,0.4)', border: '1px solid rgba(255,255,255,0.06)', padding: '10px', borderRadius: '6px', whiteSpace: 'pre-wrap', maxHeight: '160px', overflowY: 'auto' }}>
                            {msg.rawSource.evidence || msg.rawSource.text}
                          </div>
                        </>
                      ) : (
                        <div style={{ color: '#cbd5e1', fontFamily: 'monospace', fontSize: '0.8em', background: 'rgba(0,0,0,0.4)', border: '1px solid rgba(255,255,255,0.06)', padding: '10px', borderRadius: '6px', whiteSpace: 'pre-wrap', maxHeight: '160px', overflowY: 'auto' }}>
                          {msg.rawSource}
                        </div>
                      )}
                    </div>
                  )}
                </div>
              )}
            </div>
          ))}
          {kbChatLoading && <div className="message-bubble advisor">🔍 Searching manual chunks...</div>}
        </div>
        <div style={{ display: 'flex', gap: '10px', paddingTop: '10px', borderTop: '1px solid rgba(255,255,255,0.05)' }}>
          <input type="text" placeholder="e.g. How to replace the ventilator battery?" value={kbChatInput} onChange={e => setKbChatInput(e.target.value)} onKeyDown={e => e.key === 'Enter' && sendKbChatMessage()} style={{ flex: 1 }} />
          <button className="primary" onClick={sendKbChatMessage} disabled={kbChatLoading}>Query RAG</button>
        </div>
      </div>
    </div>
  );
}
