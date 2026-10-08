import { useState } from 'react';

/* TicketCard — shows user identity, userId badge, admin reply */
export default function TicketCard({ ticket, onResolve, onReopen, onReply, darkMode = false }) {
  const [showReply, setShowReply] = useState(false);
  const [reply, setReply]         = useState(ticket.adminReply || '');
  const [saved,  setSaved]        = useState(false);
  const [replyError, setReplyError] = useState('');
  const [saving, setSaving] = useState(false);

  const saveReply = async () => {
    setSaving(true);
    try {
      await onReply(ticket._id, reply.trim());
      setReplyError('');
      setSaved(true);
      setTimeout(() => setSaved(false), 2000);
    } catch (error) {
      setReplyError(error?.response?.data?.message || 'Reply could not be saved. Please try again.');
    } finally {
      setSaving(false);
    }
  };

  const cardBg = darkMode ? '#141d1a' : '#fff';
  const cardBorder = darkMode ? (ticket.status === 'Open' ? '#564930' : '#2d5d4d') : (ticket.status === 'Open' ? '#fde68a' : '#bbf7d0');
  const text = darkMode ? '#edf7f2' : '#0f172a';
  const subText = darkMode ? '#b7c9c1' : '#64748b';
  const muted = darkMode ? '#8ea49a' : '#94a3b8';
  const chipBg = darkMode ? '#1e2d2b' : '#f1f5f9';
  const chipText = darkMode ? '#dff7eb' : '#6366f1';
  const replyBg = darkMode ? '#172d29' : '#f0fdf4';
  const replyBorder = darkMode ? '#2b4d44' : '#bbf7d0';
  const replyText = darkMode ? '#d7ece3' : '#334155';
  const textareaBg = darkMode ? '#0f1715' : '#f8fafc';
  const textareaBorder = darkMode ? '#324c45' : '#e2e8f0';
  const buttonSecondary = darkMode ? '#1c2422' : '#f8fafc';
  const buttonSecondaryText = darkMode ? '#dcefe8' : '#64748b';
  const buttonSecondaryBorder = darkMode ? '#34453f' : '#e2e8f0';

  return (
    <div style={{ background:cardBg, borderRadius:'16px', border:`1.5px solid ${cardBorder}`, padding:'20px 24px', boxShadow: darkMode ? '0 10px 24px rgba(0,0,0,.15)' : '0 2px 8px rgba(0,0,0,0.05)' }}>
      <div style={{ display:'flex', justifyContent:'space-between', alignItems:'flex-start', flexWrap:'wrap', gap:'12px' }}>

        {/* Left: ticket info */}
        <div style={{ flex:1, minWidth:0 }}>
          <div style={{ display:'flex', alignItems:'center', gap:'10px', marginBottom:'8px', flexWrap:'wrap' }}>
            {/* Avatar */}
            <div style={{ width:32, height:32, borderRadius:'50%', background:'linear-gradient(135deg,#6366f1,#8b5cf6)', display:'flex', alignItems:'center', justifyContent:'center', flexShrink:0 }}>
              <span style={{ fontSize:13, fontWeight:800, color:'#fff', fontFamily:"'Sora',sans-serif" }}>{ticket.name?.[0]?.toUpperCase()||'?'}</span>
            </div>
            <span style={{ fontSize:'14px', fontWeight:'900', color:text, fontFamily:"'Sora',sans-serif" }}>{ticket.name}</span>
            <span style={{ fontSize:'12px', color:subText }}>{ticket.email}</span>

            {/* 👤 Registered user badge if userId present */}
            {ticket.user ? (
              <span style={{ fontSize:'10px', background: darkMode ? '#17382d' : '#ecfdf5', color: darkMode ? '#a9f0c7' : '#059669', padding:'3px 9px', borderRadius:'999px', fontWeight:'800', border: darkMode ? '1px solid #2a5b4c' : '1px solid #bbf7d0', fontFamily:"'Sora',sans-serif" }}>
                👤 Registered User
              </span>
            ) : (
              <span style={{ fontSize:'10px', background: darkMode ? '#1a2320' : '#f8fafc', color: darkMode ? '#b9c9bf' : '#94a3b8', padding:'3px 9px', borderRadius:'999px', fontWeight:'700', border: darkMode ? '1px solid #33463e' : '1px solid #e2e8f0', fontFamily:"'Sora',sans-serif" }}>
                👻 Guest
              </span>
            )}

            {ticket.orderId && (
              <span style={{ fontSize:'10px', background: darkMode ? '#1b2d3d' : '#eff6ff', color: darkMode ? '#b7d5ff' : '#2563eb', padding:'3px 9px', borderRadius:'999px', fontWeight:'700', fontFamily:"'JetBrains Mono',monospace" }}>
                Order: #{ticket.orderId}
              </span>
            )}
          </div>

          {/* User ID line */}
          {ticket.user && (
            <p style={{ margin:'0 0 6px', fontSize:'10px', color:muted, fontFamily:"'JetBrains Mono',monospace" }}>
              User ID: <span style={{ color: darkMode ? '#dfeafc' : '#6366f1' }}>{ticket.user._id || ticket.user}</span>
            </p>
          )}

          <p style={{ margin:'0 0 6px', fontSize:'13px', fontWeight:'700', color: darkMode ? '#dfeae4' : '#334155' }}>
            <span style={{ background:chipBg, borderRadius:6, padding:'2px 8px', fontSize:11, color:chipText, fontWeight:700 }}>
              {ticket.subject || 'General'}
            </span>
          </p>
          <p style={{ margin:'0 0 8px', fontSize:'13px', color:subText, lineHeight:'1.6', fontFamily:"'Sora',sans-serif" }}>
            {ticket.message}
          </p>
          <p style={{ margin:0, fontSize:'11px', color:muted, fontFamily:"'JetBrains Mono',monospace" }}>
            Submitted: {new Date(ticket.createdAt).toLocaleString('en-PK')}
            {ticket.resolvedAt && <span style={{ color: darkMode ? '#a7f3d0' : '#10b981' }}> · Resolved: {new Date(ticket.resolvedAt).toLocaleString('en-PK')}</span>}
          </p>

          {/* Admin reply area */}
          {ticket.adminReply && !showReply && (
            <div style={{ marginTop:10, background:replyBg, border:`1px solid ${replyBorder}`, borderRadius:10, padding:'10px 14px' }}>
              <p style={{ margin:'0 0 2px', fontSize:10, fontWeight:800, color: darkMode ? '#a7f3d0' : '#059669', textTransform:'uppercase', letterSpacing:'0.5px' }}>✍️ Admin Reply</p>
              <p style={{ margin:0, fontSize:12, color:replyText, lineHeight:1.6 }}>{ticket.adminReply}</p>
            </div>
          )}
          {showReply && (
            <div style={{ marginTop:12 }}>
              <textarea
                style={{ width:'100%', padding:'10px 13px', border:`1.5px solid ${textareaBorder}`, borderRadius:10, fontSize:13, fontFamily:"'Sora',sans-serif", color: darkMode ? '#edf7f2' : '#1e293b', boxSizing:'border-box', resize:'vertical', minHeight:80, background:textareaBg }}
                placeholder="Type your reply to the customer…"
                value={reply}
                onChange={e => setReply(e.target.value)}
              />
              {replyError && <p style={{ margin:'6px 0 0', fontSize:11, color:'#dc2626' }}>{replyError}</p>}
              <div style={{ display:'flex', gap:8, marginTop:8 }}>
                <button onClick={saveReply} disabled={saving || !reply.trim()}
                  style={{ padding:'7px 16px', background:'linear-gradient(135deg,#6366f1,#4f46e5)', color:'#fff', border:'none', borderRadius:9, fontSize:12, fontWeight:700, cursor:'pointer', fontFamily:"'Sora',sans-serif", opacity:saving ? 0.7 : 1 }}>
                  {saved ? '✓ Saved!' : saving ? 'Saving…' : '💾 Save Reply'}
                </button>
                <button onClick={() => setShowReply(false)}
                  style={{ padding:'7px 14px', background:buttonSecondary, border:`1px solid ${buttonSecondaryBorder}`, color:buttonSecondaryText, borderRadius:9, fontSize:12, fontWeight:700, cursor:'pointer' }}>
                  Cancel
                </button>
              </div>
            </div>
          )}
        </div>

        {/* Right: status + actions */}
        <div style={{ display:'flex', flexDirection:'column', alignItems:'flex-end', gap:'8px', flexShrink:0 }}>
          <span style={{
            padding:'5px 14px', borderRadius:'999px', fontSize:'12px', fontWeight:'800',
            background: ticket.status==='Open' ? (darkMode ? '#3f3022' : '#fef3c7') : (darkMode ? '#17382d' : '#f0fdf4'),
            color:      ticket.status==='Open' ? (darkMode ? '#ffe0b5' : '#d97706') : (darkMode ? '#a7f3d0' : '#059669'),
          }}>
            {ticket.status==='Open' ? '🟡 Open' : '✅ Resolved'}
          </span>

          {/* Reply button */}
          <button onClick={() => setShowReply(r => !r)}
            style={{ padding:'7px 16px', background: darkMode ? '#1a2421' : '#f0f0ff', color: darkMode ? '#dfeafc' : '#4f46e5', border:`1px solid ${darkMode ? '#3a4742' : '#c7d2fe'}`, borderRadius:'9px', fontSize:'12px', fontWeight:'700', cursor:'pointer', fontFamily:"'Sora',sans-serif" }}>
            {showReply ? '✕ Cancel Reply' : '✍️ Reply'}
          </button>

          {ticket.status === 'Open' ? (
            <button style={{ padding:'7px 16px', background:'linear-gradient(135deg,#10b981,#059669)', color:'#fff', border:'none', borderRadius:'9px', fontSize:'12px', fontWeight:'700', cursor:'pointer', fontFamily:"'Sora',sans-serif" }}
              onClick={onResolve}>✓ Mark Resolved</button>
          ) : (
            <button style={{ padding:'7px 16px', background: darkMode ? '#1d2d28' : '#fff', color: darkMode ? '#ffe0b5' : '#d97706', border:`1.5px solid ${darkMode ? '#564930' : '#fde68a'}`, borderRadius:'9px', fontSize:'12px', fontWeight:'700', cursor:'pointer', fontFamily:"'Sora',sans-serif" }}
              onClick={onReopen}>🔄 Reopen</button>
          )}
        </div>
      </div>
    </div>
  );
}
