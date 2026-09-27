import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import API, { assetUrl } from '../utils/axiosConfig';
import { formatPKR } from '../utils/priceUtils';

const STATUS_CFG = {
  Pending:    { lightColor:'#c2410c', lightBg:'#fff7ed', darkColor:'#ffd7a8', darkBg:'rgba(125, 69, 29, 0.48)', dot:'#f97316', icon:'⏳' },
  Processing: { lightColor:'#1d4ed8', lightBg:'#eff6ff', darkColor:'#d4e7ff', darkBg:'rgba(35, 68, 126, 0.42)', dot:'#60a5fa', icon:'⚙️' },
  Shipped:    { lightColor:'#0369a1', lightBg:'#f0f9ff', darkColor:'#d7f0ff', darkBg:'rgba(16, 73, 108, 0.42)', dot:'#38bdf8', icon:'🚚' },
  Delivered:  { lightColor:'#166534', lightBg:'#f0fdf4', darkColor:'#d9ffe8', darkBg:'rgba(22, 84, 53, 0.42)', dot:'#4ade80', icon:'✅' },
  Cancelled:  { lightColor:'#be123c', lightBg:'#fff1f2', darkColor:'#ffd5de', darkBg:'rgba(103, 36, 49, 0.42)', dot:'#fb7185', icon:'❌' },
};

const StatusBadge = ({ status, isDark }) => {
  const c = STATUS_CFG[status] || STATUS_CFG.Pending;
  return (
    <span style={{ display:'inline-flex', alignItems:'center', gap:'5px', background: isDark ? c.darkBg : c.lightBg, color: isDark ? c.darkColor : c.lightColor, padding:'5px 12px', borderRadius:'999px', fontSize:'12px', fontWeight:'700', border: isDark ? '1px solid rgba(255,255,255,0.08)' : 'none' }}>
      <span style={{ width:'7px', height:'7px', borderRadius:'50%', background:c.dot }} />
      {c.icon} {status}
    </span>
  );
};

export default function OrdersPage() {
  const [orders,  setOrders]  = useState([]);
  const [loading, setLoading] = useState(true);
  const [error,   setError]   = useState('');
  const [open,    setOpen]    = useState(null);   // expanded order id
  const [themeMode, setThemeMode] = useState(() => document.documentElement.dataset.theme === 'dark' ? 'dark' : 'light');
  const [isCompact, setIsCompact] = useState(() => typeof window !== 'undefined' ? window.innerWidth <= 520 : false);
  const isDark = themeMode === 'dark';

  useEffect(() => {
    const syncTheme = () => {
      const next = document.documentElement.dataset.theme === 'dark' ? 'dark' : 'light';
      setThemeMode(next);
    };

    const syncCompact = () => setIsCompact(window.innerWidth <= 520);

    syncTheme();
    syncCompact();
    const observer = new MutationObserver(syncTheme);
    observer.observe(document.documentElement, { attributes: true, attributeFilter: ['data-theme'] });
    window.addEventListener('resize', syncCompact);
    return () => {
      observer.disconnect();
      window.removeEventListener('resize', syncCompact);
    };
  }, []);

  useEffect(() => {
    API.get('/api/orders/my')
      .then(r => setOrders(r.data))
      .catch(() => setError('We could not load your orders. Please refresh and try again.'))
      .finally(() => setLoading(false));
  }, []);

  if (loading) return (
    <div style={{ display:'flex', alignItems:'center', justifyContent:'center', minHeight:'60vh', fontFamily:"'DM Sans',sans-serif", background: isDark ? '#0b1510' : '#f8fafc' }}>
      <div style={{ textAlign:'center' }}>
        <div style={{ width:'36px', height:'36px', border:'3px solid #e2e8f0', borderTop:'3px solid #10b981', borderRadius:'50%', animation:'spin 0.8s linear infinite', margin:'0 auto' }} />
        <p style={{ color: isDark ? '#d8f5e5' : '#64748b', marginTop:'12px' }}>Loading orders…</p>
        <style>{`@keyframes spin { to { transform:rotate(360deg) } }`}</style>
      </div>
    </div>
  );

  if (error) return (
    <div className="responsive-page orders-page" style={{ minHeight:'70vh', display:'flex', alignItems:'center', justifyContent:'center', padding:'32px 20px', fontFamily:"'DM Sans',sans-serif" }}>
      <div style={{ textAlign:'center', background:'#fff', borderRadius:'18px', padding:'42px 28px', border:'1px solid #fecaca', maxWidth:420, boxShadow:'0 4px 24px rgba(0,0,0,.06)' }}>
        <p style={{ fontSize:48, margin:'0 0 12px' }}>⚠️</p>
        <h2 style={{ margin:'0 0 8px', color:'#991b1b', fontSize:20 }}>Orders unavailable</h2>
        <p style={{ margin:0, color:'#64748b', fontSize:14, lineHeight:1.6 }}>{error}</p>
      </div>
    </div>
  );

  if (!orders.length) return (
    <div style={{ minHeight:'80vh', display:'flex', alignItems:'center', justifyContent:'center', fontFamily:"'DM Sans',sans-serif" }}>
      <div style={{ textAlign:'center', background:'#fff', borderRadius:'22px', padding:'60px 48px', border:'1px solid #e2e8f0', boxShadow:'0 4px 24px rgba(0,0,0,0.07)' }}>
        <p style={{ fontSize:'64px', margin:0 }}>📦</p>
        <h2 style={{ margin:'16px 0 8px', color:'#1e293b' }}>No orders yet</h2>
        <p style={{ color:'#94a3b8', margin:'0 0 24px' }}>Your orders will appear here once you shop.</p>
        <Link to="/" style={{ padding:'12px 28px', background:'linear-gradient(135deg,#10b981,#059669)', color:'#fff', borderRadius:'12px', textDecoration:'none', fontSize:'14px', fontWeight:'700' }}>
          Start Shopping
        </Link>
      </div>
    </div>
  );

  return (
    <div className="responsive-page orders-page" style={{ ...S.page, background: isDark ? 'radial-gradient(circle at top, rgba(21,42,33,0.9) 0%, rgba(11,21,16,0.92) 42%, rgba(6,10,9,0.98) 100%)' : '#f8fafc' }}>
      <div style={{ ...S.wrap, maxWidth:'760px' }}>
        <div style={{ marginBottom:'28px' }}>
          <h1 style={{ margin:'0 0 6px', fontSize:'26px', fontWeight:'900', color: isDark ? '#f1fff6' : '#0f172a' }}>📦 My Orders</h1>
          <p style={{ margin:0, fontSize:'14px', color: isDark ? '#b9d1c4' : '#64748b' }}>{orders.length} order{orders.length !== 1 ? 's':''} total</p>
        </div>

        <div style={{ display:'flex', flexDirection:'column', gap:'14px' }}>
          {orders.map(order => {
            const isOpen = open === order._id;
            return (
              <div key={order._id} style={{
                ...S.orderCard,
                background: isDark ? 'linear-gradient(180deg, rgba(17, 30, 24, 0.96), rgba(11, 20, 17, 0.98))' : '#fff',
                border: isDark ? '1px solid rgba(130, 175, 157, 0.24)' : '1px solid #e2e8f0',
                boxShadow: isDark ? '0 18px 34px rgba(0,0,0,0.26)' : '0 1px 4px rgba(0,0,0,0.05)',
              }}>
                {/* Header */}
                <div
                  style={{
                    ...S.orderHead,
                    background: isDark ? 'rgba(123, 154, 142, 0.02)' : 'transparent',
                    flexDirection: isCompact ? 'column' : 'row',
                    alignItems: isCompact ? 'stretch' : 'center',
                  }}
                  role="button"
                  tabIndex={0}
                  aria-expanded={isOpen}
                  onClick={() => setOpen(isOpen ? null : order._id)}
                  onKeyDown={e => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); setOpen(isOpen ? null : order._id); } }}
                >
                  <div style={{ display:'grid', gridTemplateColumns: isCompact ? 'repeat(2, minmax(0, 1fr))' : 'auto', alignItems:'center', gap:isCompact ? '12px 10px' : '16px', flexWrap:'wrap', flex:1 }}>
                    <div>
                      <p style={{ margin:0, fontSize:'12px', color: isDark ? '#a7b8b0' : '#94a3b8', fontWeight:'600' }}>ORDER</p>
                      <p style={{ margin:0, fontWeight:'800', fontSize:'14px', color: isDark ? '#dfefff' : '#6366f1', fontFamily:'monospace' }}>
                        #{order._id.slice(-8).toUpperCase()}
                      </p>
                    </div>
                    <div>
                      <p style={{ margin:0, fontSize:'12px', color: isDark ? '#a7b8b0' : '#94a3b8', fontWeight:'600' }}>DATE</p>
                      <p style={{ margin:0, fontSize:'13px', fontWeight:'600', color: isDark ? '#edf9f3' : '#334155' }}>
                        {new Date(order.createdAt).toLocaleDateString('en-PK', { day:'numeric', month:'short', year:'numeric' })}
                      </p>
                    </div>
                    <div>
                      <p style={{ margin:0, fontSize:'12px', color: isDark ? '#a7b8b0' : '#94a3b8', fontWeight:'600' }}>TOTAL</p>
                      <p style={{ margin:0, fontSize:'16px', fontWeight:'900', color: isDark ? '#a9f5c8' : '#10b981' }}>{formatPKR(order.totalPrice)}</p>
                    </div>
                    <div>
                      <p style={{ margin:0, fontSize:'12px', color: isDark ? '#a7b8b0' : '#94a3b8', fontWeight:'600' }}>PAYMENT</p>
                      <p style={{ margin:0, fontSize:'13px', fontWeight:'600', color: isDark ? '#d6c9ff' : '#7c3aed' }}>{order.paymentMethod}</p>
                    </div>
                    {isCompact && (
                      <div style={{ gridColumn:'1 / -1' }}>
                        <StatusBadge status={order.status} isDark={isDark} />
                      </div>
                    )}
                    {!isCompact && <StatusBadge status={order.status} isDark={isDark} />}
                  </div>
                  <div style={{ display:'flex', alignItems:'center', justifyContent:isCompact ? 'space-between' : 'center', gap:'8px', flexShrink:0, width:isCompact ? '100%' : 'auto', marginTop:isCompact ? '8px' : '0' }}>
                    <Link
                      to={`/orders/${order._id}`}
                      onClick={e => e.stopPropagation()}
                      style={{ padding:'7px 16px', background:'linear-gradient(135deg,#2c4842,#18372e)', color:'#ffffff', borderRadius:'9px', fontSize:'12px', fontWeight:'800', textDecoration:'none', whiteSpace:'nowrap', boxShadow:'0 3px 10px rgba(20,46,39,0.38)', border:'1px solid rgba(160, 234, 188, 0.18)' }}
                    >
                      📍 Track
                    </Link>
                    <span style={{ fontSize:'18px', color: isDark ? '#dbe9e2' : '#94a3b8', userSelect:'none' }}>
                      {isOpen ? '▲' : '▼'}
                    </span>
                  </div>
                </div>

                {/* Expanded detail */}
                {isOpen && (
                  <div style={S.orderBody}>
                    {/* Progress tracker */}
                    <div style={S.tracker}>
                      {['Pending','Processing','Shipped','Delivered'].map((s, i, arr) => {
                        const cfg = STATUS_CFG[s];
                        const statuses = ['Pending','Processing','Shipped','Delivered'];
                        const currentIdx = statuses.indexOf(order.status);
                        const thisIdx    = statuses.indexOf(s);
                        const done = order.status === 'Cancelled' ? false : thisIdx <= currentIdx;
                        const active = thisIdx === currentIdx;
                        return (
                          <div key={s} style={{ display:'flex', flexDirection:'column', alignItems:'center', flex:1 }}>
                            <div style={{ ...S.trackDot, background: done ? '#10b981' : (isDark ? '#20342d' : '#e2e8f0'), border: active ? '3px solid #6ee7b7' : 'none', transform: active ? 'scale(1.2)' : 'scale(1)', boxShadow: active && isDark ? '0 0 0 5px rgba(110, 231, 183, 0.12)' : 'none', color: isDark ? '#f3fff8' : '#fff' }}>
                              {done ? '✓' : cfg.icon}
                            </div>
                            <span style={{ fontSize:'10px', fontWeight:'700', color: done ? (isDark ? '#d9ffe8' : '#10b981') : (isDark ? '#cfe4d9' : '#94a3b8'), marginTop:'6px', textAlign:'center' }}>{s}</span>
                            {i < arr.length - 1 && (
                              <div style={{ position:'absolute', top:'16px', left:'60%', right:'-40%', height:'2px', background: done && thisIdx < currentIdx ? '#10b981':'#e2e8f0', zIndex:0 }} />
                            )}
                          </div>
                        );
                      })}
                    </div>

                    {order.status === 'Cancelled' && (
                      <div style={{ background:'#fff1f2', border:'1px solid #fecdd3', borderRadius:'10px', padding:'10px 14px', fontSize:'13px', color:'#be123c', fontWeight:'600', marginBottom:'16px' }}>
                        ❌ This order was cancelled.
                      </div>
                    )}

                    {/* Products */}
                    <h4 style={{ margin:'0 0 12px', fontSize:'13px', fontWeight:'800', color:'#475569', textTransform:'uppercase', letterSpacing:'0.5px' }}>Items Ordered</h4>
                    {order.products.map((p, i) => (
                      <div key={i} style={S.itemRow}>
                        <div style={S.itemImg}>
                          {p.image
                            ? <img src={assetUrl(p.image)} alt={p.name} style={{ width:'100%', height:'100%', objectFit:'cover' }} onError={e => e.target.style.display='none'} />
                            : <span style={{ fontSize:'20px' }}>🛍️</span>}
                        </div>
                        <div style={{ flex:1 }}>
                          <p style={{ margin:'0 0 2px', fontWeight:'700', color: isDark ? '#f1fff6' : '#1e293b' }}>{p.name}</p>
                          <p style={{ margin:0, fontSize:'12px', color: isDark ? '#afc4b8' : '#94a3b8' }}>Quantity: {p.quantity}</p>
                          {(p.selectedColor || p.selectedSize) && (
                            <p style={{ margin:'4px 0 0', fontSize:'11px', color: isDark ? '#9cebc0' : '#047857', fontWeight:'700' }}>
                              {[p.selectedColor && `Colour: ${p.selectedColor}`, p.selectedSize && `Size: ${p.selectedSize}`].filter(Boolean).join(' · ')}
                            </p>
                          )}
                        </div>
                        <span style={{ fontWeight:'800', color: isDark ? '#a9f5c8' : '#10b981', whiteSpace:'nowrap' }}>{formatPKR(p.price * p.quantity)}</span>
                      </div>
                    ))}

                    {/* Pricing breakdown */}
                    <div style={{ background: isDark ? 'rgba(19,33,29,0.9)' : '#f8fafc', borderRadius:'12px', padding:'14px 16px', marginTop:'14px', border: isDark ? '1px solid rgba(130,175,157,0.2)' : 'none' }}>
                      <div style={{ display:'flex', justifyContent:'space-between', marginBottom:'8px' }}>
                        <span style={{ fontSize:'13px', color: isDark ? '#afc4b8' : '#64748b' }}>Subtotal</span>
                        <span style={{ fontWeight:'700', color: isDark ? '#ecfff3' : '#334155' }}>{formatPKR(order.productTotal)}</span>
                      </div>
                      <div style={{ display:'flex', justifyContent:'space-between', marginBottom:'8px' }}>
                        <span style={{ fontSize:'13px', color: isDark ? '#afc4b8' : '#64748b' }}>Shipping ({order.address?.country})</span>
                        <span style={{ fontWeight:'700', color: isDark ? '#ecfff3' : '#334155' }}>{formatPKR(order.shippingFee)}</span>
                      </div>
                      <div style={{ height:'1px', background: isDark ? 'rgba(140,175,160,0.16)' : '#e2e8f0', margin:'10px 0' }} />
                      <div style={{ display:'flex', justifyContent:'space-between' }}>
                        <span style={{ fontWeight:'800', color: isDark ? '#f4fff6' : '#0f172a' }}>Total</span>
                        <span style={{ fontWeight:'900', fontSize:'18px', color: isDark ? '#a9f5c8' : '#10b981' }}>{formatPKR(order.totalPrice)}</span>
                      </div>
                    </div>

                    {/* Delivery address */}
                    <div style={{ marginTop:'12px', background: isDark ? 'rgba(19,33,29,0.9)' : '#f8fafc', borderRadius:'12px', padding:'14px 16px', border: isDark ? '1px solid rgba(130,175,157,0.2)' : 'none' }}>
                      <p style={{ margin:'0 0 6px', fontSize:'12px', fontWeight:'800', color: isDark ? '#cfe8db' : '#475569', textTransform:'uppercase', letterSpacing:'0.5px' }}>📍 Delivery Address</p>
                      <p style={{ margin:0, fontSize:'13px', color: isDark ? '#edf9f3' : '#334155', lineHeight:'1.6' }}>
                        {[order.address?.street, order.address?.city, order.address?.country].filter(Boolean).join(', ')}
                      </p>
                    </div>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}

const S = {
  page:       { minHeight:'100vh', background:'#f8fafc', padding:'32px 20px', fontFamily:"'DM Sans','Segoe UI',sans-serif" },
  wrap:       { maxWidth:'780px', margin:'0 auto' },
  orderCard:  { background:'#fff', borderRadius:'16px', border:'1px solid #e2e8f0', boxShadow:'0 1px 4px rgba(0,0,0,0.05)', overflow:'hidden' },
  orderHead:  { display:'flex', alignItems:'center', gap:'12px', padding:'18px 22px', cursor:'pointer', userSelect:'none' },
  orderBody:  { padding:'0 22px 22px', borderTop:'1px solid #f1f5f9' },
  tracker:    { display:'flex', position:'relative', padding:'20px 0 16px', justifyContent:'space-between' },
  trackDot:   { width:'32px', height:'32px', borderRadius:'50%', display:'flex', alignItems:'center', justifyContent:'center', fontSize:'13px', color:'#fff', fontWeight:'800', position:'relative', zIndex:1, transition:'all 0.2s' },
  itemRow:    { display:'flex', alignItems:'center', gap:'12px', padding:'10px 0', borderBottom:'1px solid #f8fafc' },
  itemImg:    { width:'44px', height:'44px', borderRadius:'9px', background:'#f0fdf4', flexShrink:0, overflow:'hidden', display:'flex', alignItems:'center', justifyContent:'center', border:'1px solid #e2e8f0' },
};
