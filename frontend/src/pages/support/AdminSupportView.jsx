import { useCallback, useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import API from '../../utils/axiosConfig';
import { FAQS } from './supportConfig';
import { A } from './supportStyles';
import AdminTicketCard from './AdminTicketCard';

/* ═══════════════════════════════════════════════════════════════
   ADMIN SUPPORT DASHBOARD
   ═══════════════════════════════════════════════════════════════ */
export default function AdminSupportView() {
  const [tickets,     setTickets]     = useState([]);
  const [loading,     setLoading]     = useState(true);
  const [filter,      setFilter]      = useState('All');
  const [search,      setSearch]      = useState('');
  const [expandedFaq, setExpandedFaq] = useState(null);
  const [themeMode, setThemeMode] = useState(() => document.documentElement.dataset.theme === 'dark' ? 'dark' : 'light');

  useEffect(() => {
    const syncTheme = () => setThemeMode(document.documentElement.dataset.theme === 'dark' ? 'dark' : 'light');
    syncTheme();
    const observer = new MutationObserver(syncTheme);
    observer.observe(document.documentElement, { attributes: true, attributeFilter: ['data-theme'] });
    return () => observer.disconnect();
  }, []);

  const isDark = themeMode === 'dark';

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
    <div className={`responsive-page support-admin-page${isDark ? ' is-dark' : ' is-light'}`} style={{ ...A.page, background: isDark ? 'linear-gradient(145deg, #0b1510 0%, #0d1a16 100%)' : '#f3f6f4' }}>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Sora:wght@400;600;700;800;900&family=JetBrains+Mono:wght@500;700&display=swap');
        @keyframes fadeUp { from{opacity:0;transform:translateY(12px)} to{opacity:1;transform:none} }
        @keyframes spin   { to{transform:rotate(360deg)} }
        .support-admin-page.is-light { background:#f3f6f4 !important; color:#1e3027; }
        .support-admin-page.is-light .support-ticket-kpi { border-color:#e0e7e2 !important; box-shadow:0 4px 14px rgba(24,48,35,.055) !important; }
        .support-admin-page.is-light .support-ticket-kpi-total { border-left:3px solid #54796a !important; }
        .support-admin-page.is-light .support-ticket-kpi-open { border-left:3px solid #bd7624 !important; }
        .support-admin-page.is-light .support-ticket-kpi-resolved { border-left:3px solid #25825d !important; }
        .support-admin-page.is-light .support-ticket-kpi-icon { padding:8px; border-radius:12px; background:#f1f5f2; }
        .support-admin-page.is-light .support-ticket-filter[aria-pressed='true'] { background:#176b50 !important; border-color:#176b50 !important; color:#fff !important; }
        .support-admin-page.is-light .support-ticket-filter:not([aria-pressed='true']) { color:#43544a !important; border-color:#d5ded8 !important; }
        .support-admin-page.is-light .support-ticket-card { border-color:#dfe6e1 !important; box-shadow:0 3px 12px rgba(24,48,35,.045) !important; }
        .support-admin-page.is-light .support-ticket-card[data-status='open'] { border-left:3px solid #bd7624 !important; }
        .support-admin-page.is-light .support-ticket-card[data-status='resolved'] { border-left:3px solid #25825d !important; }
        .support-admin-page.is-light .support-ticket-faq { border-color:#dfe6e1 !important; }
        .tkt-row:hover { background:${isDark ? '#16241e !important' : '#f8fafc !important'}; }
        .pill-btn:hover { opacity:.85; }
        .action-btn:hover { opacity:.8; }
        ::-webkit-scrollbar { width:4px; height:4px; }
        ::-webkit-scrollbar-thumb { background:${isDark ? '#3b4d45' : '#e2e8f0'}; border-radius:99px; }
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
            { label: 'Total Tickets', val: tickets.length,  color: isDark ? '#dfeafc' : '#496b5c', bg: isDark ? 'linear-gradient(135deg,#18212c,#111827)' : '#fff', border: isDark ? '#3f4a62' : '#e0e7e2', icon: '🗂️', tone: 'total' },
            { label: 'Open',          val: openCount,        color: isDark ? '#ffe0b5' : '#985915', bg: isDark ? 'linear-gradient(135deg,#352a1a,#221b14)' : '#fff', border: isDark ? '#7b5b3f' : '#e0e7e2', icon: '🟡', tone: 'open' },
            { label: 'Resolved',      val: resolvedCount,    color: isDark ? '#a7f3d0' : '#176b50', bg: isDark ? 'linear-gradient(135deg,#183327,#10281f)' : '#fff', border: isDark ? '#3c735f' : '#e0e7e2', icon: '✅', tone: 'resolved' },
          ].map(k => (
            <div key={k.label} className={`support-ticket-kpi support-ticket-kpi-${k.tone}`} style={{ ...A.kpiCard, background: k.bg, border: `1.5px solid ${k.border}`, boxShadow: isDark ? '0 10px 24px rgba(0,0,0,0.18)' : '0 2px 10px rgba(0,0,0,.05)' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                <div>
                  <p style={{ margin: '0 0 6px', fontSize: 10, fontWeight: 700, color: k.color, textTransform: 'uppercase', letterSpacing: '1px', fontFamily: "'Sora',sans-serif" }}>{k.label}</p>
                  <p style={{ margin: 0, fontSize: 32, fontWeight: 900, color: isDark ? '#f8fbfa' : '#20372b', lineHeight: 1, fontFamily: "'Sora',sans-serif" }}>{k.val}</p>
                </div>
                <span className="support-ticket-kpi-icon" style={{ fontSize: 26 }}>{k.icon}</span>
              </div>
            </div>
          ))}
        </div>

        {/* Filter + Search */}
        <div style={A.toolbar}>
          <div style={{ display: 'flex', gap: 6, flexShrink: 0 }}>
            {['All', 'Open', 'Resolved'].map(f => {
              const isActive = filter === f;
              const activeColor = '#f8fbfa';
              const activeBg = isDark
                ? f === 'Open' ? '#3d2f21' : f === 'Resolved' ? '#1f3a31' : '#1f2d3a'
                : '#176b50';
              const activeBorder = isDark
                ? f === 'Open' ? '#7f5a3d' : f === 'Resolved' ? '#4b8267' : '#4b6981'
                : '#176b50';
              return (
                <button key={f} className="pill-btn support-ticket-filter" aria-pressed={isActive} onClick={() => setFilter(f)} style={{
                  padding: '8px 18px', borderRadius: 999, fontSize: 13, fontWeight: 700, cursor: 'pointer',
                  border: `1.5px solid ${isActive ? activeBorder : isDark ? '#33473f' : '#e2e8f0'}`,
                  background: isActive ? activeBg : isDark ? '#111915' : '#fff',
                  color: isActive ? activeColor : isDark ? '#e2efe8' : '#64748b',
                  fontFamily: "'Sora',sans-serif", transition: 'all .15s',
                }}>
                  {f} ({f === 'All' ? tickets.length : f === 'Open' ? openCount : resolvedCount})
                </button>
              );
            })}
          </div>
          <input
            style={{ ...A.searchBox, background: isDark ? '#0d1714' : '#fff', borderColor: isDark ? '#33473f' : '#e2e8f0', color: isDark ? '#edf7f2' : '#1e293b' }}
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
          <div style={{ ...A.empty, background: isDark ? '#101915' : '#fff', borderColor: isDark ? '#33473f' : '#e2e8f0', boxShadow: isDark ? '0 10px 24px rgba(0,0,0,0.18)' : '0 2px 8px rgba(0,0,0,0.04)' }}>
            <p style={{ fontSize: '52px', margin: '0 0 12px' }}>{tickets.length === 0 ? '📭' : '🔍'}</p>
            <p style={{ margin: 0, fontSize: 16, fontWeight: 700, color: isDark ? '#edf7f2' : '#334155', fontFamily: "'Sora',sans-serif" }}>
              {tickets.length === 0 ? 'No tickets yet' : 'No tickets match your filter'}
            </p>
            <p style={{ margin: '6px 0 0', fontSize: 13, color: isDark ? '#a7b8b0' : '#94a3b8', fontFamily: "'Sora',sans-serif" }}>
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
                darkMode={isDark}
                onStatusChange={(status) => handleStatusChange(ticket._id, status)}
                onReply={(text) => handleReply(ticket._id, text)}
              />
            ))}
          </div>
        )}

        {/* FAQ reference */}
        <div className="support-ticket-faq" style={{ ...A.faqSection, marginTop: 40 }}>
          <h2 style={{ margin: '0 0 16px', fontSize: 17, fontWeight: 800, color: '#0f172a', fontFamily: "'Sora',sans-serif" }}>📚 FAQ Reference</h2>
          <p style={{ margin: '0 0 16px', fontSize: 13, color: '#64748b' }}>Standard answers to refer to when responding to tickets:</p>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
            {FAQS.map((faq, i) => (
              <div key={i} className="support-ticket-faq-row" style={{ background: '#fff', borderRadius: 12, border: '1px solid #e2e8f0', overflow: 'hidden' }}>
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
