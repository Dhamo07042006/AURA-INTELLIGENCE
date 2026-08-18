import React from 'react';
import { RefreshCw } from 'lucide-react';

export default function RagAdvisorChat({
  deviceData, chatMessages, ragLoading, chatInput, setChatInput, sendChatMessage
}) {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
      <div>
        <h1 style={{ margin: 0, fontSize: '2em' }}>RAG Maintenance Advisor</h1>
        <p style={{ margin: '5px 0 0 0', color: 'var(--text-muted)' }}>Query verified manufacturer specifications and get xAI Grok evidence summary</p>
      </div>

      {deviceData && (
        <div className="glass-card chat-window" style={{ height: '560px' }}>
          <div style={{ borderBottom: '1px solid var(--border-light)', paddingBottom: '12px', marginBottom: '12px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <div>
              <h3 style={{ margin: 0 }}>Grok AI Biomed Support: {deviceData.device_id}</h3>
              <span style={{ fontSize: '0.8em', color: 'var(--text-muted)' }}>Target component: {deviceData.root_cause?.primary}</span>
            </div>
            <span className="badge badge-low">RAG GROK-4.5 ENGINE</span>
          </div>

          <div className="chat-history" style={{ flex: 1, overflowY: 'auto', marginBottom: '15px' }}>
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
                <span>Grok-4.5 synthesizing live telemetry + verified manuals...</span>
              </div>
            )}
          </div>

          <div style={{ display: 'flex', gap: '10px' }}>
            <input
              type="text"
              placeholder="Ask questions about device state or manual procedures..."
              value={chatInput}
              onChange={(e) => setChatInput(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && sendChatMessage()}
              style={{ flex: 1 }}
            />
            <button className="primary" onClick={sendChatMessage}>Query Grok</button>
          </div>
        </div>
      )}
    </div>
  );
}
