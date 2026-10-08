// frontend/src/pages/SupportPage.jsx
import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import API from '../utils/axiosConfig';
import AdminSupportView from './support/AdminSupportView';
import AdminTicketCard from './support/AdminTicketCard';
import MyTickets from './support/MyTickets';
import { FAQS } from './support/supportConfig';
import { S } from './support/supportStyles';


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
    <div className="responsive-page support-page" style={S.page}>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Outfit:wght@400;600;700;800;900&display=swap');
        @keyframes fadeUp { from{opacity:0;transform:translateY(14px)} to{opacity:1;transform:none} }
        @keyframes spin   { to{transform:rotate(360deg)} }
        .faq-row:hover { background:#f8fafc !important; }
        .ci:focus { border-color:#10b981 !important; box-shadow:0 0 0 3px rgba(16,185,129,0.1) !important; outline:none; }
        .ci { transition:all 0.15s; }
        .ch:hover { transform:translateY(-3px); box-shadow:0 8px 28px rgba(0,0,0,0.1) !important; }
        .ch { transition:all 0.2s; }
        .support-hero {
          max-width:1060px;
          margin:0 auto;
          display:grid;
          grid-template-columns:minmax(0,1fr) 320px;
          align-items:center;
          gap:36px;
        }
        .support-hero-art {
          min-height:190px;
          position:relative;
          border:1px solid rgba(167,243,208,.2);
          border-radius:28px;
          background:rgba(2,44,34,.28);
          overflow:hidden;
        }
        .support-hero-art:before,
        .support-hero-art:after {
          content:'';
          position:absolute;
          border-radius:50%;
          border:1px solid rgba(167,243,208,.25);
        }
        .support-hero-art:before { width:220px; height:220px; top:-80px; right:-40px; }
        .support-hero-art:after { width:150px; height:150px; bottom:-80px; left:-30px; }
        .support-orbit {
          position:absolute;
          inset:34px 50px;
          border:1px dashed rgba(255,255,255,.28);
          border-radius:50%;
          transform:rotate(-18deg);
        }
        .support-orbit span {
          position:absolute;
          width:54px; height:54px;
          display:flex; align-items:center; justify-content:center;
          border-radius:18px;
          background:#10b981;
          box-shadow:0 10px 24px rgba(0,0,0,.2);
          font-size:25px;
        }
        .support-orbit span:first-child { top:-18px; left:18px; }
        .support-orbit span:last-child { right:-10px; bottom:0; background:#f59e0b; }
        .support-headset {
          position:absolute;
          left:50%; top:50%;
          transform:translate(-50%,-50%);
          width:92px; height:92px;
          display:flex; align-items:center; justify-content:center;
          border:10px solid #d1fae5;
          border-bottom-color:transparent;
          border-radius:50%;
          color:#fff;
          font-size:30px;
        }
        @media (max-width:760px) {
          .support-hero { display:block; }
          .support-hero-art { display:none; }
        }
      `}</style>

      {/* Hero */}
      <div style={S.hero}>
        <div style={S.heroBg} />
        <div className="support-hero">
          <div style={{ position: 'relative', zIndex: 1 }}>
            <span style={{ display:'inline-flex', padding:'7px 11px', borderRadius:999, background:'rgba(167,243,208,.12)', border:'1px solid rgba(167,243,208,.25)', color:'#a7f3d0', fontSize:10, fontWeight:800, letterSpacing:'1.3px' }}>INDUSCART CARE</span>
            <h1 style={{ ...S.heroTitle, marginTop:14 }}>We’re here to help.</h1>
            <p style={{ ...S.heroSub, maxWidth:470 }}>Questions about an order, delivery, or your account? Our support team is ready to guide you.</p>
            <div style={{ display:'flex', gap:18, flexWrap:'wrap', color:'rgba(255,255,255,.72)', fontSize:11, fontWeight:700 }}>
              <span>✓ Fast replies</span><span>✓ Order guidance</span><span>✓ Human support</span>
            </div>
          </div>
          <div className="support-hero-art" aria-hidden="true">
            <div className="support-orbit"><span>💬</span><span>✓</span></div>
            <div className="support-headset">🎧</div>
          </div>
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
            <div key={ch.label} className="ch support-channel-card" style={{ ...S.channelCard, border: '1.5px solid ' + ch.bg }}>
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
                <div key={i} className={`faq-row support-faq-row${openFaq === i ? ' is-open' : ''}`} style={{ ...S.faqRow, background: openFaq === i ? '#f0fdf4' : '#fff' }}>
                  <button className="support-faq-question" style={S.faqQ} onClick={() => setOpenFaq(openFaq === i ? null : i)}>
                    <span style={{ flex: 1, textAlign: 'left' }}>{faq.q}</span>
                    <span style={{ fontSize: '18px', color: '#10b981', fontWeight: '700', transform: openFaq === i ? 'rotate(45deg)' : 'none', transition: 'transform 0.2s', flexShrink: 0 }}>+</span>
                  </button>
                  {openFaq === i && <p className="support-faq-answer" style={S.faqA}>{faq.a}</p>}
                </div>
              ))}
            </div>
          </div>

          {/* Contact form */}
          <div>
            <h2 style={S.secTitle}>✉️ Send Us a Message</h2>
            {sent ? (
              <div className="support-form-card" style={{ ...S.formCard, textAlign: 'center', padding: '40px 24px' }}>
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
              <div className="support-form-card" style={S.formCard}>
                {err && (
                  <div style={{ background: '#fef2f2', border: '1px solid #fecaca', color: '#dc2626', padding: '10px 14px', borderRadius: '10px', fontSize: '13px', fontWeight: '600', marginBottom: '16px' }}>
                    ⚠️ {err}
                  </div>
                )}

                {/* Login nudge for guests */}
                {!user && (
                  <div className="support-login-nudge" style={{ background: '#eff6ff', border: '1px solid #bfdbfe', borderRadius: 10, padding: '10px 14px', marginBottom: 16, fontSize: 13, color: '#1d4ed8', fontWeight: 600 }}>
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
                    <div className="support-order-placeholder" style={{ ...S.inp, color: '#94a3b8', fontSize: 13, display: 'flex', alignItems: 'center', gap: 6 }}>
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
        <div className="support-quick-links" style={S.quickLinks}>
          <p style={{ margin: '0 0 16px', fontWeight: '800', fontSize: '15px', color: '#0f172a', textAlign: 'center' }}>Quick Links</p>
          <div style={{ display: 'flex', gap: '10px', flexWrap: 'wrap', justifyContent: 'center' }}>
            {[
              { to: '/',         label: '🏪 Shop'      },
              { to: '/orders',   label: '📦 My Orders' },
              { to: '/cart',     label: '🛒 Cart'      },
              { to: '/register', label: '👤 Register'  },
            ].map(l => (
              <Link key={l.to} to={l.to} className="quickLink" style={S.quickLink}>{l.label}</Link>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}

/* ─── Styles ──────────────────────────────────────────────────── */
