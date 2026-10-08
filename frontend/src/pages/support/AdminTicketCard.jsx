import { useState } from 'react';

/* ─── Admin ticket card with live reply ─────────────────────── */
export default function AdminTicketCard({ ticket, onStatusChange, onReply, darkMode = false }) {
  const [showReply, setShowReply] = useState(false);
  const [reply,     setReply]     = useState(ticket.adminReply || '');
  const [saving,    setSaving]    = useState(false);
  const [saved,     setSaved]     = useState(false);

  const cardBg = darkMode ? '#101a17' : '#fff';
  const borderColor = darkMode ? (ticket.status === 'Open' ? '#5f4c36' : '#2d584b') : '#dfe6e1';
  const textColor = darkMode ? '#edf7f2' : '#0f172a';
  const subText = darkMode ? '#b8c9c3' : '#64748b';
  const muted = darkMode ? '#8fa59c' : '#68786e';
  const tagBg = darkMode ? '#162922' : '#f1f5f9';
  const tagText = darkMode ? '#d9f8eb' : '#356451';
  const panelBg = darkMode ? '#162d27' : '#f3f7f4';
  const panelBorder = darkMode ? '#2d584b' : '#dce6df';
  const panelText = darkMode ? '#daf2e6' : '#35483c';
  const textareaBg = darkMode ? '#0c1715' : '#f8fafc';
  const textareaBorder = darkMode ? '#324c45' : '#e2e8f0';
  const actionBg = darkMode ? '#171f1d' : '#f8fafc';
  const actionText = darkMode ? '#dcefe8' : '#506157';
  const actionBorder = darkMode ? '#32443f' : '#d8e1da';

  const submitReply = async () => {
    if (!reply.trim()) return;
    setSaving(true);
    await onReply(reply.trim());
    setSaving(false);
    setSaved(true);
    setTimeout(() => { setSaved(false); setShowReply(false); }, 1500);
  };

  return (
    <div className="tkt-row support-ticket-card" data-status={ticket.status.toLowerCase()} style={{
      background: cardBg, borderRadius: 16,
      border: `1.5px solid ${borderColor}`,
      padding: '20px 24px', boxShadow: darkMode ? '0 10px 24px rgba(0,0,0,.15)' : '0 2px 8px rgba(0,0,0,.04)', transition: 'background .15s',
    }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: 14 }}>

        {/* Left: ticket info */}
        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 8, flexWrap: 'wrap' }}>
            <div style={{ width: 32, height: 32, borderRadius: '50%', background: darkMode ? 'linear-gradient(135deg,#6366f1,#8b5cf6)' : 'linear-gradient(135deg,#25825d,#176b50)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
              <span style={{ fontSize: 13, fontWeight: 800, color: '#fff', fontFamily: "'Sora',sans-serif" }}>{ticket.name?.[0]?.toUpperCase() || '?'}</span>
            </div>
            <span style={{ fontSize: 14, fontWeight: 900, color: textColor, fontFamily: "'Sora',sans-serif" }}>{ticket.name}</span>
            <span style={{ fontSize: 12, color: subText }}>{ticket.email}</span>

            {ticket.user ? (
              <span style={{ fontSize: 10, background: darkMode ? '#17382d' : '#ecfdf5', color: darkMode ? '#a9f0c7' : '#059669', padding: '3px 9px', borderRadius: 999, fontWeight: 800, border: darkMode ? '1px solid #2a5b4c' : '1px solid #bbf7d0', fontFamily: "'Sora',sans-serif" }}>👤 Registered</span>
            ) : (
              <span style={{ fontSize: 10, background: darkMode ? '#1b2320' : '#f3f6f4', color: darkMode ? '#c3d5cf' : '#59685f', padding: '3px 9px', borderRadius: 999, fontWeight: 700, border: darkMode ? '1px solid #33463e' : '1px solid #dfe6e1', fontFamily: "'Sora',sans-serif" }}>👻 Guest</span>
            )}

            {ticket.orderId && (
              <span style={{ fontSize: 11, background: darkMode ? '#1d2c38' : '#eff6ff', color: darkMode ? '#c7defd' : '#2563eb', padding: '3px 10px', borderRadius: 999, fontWeight: 700, fontFamily: "'JetBrains Mono',monospace" }}>
                Order #{ticket.orderId.slice(-8).toUpperCase()}
              </span>
            )}
          </div>

          <p style={{ margin: '0 0 5px', fontSize: 13, fontWeight: 800, color: darkMode ? '#dfeae4' : '#1e3027', display: 'flex', alignItems: 'center', gap: 6 }}>
            <span style={{ background: tagBg, borderRadius: 6, padding: '2px 8px', fontSize: 11, color: tagText, fontWeight: 700 }}>{ticket.subject || 'General'}</span>
          </p>
          <p style={{ margin: '0 0 8px', fontSize: 13, color: subText, lineHeight: 1.65, fontFamily: "'Sora',sans-serif" }}>{ticket.message}</p>
          <p style={{ margin: 0, fontSize: 11, color: muted, fontFamily: "'JetBrains Mono',monospace" }}>
            Submitted: {new Date(ticket.createdAt).toLocaleString('en-PK')}
            {ticket.resolvedAt && <span style={{ color: darkMode ? '#a7f3d0' : '#10b981' }}> · Resolved: {new Date(ticket.resolvedAt).toLocaleString('en-PK')}</span>}
          </p>

          {/* Existing reply display */}
          {ticket.adminReply && !showReply && (
            <div style={{ marginTop: 10, background: panelBg, border: `1px solid ${panelBorder}`, borderRadius: 10, padding: '10px 14px' }}>
              <p style={{ margin: '0 0 2px', fontSize: 10, fontWeight: 800, color: darkMode ? '#a7f3d0' : '#059669', textTransform: 'uppercase', letterSpacing: '0.5px' }}>✍️ Your Reply (visible to user)</p>
              <p style={{ margin: 0, fontSize: 12, color: panelText, lineHeight: 1.6 }}>{ticket.adminReply}</p>
            </div>
          )}

          {/* Reply textarea */}
          {showReply && (
            <div style={{ marginTop: 12 }}>
              <textarea
                style={{ width: '100%', padding: '10px 13px', border: `1.5px solid ${textareaBorder}`, borderRadius: 10, fontSize: 13, fontFamily: "'Sora',sans-serif", color: darkMode ? '#edf7f2' : '#1e293b', boxSizing: 'border-box', resize: 'vertical', minHeight: 80, background: textareaBg }}
                placeholder="Type your reply to the customer… (they will see this on their ticket)"
                value={reply}
                onChange={e => setReply(e.target.value)}
              />
              <div style={{ display: 'flex', gap: 8, marginTop: 8 }}>
                <button onClick={submitReply} disabled={saving || !reply.trim()}
                  style={{ padding: '7px 16px', background: 'linear-gradient(135deg,#6366f1,#4f46e5)', color: '#fff', border: 'none', borderRadius: 9, fontSize: 12, fontWeight: 700, cursor: 'pointer', fontFamily: "'Sora',sans-serif", opacity: saving ? 0.7 : 1 }}>
                  {saved ? '✓ Sent!' : saving ? 'Saving…' : '💬 Send Reply'}
                </button>
                <button onClick={() => setShowReply(false)}
                  style={{ padding: '7px 14px', background: actionBg, border: `1px solid ${actionBorder}`, color: actionText, borderRadius: 9, fontSize: 12, fontWeight: 700, cursor: 'pointer' }}>
                  Cancel
                </button>
              </div>
            </div>
          )}
        </div>

        {/* Right: status actions */}
        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: 8, flexShrink: 0 }}>
          <span style={{
            padding: '5px 14px', borderRadius: 999, fontSize: 12, fontWeight: 800,
            background: ticket.status === 'Open' ? (darkMode ? '#3d2f21' : '#f8f1e5') : (darkMode ? '#17382d' : '#eaf3ed'),
            color:      ticket.status === 'Open' ? (darkMode ? '#ffe0b5' : '#89520f') : (darkMode ? '#a7f3d0' : '#176b50'),
            fontFamily: "'Sora',sans-serif",
          }}>
            {ticket.status === 'Open' ? '🟡 Open' : '✅ Resolved'}
          </span>

          <button className="action-btn" onClick={() => setShowReply(r => !r)}
            style={{ padding: '7px 16px', background: darkMode ? '#191f1d' : '#edf4ef', color: darkMode ? '#dfeafc' : '#176b50', border: `1px solid ${darkMode ? '#364740' : '#d4e2d8'}`, borderRadius: 10, fontSize: 12, fontWeight: 700, cursor: 'pointer', fontFamily: "'Sora',sans-serif" }}>
            {showReply ? '✕ Cancel' : '💬 Reply'}
          </button>

          {ticket.status === 'Open' ? (
            <button className="action-btn"
              style={{ padding: '8px 18px', background: 'linear-gradient(135deg,#10b981,#059669)', color: '#fff', border: 'none', borderRadius: 10, fontSize: 12, fontWeight: 700, cursor: 'pointer', fontFamily: "'Sora',sans-serif", boxShadow: '0 4px 12px rgba(16,185,129,.3)' }}
              onClick={() => onStatusChange('Resolved')}>✓ Mark Resolved</button>
          ) : (
            <button className="action-btn"
              style={{ padding: '7px 16px', background: '#fff', color: '#d97706', border: '1.5px solid #fde68a', borderRadius: 10, fontSize: 12, fontWeight: 700, cursor: 'pointer', fontFamily: "'Sora',sans-serif" }}
              onClick={() => onStatusChange('Open')}>🔄 Reopen</button>
          )}
        </div>
      </div>
    </div>
  );
}
