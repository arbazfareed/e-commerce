import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useCart }  from '../context/CartContext';
import { useAuth }  from '../context/AuthContext';
import API from '../utils/axiosConfig';
import { formatPKR, formatUSD, calcZoneShipping, getUSDRate } from '../utils/priceUtils';

const BASE = 'http://localhost:5000';

const PAYMENTS = [
  { id:'COD',       icon:'💵', label:'Cash on Delivery',    desc:'Pay when order arrives' },
  { id:'JazzCash',  icon:'📱', label:'JazzCash',            desc:'Mobile wallet payment' },
  { id:'EasyPaisa', icon:'📲', label:'EasyPaisa',           desc:'Mobile wallet payment' },
  { id:'Stripe',    icon:'💳', label:'Credit / Debit Card', desc:'Powered by Stripe' },
  { id:'PayPal',    icon:'🅿️', label:'PayPal',              desc:'Pay via PayPal' },
];

export default function CartPage() {
  // useCart always returns safe defaults (never undefined)
  const { items = [], removeFromCart, updateQty, clearCart } = useCart();
  const { user }   = useAuth();
  const navigate   = useNavigate();

  const isPak = !user || user.country === 'Pakistan';
  const fmt   = (n) => isPak ? formatPKR(n ?? 0) : formatUSD(n ?? 0);

  const [step,    setStep]    = useState('cart');
  const [addr,    setAddr]    = useState({
    street:  '',
    city:    user?.city    || '',
    country: user?.country || 'Pakistan',
  });
  const [payment, setPayment] = useState('COD');
  const [placing, setPlacing] = useState(false);
  const [error,   setError]   = useState('');
  const [orderId, setOrderId] = useState(null);

  // Safe totals — always work even if items is []
  const safeItems  = Array.isArray(items) ? items : [];
  const subTotal   = safeItems.reduce((s, i) => s + (isPak ? (i.pricePKR||0) : (i.priceUSD||0)) * (i.quantity||1), 0);
  // ✅ Zone-based shipping: detects domestic (Multan→Karachi), Middle East, US, etc.
  //    Items with no weight (glasses, fruit, etc.) incur only the base/flat rate.
  const shipCalc    = calcZoneShipping(safeItems, addr.country, addr.city);
  const shipFeePKR  = shipCalc.fee;                                  // always PKR
  const shipBreak   = shipCalc.breakdown;
  // For display & grand total: convert ship fee to the user's currency
  const USD_RATE    = getUSDRate();  // reads from localStorage (admin-configurable)
  const shipFee     = isPak ? shipFeePKR : parseFloat((shipFeePKR / USD_RATE).toFixed(2));
  const grandTotal  = subTotal + shipFee;
  const totalQty    = safeItems.reduce((a, i) => a + (i.quantity||1), 0);

  const handlePlaceOrder = async () => {
    setError('');
    if (!addr.street.trim()) { setError('Please enter your street address.'); return; }
    if (!addr.city.trim())   { setError('Please enter your city.'); return; }
    setPlacing(true);
    try {
      const orderItems = safeItems.map(i => ({
        product:  i._id,
        name:     i.name,
        price:    isPak ? (i.pricePKR||0) : (i.priceUSD||0),
        quantity: i.quantity || 1,
        image:    i.images?.[0] || '',
      }));
      const { data } = await API.post('/api/orders', {
        products:      orderItems,
        address:       addr,
        paymentMethod: payment,
      });
      setOrderId(data._id);
      clearCart();
      setStep('success');
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to place order. Please try again.');
    } finally { setPlacing(false); }
  };

  // ── Success ───────────────────────────────────────────────
  if (step === 'success') return (
    <div style={S.page}>
      <div style={S.successCard}>
        <div style={{ fontSize:'72px', lineHeight:1, marginBottom:'4px' }}>🎉</div>
        <h2 style={{ margin:'16px 0 10px', fontSize:'26px', fontWeight:'900', color:'#0f172a' }}>Order Confirmed!</h2>
        <p style={{ margin:'0 0 6px', fontSize:'15px', color:'#475569' }}>
          Order ID: <strong style={{ color:'#10b981', fontFamily:'monospace', fontSize:'16px' }}>
            #{orderId?.slice(-8).toUpperCase()}
          </strong>
        </p>
        <p style={{ margin:'0 0 30px', fontSize:'13px', color:'#64748b', lineHeight:'1.6' }}>
          {payment === 'COD'
            ? '💵 You will pay cash when your order arrives at your doorstep.'
            : `Payment via ${payment} has been noted.`}
        </p>
        <div style={{ display:'flex', gap:'12px', justifyContent:'center', flexWrap:'wrap' }}>
          <button style={S.greenBtn} onClick={() => navigate('/orders')}>📦 View My Orders</button>
          <button style={S.ghostBtn} onClick={() => navigate('/')}>Continue Shopping</button>
        </div>
      </div>
    </div>
  );

  // ── Empty cart ────────────────────────────────────────────
  if (!safeItems.length) return (
    <div style={S.page}>
      <div style={S.emptyCard}>
        <p style={{ fontSize:'64px', margin:0 }}>🛒</p>
        <h2 style={{ margin:'16px 0 8px', color:'#1e293b', fontSize:'22px' }}>Your cart is empty</h2>
        <p style={{ color:'#94a3b8', margin:'0 0 24px', fontSize:'14px' }}>Browse our products and add items to your cart.</p>
        <Link to="/" style={{ ...S.greenBtn, textDecoration:'none' }}>Browse Products →</Link>
      </div>
    </div>
  );

  // ── Cart / Checkout ───────────────────────────────────────
  return (
    <div style={S.page}>
      {/* Page header */}
      <div style={S.topBar}>
        <div>
          <h1 style={{ margin:0, fontSize:'26px', fontWeight:'900', color:'#0f172a' }}>
            {step === 'cart' ? '🛒 Your Cart' : '📋 Checkout'}
          </h1>
          <p style={{ margin:'4px 0 0', fontSize:'13px', color:'#64748b' }}>
            {totalQty} item{totalQty !== 1 ? 's' : ''} in your cart
          </p>
        </div>
        {/* Step indicators */}
        <div style={{ display:'flex', gap:'6px', alignItems:'center' }}>
          {[['cart','1. Cart'],['checkout','2. Checkout']].map(([s, lbl]) => (
            <span key={s} style={{
              padding:'7px 18px', borderRadius:'999px', fontSize:'12px', fontWeight:'700',
              background: step === s ? '#10b981' : (step === 'checkout' && s === 'cart') ? '#d1fae5' : '#f1f5f9',
              color:      step === s ? '#fff'    : (step === 'checkout' && s === 'cart') ? '#059669' : '#94a3b8',
            }}>
              {lbl}
            </span>
          ))}
        </div>
      </div>

      <div style={S.layout}>

        {/* ── LEFT COLUMN ──────────────────────────────────── */}
        <div style={{ flex:1, minWidth:'280px' }}>

          {/* CART STEP */}
          {step === 'cart' && (
            <div style={S.card}>
              {safeItems.map(item => {
                const price = isPak ? (item.pricePKR||0) : (item.priceUSD||0);
                const img   = item.images?.[0];
                return (
                  <div key={item._id} style={S.itemRow}>
                    {/* Product image */}
                    <div style={S.itemImgBox}>
                      {img
                        ? <img
                            src={`${BASE}/uploads/${img}`}
                            alt={item.name}
                            style={{ width:'100%', height:'100%', objectFit:'cover' }}
                            onError={e => { e.target.style.display = 'none'; e.target.nextSibling.style.display = 'flex'; }}
                          />
                        : null}
                      <div style={{ ...S.itemImgPh, display: img ? 'none' : 'flex' }}>{item.name[0]}</div>
                    </div>

                    {/* Info */}
                    <div style={{ flex:1, minWidth:0 }}>
                      <p style={{ margin:'0 0 2px', fontWeight:'700', fontSize:'15px', color:'#1e293b' }}>{item.name}</p>
                      <p style={{ margin:'0 0 6px', fontSize:'11px', color:'#94a3b8', textTransform:'uppercase', letterSpacing:'0.5px', fontWeight:'600' }}>
                        {item.category}
                      </p>
                      <p style={{ margin:0, fontSize:'13px', color:'#64748b' }}>{fmt(price)} each</p>
                    </div>

                    {/* Quantity controls */}
                    <div style={S.qtyBox}>
                      <button style={S.qtyBtn} onClick={() => updateQty(item._id, item.quantity - 1)}>−</button>
                      <span style={S.qtyNum}>{item.quantity}</span>
                      <button style={S.qtyBtn} onClick={() => updateQty(item._id, item.quantity + 1)}>+</button>
                    </div>

                    {/* Subtotal */}
                    <div style={{ textAlign:'right', minWidth:'95px' }}>
                      <p style={{ margin:'0 0 6px', fontWeight:'800', fontSize:'16px', color:'#10b981' }}>
                        {fmt(price * item.quantity)}
                      </p>
                      <button
                        style={{ background:'none', border:'none', color:'#ef4444', fontSize:'12px', cursor:'pointer', fontWeight:'600', padding:0 }}
                        onClick={() => removeFromCart(item._id)}
                      >
                        Remove
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          )}

          {/* CHECKOUT STEP */}
          {step === 'checkout' && (
            <div style={S.card}>
              <h3 style={S.secTitle}>📍 Delivery Address</h3>
              {error && <div style={S.errBox}>⚠️ {error}</div>}

              <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:'14px' }}>
                <div style={{ gridColumn:'1/-1' }}>
                  <label style={S.lbl}>Street / Area *</label>
                  <input style={S.inp}
                    placeholder="e.g. House 12, Block B, DHA Phase 5"
                    value={addr.street}
                    onChange={e => setAddr(a => ({ ...a, street: e.target.value }))}
                  />
                </div>
                <div>
                  <label style={S.lbl}>City *</label>
                  <input style={S.inp}
                    placeholder="Lahore"
                    value={addr.city}
                    onChange={e => setAddr(a => ({ ...a, city: e.target.value }))}
                  />
                </div>
                <div>
                  <label style={S.lbl}>Country</label>
                  <input style={{ ...S.inp, background:'#f1f5f9', color:'#64748b' }}
                    value={addr.country} readOnly />
                </div>
              </div>

              <h3 style={{ ...S.secTitle, marginTop:'24px' }}>💳 Payment Method</h3>
              <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:'10px' }}>
                {PAYMENTS.map(pm => (
                  <label key={pm.id} style={{ ...S.payOpt, ...(payment === pm.id ? S.payOn : {}) }}>
                    <input type="radio" name="pm" style={{ display:'none' }}
                      checked={payment === pm.id} onChange={() => setPayment(pm.id)} />
                    <span style={{ fontSize:'20px' }}>{pm.icon}</span>
                    <div>
                      <p style={{ margin:0, fontWeight:'700', fontSize:'13px', color:'#1e293b' }}>{pm.label}</p>
                      <p style={{ margin:0, fontSize:'11px', color:'#64748b' }}>{pm.desc}</p>
                    </div>
                  </label>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* ── ORDER SUMMARY SIDEBAR ────────────────────────── */}
        <div style={S.summary}>
          <h3 style={S.secTitle}>Order Summary</h3>

          {/* Mini item list */}
          <div style={{ marginBottom:'16px' }}>
            {safeItems.map(item => (
              <div key={item._id} style={{ display:'flex', alignItems:'center', gap:'10px', marginBottom:'10px' }}>
                <div style={{ width:'38px', height:'38px', borderRadius:'8px', overflow:'hidden', flexShrink:0, border:'1px solid #e2e8f0', background:'#f8fafc' }}>
                  {item.images?.[0]
                    ? <img src={`${BASE}/uploads/${item.images[0]}`} alt=""
                        style={{ width:'100%', height:'100%', objectFit:'cover' }} />
                    : <div style={{ width:'100%', height:'100%', display:'flex', alignItems:'center', justifyContent:'center', fontSize:'14px', fontWeight:'700', color:'#10b981' }}>
                        {item.name[0]}
                      </div>}
                </div>
                <div style={{ flex:1, minWidth:0 }}>
                  <p style={{ margin:0, fontSize:'12px', fontWeight:'600', color:'#334155', overflow:'hidden', textOverflow:'ellipsis', whiteSpace:'nowrap' }}>{item.name}</p>
                  <p style={{ margin:0, fontSize:'11px', color:'#94a3b8' }}>×{item.quantity}</p>
                </div>
                <span style={{ fontSize:'12px', fontWeight:'700', color:'#10b981', flexShrink:0 }}>
                  {fmt((isPak ? (item.pricePKR||0) : (item.priceUSD||0)) * item.quantity)}
                </span>
              </div>
            ))}
          </div>

          <div style={S.divider} />

          <div style={S.sumRow}>
            <span style={S.sumLbl}>Subtotal ({totalQty} items)</span>
            <span style={S.sumVal}>{fmt(subTotal)}</span>
          </div>
          <div style={S.sumRow}>
            <span style={S.sumLbl}>
              Shipping
              <small style={{ display:'block', color:'#94a3b8', fontWeight:'400' }}>
                {shipCalc.zoneLabel}
              </small>
              <small style={{ display:'block', color:'#94a3b8', fontWeight:'400', fontSize:'10px' }}>
                {shipBreak}
              </small>
            </span>
            <span style={S.sumVal}>{fmt(shipFee)}</span>
          </div>

          <div style={S.divider} />

          <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center', marginBottom:'22px' }}>
            <span style={{ fontWeight:'800', fontSize:'16px', color:'#0f172a' }}>Total</span>
            <span style={{ fontWeight:'900', fontSize:'24px', color:'#10b981' }}>{fmt(grandTotal)}</span>
          </div>

          {step === 'cart' && (
            <button style={{ ...S.greenBtn, width:'100%' }}
              onClick={() => { if (!user) { navigate('/login'); return; } setStep('checkout'); }}>
              Proceed to Checkout →
            </button>
          )}

          {step === 'checkout' && (
            <>
              <button
                style={{ ...S.greenBtn, width:'100%', marginBottom:'10px', opacity: placing ? 0.7 : 1 }}
                onClick={handlePlaceOrder}
                disabled={placing}
              >
                {placing ? '⏳ Placing Order…' : '✅ Confirm & Place Order'}
              </button>
              <button style={{ ...S.ghostBtn, width:'100%' }} onClick={() => setStep('cart')}>
                ← Back to Cart
              </button>
            </>
          )}

          <p style={{ textAlign:'center', fontSize:'11px', color:'#94a3b8', marginTop:'14px', lineHeight:'1.5' }}>
            🔒 Secure checkout · IndusCart 🇵🇰
          </p>
        </div>
      </div>
    </div>
  );
}

// ── Styles ────────────────────────────────────────────────────
const S = {
  page:    { minHeight:'100vh', background:'#f8fafc', padding:'28px 20px', fontFamily:"'DM Sans','Segoe UI',sans-serif" },
  topBar:  { maxWidth:'1040px', margin:'0 auto 24px', display:'flex', justifyContent:'space-between', alignItems:'flex-start', flexWrap:'wrap', gap:'14px' },
  layout:  { maxWidth:'1040px', margin:'0 auto', display:'flex', gap:'24px', alignItems:'flex-start', flexWrap:'wrap' },

  card:    { background:'#fff', borderRadius:'16px', padding:'24px', border:'1px solid #e2e8f0', boxShadow:'0 1px 4px rgba(0,0,0,0.05)', flex:1, minWidth:'280px' },
  itemRow: { display:'flex', alignItems:'center', gap:'16px', padding:'18px 0', borderBottom:'1px solid #f1f5f9' },

  itemImgBox: { width:'72px', height:'72px', borderRadius:'12px', overflow:'hidden', flexShrink:0, border:'1px solid #e2e8f0', background:'#f8fafc', position:'relative' },
  itemImgPh:  { width:'100%', height:'100%', display:'flex', alignItems:'center', justifyContent:'center', fontSize:'24px', fontWeight:'900', color:'#10b981', background:'linear-gradient(135deg,#f0fdf4,#dcfce7)' },

  qtyBox:  { display:'flex', alignItems:'center', border:'1px solid #e2e8f0', borderRadius:'10px', overflow:'hidden' },
  qtyBtn:  { background:'#f8fafc', border:'none', width:'34px', height:'36px', cursor:'pointer', fontSize:'18px', color:'#334155', fontWeight:'700', display:'flex', alignItems:'center', justifyContent:'center', flexShrink:0 },
  qtyNum:  { padding:'0 14px', fontWeight:'800', fontSize:'15px', color:'#1e293b', minWidth:'32px', textAlign:'center', userSelect:'none' },

  summary: { width:'290px', flexShrink:0, background:'#fff', borderRadius:'16px', padding:'24px', border:'1px solid #e2e8f0', boxShadow:'0 1px 4px rgba(0,0,0,0.05)', position:'sticky', top:'80px' },
  secTitle:{ margin:'0 0 18px', fontSize:'16px', fontWeight:'800', color:'#1e293b' },
  divider: { height:'1px', background:'#f1f5f9', margin:'12px 0 14px' },
  sumRow:  { display:'flex', justifyContent:'space-between', alignItems:'flex-start', marginBottom:'12px' },
  sumLbl:  { fontSize:'13px', color:'#64748b', lineHeight:'1.5' },
  sumVal:  { fontSize:'14px', fontWeight:'700', color:'#334155' },

  lbl:     { display:'block', fontSize:'11px', fontWeight:'800', color:'#475569', marginBottom:'6px', textTransform:'uppercase', letterSpacing:'0.3px' },
  inp:     { width:'100%', padding:'11px 13px', border:'1.5px solid #e2e8f0', borderRadius:'10px', fontSize:'13px', outline:'none', boxSizing:'border-box', background:'#f8fafc', color:'#1e293b', fontFamily:'inherit', marginBottom:'0' },
  errBox:  { background:'#fef2f2', border:'1px solid #fecaca', color:'#dc2626', padding:'10px 14px', borderRadius:'10px', fontSize:'13px', fontWeight:'600', marginBottom:'16px' },
  payOpt:  { display:'flex', alignItems:'center', gap:'10px', padding:'12px', border:'2px solid #e2e8f0', borderRadius:'12px', cursor:'pointer', transition:'all 0.15s', userSelect:'none' },
  payOn:   { borderColor:'#10b981', background:'#f0fdf4' },

  greenBtn: { display:'inline-flex', alignItems:'center', justifyContent:'center', padding:'13px 24px', background:'linear-gradient(135deg,#10b981,#059669)', color:'#fff', border:'none', borderRadius:'12px', fontSize:'14px', fontWeight:'700', cursor:'pointer', textDecoration:'none', boxSizing:'border-box', letterSpacing:'0.2px' },
  ghostBtn: { display:'inline-flex', alignItems:'center', justifyContent:'center', padding:'13px 24px', background:'#f1f5f9', color:'#475569', border:'1px solid #e2e8f0', borderRadius:'12px', fontSize:'14px', fontWeight:'600', cursor:'pointer', textDecoration:'none', boxSizing:'border-box' },

  successCard: { maxWidth:'500px', margin:'60px auto 0', background:'#fff', borderRadius:'22px', padding:'52px 40px', textAlign:'center', border:'1px solid #e2e8f0', boxShadow:'0 8px 48px rgba(0,0,0,0.08)' },
  emptyCard:   { maxWidth:'400px', margin:'80px auto 0', background:'#fff', borderRadius:'22px', padding:'52px 36px', textAlign:'center', border:'1px solid #e2e8f0', boxShadow:'0 4px 24px rgba(0,0,0,0.07)' },
};
