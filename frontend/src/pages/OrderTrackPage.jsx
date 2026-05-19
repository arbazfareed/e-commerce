import { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import API from '../utils/axiosConfig';
import { formatPKR } from '../utils/priceUtils';

const BASE = 'http://localhost:5000';
const STATUS_CFG = {
  Pending:    { color:'#c2410c', bg:'#fff7ed', dot:'#f97316', icon:'⏳' },
  Processing: { color:'#1d4ed8', bg:'#eff6ff', dot:'#3b82f6', icon:'⚙️' },
  Shipped:    { color:'#0369a1', bg:'#f0f9ff', dot:'#0ea5e9', icon:'🚚' },
  Delivered:  { color:'#166534', bg:'#f0fdf4', dot:'#16a34a', icon:'✅' },
  Cancelled:  { color:'#be123c', bg:'#fff1f2', dot:'#f43f5e', icon:'❌' },
};

const StatusBadge = ({ status }) => {
  const c = STATUS_CFG[status] || STATUS_CFG.Pending;
  return (
    <span style={{ display:'inline-flex', alignItems:'center', gap:'5px', background:c.bg, color:c.color, padding:'5px 12px', borderRadius:'999px', fontSize:'12px', fontWeight:'700' }}>
      <span style={{ width:'7px', height:'7px', borderRadius:'50%', background:c.dot }} />
      {c.icon} {status}
    </span>
  );
};

export default function OrdersPage() {
  const [orders,  setOrders]  = useState([]);
  const [loading, setLoading] = useState(true);
  const [open,    setOpen]    = useState(null);   // expanded order id

  useEffect(() => {
    API.get('/api/orders/my')
      .then(r => setOrders(r.data))
      .catch(console.error)
      .finally(() => setLoading(false));
  }, []);

  if (loading) return (
    <div style={{ display:'flex', alignItems:'center', justifyContent:'center', minHeight:'60vh', fontFamily:"'DM Sans',sans-serif" }}>
      <div style={{ textAlign:'center' }}>
        <div style={{ width:'36px', height:'36px', border:'3px solid #e2e8f0', borderTop:'3px solid #10b981', borderRadius:'50%', animation:'spin 0.8s linear infinite', margin:'0 auto' }} />
        <p style={{ color:'#64748b', marginTop:'12px' }}>Loading orders…</p>
        <style>{`@keyframes spin { to { transform:rotate(360deg) } }`}</style>
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
    <div style={S.page}>
      <div style={S.wrap}>
        <div style={{ marginBottom:'28px' }}>
          <h1 style={{ margin:'0 0 6px', fontSize:'26px', fontWeight:'900', color:'#0f172a' }}>📦 My Orders</h1>
          <p style={{ margin:0, fontSize:'14px', color:'#64748b' }}>{orders.length} order{orders.length !== 1 ? 's':''} total</p>
        </div>

        <div style={{ display:'flex', flexDirection:'column', gap:'14px' }}>
          {orders.map(order => {
            const isOpen = open === order._id;
            return (
              <div key={order._id} style={S.orderCard}>
                {/* Header */}
                <div style={S.orderHead} onClick={() => setOpen(isOpen ? null : order._id)}>
                  <div style={{ display:'flex', alignItems:'center', gap:'16px', flexWrap:'wrap', flex:1 }}>
                    <div>
                      <p style={{ margin:0, fontSize:'12px', color:'#94a3b8', fontWeight:'600' }}>ORDER</p>
                      <p style={{ margin:0, fontWeight:'800', fontSize:'14px', color:'#6366f1', fontFamily:'monospace' }}>
                        #{order._id.slice(-8).toUpperCase()}
                      </p>
                    </div>
                    <div>
                      <p style={{ margin:0, fontSize:'12px', color:'#94a3b8', fontWeight:'600' }}>DATE</p>
                      <p style={{ margin:0, fontSize:'13px', fontWeight:'600', color:'#334155' }}>
                        {new Date(order.createdAt).toLocaleDateString('en-PK', { day:'numeric', month:'short', year:'numeric' })}
                      </p>
                    </div>
                    <div>
                      <p style={{ margin:0, fontSize:'12px', color:'#94a3b8', fontWeight:'600' }}>TOTAL</p>
                      <p style={{ margin:0, fontSize:'16px', fontWeight:'900', color:'#10b981' }}>{formatPKR(order.totalPrice)}</p>
                    </div>
                    <div>
                      <p style={{ margin:0, fontSize:'12px', color:'#94a3b8', fontWeight:'600' }}>PAYMENT</p>
                      <p style={{ margin:0, fontSize:'13px', fontWeight:'600', color:'#7c3aed' }}>{order.paymentMethod}</p>
                    </div>
                    <StatusBadge status={order.status} />
                  </div>
                  <div style={{ display:'flex', alignItems:'center', gap:'8px', flexShrink:0 }}>
                    <Link
                      to={`/orders/${order._id}`}
                      onClick={e => e.stopPropagation()}
                      style={{ padding:'7px 16px', background:'linear-gradient(135deg,#10b981,#059669)', color:'#fff', borderRadius:'9px', fontSize:'12px', fontWeight:'800', textDecoration:'none', whiteSpace:'nowrap', boxShadow:'0 3px 10px rgba(16,185,129,0.3)' }}
                    >
                      📍 Track
                    </Link>
                    <span style={{ fontSize:'18px', color:'#94a3b8', userSelect:'none' }}>
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
                            <div style={{ ...S.trackDot, background: done ? '#10b981':'#e2e8f0', border: active ? '3px solid #059669':'none', transform: active ? 'scale(1.2)':'scale(1)' }}>
                              {done ? '✓' : cfg.icon}
                            </div>
                            <span style={{ fontSize:'10px', fontWeight:'700', color: done ? '#10b981':'#94a3b8', marginTop:'6px', textAlign:'center' }}>{s}</span>
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
                            ? <img src={`${BASE}/uploads/${p.image}`} alt={p.name} style={{ width:'100%', height:'100%', objectFit:'cover' }} onError={e => e.target.style.display='none'} />
                            : <span style={{ fontSize:'20px' }}>🛍️</span>}
                        </div>
                        <div style={{ flex:1 }}>
                          <p style={{ margin:'0 0 2px', fontWeight:'700', color:'#1e293b' }}>{p.name}</p>
                          <p style={{ margin:0, fontSize:'12px', color:'#94a3b8' }}>Quantity: {p.quantity}</p>
                        </div>
                        <span style={{ fontWeight:'800', color:'#10b981', whiteSpace:'nowrap' }}>{formatPKR(p.price * p.quantity)}</span>
                      </div>
                    ))}

                    {/* Pricing breakdown */}
                    <div style={{ background:'#f8fafc', borderRadius:'12px', padding:'14px 16px', marginTop:'14px' }}>
                      <div style={{ display:'flex', justifyContent:'space-between', marginBottom:'8px' }}>
                        <span style={{ fontSize:'13px', color:'#64748b' }}>Subtotal</span>
                        <span style={{ fontWeight:'700', color:'#334155' }}>{formatPKR(order.productTotal)}</span>
                      </div>
                      <div style={{ display:'flex', justifyContent:'space-between', marginBottom:'8px' }}>
                        <span style={{ fontSize:'13px', color:'#64748b' }}>Shipping ({order.address?.country})</span>
                        <span style={{ fontWeight:'700', color:'#334155' }}>{formatPKR(order.shippingFee)}</span>
                      </div>
                      <div style={{ height:'1px', background:'#e2e8f0', margin:'10px 0' }} />
                      <div style={{ display:'flex', justifyContent:'space-between' }}>
                        <span style={{ fontWeight:'800', color:'#0f172a' }}>Total</span>
                        <span style={{ fontWeight:'900', fontSize:'18px', color:'#10b981' }}>{formatPKR(order.totalPrice)}</span>
                      </div>
                    </div>

                    {/* Delivery address */}
                    <div style={{ marginTop:'12px', background:'#f8fafc', borderRadius:'12px', padding:'14px 16px' }}>
                      <p style={{ margin:'0 0 6px', fontSize:'12px', fontWeight:'800', color:'#475569', textTransform:'uppercase', letterSpacing:'0.5px' }}>📍 Delivery Address</p>
                      <p style={{ margin:0, fontSize:'13px', color:'#334155', lineHeight:'1.6' }}>
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
