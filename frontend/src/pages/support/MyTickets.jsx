import { useEffect, useState } from 'react';
import API from '../../utils/axiosConfig';
import { S } from './supportStyles';

/* ═══════════════════════════════════════════════════════════════
   MY TICKETS  — user sees their own tickets + admin replies
   ═══════════════════════════════════════════════════════════════ */
export default function MyTickets({ user }) {
  const [tickets, setTickets] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!user) return;
    API.get('/api/support/tickets/my')
      .then(r => setTickets(r.data || []))
      .catch(() => setTickets([]))
      .finally(() => setLoading(false));
  }, [user]);

  if (!user || loading) return null;
  if (tickets.length === 0) return null;

  return (
    <div style={{ marginBottom: 40 }}>
      <h2 style={{ ...S.secTitle, marginBottom: 6 }}>📋 My Support Tickets</h2>
      <p style={{ margin: '0 0 20px', fontSize: 13, color: '#64748b' }}>
        Track your submitted tickets and read replies from our support team
      </p>

      <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
        {tickets.map(t => (
          <div key={t._id} style={{
            background: '#fff',
            borderRadius: 16,
            border: `1.5px solid ${t.status === 'Open' ? '#fde68a' : '#bbf7d0'}`,
            padding: '20px 22px',
            boxShadow: '0 2px 10px rgba(0,0,0,0.05)',
          }}>
            {/* Ticket header */}
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: 12, flexWrap: 'wrap', marginBottom: 10 }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'wrap' }}>
                <span style={{ fontSize: 12, fontWeight: 800, color: '#6366f1', background: '#f1f5f9', padding: '3px 10px', borderRadius: 6 }}>
                  {t.subject || 'General'}
                </span>
                {t.orderId && (
                  <span style={{ fontSize: 11, color: '#2563eb', background: '#eff6ff', padding: '3px 9px', borderRadius: 6, fontFamily: 'monospace', fontWeight: 700 }}>
                    #{t.orderId.slice(-8).toUpperCase()}
                  </span>
                )}
                <span style={{ fontSize: 11, color: '#94a3b8' }}>
                  {new Date(t.createdAt).toLocaleDateString('en-PK', { day: 'numeric', month: 'short', year: 'numeric' })}
                </span>
              </div>
              <span style={{
                padding: '4px 12px', borderRadius: 999, fontSize: 11, fontWeight: 800, flexShrink: 0,
                background: t.status === 'Open' ? '#fef3c7' : '#f0fdf4',
                color:      t.status === 'Open' ? '#d97706'  : '#059669',
              }}>
                {t.status === 'Open' ? '🟡 Open' : '✅ Resolved'}
              </span>
            </div>

            {/* User message */}
            <div style={{ background: '#f8fafc', borderRadius: 10, padding: '12px 14px', marginBottom: 10, border: '1px solid #e2e8f0' }}>
              <p style={{ margin: '0 0 4px', fontSize: 10, fontWeight: 800, color: '#64748b', textTransform: 'uppercase', letterSpacing: '0.5px' }}>
                📝 Your Message
              </p>
              <p style={{ margin: 0, fontSize: 13, color: '#334155', lineHeight: 1.65 }}>{t.message}</p>
            </div>

            {/* Admin reply — what user sees */}
            {t.adminReply ? (
              <div style={{ background: '#f0fdf4', border: '1.5px solid #bbf7d0', borderRadius: 10, padding: '12px 14px' }}>
                <p style={{ margin: '0 0 4px', fontSize: 10, fontWeight: 800, color: '#059669', textTransform: 'uppercase', letterSpacing: '0.5px' }}>
                  💬 Reply from Support Team
                </p>
                <p style={{ margin: 0, fontSize: 13, color: '#166534', lineHeight: 1.65 }}>{t.adminReply}</p>
              </div>
            ) : (
              <div style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '10px 14px', background: '#fffbeb', border: '1px solid #fde68a', borderRadius: 10 }}>
                <span style={{ fontSize: 16 }}>⏳</span>
                <p style={{ margin: 0, fontSize: 12, color: '#92400e', fontWeight: 600 }}>
                  Awaiting reply from our support team — we'll respond within 24 hours.
                </p>
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}
