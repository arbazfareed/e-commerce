// frontend/src/pages/SupportPage.jsx
import { useState, useEffect, useCallback } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import API from '../utils/axiosConfig';

/* ─── FAQ data ──────────────────────────────────────────────── */
const FAQS = [
  { q: 'How do I track my order?',              a: 'Go to "My Orders" from the navbar, click on any order, then press "📍 Track" to see real-time status.' },
  { q: 'What is the shipping fee?',             a: 'Shipping is weight-based. Pakistan: Rs 80 base + Rs 40/kg. International: Rs 500 base + Rs 300/kg.' },
  { q: 'Can international customers buy local products?', a: 'No — products marked "🇵🇰 Local" are only available for delivery within Pakistan.' },
  { q: 'How do I cancel my order?',             a: 'Contact support with your Order ID. We process cancellations within 24 hours.' },
  { q: 'What payment methods are accepted?',    a: 'Cash on Delivery (COD), JazzCash, EasyPaisa, Credit/Debit Card, and PayPal.' },
  { q: 'How long does delivery take?',          a: 'Pakistan: 2–4 business days. International: 7–14 business days.' },
  { q: 'Can I return a product?',               a: 'Yes — returns accepted within 7 days of delivery for undamaged items. Contact support with your order ID.' },
  { q: 'How do I change my account details?',   a: 'Account editing is coming soon. Contact our support team for urgent changes.' },
];

/* ═══════════════════════════════════════════════════════════════
   ADMIN SUPPORT DASHBOARD
   ═══════════════════════════════════════════════════════════════ */
function AdminSupportView() {
  const [tickets,     setTickets]     = useState([]);
  const [loading,     setLoading]     = useState(true);
  const [filter,      setFilter]      = useState('All');
  const [search,      setSearch]      = useState('');
  const [expandedFaq, setExpandedFaq] = useState(null);

  const fetchTickets = useCallback(async () => {
    setLoading(true);
    try {
      const res = await API.get('/api/support/tickets');
      setTickets(res.data || []);
    } catch (err) {
      console.error('Failed to fetch tickets:', err);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { fetchTickets(); }, [fetchTickets]);

  const openCount     = tickets.filter(t => t.status === 'Open').length;
  const resolvedCount = tickets.filter(t => t.status === 'Resolved').length;

  const visible = tickets.filter(t => {
    const matchFilter = filter === 'All' || t.status === filter;
    const matchSearch = !search.trim() ||
      t.name.toLowerCase().includes(search.toLowerCase()) ||
      t.email.toLowerCase().includes(search.toLowerCase()) ||
      (t.subject || '').toLowerCase().includes(search.toLowerCase()) ||
      (t.message || '').toLowerCase().includes(search.toLowerCase()) ||
      (t.orderId || '').toLowerCase().includes(search.toLowerCase());
    return matchFilter && matchSearch;
  });

  const handleStatusChange = async (id, status) => {
    try {
      await API.put(`/api/support/tickets/${id}/status`, { status });
      setTickets(prev => prev.map(t => t._id === id
        ? { ...t, status, resolvedAt: status === 'Resolved' ? new Date().toISOString() : undefined }
        : t
      ));
    } catch (err) {
      console.error('Status update failed:', err);
    }
  };

  const handleReply = async (id, text) => {
    try {
      const res = await API.put(`/api/support/tickets/${id}/reply`, { text });
      setTickets(prev => prev.map(t => t._id === id ? res.data : t));
    } catch (err) {
      console.error('Reply failed:', err);
    }
  };

  return (
    <div style={A.page}>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Sora:wght@400;600;700;800;900&family=JetBrains+Mono:wght@500;700&display=swap');
        @keyframes fadeUp { from{opacity:0;transform:translateY(12px)} to{opacity:1;transform:none} }
        @keyframes spin   { to{transform:rotate(360deg)} }
        .tkt-row:hover { background:#f8fafc !important; }
        .pill-btn:hover { opacity:.85; }
        .action-btn:hover { opacity:.8; }
        ::-webkit-scrollbar { width:4px; height:4px; }
        ::-webkit-scrollbar-thumb { background:#e2e8f0; border-radius:99px; }
      `}</style>

      {/* Header */}
      <div style={A.header}>
        <div style={A.headerInner}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 14 }}>
            <div style={A.headerIcon}>🎧</div>
            <div>
              <h1 style={A.headerTitle}>Support Tickets</h1>
              <p style={A.headerSub}>Manage and respond to customer requests</p>
            </div>
          </div>
          <div style={{ display: 'flex', gap: 10, alignItems: 'center' }}>
            <Link to="/admin" style={A.backBtn}>← Admin Panel</Link>
            <button style={A.refreshBtn} onClick={fetchTickets}>🔄 Refresh</button>
          </div>
        </div>
      </div>

      <div style={A.wrap}>

        {/* KPI row */}
        <div style={A.kpiRow}>
          {[
            { label: 'Total Tickets', val: tickets.length,  color: '#6366f1', bg: 'linear-gradient(135deg,#eef2ff,#e0e7ff)', border: '#c7d2fe', icon: '🗂️' },
            { label: 'Open',          val: openCount,        color: '#d97706', bg: 'linear-gradient(135deg,#fffbeb,#fef3c7)', border: '#fde68a', icon: '🟡' },
            { label: 'Resolved',      val: resolvedCount,    color: '#059669', bg: 'linear-gradient(135deg,#f0fdf4,#dcfce7)', border: '#bbf7d0', icon: '✅' },
          ].map(k => (
            <div key={k.label} style={{ ...A.kpiCard, background: k.bg, border: `1.5px solid ${k.border}` }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                <div>
                  <p style={{ margin: '0 0 6px', fontSize: 10, fontWeight: 700, color: k.color, textTransform: 'uppercase', letterSpacing: '1px', fontFamily: "'Sora',sans-serif" }}>{k.label}</p>
                  <p style={{ margin: 0, fontSize: 32, fontWeight: 900, color: k.color, lineHeight: 1, fontFamily: "'Sora',sans-serif" }}>{k.val}</p>
                </div>
                <span style={{ fontSize: 26 }}>{k.icon}</span>
              </div>
            </div>
          ))}
        </div>

        {/* Filter + Search */}
        <div style={A.toolbar}>
          <div style={{ display: 'flex', gap: 6, flexShrink: 0 }}>
            {['All', 'Open', 'Resolved'].map(f => (
              <button key={f} className="pill-btn" onClick={() => setFilter(f)} style={{
                padding: '8px 18px', borderRadius: 999, fontSize: 13, fontWeight: 700, cursor: 'pointer',
                border: `1.5px solid ${filter === f ? (f === 'Open' ? '#f59e0b' : f === 'Resolved' ? '#10b981' : '#6366f1') : '#e2e8f0'}`,
                background: filter === f ? (f === 'Open' ? '#fef3c7' : f === 'Resolved' ? '#d1fae5' : '#e0e7ff') : '#fff',
                color: filter === f ? (f === 'Open' ? '#d97706' : f === 'Resolved' ? '#059669' : '#4f46e5') : '#64748b',
                fontFamily: "'Sora',sans-serif", transition: 'all .15s',
              }}>
                {f} ({f === 'All' ? tickets.length : f === 'Open' ? openCount : resolvedCount})
              </button>
            ))}
          </div>
          <input
            style={A.searchBox}
            placeholder="🔍  Search by name, email, subject, order ID…"
            value={search}
            onChange={e => setSearch(e.target.value)}
          />
        </div>

        {/* Loading */}
        {loading && (
          <div style={{ textAlign: 'center', padding: '60px 20px', color: '#94a3b8', background: '#fff', borderRadius: 18, border: '1px solid #e2e8f0' }}>
            <div style={{ width: 36, height: 36, border: '3px solid #e2e8f0', borderTop: '3px solid #10b981', borderRadius: '50%', animation: 'spin .8s linear infinite', margin: '0 auto 14px' }} />
            <p style={{ margin: 0, fontFamily: "'Sora',sans-serif", fontSize: 14, fontWeight: 600 }}>Loading tickets…</p>
          </div>
        )}

        {/* Empty */}
        {!loading && visible.length === 0 && (
          <div style={A.empty}>
            <p style={{ fontSize: '52px', margin: '0 0 12px' }}>{tickets.length === 0 ? '📭' : '🔍'}</p>
            <p style={{ margin: 0, fontSize: 16, fontWeight: 700, color: '#334155', fontFamily: "'Sora',sans-serif" }}>
              {tickets.length === 0 ? 'No tickets yet' : 'No tickets match your filter'}
            </p>
            <p style={{ margin: '6px 0 0', fontSize: 13, color: '#94a3b8', fontFamily: "'Sora',sans-serif" }}>
              {tickets.length === 0 ? 'Customer support requests will appear here once submitted' : 'Try changing the filter or clearing the search'}
            </p>
          </div>
        )}

        {/* Ticket list */}
        {!loading && visible.length > 0 && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 12, animation: 'fadeUp .3s ease' }}>
            {visible.map(ticket => (
              <AdminTicketCard
                key={ticket._id}
                ticket={ticket}
                onStatusChange={(status) => handleStatusChange(ticket._id, status)}
                onReply={(text) => handleReply(ticket._id, text)}
              />
            ))}
          </div>
        )}

        {/* FAQ reference */}
        <div style={{ ...A.faqSection, marginTop: 40 }}>
          <h2 style={{ margin: '0 0 16px', fontSize: 17, fontWeight: 800, color: '#0f172a', fontFamily: "'Sora',sans-serif" }}>📚 FAQ Reference</h2>
          <p style={{ margin: '0 0 16px', fontSize: 13, color: '#64748b' }}>Standard answers to refer to when responding to tickets:</p>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
            {FAQS.map((faq, i) => (
              <div key={i} style={{ background: '#fff', borderRadius: 12, border: '1px solid #e2e8f0', overflow: 'hidden' }}>
                <button style={A.faqQ} onClick={() => setExpandedFaq(expandedFaq === i ? null : i)}>
                  <span style={{ flex: 1, textAlign: 'left', fontFamily: "'Sora',sans-serif" }}>{faq.q}</span>
                  <span style={{ color: '#10b981', fontSize: 18, fontWeight: 700, transform: expandedFaq === i ? 'rotate(45deg)' : 'none', transition: 'transform .2s', flexShrink: 0 }}>+</span>
                </button>
                {expandedFaq === i && (
                  <p style={{ margin: 0, padding: '0 18px 14px', fontSize: 13, color: '#64748b', lineHeight: 1.7, fontFamily: "'Sora',sans-serif" }}>{faq.a}</p>
                )}
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}

/* ─── Admin ticket card with live reply ─────────────────────── */
function AdminTicketCard({ ticket, onStatusChange, onReply }) {
  const [showReply, setShowReply] = useState(false);
  const [reply,     setReply]     = useState(ticket.adminReply || '');
  const [saving,    setSaving]    = useState(false);
  const [saved,     setSaved]     = useState(false);

  const submitReply = async () => {
    if (!reply.trim()) return;
    setSaving(true);
    await onReply(reply.trim());
    setSaving(false);
    setSaved(true);
    setTimeout(() => { setSaved(false); setShowReply(false); }, 1500);
  };

  return (
    <div className="tkt-row" style={{
      background: '#fff', borderRadius: 16,
      border: `1.5px solid ${ticket.status === 'Open' ? '#fde68a' : '#bbf7d0'}`,
      padding: '20px 24px', boxShadow: '0 2px 8px rgba(0,0,0,.04)', transition: 'background .15s',
    }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: 14 }}>

        {/* Left: ticket info */}
        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 8, flexWrap: 'wrap' }}>
            <div style={{ width: 32, height: 32, borderRadius: '50%', background: 'linear-gradient(135deg,#6366f1,#8b5cf6)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
              <span style={{ fontSize: 13, fontWeight: 800, color: '#fff', fontFamily: "'Sora',sans-serif" }}>{ticket.name?.[0]?.toUpperCase() || '?'}</span>
            </div>
            <span style={{ fontSize: 14, fontWeight: 900, color: '#0f172a', fontFamily: "'Sora',sans-serif" }}>{ticket.name}</span>
            <span style={{ fontSize: 12, color: '#64748b' }}>{ticket.email}</span>

            {ticket.user ? (
              <span style={{ fontSize: 10, background: '#ecfdf5', color: '#059669', padding: '3px 9px', borderRadius: 999, fontWeight: 800, border: '1px solid #bbf7d0', fontFamily: "'Sora',sans-serif" }}>👤 Registered</span>
            ) : (
              <span style={{ fontSize: 10, background: '#f8fafc', color: '#94a3b8', padding: '3px 9px', borderRadius: 999, fontWeight: 700, border: '1px solid #e2e8f0', fontFamily: "'Sora',sans-serif" }}>👻 Guest</span>
            )}

            {ticket.orderId && (
              <span style={{ fontSize: 11, background: '#eff6ff', color: '#2563eb', padding: '3px 10px', borderRadius: 999, fontWeight: 700, fontFamily: "'JetBrains Mono',monospace" }}>
                Order #{ticket.orderId.slice(-8).toUpperCase()}
              </span>
            )}
          </div>

          <p style={{ margin: '0 0 5px', fontSize: 13, fontWeight: 800, color: '#1e293b', display: 'flex', alignItems: 'center', gap: 6 }}>
            <span style={{ background: '#f1f5f9', borderRadius: 6, padding: '2px 8px', fontSize: 11, color: '#6366f1', fontWeight: 700 }}>{ticket.subject || 'General'}</span>
          </p>
          <p style={{ margin: '0 0 8px', fontSize: 13, color: '#475569', lineHeight: 1.65, fontFamily: "'Sora',sans-serif" }}>{ticket.message}</p>
          <p style={{ margin: 0, fontSize: 11, color: '#94a3b8', fontFamily: "'JetBrains Mono',monospace" }}>
            Submitted: {new Date(ticket.createdAt).toLocaleString('en-PK')}
            {ticket.resolvedAt && <span style={{ color: '#10b981' }}> · Resolved: {new Date(ticket.resolvedAt).toLocaleString('en-PK')}</span>}
          </p>

          {/* Existing reply display */}
          {ticket.adminReply && !showReply && (
            <div style={{ marginTop: 10, background: '#f0fdf4', border: '1px solid #bbf7d0', borderRadius: 10, padding: '10px 14px' }}>
              <p style={{ margin: '0 0 2px', fontSize: 10, fontWeight: 800, color: '#059669', textTransform: 'uppercase', letterSpacing: '0.5px' }}>✍️ Your Reply (visible to user)</p>
              <p style={{ margin: 0, fontSize: 12, color: '#334155', lineHeight: 1.6 }}>{ticket.adminReply}</p>
            </div>
          )}

          {/* Reply textarea */}
          {showReply && (
            <div style={{ marginTop: 12 }}>
              <textarea
                style={{ width: '100%', padding: '10px 13px', border: '1.5px solid #e2e8f0', borderRadius: 10, fontSize: 13, fontFamily: "'Sora',sans-serif", color: '#1e293b', boxSizing: 'border-box', resize: 'vertical', minHeight: 80, background: '#f8fafc' }}
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
                  style={{ padding: '7px 14px', background: '#f8fafc', border: '1px solid #e2e8f0', color: '#64748b', borderRadius: 9, fontSize: 12, fontWeight: 700, cursor: 'pointer' }}>
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
            background: ticket.status === 'Open' ? '#fef3c7' : '#f0fdf4',
            color:      ticket.status === 'Open' ? '#d97706'  : '#059669',
            fontFamily: "'Sora',sans-serif",
          }}>
            {ticket.status === 'Open' ? '🟡 Open' : '✅ Resolved'}
          </span>

          <button className="action-btn" onClick={() => setShowReply(r => !r)}
            style={{ padding: '7px 16px', background: '#f0f0ff', color: '#4f46e5', border: '1px solid #c7d2fe', borderRadius: 10, fontSize: 12, fontWeight: 700, cursor: 'pointer', fontFamily: "'Sora',sans-serif" }}>
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

/* ═══════════════════════════════════════════════════════════════
   MY TICKETS  — user sees their own tickets + admin replies
   ═══════════════════════════════════════════════════════════════ */
function MyTickets({ user }) {
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

/* ═══════════════════════════════════════════════════════════════
   CUSTOMER SUPPORT PAGE  (default export)
   ═══════════════════════════════════════════════════════════════ */
export default function SupportPage() {
  const { user }  = useAuth();
  const isAdmin   = user?.isAdmin;

  const [openFaq,       setOpenFaq]       = useState(null);
  const [form,          setForm]          = useState({
    name:    user?.name  || '',
    email:   user?.email || '',
    subject: '',
    message: '',
    orderId: '',
  });
  const [sent,          setSent]          = useState(false);
  const [sending,       setSending]       = useState(false);
  const [err,           setErr]           = useState('');
  const [orders,        setOrders]        = useState([]);
  const [ordersLoading, setOrdersLoading] = useState(false);

  // Fetch user's orders for the Order ID dropdown
  useEffect(() => {
    if (!user || isAdmin) return;
    setOrdersLoading(true);
    API.get('/api/orders/my')
      .catch(() => API.get('/api/orders').then(r => ({
        data: (r.data || []).filter(o => o.user?._id === user._id || o.user === user._id)
      })))
      .then(r => setOrders(r.data || []))
      .catch(() => setOrders([]))
      .finally(() => setOrdersLoading(false));
  }, [user, isAdmin]);

  // Admin → dedicated view
  if (isAdmin) return <AdminSupportView />;

  const set = k => e => setForm(f => ({ ...f, [k]: e.target.value }));

  const handleSubmit = async (e) => {
    e.preventDefault();
    setErr('');
    if (!form.name.trim() || !form.email.trim() || !form.message.trim()) {
      setErr('Please fill in Name, Email and Message.'); return;
    }
    setSending(true);
    try {
      const endpoint = user ? '/api/support/tickets' : '/api/support/tickets/guest';
      await API.post(endpoint, {
        name:    form.name.trim(),
        email:   form.email.trim(),
        subject: form.subject || 'General',
        message: form.message.trim(),
        orderId: form.orderId.trim(),
      });
      setSent(true);
    } catch (error) {
      setErr(error?.response?.data?.message || 'Failed to submit ticket. Please try again.');
    } finally {
      setSending(false);
    }
  };

  return (
    <div style={S.page}>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Outfit:wght@400;600;700;800;900&display=swap');
        @keyframes fadeUp { from{opacity:0;transform:translateY(14px)} to{opacity:1;transform:none} }
        @keyframes spin   { to{transform:rotate(360deg)} }
        .faq-row:hover { background:#f8fafc !important; }
        .ci:focus { border-color:#10b981 !important; box-shadow:0 0 0 3px rgba(16,185,129,0.1) !important; outline:none; }
        .ci { transition:all 0.15s; }
        .ch:hover { transform:translateY(-3px); box-shadow:0 8px 28px rgba(0,0,0,0.1) !important; }
        .ch { transition:all 0.2s; }
      `}</style>

      {/* Hero */}
      <div style={S.hero}>
        <div style={S.heroBg} />
        <div style={{ position: 'relative', zIndex: 1, textAlign: 'center' }}>
          <div style={{ fontSize: '52px', marginBottom: '14px' }}>🎧</div>
          <h1 style={S.heroTitle}>How can we help you?</h1>
          <p style={S.heroSub}>Our support team is here for you — reach out anytime</p>
        </div>
      </div>

      <div style={S.wrap}>

        {/* Contact channels */}
        <div style={S.channelsRow}>
          {[
            { icon: '📧', label: 'Email Us',   value: 'support@induscart.pk', sub: 'Reply within 24 hours', color: '#3b82f6', bg: '#eff6ff' },
            { icon: '📱', label: 'WhatsApp',   value: '+92 300 000 0000',      sub: 'Mon–Sat, 9am–6pm PKT',  color: '#22c55e', bg: '#f0fdf4' },
            { icon: '📦', label: 'Order Help', value: 'Track & manage orders', sub: 'View orders page',      color: '#f59e0b', bg: '#fffbeb', link: '/orders' },
          ].map(ch => (
            <div key={ch.label} className="ch" style={{ ...S.channelCard, border: '1.5px solid ' + ch.bg }}>
              <div style={{ ...S.channelIcon, background: ch.bg, color: ch.color }}>{ch.icon}</div>
              <div>
                <p style={{ margin: '0 0 2px', fontWeight: '800', fontSize: '14px', color: '#0f172a' }}>{ch.label}</p>
                {ch.link
                  ? <Link to={ch.link} style={{ margin: 0, fontSize: '13px', color: ch.color, fontWeight: '700', textDecoration: 'none' }}>{ch.value} →</Link>
                  : <p style={{ margin: 0, fontSize: '13px', color: ch.color, fontWeight: '700' }}>{ch.value}</p>}
                <p style={{ margin: '3px 0 0', fontSize: '11px', color: '#94a3b8' }}>{ch.sub}</p>
              </div>
            </div>
          ))}
        </div>

        {/* My Tickets — logged-in users see their history + admin replies */}
        <MyTickets user={user} />

        <div style={S.twoCol}>

          {/* FAQ */}
          <div>
            <h2 style={S.secTitle}>❓ Frequently Asked Questions</h2>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
              {FAQS.map((faq, i) => (
                <div key={i} className="faq-row" style={{ ...S.faqRow, background: openFaq === i ? '#f0fdf4' : '#fff' }}>
                  <button style={S.faqQ} onClick={() => setOpenFaq(openFaq === i ? null : i)}>
                    <span style={{ flex: 1, textAlign: 'left' }}>{faq.q}</span>
                    <span style={{ fontSize: '18px', color: '#10b981', fontWeight: '700', transform: openFaq === i ? 'rotate(45deg)' : 'none', transition: 'transform 0.2s', flexShrink: 0 }}>+</span>
                  </button>
                  {openFaq === i && <p style={S.faqA}>{faq.a}</p>}
                </div>
              ))}
            </div>
          </div>

          {/* Contact form */}
          <div>
            <h2 style={S.secTitle}>✉️ Send Us a Message</h2>
            {sent ? (
              <div style={{ ...S.formCard, textAlign: 'center', padding: '40px 24px' }}>
                <p style={{ fontSize: '56px', margin: '0 0 16px' }}>✅</p>
                <h3 style={{ margin: '0 0 8px', fontSize: '20px', fontWeight: '800', color: '#0f172a' }}>Ticket Submitted!</h3>
                <p style={{ margin: '0 0 6px', color: '#64748b', fontSize: '14px' }}>
                  We'll get back to you at <strong>{form.email}</strong> within 24 hours.
                </p>
                <p style={{ margin: '0 0 24px', color: '#94a3b8', fontSize: '12px' }}>
                  {user
                    ? 'You can track replies in "My Support Tickets" above — refresh the page to see new replies.'
                    : 'Please log in to track your ticket status and see admin replies.'}
                </p>
                <button style={S.greenBtn} onClick={() => { setSent(false); setForm(f => ({ ...f, subject: '', message: '', orderId: '' })); }}>
                  Submit Another
                </button>
              </div>
            ) : (
              <div style={S.formCard}>
                {err && (
                  <div style={{ background: '#fef2f2', border: '1px solid #fecaca', color: '#dc2626', padding: '10px 14px', borderRadius: '10px', fontSize: '13px', fontWeight: '600', marginBottom: '16px' }}>
                    ⚠️ {err}
                  </div>
                )}

                {/* Login nudge for guests */}
                {!user && (
                  <div style={{ background: '#eff6ff', border: '1px solid #bfdbfe', borderRadius: 10, padding: '10px 14px', marginBottom: 16, fontSize: 13, color: '#1d4ed8', fontWeight: 600 }}>
                    💡 <Link to="/login" style={{ color: '#2563eb', fontWeight: 800 }}>Log in</Link> to track your ticket status and see replies from our team.
                  </div>
                )}

                <div style={S.formGrid}>
                  <div style={S.fg}>
                    <label style={S.lbl}>Full Name *</label>
                    <input className="ci" style={S.inp} placeholder="Muhammad Ali" value={form.name} onChange={set('name')} />
                  </div>
                  <div style={S.fg}>
                    <label style={S.lbl}>Email *</label>
                    <input className="ci" style={S.inp} type="email" placeholder="you@example.com" value={form.email} onChange={set('email')} />
                  </div>
                </div>
                <div style={S.fg}>
                  <label style={S.lbl}>Subject</label>
                  <select className="ci" style={S.inp} value={form.subject} onChange={set('subject')}>
                    <option value="">Select a topic…</option>
                    <option>Order Issue</option>
                    <option>Payment Problem</option>
                    <option>Product Question</option>
                    <option>Return / Refund</option>
                    <option>Account Help</option>
                    <option>Other</option>
                  </select>
                </div>
                <div style={S.fg}>
                  <label style={S.lbl}>Order ID <span style={{ color: '#94a3b8', fontWeight: 500, textTransform: 'none', fontSize: 10 }}>(optional)</span></label>
                  {ordersLoading ? (
                    <div style={{ ...S.inp, color: '#94a3b8', display: 'flex', alignItems: 'center', gap: 8 }}>
                      <span style={{ width: 12, height: 12, border: '2px solid #e2e8f0', borderTop: '2px solid #10b981', borderRadius: '50%', display: 'inline-block', animation: 'spin 0.7s linear infinite' }} />
                      Loading your orders…
                    </div>
                  ) : orders.length > 0 ? (
                    <select className="ci" style={S.inp} value={form.orderId} onChange={set('orderId')}>
                      <option value="">— Not related to an order —</option>
                      {orders.map(o => (
                        <option key={o._id} value={o._id}>
                          #{o._id.slice(-8).toUpperCase()} · {(o.products || []).slice(0, 2).map(p => p.name).join(', ')}{(o.products || []).length > 2 ? ` +${o.products.length - 2} more` : ''} · {o.status}
                        </option>
                      ))}
                    </select>
                  ) : (
                    <div style={{ ...S.inp, color: '#94a3b8', fontSize: 13, display: 'flex', alignItems: 'center', gap: 6 }}>
                      📭 {user ? 'No orders found — leave blank if not order-related' : 'Login to link an order'}
                    </div>
                  )}
                </div>
                <div style={{ ...S.fg, marginBottom: '20px' }}>
                  <label style={S.lbl}>Message *</label>
                  <textarea className="ci" style={{ ...S.inp, height: '120px', resize: 'vertical' }}
                    placeholder="Describe your issue in detail…"
                    value={form.message} onChange={set('message')} />
                </div>
                <button onClick={handleSubmit} style={{ ...S.greenBtn, width: '100%', opacity: sending ? 0.75 : 1 }} disabled={sending}>
                  {sending
                    ? <span style={{ display: 'flex', alignItems: 'center', gap: '8px', justifyContent: 'center' }}>
                        <span style={S.spinner} /> Submitting ticket…
                      </span>
                    : '📨 Submit Support Ticket'}
                </button>
              </div>
            )}
          </div>
        </div>

        {/* Quick links */}
        <div style={S.quickLinks}>
          <p style={{ margin: '0 0 16px', fontWeight: '800', fontSize: '15px', color: '#0f172a', textAlign: 'center' }}>Quick Links</p>
          <div style={{ display: 'flex', gap: '10px', flexWrap: 'wrap', justifyContent: 'center' }}>
            {[
              { to: '/',         label: '🏪 Shop'      },
              { to: '/orders',   label: '📦 My Orders' },
              { to: '/cart',     label: '🛒 Cart'      },
              { to: '/register', label: '👤 Register'  },
            ].map(l => (
              <Link key={l.to} to={l.to} style={S.quickLink}>{l.label}</Link>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}

/* ─── Styles ──────────────────────────────────────────────────── */
const S = {
  page:        { minHeight: '100vh', background: '#f8fafc', fontFamily: "'Outfit','DM Sans',sans-serif" },
  hero:        { background: 'linear-gradient(135deg,#064e3b,#065f46,#059669)', padding: '56px 20px 52px', position: 'relative', overflow: 'hidden' },
  heroBg:      { position: 'absolute', inset: 0, background: 'radial-gradient(circle at 60% 40%,rgba(110,231,183,0.1),transparent 60%)', pointerEvents: 'none' },
  heroTitle:   { margin: '0 0 10px', fontSize: 'clamp(22px,4vw,36px)', fontWeight: '900', color: '#fff', letterSpacing: '-1px' },
  heroSub:     { margin: '0 0 20px', fontSize: '15px', color: 'rgba(255,255,255,0.75)' },
  wrap:        { maxWidth: '1060px', margin: '0 auto', padding: '36px 20px 60px' },
  channelsRow: { display: 'grid', gridTemplateColumns: 'repeat(auto-fit,minmax(220px,1fr))', gap: '16px', marginBottom: '40px' },
  channelCard: { background: '#fff', borderRadius: '16px', padding: '20px', display: 'flex', alignItems: 'center', gap: '14px', boxShadow: '0 2px 10px rgba(0,0,0,0.05)' },
  channelIcon: { width: '48px', height: '48px', borderRadius: '14px', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '22px', flexShrink: 0 },
  twoCol:      { display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '32px', marginBottom: '40px' },
  secTitle:    { margin: '0 0 20px', fontSize: '18px', fontWeight: '900', color: '#0f172a' },
  faqRow:      { borderRadius: '14px', border: '1px solid #e2e8f0', overflow: 'hidden' },
  faqQ:        { width: '100%', display: 'flex', alignItems: 'center', gap: '12px', padding: '16px 18px', background: 'none', border: 'none', cursor: 'pointer', fontSize: '14px', fontWeight: '700', color: '#0f172a', fontFamily: "'Outfit',sans-serif" },
  faqA:        { margin: 0, padding: '0 18px 16px', fontSize: '13px', color: '#64748b', lineHeight: '1.7' },
  formCard:    { background: '#fff', borderRadius: '18px', padding: '28px', border: '1px solid #e2e8f0', boxShadow: '0 2px 12px rgba(0,0,0,0.05)' },
  formGrid:    { display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '14px' },
  fg:          { marginBottom: '14px' },
  lbl:         { display: 'block', fontSize: '11px', fontWeight: '800', color: '#475569', marginBottom: '6px', textTransform: 'uppercase', letterSpacing: '0.4px' },
  inp:         { width: '100%', padding: '11px 14px', border: '1.5px solid #e2e8f0', borderRadius: '11px', fontSize: '13px', boxSizing: 'border-box', background: '#f8fafc', color: '#1e293b', fontFamily: "'Outfit',sans-serif", fontWeight: '500' },
  greenBtn:    { display: 'inline-flex', alignItems: 'center', justifyContent: 'center', padding: '13px 24px', background: 'linear-gradient(135deg,#10b981,#059669)', color: '#fff', border: 'none', borderRadius: '12px', fontSize: '14px', fontWeight: '700', cursor: 'pointer', boxShadow: '0 4px 16px rgba(16,185,129,0.3)', fontFamily: "'Outfit',sans-serif", textDecoration: 'none' },
  spinner:     { width: '14px', height: '14px', border: '2px solid rgba(255,255,255,0.4)', borderTop: '2px solid #fff', borderRadius: '50%', display: 'inline-block', animation: 'spin 0.7s linear infinite' },
  quickLinks:  { background: '#fff', borderRadius: '16px', padding: '24px', border: '1px solid #e2e8f0', textAlign: 'center' },
  quickLink:   { padding: '9px 20px', background: '#f8fafc', border: '1.5px solid #e2e8f0', borderRadius: '999px', textDecoration: 'none', fontSize: '13px', fontWeight: '700', color: '#475569' },
};

const A = {
  page:        { minHeight: '100vh', background: '#f1f5f9', fontFamily: "'Sora','Segoe UI',sans-serif" },
  header:      { background: 'linear-gradient(135deg,#0a1628,#0f2040)', padding: '24px 36px', borderBottom: '1px solid rgba(255,255,255,.06)' },
  headerInner: { maxWidth: 1100, margin: '0 auto', display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 14 },
  headerIcon:  { width: 48, height: 48, borderRadius: 14, background: 'linear-gradient(135deg,#10b981,#059669)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 22, boxShadow: '0 4px 14px rgba(16,185,129,.4)' },
  headerTitle: { margin: 0, fontSize: 22, fontWeight: 900, color: '#f8fafc', letterSpacing: '-0.5px', fontFamily: "'Sora',sans-serif" },
  headerSub:   { margin: '3px 0 0', fontSize: 13, color: '#64748b' },
  backBtn:     { padding: '9px 18px', background: 'rgba(255,255,255,.08)', color: '#94a3b8', border: '1px solid rgba(255,255,255,.1)', borderRadius: 10, textDecoration: 'none', fontSize: 13, fontWeight: 700, fontFamily: "'Sora',sans-serif" },
  refreshBtn:  { padding: '9px 18px', background: 'linear-gradient(135deg,#10b981,#059669)', color: '#fff', border: 'none', borderRadius: 10, fontSize: 13, fontWeight: 700, cursor: 'pointer', fontFamily: "'Sora',sans-serif", boxShadow: '0 4px 12px rgba(16,185,129,.3)' },
  wrap:        { maxWidth: 1100, margin: '0 auto', padding: '30px 24px 60px' },
  kpiRow:      { display: 'grid', gridTemplateColumns: 'repeat(3,1fr)', gap: 16, marginBottom: 24 },
  kpiCard:     { borderRadius: 16, padding: '20px 22px', boxShadow: '0 2px 10px rgba(0,0,0,.05)' },
  toolbar:     { display: 'flex', gap: 12, marginBottom: 20, flexWrap: 'wrap', alignItems: 'center' },
  searchBox:   { flex: 1, minWidth: 240, padding: '10px 16px', border: '1.5px solid #e2e8f0', borderRadius: 11, fontSize: 13, background: '#fff', outline: 'none', fontFamily: "'Sora',sans-serif", fontWeight: 500, color: '#1e293b', boxShadow: '0 1px 4px rgba(0,0,0,.04)' },
  empty:       { textAlign: 'center', padding: '70px 20px', color: '#94a3b8', background: '#fff', borderRadius: 18, border: '1px solid #e2e8f0' },
  faqSection:  { background: '#fff', borderRadius: 18, padding: '24px 28px', border: '1px solid #e2e8f0' },
  faqQ:        { width: '100%', display: 'flex', alignItems: 'center', gap: 12, padding: '14px 18px', background: 'none', border: 'none', cursor: 'pointer', fontSize: 14, fontWeight: 700, color: '#0f172a' },
};
