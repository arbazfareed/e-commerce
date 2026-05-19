import { useState, useEffect, useRef, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import API from '../utils/axiosConfig';
import { formatPKR, formatUSD, getWeightRates, saveWeightRates, getSupportTickets, updateTicketStatus, getShippingRates, saveShippingRates, getUSDRate, saveUSDRate, pkrToUSD, getZoneRates, saveZoneRates, ZONE_LABELS } from '../utils/priceUtils';

const BASE        = 'http://localhost:5000';
const STATUS_LIST = ['Pending', 'Processing', 'Shipped', 'Delivered', 'Cancelled'];
const STATUS_CFG  = {
  Pending:    { bg:'#fff7ed', color:'#c2410c', dot:'#f97316', icon:'⏳' },
  Processing: { bg:'#eff6ff', color:'#1d4ed8', dot:'#3b82f6', icon:'⚙️' },
  Shipped:    { bg:'#f0f9ff', color:'#0369a1', dot:'#0ea5e9', icon:'🚚' },
  Delivered:  { bg:'#f0fdf4', color:'#166534', dot:'#16a34a', icon:'✅' },
  Cancelled:  { bg:'#fff1f2', color:'#be123c', dot:'#f43f5e', icon:'❌' },
};
const EMPTY_FORM = { name:'', pricePKR:'', priceUSD:'', category:'', description:'', isLocal:false, stock:'', weightKg:'' };

/* ─── Badge ─────────────────────────────────────────────────── */
const Badge = ({ s }) => {
  const c = STATUS_CFG[s] || STATUS_CFG.Pending;
  return (
    <span style={{ display:'inline-flex', alignItems:'center', gap:5, background:c.bg, color:c.color, padding:'4px 12px', borderRadius:999, fontSize:11, fontWeight:800, letterSpacing:'0.3px' }}>
      <span style={{ width:6, height:6, borderRadius:'50%', background:c.dot, flexShrink:0 }} />
      {s}
    </span>
  );
};

/* ─── Market Badge ──────────────────────────────────────────── */
const MktBadge = ({ isLocal }) => (
  <span style={{
    display:'inline-flex', alignItems:'center', gap:4,
    background: isLocal ? '#ecfdf5' : '#eff6ff',
    color:      isLocal ? '#059669' : '#2563eb',
    border:    `1px solid ${isLocal ? '#bbf7d0' : '#bfdbfe'}`,
    padding:'3px 10px', borderRadius:999, fontSize:11, fontWeight:800, whiteSpace:'nowrap',
  }}>
    {isLocal ? '🇵🇰 Local' : '🌍 Global'}
  </span>
);

/* ─── Toast ─────────────────────────────────────────────────── */
const Toast = ({ t }) => !t ? null : (
  <div style={{
    position:'fixed', bottom:28, right:28, zIndex:9999,
    padding:'14px 22px', borderRadius:14, fontSize:13, fontWeight:700, color:'#fff',
    background: t.ok ? 'linear-gradient(135deg,#064e3b,#065f46)' : 'linear-gradient(135deg,#7f1d1d,#991b1b)',
    boxShadow:'0 12px 40px rgba(0,0,0,.3)', backdropFilter:'blur(8px)',
    border:`1px solid ${t.ok ? 'rgba(16,185,129,.3)' : 'rgba(248,113,113,.3)'}`,
    display:'flex', alignItems:'center', gap:10, animation:'slideUp .3s ease',
  }}>
    <span style={{ fontSize:16 }}>{t.ok ? '✓' : '✕'}</span>{t.text}
  </div>
);

/* ─── ImgPicker (defined outside AdminPage to prevent remount on re-render) ─ */
const ImgPicker = ({ prevs, onPick, onRemove, inputRef, max=5 }) => (
  <div>
    <div style={{ display:'flex', flexWrap:'wrap', gap:10 }}>
      {prevs.map((url,i) => (
        <div key={i} style={{ position:'relative' }}>
          <img src={url} alt="" style={{ width:82, height:82, objectFit:'cover', borderRadius:12, border:'2px solid #e2e8f0', display:'block' }} />
          <button type="button" onClick={() => onRemove(i)}
            style={{ position:'absolute', top:-7, right:-7, background:'#ef4444', border:'2.5px solid #fff', color:'#fff', borderRadius:'50%', width:22, height:22, cursor:'pointer', fontSize:11, fontWeight:900, display:'flex', alignItems:'center', justifyContent:'center', padding:0 }}>
            ×
          </button>
        </div>
      ))}
      {prevs.length < max && (
        <label style={{ width:82, height:82, border:'2px dashed #cbd5e1', borderRadius:12, display:'flex', flexDirection:'column', alignItems:'center', justifyContent:'center', cursor:'pointer', background:'#f8fafc', gap:4 }}>
          <span style={{ fontSize:24, color:'#94a3b8' }}>+</span>
          <span style={{ fontSize:10, color:'#94a3b8', fontWeight:700 }}>Photo</span>
          <input ref={inputRef} type="file" accept="image/*" multiple style={{ display:'none' }}
            onChange={e => { onPick(e.target.files); if(inputRef.current) inputRef.current.value=''; }} />
        </label>
      )}
    </div>
    <p style={{ margin:'8px 0 0', fontSize:11, color:'#94a3b8' }}>Up to {max} images · JPG PNG WEBP · 5 MB each</p>
  </div>
);

/* ─── CatPicker ─────────────────────────────────────────────── */
// IMPORTANT: defined outside AdminPage so it's a stable component reference.
// If defined inside, React remounts it on every parent re-render, causing
// autoFocus to fire each time the user types in another field (e.g. price).
const CatPicker = ({ val, onChange, isNew, setIsNew, cats = [] }) => (
  isNew ? (
    <div style={{ display:'flex', gap:8 }}>
      {/* autoFocus is safe here because the component only mounts once when isNew flips true */}
      <input style={S.inp} placeholder="Type new category name…" value={val} onChange={e => onChange(e.target.value)} autoFocus />
      <button type="button" style={S.ghostBtn} onClick={() => { setIsNew(false); onChange(''); }}>✕</button>
    </div>
  ) : (
    <div style={{ display:'flex', gap:8 }}>
      <select style={{ ...S.inp, flex:1 }} value={cats.includes(val) ? val : ''} onChange={e => onChange(e.target.value)}>
        <option value="">— Select category —</option>
        {cats.map(c => <option key={c} value={c}>{c}</option>)}
      </select>
      <button type="button" style={S.ghostBtn} onClick={() => { setIsNew(true); onChange(''); }}>+ New</button>
    </div>
  )
);

/* ─── MktPicker ─────────────────────────────────────────────── */
const MktPicker = ({ val, onChange, hint = true }) => (
  <div>
    <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:10 }}>
      {[
        { v:false, flag:'🌍', title:'Global', sub:'Visible to ALL customers\n(Pakistan + International)', color:'#2563eb', activeBg:'#eff6ff', activeBorder:'#93c5fd' },
        { v:true,  flag:'🇵🇰', title:'Pakistan Only', sub:'Visible only to local\nPakistan customers', color:'#059669', activeBg:'#ecfdf5', activeBorder:'#6ee7b7' },
      ].map(opt => {
        const active = val === opt.v;
        return (
          <label key={String(opt.v)}
            style={{
              display:'flex', flexDirection:'column', gap:6,
              padding:'14px 16px', borderRadius:14, cursor:'pointer', userSelect:'none',
              border:`2px solid ${active ? opt.activeBorder : '#e2e8f0'}`,
              background: active ? opt.activeBg : '#f8fafc',
              transition:'all .15s',
            }}>
            <input type="radio" style={{ display:'none' }} checked={active} onChange={() => onChange(opt.v)} />
            <div style={{ display:'flex', alignItems:'center', gap:8 }}>
              <span style={{ fontSize:20 }}>{opt.flag}</span>
              <span style={{ fontSize:13, fontWeight:800, color: active ? opt.color : '#64748b', fontFamily:"'Sora',sans-serif" }}>{opt.title}</span>
              {active && <span style={{ marginLeft:'auto', fontSize:14, color: opt.color }}>✓</span>}
            </div>
            <p style={{ margin:0, fontSize:11, color:'#94a3b8', fontWeight:400, whiteSpace:'pre-line', lineHeight:1.5 }}>{opt.sub}</p>
          </label>
        );
      })}
    </div>
    {hint && (
      <p style={{ margin:'8px 0 0', fontSize:11, color: val ? '#059669' : '#2563eb', fontWeight:600 }}>
        {val
          ? '🇵🇰 Only Pakistani customers (shopping in PKR mode) will see this product.'
          : '🌍 Everyone sees this product — both local and international customers.'}
      </p>
    )}
  </div>
);

/* ════════════════════════════════════════════════════════════ */
export default function AdminPage() {
  const { user, logout } = useAuth();
  const navigate         = useNavigate();

  const [tab,       setTab]       = useState('dashboard');
  const [products,  setProducts]  = useState([]);
  const [orders,    setOrders]    = useState([]);
  const [cats,      setCats]      = useState([]);
  const [loading,   setLoading]   = useState(true);
  const [toast,     setToast]     = useState(null);
  const [search,    setSearch]    = useState('');
  const [fCat,      setFCat]      = useState('All');
  const [fMarket,   setFMarket]   = useState('all');   // 'all' | 'local' | 'global'
  const [fStatus,   setFStatus]   = useState('All');

  const [form,      setForm]      = useState(EMPTY_FORM);
  const [previews,  setPreviews]  = useState([]);
  const [imgFiles,  setImgFiles]  = useState([]);
  const [saving,    setSaving]    = useState(false);
  const [newCat,    setNewCat]    = useState(false);
  const fileRef = useRef();

  const [shipRates,   setShipRates]   = useState(getShippingRates());
  const [shipSaved,   setShipSaved]   = useState(false);
  const [weightRates,  setWeightRates]  = useState(getWeightRates());
  const [wSaved,       setWSaved]       = useState(false);
  const [tickets,      setTickets]      = useState(getSupportTickets());
  const [ticketFilter, setTicketFilter] = useState('All');
  const [usdRate,   setUsdRate]   = useState(String(getUSDRate()));
  const [usdSaved,  setUsdSaved]  = useState(false);
  const [zoneRates, setZoneRates] = useState(getZoneRates());
  const [zoneSaved, setZoneSaved] = useState(false);

  const [editP,     setEditP]     = useState(null);
  const [eForm,     setEForm]     = useState({});
  const [ePrevs,    setEPrevs]    = useState([]);
  const [eNewFiles, setENewFiles] = useState([]);
  const [eNewCat,   setENewCat]   = useState(false);
  const [eSaving,   setESaving]   = useState(false);
  const eRef = useRef();

  /* auth guard */
  useEffect(() => {
    if (!user)         { navigate('/login'); return; }
    if (!user.isAdmin) { navigate('/');      return; }
  }, [user, navigate]);

  const load = useCallback(async () => {
    try {
      const [pR, oR, cR] = await Promise.all([
        API.get('/api/products'),
        API.get('/api/orders'),
        API.get('/api/products/categories'),
      ]);
      setProducts(pR.data);
      setOrders(oR.data);
      setCats(Array.isArray(cR.data) ? cR.data.filter(Boolean) : []);
    } catch { flash('Failed to load data', false); }
    finally  { setLoading(false); }
  }, []);
  useEffect(() => { load(); }, [load]);

  const flash = (text, ok = true) => {
    setToast({ text, ok });
    setTimeout(() => setToast(null), 3500);
  };

  /* ── image helpers ── */
  const pickImgs = (files, isEdit) => {
    const arr  = Array.from(files);
    const urls = arr.map(f => URL.createObjectURL(f));
    if (isEdit) { setENewFiles(p => [...p,...arr]); setEPrevs(p => [...p,...urls]); }
    else        { setImgFiles(p => [...p,...arr]);  setPreviews(p => [...p,...urls]); }
  };
  const removeImg = (idx, isEdit) => {
    if (isEdit) {
      const existCount = eForm.existImgs?.length || 0;
      if (idx < existCount) setEForm(f => ({ ...f, existImgs: f.existImgs.filter((_,i) => i !== idx) }));
      else { const ni = idx - existCount; setENewFiles(p => p.filter((_,i) => i !== ni)); }
      setEPrevs(p => p.filter((_,i) => i !== idx));
    } else {
      setImgFiles(p => p.filter((_,i) => i !== idx));
      setPreviews(p => p.filter((_,i) => i !== idx));
    }
  };

  /* ── CRUD ── */
  const handleAdd = async (e) => {
    e.preventDefault();
    if (!form.category.trim()) { flash('Please select or type a category', false); return; }
    setSaving(true);
    try {
      const fd = new FormData();
      Object.entries(form).forEach(([k,v]) => fd.append(k, v));
      imgFiles.forEach(f => fd.append('images', f));
      const { data } = await API.post('/api/products', fd, { headers:{ 'Content-Type':'multipart/form-data' } });
      setProducts(p => [data, ...p]);
      if (!cats.includes(form.category)) setCats(c => [...c, form.category].sort());
      setForm({ ...EMPTY_FORM, category: '' }); setImgFiles([]); setPreviews([]); setNewCat(false);
      if (fileRef.current) fileRef.current.value = '';
      flash('Product published!'); setTab('products');
    } catch (err) { flash(err.response?.data?.message || 'Failed to publish', false); }
    finally { setSaving(false); }
  };

  const openEdit = (p) => {
    setEditP(p);
    setEForm({ name:p.name, pricePKR:p.pricePKR, priceUSD:p.priceUSD, category:p.category, description:p.description, isLocal:p.isLocal, stock:p.stock, weightKg: p.weightKg != null ? p.weightKg : '', existImgs:[...(p.images||[])] });
    setEPrevs((p.images||[]).map(img => `${BASE}/uploads/${img}`));
    setENewFiles([]); setENewCat(false);
  };

  const handleEditSave = async () => {
    setESaving(true);
    try {
      const fd = new FormData();
      ['name','pricePKR','priceUSD','category','description','isLocal','stock','weightKg'].forEach(k => fd.append(k, eForm[k]));
      fd.append('replaceImages', 'true');
      (eForm.existImgs||[]).forEach(img => fd.append('keptImages', img));
      eNewFiles.forEach(f => fd.append('images', f));
      const { data } = await API.put(`/api/products/${editP._id}`, fd, { headers:{ 'Content-Type':'multipart/form-data' } });
      setProducts(ps => ps.map(p => p._id === data._id ? data : p));
      if (!cats.includes(eForm.category)) setCats(c => [...c, eForm.category].sort());
      setEditP(null); flash('Product updated!');
    } catch (err) { flash(err.response?.data?.message || 'Update failed', false); }
    finally { setESaving(false); }
  };

  const handleDelete = async (id, name) => {
    if (!window.confirm(`Delete "${name}"? This cannot be undone.`)) return;
    try {
      await API.delete(`/api/products/${id}`);
      setProducts(p => p.filter(x => x._id !== id)); flash('Product deleted.');
    } catch { flash('Delete failed', false); }
  };

  const changeStatus = async (id, status) => {
    try {
      await API.put(`/api/orders/${id}/status`, { status });
      setOrders(os => os.map(o => o._id === id ? {...o, status} : o));
      flash(`Order → ${status}`);
    } catch { flash('Status update failed', false); }
  };

  /* ── refresh tickets whenever the support tab is opened ── */
  useEffect(() => {
    if (tab === 'support') setTickets(getSupportTickets());
  }, [tab]);

  const saveWeight = () => { saveWeightRates(weightRates); setWSaved(true); setTimeout(() => setWSaved(false), 2000); };
  const saveShip = () => {
    saveShippingRates(shipRates); setShipSaved(true);
    setTimeout(() => setShipSaved(false), 2500); flash('Shipping rates saved!');
  };
  const saveRate = () => {
    const r = parseFloat(usdRate);
    if (!r || r <= 0) { flash('Enter a valid exchange rate', false); return; }
    saveUSDRate(r); setUsdSaved(true);
    setTimeout(() => setUsdSaved(false), 2500); flash(`Rate saved: 1 USD = Rs ${r}`);
  };
  const saveZone = () => {
    saveZoneRates(zoneRates); setZoneSaved(true);
    setTimeout(() => setZoneSaved(false), 2500); flash('Zone shipping rates saved!');
  };

  /* ── derived stats ── */
  const revPKR    = orders.reduce((a,o) => a + (o.totalPrice||0), 0);
  const pending   = orders.filter(o => o.status === 'Pending').length;
  const delivered = orders.filter(o => o.status === 'Delivered').length;
  const oos       = products.filter(p => p.stock === 0).length;
  const localCnt  = products.filter(p =>  p.isLocal).length;
  const globalCnt = products.filter(p => !p.isLocal).length;

  const filteredProducts = products.filter(p => {
    const ms = p.name.toLowerCase().includes(search.toLowerCase());
    const mc = fCat === 'All' || p.category === fCat;
    const mm = fMarket === 'all'
      || (fMarket === 'local'  &&  p.isLocal)
      || (fMarket === 'global' && !p.isLocal);
    return ms && mc && mm;
  });

  const filteredOrders = fStatus === 'All' ? orders : orders.filter(o => o.status === fStatus);

  /* ── loading screen ── */
  if (loading) return (
    <div style={S.centered}>
      <div style={S.spinRing} />
      <p style={{ color:'#64748b', marginTop:18, fontFamily:"'Sora',sans-serif", fontWeight:600 }}>Loading admin panel…</p>
      <style>{`@keyframes spin{to{transform:rotate(360deg)}}`}</style>
    </div>
  );

  /* ══════════════════════════════════════════════════════════ */
  return (
    <div style={S.root}>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Sora:wght@400;600;700;800;900&family=JetBrains+Mono:wght@500;700&display=swap');
        @keyframes spin    { to { transform:rotate(360deg) } }
        @keyframes fadeUp  { from { opacity:0; transform:translateY(14px) } to { opacity:1; transform:none } }
        @keyframes slideUp { from { opacity:0; transform:translateY(20px) } to { opacity:1; transform:none } }
        .nav-btn:hover   { background:rgba(255,255,255,.07) !important; color:#f1f5f9 !important; }
        .row-hover:hover { background:#f8fafc; }
        .kpi-card:hover  { transform:translateY(-4px); box-shadow:0 16px 48px rgba(0,0,0,.2) !important; }
        .del-btn:hover   { background:#fef2f2 !important; }
        .edit-btn:hover  { background:#eff6ff !important; }
        .mkt-pill:hover  { opacity:.8; }
        select option    { font-family:'Sora',sans-serif; }
        ::-webkit-scrollbar       { width:5px; height:5px; }
        ::-webkit-scrollbar-track { background:transparent; }
        ::-webkit-scrollbar-thumb { background:#e2e8f0; border-radius:99px; }
      `}</style>
      <Toast t={toast} />

      {/* ═══ EDIT MODAL ══════════════════════════════════════ */}
      {editP && (
        <div style={S.overlay} onClick={() => setEditP(null)}>
          <div style={S.modal} onClick={e => e.stopPropagation()}>
            <div style={S.mHead}>
              <div>
                <h3 style={{ margin:0, fontSize:17, fontWeight:800, color:'#0f172a', fontFamily:"'Sora',sans-serif" }}>Edit Product</h3>
                <p style={{ margin:'3px 0 0', fontSize:12, color:'#94a3b8', fontFamily:"'JetBrains Mono',monospace" }}>{editP._id.slice(-10).toUpperCase()}</p>
              </div>
              <button style={S.closeX} onClick={() => setEditP(null)}>✕</button>
            </div>
            <div style={S.mBody}>
              {/* images */}
              <div style={{ marginBottom:20 }}>
                <label style={S.lbl}>Product Images</label>
                <ImgPicker prevs={ePrevs} onPick={f => pickImgs(f, true)} onRemove={i => removeImg(i, true)} inputRef={eRef} />
              </div>
              <div style={S.grid2}>
                <div>
                  <label style={S.lbl}>Product Name *</label>
                  <input style={S.inp} value={eForm.name} onChange={e => setEForm(f => ({...f, name:e.target.value}))} />
                </div>
                <div>
                  <label style={S.lbl}>Category *</label>
                  <CatPicker val={eForm.category} onChange={v => setEForm(f => ({...f, category:v}))} isNew={eNewCat} setIsNew={setENewCat} cats={cats} />
                </div>
                <div style={{ position:'relative' }}>
                  <label style={S.lbl}>🇵🇰 Price PKR *</label>
                  <div style={{ position:'relative' }}>
                    <span style={S.pre}>Rs</span>
                    <input style={{ ...S.inp, paddingLeft:36 }} type="number" min="0" value={eForm.pricePKR}
                      onChange={e => {
                        const pkr = e.target.value;
                        const usd = pkr ? pkrToUSD(pkr) : '';
                        setEForm(f => ({...f, pricePKR:pkr, priceUSD: usd !== '' ? String(usd) : f.priceUSD}));
                      }} />
                  </div>
                </div>
                <div style={{ position:'relative' }}>
                  <label style={S.lbl}>🌍 Price USD <span style={{ color:'#10b981', fontWeight:500, fontSize:10, textTransform:'none', letterSpacing:0 }}>(auto)</span></label>
                  <div style={{ position:'relative' }}>
                    <span style={S.pre}>$</span>
                    <input style={{ ...S.inp, paddingLeft:28 }} type="number" min="0" step="0.01" value={eForm.priceUSD} onChange={e => setEForm(f => ({...f, priceUSD:e.target.value}))} />
                  </div>
                </div>
                <div>
                  <label style={S.lbl}>Stock</label>
                  <input style={S.inp} type="number" min="0" value={eForm.stock} onChange={e => setEForm(f => ({...f, stock:e.target.value}))} />
                </div>
                <div>
                  <label style={S.lbl}>⚖️ Weight (kg) <span style={{ color:'#94a3b8', fontWeight:400, fontSize:10, textTransform:'none', letterSpacing:0 }}>(optional)</span></label>
                  <div style={{ position:'relative' }}>
                    <span style={{ position:'absolute', left:10, top:'50%', transform:'translateY(-50%)', fontSize:11, color:'#94a3b8', fontWeight:700 }}>kg</span>
                    <input style={{ ...S.inp, paddingLeft:30 }} type="number" min="0" step="0.1" placeholder="Leave blank if no weight" value={eForm.weightKg} onChange={e => setEForm(f => ({...f, weightKg:e.target.value}))} />
                  </div>
                  <p style={{ margin:'4px 0 0', fontSize:10, color:'#94a3b8' }}>Used to calculate shipping fee</p>
                </div>
                <div>
                  <label style={S.lbl}>Description</label>
                  <textarea style={{ ...S.inp, height:78, resize:'vertical' }} value={eForm.description} onChange={e => setEForm(f => ({...f, description:e.target.value}))} />
                </div>
                {/* ── MARKET VISIBILITY (full-width, improved) ── */}
                <div style={{ gridColumn:'1/-1' }}>
                  <label style={{ ...S.lbl, marginBottom:10 }}>Market Visibility *</label>
                  <MktPicker val={eForm.isLocal} onChange={v => setEForm(f => ({...f, isLocal:v}))} />
                </div>
              </div>
            </div>
            <div style={S.mFoot}>
              <button style={S.ghostBtn} onClick={() => setEditP(null)}>Cancel</button>
              <button style={S.greenBtn} onClick={handleEditSave} disabled={eSaving}>
                {eSaving ? '⏳ Saving…' : '💾 Save Changes'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ═══ SIDEBAR ══════════════════════════════════════════ */}
      <aside style={S.side}>
        <div style={S.sideLogo}>
          <div style={S.mark}>
            <span style={{ fontSize:13, fontWeight:900, letterSpacing:'-0.5px', color:'#fff' }}>IC</span>
          </div>
          <div>
            <p style={{ margin:0, fontSize:14, fontWeight:800, color:'#f8fafc', fontFamily:"'Sora',sans-serif", letterSpacing:'-0.3px' }}>IndusCart</p>
            <p style={{ margin:0, fontSize:9, color:'#475569', fontWeight:700, letterSpacing:'1.5px', textTransform:'uppercase' }}>Admin Console</p>
          </div>
        </div>

        <nav style={{ padding:'10px 0', flex:1 }}>
          {[
            { id:'dashboard', icon:'⬡', label:'Dashboard' },
            { id:'products',  icon:'⬢', label:'Products',   badge: products.length },
            { id:'add',       icon:'⊕', label:'Add Product' },
            { id:'orders',    icon:'◎', label:'Orders',      badge: pending, warn: true },
            { id:'settings',  icon:'⚙', label:'Settings' },
          ].map(item => (
            <button key={item.id} className="nav-btn"
              style={{ ...S.navBtn, ...(tab === item.id ? S.navOn : {}) }}
              onClick={() => setTab(item.id)}>
              <span style={{ fontSize:16, width:20, textAlign:'center', flexShrink:0, opacity: tab===item.id ? 1 : .6 }}>{item.icon}</span>
              <span style={{ flex:1, textAlign:'left' }}>{item.label}</span>
              {item.badge > 0 && (
                <span style={{ ...S.navBadge, background: item.warn ? '#ef4444' : 'rgba(16,185,129,.25)', color: item.warn ? '#fff' : '#6ee7b7' }}>
                  {item.badge}
                </span>
              )}
            </button>
          ))}
        </nav>

        {/* ── market split in sidebar ── */}
        <div style={{ padding:'14px 18px', borderTop:'1px solid rgba(255,255,255,.06)', borderBottom:'1px solid rgba(255,255,255,.06)' }}>
          <p style={{ margin:'0 0 10px', fontSize:9, color:'#475569', fontWeight:700, textTransform:'uppercase', letterSpacing:'1.2px' }}>Market Split</p>
          <div style={{ display:'flex', gap:8 }}>
            <div style={{ flex:1, background:'rgba(16,185,129,.08)', border:'1px solid rgba(16,185,129,.15)', borderRadius:10, padding:'8px 10px', textAlign:'center' }}>
              <p style={{ margin:0, fontSize:18, fontWeight:900, color:'#10b981', lineHeight:1, fontFamily:"'Sora',sans-serif" }}>{localCnt}</p>
              <p style={{ margin:'3px 0 0', fontSize:9, color:'#475569', fontWeight:700, textTransform:'uppercase', letterSpacing:'.6px' }}>🇵🇰 Local</p>
            </div>
            <div style={{ flex:1, background:'rgba(99,102,241,.08)', border:'1px solid rgba(99,102,241,.15)', borderRadius:10, padding:'8px 10px', textAlign:'center' }}>
              <p style={{ margin:0, fontSize:18, fontWeight:900, color:'#6366f1', lineHeight:1, fontFamily:"'Sora',sans-serif" }}>{globalCnt}</p>
              <p style={{ margin:'3px 0 0', fontSize:9, color:'#475569', fontWeight:700, textTransform:'uppercase', letterSpacing:'.6px' }}>🌍 Global</p>
            </div>
          </div>
        </div>

        <div style={S.miniStats}>
          {[
            { label:'Products', value: products.length, color:'#10b981' },
            { label:'Orders',   value: orders.length,   color:'#f59e0b' },
            { label:'OOS',      value: oos,             color:'#f43f5e' },
          ].map(s => (
            <div key={s.label} style={{ textAlign:'center' }}>
              <p style={{ margin:0, fontSize:20, fontWeight:900, color:s.color, lineHeight:1, fontFamily:"'Sora',sans-serif" }}>{s.value}</p>
              <p style={{ margin:'3px 0 0', fontSize:9, color:'#475569', fontWeight:700, textTransform:'uppercase', letterSpacing:'.8px' }}>{s.label}</p>
            </div>
          ))}
        </div>

        <div style={S.sideUser}>
          <div style={S.ava}>{user?.name?.[0]?.toUpperCase()||'A'}</div>
          <div style={{ flex:1, minWidth:0 }}>
            <p style={{ margin:0, fontSize:12, fontWeight:700, color:'#f8fafc', overflow:'hidden', textOverflow:'ellipsis', whiteSpace:'nowrap', fontFamily:"'Sora',sans-serif" }}>{user?.name}</p>
            <p style={{ margin:0, fontSize:10, color:'#10b981', fontWeight:600 }}>Administrator</p>
          </div>
          <button title="Logout" style={S.logoutBtn} onClick={() => { logout(); navigate('/login'); }}>⏻</button>
        </div>
      </aside>

      {/* ═══ MAIN ══════════════════════════════════════════════ */}
      <main style={S.main}>

        {/* ─── DASHBOARD ─────────────────────────────────────── */}
        {tab === 'dashboard' && (
          <div style={{ animation:'fadeUp .35s ease' }}>
            <div style={S.pgTop}>
              <div>
                <h1 style={S.pgTitle}>Dashboard</h1>
                <p style={S.pgSub}>Good day, <strong style={{ color:'#0f172a' }}>{user?.name}</strong> — here's your store at a glance.</p>
              </div>
              <button style={S.greenBtn} onClick={() => setTab('add')}>+ Add Product</button>
            </div>

            {/* KPI cards */}
            <div style={{ display:'grid', gridTemplateColumns:'repeat(4,1fr)', gap:16, marginBottom:24 }}>
              {[
                { label:'Total Revenue',     val: formatPKR(revPKR), sub:`${delivered} delivered`,      g:'linear-gradient(135deg,#064e3b,#059669)', glow:'rgba(16,185,129,.3)' },
                { label:'Total Orders',      val: orders.length,     sub:`${pending} pending`,           g:'linear-gradient(135deg,#78350f,#d97706)', glow:'rgba(217,119,6,.3)'  },
                { label:'🇵🇰 Local Products', val: localCnt,          sub:'Pakistan-only visibility',    g:'linear-gradient(135deg,#052e16,#16a34a)', glow:'rgba(22,163,74,.3)'  },
                { label:'🌍 Global Products', val: globalCnt,         sub:'Worldwide visibility',        g:'linear-gradient(135deg,#1e1b4b,#4f46e5)', glow:'rgba(99,102,241,.3)' },
              ].map((k,i) => (
                <div key={k.label} className="kpi-card"
                  style={{ background:k.g, borderRadius:18, padding:'22px 20px', cursor:'default', transition:'transform .2s,box-shadow .2s', boxShadow:`0 4px 20px ${k.glow}` }}>
                  <p style={{ margin:'0 0 14px', fontSize:10, fontWeight:700, color:'rgba(255,255,255,.6)', textTransform:'uppercase', letterSpacing:'1px', fontFamily:"'Sora',sans-serif" }}>{k.label}</p>
                  <p style={{ margin:'0 0 6px', fontSize:28, fontWeight:900, color:'#fff', letterSpacing:'-1px', lineHeight:1, fontFamily:"'Sora',sans-serif" }}>{k.val}</p>
                  <p style={{ margin:0, fontSize:11, color:'rgba(255,255,255,.55)', fontWeight:500 }}>{k.sub}</p>
                </div>
              ))}
            </div>

            {/* ── Market Split Overview card ── */}
            <div style={{ ...S.card, marginBottom:20 }}>
              <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center', marginBottom:18 }}>
                <div>
                  <h3 style={S.cardH}>📊 Market Split Overview</h3>
                  <p style={{ margin:'4px 0 0', fontSize:12, color:'#94a3b8' }}>How your catalog is distributed across customer markets</p>
                </div>
                <button style={S.linkBtn} onClick={() => setTab('products')}>Manage products →</button>
              </div>
              <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:16 }}>
                {/* Local card */}
                <div style={{ background:'linear-gradient(135deg,#f0fdf4,#dcfce7)', border:'1.5px solid #bbf7d0', borderRadius:14, padding:'20px 22px' }}>
                  <div style={{ display:'flex', justifyContent:'space-between', alignItems:'flex-start', marginBottom:14 }}>
                    <div>
                      <p style={{ margin:'0 0 4px', fontSize:10, fontWeight:700, color:'#166534', textTransform:'uppercase', letterSpacing:'1px' }}>🇵🇰 Pakistan / Local</p>
                      <p style={{ margin:0, fontSize:34, fontWeight:900, color:'#15803d', lineHeight:1, fontFamily:"'Sora',sans-serif" }}>{localCnt}</p>
                    </div>
                    <span style={{ fontSize:36, lineHeight:1 }}>🇵🇰</span>
                  </div>
                  <p style={{ margin:'0 0 12px', fontSize:12, color:'#4ade80', fontWeight:500 }}>
                    Only visible to customers shopping in <strong>Pakistan mode (PKR)</strong>
                  </p>
                  <div style={{ height:6, background:'rgba(0,0,0,.06)', borderRadius:99, overflow:'hidden' }}>
                    <div style={{ height:'100%', width: products.length ? `${(localCnt/products.length)*100}%` : '0%', background:'#16a34a', borderRadius:99, transition:'width 1.2s ease' }} />
                  </div>
                  <p style={{ margin:'6px 0 0', fontSize:11, color:'#16a34a', fontWeight:600 }}>
                    {products.length ? Math.round((localCnt/products.length)*100) : 0}% of total catalog
                  </p>
                </div>
                {/* Global card */}
                <div style={{ background:'linear-gradient(135deg,#eff6ff,#dbeafe)', border:'1.5px solid #bfdbfe', borderRadius:14, padding:'20px 22px' }}>
                  <div style={{ display:'flex', justifyContent:'space-between', alignItems:'flex-start', marginBottom:14 }}>
                    <div>
                      <p style={{ margin:'0 0 4px', fontSize:10, fontWeight:700, color:'#1d4ed8', textTransform:'uppercase', letterSpacing:'1px' }}>🌍 International / Global</p>
                      <p style={{ margin:0, fontSize:34, fontWeight:900, color:'#2563eb', lineHeight:1, fontFamily:"'Sora',sans-serif" }}>{globalCnt}</p>
                    </div>
                    <span style={{ fontSize:36, lineHeight:1 }}>🌍</span>
                  </div>
                  <p style={{ margin:'0 0 12px', fontSize:12, color:'#60a5fa', fontWeight:500 }}>
                    Visible to <strong>ALL customers</strong> — Pakistan + international buyers
                  </p>
                  <div style={{ height:6, background:'rgba(0,0,0,.06)', borderRadius:99, overflow:'hidden' }}>
                    <div style={{ height:'100%', width: products.length ? `${(globalCnt/products.length)*100}%` : '0%', background:'#3b82f6', borderRadius:99, transition:'width 1.2s ease' }} />
                  </div>
                  <p style={{ margin:'6px 0 0', fontSize:11, color:'#2563eb', fontWeight:600 }}>
                    {products.length ? Math.round((globalCnt/products.length)*100) : 0}% of total catalog
                  </p>
                </div>
              </div>
            </div>

            {/* bottom row */}
            <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:20, marginBottom:20 }}>
              <div style={S.card}>
                <h3 style={S.cardH}>Order Status Breakdown</h3>
                <div style={{ marginTop:16 }}>
                  {STATUS_LIST.map(s => {
                    const cnt = orders.filter(o => o.status === s).length;
                    const pct = orders.length ? Math.round(cnt/orders.length*100) : 0;
                    const c   = STATUS_CFG[s];
                    return (
                      <div key={s} style={{ marginBottom:14 }}>
                        <div style={{ display:'flex', justifyContent:'space-between', marginBottom:5, alignItems:'center' }}>
                          <span style={{ fontSize:12, fontWeight:700, color:'#334155', display:'flex', alignItems:'center', gap:5 }}><span>{c.icon}</span>{s}</span>
                          <span style={{ fontSize:13, fontWeight:900, color:c.color, fontFamily:"'Sora',sans-serif" }}>{cnt}</span>
                        </div>
                        <div style={{ height:5, background:'#f1f5f9', borderRadius:99, overflow:'hidden' }}>
                          <div style={{ height:'100%', width:`${pct}%`, background:c.dot, borderRadius:99, transition:'width 1.2s ease', minWidth:cnt>0?'12px':'0' }} />
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
              <div style={S.card}>
                <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center', marginBottom:16 }}>
                  <h3 style={S.cardH}>Latest Orders</h3>
                  <button style={S.linkBtn} onClick={() => setTab('orders')}>View all →</button>
                </div>
                {orders.length === 0
                  ? <div style={S.emptyState}><p style={{ fontSize:42 }}>📭</p><p style={{ margin:0, fontSize:13 }}>No orders yet</p></div>
                  : orders.slice(0,6).map(o => (
                    <div key={o._id} style={{ display:'flex', alignItems:'center', gap:12, padding:'10px 0', borderBottom:'1px solid #f8fafc' }}>
                      <div style={{ width:38, height:38, borderRadius:10, background:STATUS_CFG[o.status]?.bg||'#f1f5f9', display:'flex', alignItems:'center', justifyContent:'center', flexShrink:0, fontSize:16 }}>
                        {STATUS_CFG[o.status]?.icon || '◎'}
                      </div>
                      <div style={{ flex:1, minWidth:0 }}>
                        <p style={{ margin:0, fontSize:13, fontWeight:700, color:'#1e293b', overflow:'hidden', textOverflow:'ellipsis', whiteSpace:'nowrap', fontFamily:"'Sora',sans-serif" }}>{o.user?.name||'Guest'}</p>
                        <p style={{ margin:0, fontSize:11, color:'#94a3b8' }}>{o.paymentMethod} · {formatPKR(o.totalPrice)}</p>
                      </div>
                      <Badge s={o.status} />
                    </div>
                  ))}
              </div>
            </div>

            {/* inventory snapshot */}
            <div style={S.card}>
              <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center', marginBottom:16 }}>
                <h3 style={S.cardH}>Inventory Snapshot</h3>
                <button style={S.linkBtn} onClick={() => setTab('products')}>Manage all →</button>
              </div>
              <div style={{ overflowX:'auto' }}>
                <table style={S.tbl}>
                  <thead>
                    <tr>{['','Name','Category','PKR','USD','Stock','Market'].map(h => <th key={h} style={S.th}>{h}</th>)}</tr>
                  </thead>
                  <tbody>
                    {products.slice(0,8).map(p => (
                      <tr key={p._id} className="row-hover">
                        <td style={S.td}><ThumbCell p={p} /></td>
                        <td style={{ ...S.td, fontWeight:700, color:'#1e293b', fontFamily:"'Sora',sans-serif" }}>{p.name}</td>
                        <td style={S.td}><span style={S.catTag}>{p.category}</span></td>
                        <td style={S.td}><span style={{ fontSize:11, fontWeight:700, color:'#64748b' }}>{p.weightKg > 0 ? p.weightKg + 'kg' : '—'}</span></td>
                        <td style={{ ...S.td, fontWeight:800, color:'#10b981', fontFamily:"'JetBrains Mono',monospace" }}>{formatPKR(p.pricePKR)}</td>
                        <td style={{ ...S.td, fontWeight:800, color:'#6366f1', fontFamily:"'JetBrains Mono',monospace" }}>{formatUSD(p.priceUSD)}</td>
                        <td style={S.td}><StockCell n={p.stock} /></td>
                        <td style={S.td}><MktBadge isLocal={p.isLocal} /></td>
                      </tr>
                    ))}
                    {products.length === 0 && (
                      <tr><td colSpan={7} style={{ textAlign:'center', padding:'3rem', color:'#94a3b8', fontSize:14 }}>No products yet.</td></tr>
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        )}

        {/* ─── PRODUCTS ───────────────────────────────────────── */}
        {tab === 'products' && (
          <div style={{ animation:'fadeUp .35s ease' }}>
            <div style={S.pgTop}>
              <div>
                <h1 style={S.pgTitle}>Products</h1>
                <p style={S.pgSub}>{products.length} total · {localCnt} local · {globalCnt} global · {oos} out of stock</p>
              </div>
              <button style={S.greenBtn} onClick={() => setTab('add')}>+ Add Product</button>
            </div>

            {/* filter bar */}
            <div style={{ display:'flex', gap:10, marginBottom:18, flexWrap:'wrap', alignItems:'center' }}>
              <input style={S.searchBox} placeholder="🔍  Search products…" value={search} onChange={e => setSearch(e.target.value)} />
              <select style={S.sel} value={fCat} onChange={e => setFCat(e.target.value)}>
                <option value="All">All Categories</option>
                {cats.map(c => <option key={c}>{c}</option>)}
              </select>
              {/* market filter pills */}
              <div style={{ display:'flex', gap:6, flexShrink:0 }}>
                {[
                  { v:'all',    label:'All',       cnt: products.length,  activeColor:'#475569', activeBg:'#f1f5f9', activeBorder:'#cbd5e1' },
                  { v:'local',  label:'🇵🇰 Local',  cnt: localCnt,         activeColor:'#059669', activeBg:'#ecfdf5', activeBorder:'#6ee7b7' },
                  { v:'global', label:'🌍 Global', cnt: globalCnt,         activeColor:'#2563eb', activeBg:'#eff6ff', activeBorder:'#93c5fd' },
                ].map(o => {
                  const on = fMarket === o.v;
                  return (
                    <button key={o.v} className="mkt-pill" onClick={() => setFMarket(o.v)}
                      style={{
                        padding:'8px 14px', borderRadius:999, fontSize:12, fontWeight:700, cursor:'pointer',
                        border: `1.5px solid ${on ? o.activeBorder : '#e2e8f0'}`,
                        background: on ? o.activeBg : '#fff',
                        color: on ? o.activeColor : '#64748b',
                        transition:'all .15s', fontFamily:"'Sora',sans-serif",
                      }}>
                      {o.label} <span style={{ opacity:.65 }}>({o.cnt})</span>
                    </button>
                  );
                })}
              </div>
            </div>

            <div style={S.card}>
              <div style={{ overflowX:'auto' }}>
                <table style={S.tbl}>
                  <thead>
                    <tr>{['','Name','Category','PKR Price','USD Price','Stock','Market','Actions'].map(h => <th key={h} style={S.th}>{h}</th>)}</tr>
                  </thead>
                  <tbody>
                    {filteredProducts.length === 0 && (
                      <tr><td colSpan={8} style={{ textAlign:'center', padding:'4rem', color:'#94a3b8', fontSize:14 }}>No products found.</td></tr>
                    )}
                    {filteredProducts.map(p => (
                      <tr key={p._id} className="row-hover">
                        <td style={S.td}>
                          <div style={{ position:'relative', display:'inline-block' }}>
                            <ThumbCell p={p} />
                            {(p.images||[]).length > 1 && (
                              <span style={{ position:'absolute', top:-5, right:-5, background:'#6366f1', color:'#fff', borderRadius:999, fontSize:9, fontWeight:800, padding:'2px 5px' }}>+{p.images.length-1}</span>
                            )}
                          </div>
                        </td>
                        <td style={{ ...S.td, maxWidth:180 }}>
                          <p style={{ margin:'0 0 2px', fontWeight:700, color:'#1e293b', fontFamily:"'Sora',sans-serif" }}>{p.name}</p>
                          {p.description && <p style={{ margin:0, fontSize:11, color:'#94a3b8' }}>{p.description.slice(0,50)}{p.description.length>50?'…':''}</p>}
                        </td>
                        <td style={S.td}><span style={S.catTag}>{p.category}</span></td>
                        <td style={{ ...S.td, fontWeight:800, color:'#10b981', whiteSpace:'nowrap', fontFamily:"'JetBrains Mono',monospace" }}>{formatPKR(p.pricePKR)}</td>
                        <td style={{ ...S.td, fontWeight:800, color:'#6366f1', whiteSpace:'nowrap', fontFamily:"'JetBrains Mono',monospace" }}>{formatUSD(p.priceUSD)}</td>
                        <td style={S.td}><StockCell n={p.stock} /></td>
                        <td style={S.td}><MktBadge isLocal={p.isLocal} /></td>
                        <td style={{ ...S.td, whiteSpace:'nowrap' }}>
                          <button className="edit-btn" style={S.editBtn} onClick={() => openEdit(p)}>✏️ Edit</button>
                          <button className="del-btn" style={S.deleteBtn} onClick={() => handleDelete(p._id, p.name)}>🗑️</button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        )}

        {/* ─── ADD PRODUCT ────────────────────────────────────── */}
        {tab === 'add' && (
          <div style={{ animation:'fadeUp .35s ease' }}>
            <div style={S.pgTop}>
              <div>
                <h1 style={S.pgTitle}>Add New Product</h1>
                <p style={S.pgSub}>Fill all required (*) fields · USD auto-calculates from PKR</p>
              </div>
            </div>

            <div style={{ display:'grid', gridTemplateColumns:'1fr 300px', gap:20, alignItems:'start' }}>
              <div style={S.card}>
                <form onSubmit={handleAdd}>
                  <div style={{ marginBottom:18 }}>
                    <label style={S.lbl}>Product Name *</label>
                    <input style={S.inp} placeholder="e.g. Multan Blue Pottery Vase" value={form.name} onChange={e => setForm(f=>({...f,name:e.target.value}))} required autoComplete='off' />
                  </div>

                  <div style={{ marginBottom:18 }}>
                    <label style={S.lbl}>
                      Category *{newCat && <span style={{ color:'#10b981', fontWeight:500, fontSize:10, textTransform:'none', letterSpacing:0 }}>{' '}— new category</span>}
                    </label>
                    <CatPicker val={form.category} onChange={v => setForm(f=>({...f,category:v}))} isNew={newCat} setIsNew={setNewCat} cats={cats} />
                    {cats.length === 0 && !newCat && (
                      <p style={{ margin:'6px 0 0', fontSize:11, color:'#f59e0b', fontWeight:600 }}>⚠️ No categories yet — click "+ New" to create your first one.</p>
                    )}
                  </div>

                  <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:16, marginBottom:18 }}>
                    <div>
                      <label style={S.lbl}>🇵🇰 Price PKR *</label>
                      <div style={{ position:'relative' }}>
                        <span style={S.pre}>Rs</span>
                        <input style={{ ...S.inp, paddingLeft:36 }} type="number" min="0" placeholder="0" value={form.pricePKR}
                          onChange={e => {
                            const pkr = e.target.value;
                            const usd = pkr ? pkrToUSD(pkr) : '';
                            setForm(f=>({...f, pricePKR:pkr, priceUSD: usd !== '' ? String(usd) : f.priceUSD}));
                          }} required />
                      </div>
                    </div>
                    <div>
                      <label style={S.lbl}>🌍 Price USD <span style={{ color:'#10b981', fontWeight:500, fontSize:10, textTransform:'none', letterSpacing:0 }}>(auto)</span></label>
                      <div style={{ position:'relative' }}>
                        <span style={S.pre}>$</span>
                        <input style={{ ...S.inp, paddingLeft:28 }} type="number" min="0" step="0.01" placeholder="0.00" value={form.priceUSD} onChange={e => setForm(f=>({...f,priceUSD:e.target.value}))} required />
                      </div>
                    </div>
                  </div>

                  <div style={{ marginBottom:18 }}>
                    <label style={S.lbl}>Stock Quantity *</label>
                    <input style={S.inp} type="number" min="0" placeholder="0" value={form.stock} onChange={e => setForm(f=>({...f,stock:e.target.value}))} required />
                  </div>

                  <div style={{ marginBottom:18 }}>
                    <label style={S.lbl}>⚖️ Weight (kg) <span style={{ color:'#94a3b8', fontWeight:400, fontSize:10, textTransform:'none', letterSpacing:0 }}>(optional)</span></label>
                    <div style={{ position:'relative' }}>
                      <span style={{ position:'absolute', left:10, top:'50%', transform:'translateY(-50%)', fontSize:11, color:'#94a3b8', fontWeight:700 }}>kg</span>
                      <input style={{ ...S.inp, paddingLeft:30 }} type="number" min="0" step="0.1" placeholder="Leave blank for weightless items (glasses, etc.)" value={form.weightKg} onChange={e => setForm(f=>({...f,weightKg:e.target.value}))} />
                    </div>
                    <p style={{ margin:'4px 0 0', fontSize:10, color:'#94a3b8' }}>Items with no weight (glasses, accessories, digital) skip the per-kg shipping charge — only the flat base rate applies.</p>
                  </div>

                  <div style={{ marginBottom:18 }}>
                    <label style={S.lbl}>Description</label>
                    <textarea style={{ ...S.inp, height:90, resize:'vertical' }} placeholder="Describe this product clearly…" value={form.description} onChange={e => setForm(f=>({...f,description:e.target.value}))} />
                  </div>

                  {/* ── MARKET VISIBILITY (improved) ── */}
                  <div style={{ marginBottom:26 }}>
                    <label style={{ ...S.lbl, marginBottom:10 }}>Market Visibility *</label>
                    <MktPicker val={form.isLocal} onChange={v => setForm(f=>({...f,isLocal:v}))} />
                  </div>

                  <button type="submit" style={{ ...S.greenBtn, width:'100%', padding:15, fontSize:14 }} disabled={saving}>
                    {saving ? '⏳ Publishing…' : '+ Publish Product'}
                  </button>
                </form>
              </div>

              {/* right panel */}
              <div>
                <div style={S.card}>
                  <h4 style={{ ...S.cardH, marginBottom:16 }}>Product Photos</h4>
                  <ImgPicker prevs={previews} onPick={f => pickImgs(f, false)} onRemove={i => removeImg(i, false)} inputRef={fileRef} />
                </div>
                <div style={{ ...S.card, background:'linear-gradient(135deg,#f0fdf4,#ecfdf5)', border:'1px solid #bbf7d0', marginTop:16 }}>
                  <p style={{ margin:'0 0 12px', fontSize:10, fontWeight:800, color:'#065f46', letterSpacing:'1px', textTransform:'uppercase' }}>💡 Tips</p>
                  <ul style={{ margin:0, paddingLeft:18, fontSize:12, color:'#166534', lineHeight:2.2, fontWeight:500 }}>
                    <li>First photo = main display image</li>
                    <li>Upload up to <strong>5 photos</strong></li>
                    <li>Type PKR → USD auto-fills</li>
                    <li><strong>Global</strong> = all customers see it</li>
                    <li><strong>Local</strong> = Pakistan mode only</li>
                    <li>Stock &lt;5 shows low-stock warning</li>
                  </ul>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* ─── ORDERS ─────────────────────────────────────────── */}
        {tab === 'orders' && (
          <div style={{ animation:'fadeUp .35s ease' }}>
            <div style={S.pgTop}>
              <div>
                <h1 style={S.pgTitle}>Orders</h1>
                <p style={S.pgSub}>{orders.length} total · {pending} pending · {delivered} delivered</p>
              </div>
            </div>

            <div style={{ display:'flex', gap:8, marginBottom:18, flexWrap:'wrap' }}>
              {['All', ...STATUS_LIST].map(s => {
                const cnt = s === 'All' ? orders.length : orders.filter(o => o.status === s).length;
                const c   = STATUS_CFG[s] || { bg:'#f1f5f9', color:'#475569', dot:'#94a3b8' };
                const on  = fStatus === s;
                return (
                  <button key={s} onClick={() => setFStatus(s)} style={{
                    padding:'7px 16px', borderRadius:999, fontSize:12, fontWeight:700,
                    border: on ? `1.5px solid ${c.dot}` : '1.5px solid #e2e8f0',
                    background: on ? c.bg : '#fff', color: on ? c.color : '#64748b',
                    cursor:'pointer', transition:'all .15s', fontFamily:"'Sora',sans-serif",
                  }}>
                    {s} <span style={{ opacity:.7 }}>({cnt})</span>
                  </button>
                );
              })}
            </div>

            <div style={S.card}>
              {orders.length === 0 ? (
                <div style={S.emptyState}><p style={{ fontSize:52 }}>📭</p><p style={{ margin:0, fontWeight:700, fontSize:16, color:'#475569' }}>No orders yet</p></div>
              ) : (
                <div style={{ overflowX:'auto' }}>
                  <table style={S.tbl}>
                    <thead>
                      <tr>{['Order ID','Customer','Items','Total','Payment','Status','Update'].map(h => <th key={h} style={S.th}>{h}</th>)}</tr>
                    </thead>
                    <tbody>
                      {filteredOrders.length === 0 && (
                        <tr><td colSpan={7} style={{ textAlign:'center', padding:'3rem', color:'#94a3b8' }}>No orders with this status.</td></tr>
                      )}
                      {filteredOrders.map(o => (
                        <tr key={o._id} className="row-hover">
                          <td style={{ ...S.td, fontFamily:"'JetBrains Mono',monospace", fontWeight:700, color:'#6366f1', fontSize:13 }}>#{o._id.slice(-6).toUpperCase()}</td>
                          <td style={S.td}>
                            <p style={{ margin:'0 0 2px', fontWeight:700, color:'#1e293b', fontSize:13, fontFamily:"'Sora',sans-serif" }}>{o.user?.name||'—'}</p>
                            <p style={{ margin:0, fontSize:11, color:'#94a3b8' }}>{o.address?.city || '—'}</p>
                          </td>
                          <td style={{ ...S.td, maxWidth:160 }}>
                            <p style={{ margin:0, fontSize:12, color:'#475569', lineHeight:1.7 }}>
                              {(o.products||[]).slice(0,2).map(p=>`${p.name}×${p.quantity}`).join(', ')}
                              {(o.products||[]).length > 2 && ` +${o.products.length-2} more`}
                            </p>
                          </td>
                          <td style={{ ...S.td, fontWeight:900, color:'#10b981', whiteSpace:'nowrap', fontFamily:"'JetBrains Mono',monospace" }}>{formatPKR(o.totalPrice)}</td>
                          <td style={S.td}>
                            <span style={{ background:'#faf5ff', color:'#7c3aed', padding:'4px 10px', borderRadius:7, fontSize:11, fontWeight:700 }}>{o.paymentMethod}</span>
                          </td>
                          <td style={S.td}><Badge s={o.status} /></td>
                          <td style={S.td}>
                            <select value={o.status} onChange={e => changeStatus(o._id, e.target.value)}
                              style={{ border:'1.5px solid #e2e8f0', borderRadius:9, padding:'7px 10px', fontSize:12, cursor:'pointer', background:'#fff', color:'#334155', outline:'none', fontFamily:"'Sora',sans-serif", fontWeight:600 }}>
                              {STATUS_LIST.map(s => <option key={s}>{s}</option>)}
                            </select>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          </div>
        )}

        {/* ─── SETTINGS ───────────────────────────────────────── */}
        {tab === 'settings' && (
          <div style={{ animation:'fadeUp .35s ease' }}>
            <div style={S.pgTop}>
              <div>
                <h1 style={S.pgTitle}>Settings</h1>
                <p style={S.pgSub}>Configure pricing, currency, and zone-based shipping rates</p>
              </div>
            </div>

            {/* Exchange rate card */}
            <div style={{ ...S.card, marginBottom:20 }}>
              <h3 style={{ ...S.cardH, marginBottom:6 }}>💱 PKR → USD Exchange Rate</h3>
              <p style={{ margin:'0 0 18px', fontSize:12, color:'#64748b' }}>
                Used to auto-calculate USD price when you enter PKR. Current: <strong>1 USD = Rs {getUSDRate()}</strong>
              </p>
              <div style={{ display:'flex', gap:12, alignItems:'flex-end', maxWidth:380 }}>
                <div style={{ flex:1 }}>
                  <label style={S.lbl}>1 USD equals (PKR)</label>
                  <div style={{ position:'relative' }}>
                    <span style={S.pre}>Rs</span>
                    <input style={{ ...S.inp, paddingLeft:36 }} type="number" min="1" step="0.01" value={usdRate} onChange={e => setUsdRate(e.target.value)} />
                  </div>
                </div>
                <button style={{ ...S.greenBtn, whiteSpace:'nowrap', flexShrink:0 }} onClick={saveRate}>
                  {usdSaved ? '✓ Saved!' : '💾 Save Rate'}
                </button>
              </div>
              <p style={{ margin:'10px 0 0', fontSize:11, color:'#94a3b8' }}>e.g. rate = 278 → Rs 1,000 = $3.60. USD auto-fills when you type PKR in Add/Edit Product.</p>
            </div>

            {/* Zone-based shipping card */}
            <div style={S.card}>
              <h3 style={{ ...S.cardH, marginBottom:4 }}>🌍 Zone-Based Shipping Rates</h3>
              <p style={{ margin:'0 0 4px', fontSize:12, color:'#64748b' }}>
                Formula: <strong>Shipping = Base Rate + (Total Weight × Per-KG Rate)</strong>
              </p>
              <p style={{ margin:'0 0 18px', fontSize:11, color:'#94a3b8' }}>
                Items with no weight entered (glasses, accessories, fruit) only pay the base rate — no per-kg charge.
                Zone is auto-detected from the customer's destination (e.g. Multan → Karachi = Domestic, Pakistan → Dubai = Middle East).
              </p>

              <div style={{ display:'grid', gridTemplateColumns:'repeat(auto-fill,minmax(280px,1fr))', gap:14, marginBottom:20 }}>
                {Object.entries(ZONE_LABELS).map(([zone, label]) => {
                  const r = zoneRates[zone] || { baseRate:0, perKg:0, minFee:0 };
                  return (
                    <div key={zone} style={{ background:'#f8fafc', border:'1.5px solid #e2e8f0', borderRadius:14, padding:'16px' }}>
                      <p style={{ margin:'0 0 12px', fontSize:11, fontWeight:800, color:'#334155', textTransform:'uppercase', letterSpacing:'0.8px' }}>{label}</p>
                      <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr 1fr', gap:8 }}>
                        <div>
                          <label style={{ ...S.lbl, fontSize:9 }}>Base (Rs)</label>
                          <input style={{ ...S.inp, padding:'8px 10px', fontSize:12 }} type="number" min="0"
                            value={r.baseRate}
                            onChange={e => setZoneRates(z => ({...z, [zone]: {...z[zone], baseRate: Number(e.target.value)}}))} />
                        </div>
                        <div>
                          <label style={{ ...S.lbl, fontSize:9 }}>Per KG (Rs)</label>
                          <input style={{ ...S.inp, padding:'8px 10px', fontSize:12 }} type="number" min="0"
                            value={r.perKg}
                            onChange={e => setZoneRates(z => ({...z, [zone]: {...z[zone], perKg: Number(e.target.value)}}))} />
                        </div>
                        <div>
                          <label style={{ ...S.lbl, fontSize:9 }}>Min Fee (Rs)</label>
                          <input style={{ ...S.inp, padding:'8px 10px', fontSize:12 }} type="number" min="0"
                            value={r.minFee}
                            onChange={e => setZoneRates(z => ({...z, [zone]: {...z[zone], minFee: Number(e.target.value)}}))} />
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>

              <button style={S.greenBtn} onClick={saveZone}>
                {zoneSaved ? '✓ Saved!' : '💾 Save Zone Rates'}
              </button>
              <p style={{ margin:'10px 0 0', fontSize:11, color:'#94a3b8' }}>
                Customers see the shipping fee auto-calculated at checkout based on their delivery country/city.
              </p>
            </div>
          </div>
        )}

        {/* ── Support Tickets Tab ── */}
        {tab === 'support' && (
          <div style={{ animation:'fadeUp .35s ease' }}>
            <div style={S.pgTop}>
              <div>
                <h1 style={S.pgTitle}>🎧 Support Tickets</h1>
                <p style={S.pgSub}>Customer support requests · {tickets.filter(t=>t.status==='Open').length} open · {tickets.filter(t=>t.status==='Resolved').length} resolved</p>
              </div>
              <button style={S.greenBtn} onClick={() => setTickets(getSupportTickets())}>
                🔄 Refresh
              </button>
            </div>

            {/* KPI row */}
            <div style={{ display:'grid', gridTemplateColumns:'repeat(3,1fr)', gap:14, marginBottom:22 }}>
              {[
                { label:'Total Tickets', val: tickets.length,                                color:'#6366f1', bg:'#eef2ff', border:'#c7d2fe', icon:'🗂️' },
                { label:'Open',          val: tickets.filter(t=>t.status==='Open').length,     color:'#d97706', bg:'#fffbeb', border:'#fde68a', icon:'🟡' },
                { label:'Resolved',      val: tickets.filter(t=>t.status==='Resolved').length, color:'#059669', bg:'#f0fdf4', border:'#bbf7d0', icon:'✅' },
              ].map(k => (
                <div key={k.label} style={{ background:k.bg, border:`1.5px solid ${k.border}`, borderRadius:14, padding:'16px 20px', display:'flex', justifyContent:'space-between', alignItems:'center' }}>
                  <div>
                    <p style={{ margin:'0 0 4px', fontSize:10, fontWeight:700, color:k.color, textTransform:'uppercase', letterSpacing:'1px', fontFamily:"'Sora',sans-serif" }}>{k.label}</p>
                    <p style={{ margin:0, fontSize:28, fontWeight:900, color:k.color, lineHeight:1, fontFamily:"'Sora',sans-serif" }}>{k.val}</p>
                  </div>
                  <span style={{ fontSize:24 }}>{k.icon}</span>
                </div>
              ))}
            </div>

            {/* Filter pills + search */}
            <div style={{ display:'flex', gap:'10px', marginBottom:'18px', flexWrap:'wrap', alignItems:'center' }}>
              <div style={{ display:'flex', gap:6 }}>
                {['All','Open','Resolved'].map(f => (
                  <button key={f} onClick={() => setTicketFilter(f)} style={{
                    padding:'7px 18px', borderRadius:'999px', border:'1.5px solid',
                    borderColor: ticketFilter===f ? '#10b981' : '#e2e8f0',
                    background:  ticketFilter===f ? '#10b981' : '#fff',
                    color:       ticketFilter===f ? '#fff'    : '#64748b',
                    fontSize:'13px', fontWeight:'700', cursor:'pointer',
                    fontFamily:"'Sora',sans-serif",
                  }}>
                    {f} {f==='Open' ? '('+tickets.filter(t=>t.status==='Open').length+')' : f==='Resolved' ? '('+tickets.filter(t=>t.status==='Resolved').length+')' : '('+tickets.length+')'}
                  </button>
                ))}
              </div>
              <input
                style={{ ...S.searchBox, flex:1, minWidth:220 }}
                placeholder="🔍  Search by name, email, subject, order ID…"
                value={search}
                onChange={e => setSearch(e.target.value)}
              />
            </div>

            {[...tickets]
              .sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt))
              .filter(t => ticketFilter==='All' || t.status===ticketFilter)
              .filter(t => !search.trim() ||
                t.name?.toLowerCase().includes(search.toLowerCase()) ||
                t.email?.toLowerCase().includes(search.toLowerCase()) ||
                (t.subject||'').toLowerCase().includes(search.toLowerCase()) ||
                (t.message||'').toLowerCase().includes(search.toLowerCase()) ||
                (t.orderId||'').toLowerCase().includes(search.toLowerCase())
              ).length === 0 ? (
              <div style={{ ...S.emptyState, background:'#fff', borderRadius:16, border:'1px solid #e2e8f0' }}>
                <p style={{ fontSize:'52px', margin:'0 0 12px' }}>🎧</p>
                <p style={{ margin:0, fontSize:'15px', fontWeight:'700', color:'#334155' }}>No {ticketFilter==='All'?'':ticketFilter.toLowerCase()} tickets{search?' matching your search':''}</p>
                <p style={{ margin:'6px 0 0', fontSize:'13px', color:'#94a3b8' }}>Support tickets from customers will appear here</p>
              </div>
            ) : (
              <div style={{ display:'flex', flexDirection:'column', gap:'12px' }}>
                {[...tickets]
                  .sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt))
                  .filter(t => ticketFilter==='All' || t.status===ticketFilter)
                  .filter(t => !search.trim() ||
                    t.name?.toLowerCase().includes(search.toLowerCase()) ||
                    t.email?.toLowerCase().includes(search.toLowerCase()) ||
                    (t.subject||'').toLowerCase().includes(search.toLowerCase()) ||
                    (t.message||'').toLowerCase().includes(search.toLowerCase()) ||
                    (t.orderId||'').toLowerCase().includes(search.toLowerCase())
                  )
                  .map(ticket => (
                    <TicketCard
                      key={ticket.id}
                      ticket={ticket}
                      onResolve={() => { updateTicketStatus(ticket.id, 'Resolved'); setTickets(getSupportTickets()); }}
                      onReopen={() => { updateTicketStatus(ticket.id, 'Open'); setTickets(getSupportTickets()); }}
                    />
                  ))}
              </div>
            )}
          </div>
        )}

      </main>
    </div>
  );
}

/* ── helpers ─────────────────────────────────────────────────── */

/* TicketCard — shows user identity, userId badge, admin reply */
function TicketCard({ ticket, onResolve, onReopen }) {
  const [showReply, setShowReply] = useState(false);
  const [reply, setReply]         = useState(ticket.adminReply || '');
  const [saved,  setSaved]        = useState(false);

  const saveReply = () => {
    // Persist reply alongside the ticket in localStorage
    try {
      const all = JSON.parse(localStorage.getItem('ic_support_tickets') || '[]');
      const updated = all.map(t => t.id === ticket.id ? { ...t, adminReply: reply } : t);
      localStorage.setItem('ic_support_tickets', JSON.stringify(updated));
      setSaved(true);
      setTimeout(() => setSaved(false), 2000);
    } catch {}
  };

  return (
    <div style={{ background:'#fff', borderRadius:'16px', border:`1.5px solid ${ticket.status==='Open' ? '#fde68a' : '#bbf7d0'}`, padding:'20px 24px', boxShadow:'0 2px 8px rgba(0,0,0,0.05)' }}>
      <div style={{ display:'flex', justifyContent:'space-between', alignItems:'flex-start', flexWrap:'wrap', gap:'12px' }}>

        {/* Left: ticket info */}
        <div style={{ flex:1, minWidth:0 }}>
          <div style={{ display:'flex', alignItems:'center', gap:'10px', marginBottom:'8px', flexWrap:'wrap' }}>
            {/* Avatar */}
            <div style={{ width:32, height:32, borderRadius:'50%', background:'linear-gradient(135deg,#6366f1,#8b5cf6)', display:'flex', alignItems:'center', justifyContent:'center', flexShrink:0 }}>
              <span style={{ fontSize:13, fontWeight:800, color:'#fff', fontFamily:"'Sora',sans-serif" }}>{ticket.name?.[0]?.toUpperCase()||'?'}</span>
            </div>
            <span style={{ fontSize:'14px', fontWeight:'900', color:'#0f172a', fontFamily:"'Sora',sans-serif" }}>{ticket.name}</span>
            <span style={{ fontSize:'12px', color:'#64748b' }}>{ticket.email}</span>

            {/* 👤 Registered user badge if userId present */}
            {ticket.userId ? (
              <span style={{ fontSize:'10px', background:'#ecfdf5', color:'#059669', padding:'3px 9px', borderRadius:'999px', fontWeight:'800', border:'1px solid #bbf7d0', fontFamily:"'Sora',sans-serif" }}>
                👤 Registered User
              </span>
            ) : (
              <span style={{ fontSize:'10px', background:'#f8fafc', color:'#94a3b8', padding:'3px 9px', borderRadius:'999px', fontWeight:'700', border:'1px solid #e2e8f0', fontFamily:"'Sora',sans-serif" }}>
                👻 Guest
              </span>
            )}

            {ticket.orderId && (
              <span style={{ fontSize:'10px', background:'#eff6ff', color:'#2563eb', padding:'3px 9px', borderRadius:'999px', fontWeight:'700', fontFamily:"'JetBrains Mono',monospace" }}>
                Order: #{ticket.orderId}
              </span>
            )}
          </div>

          {/* User ID line */}
          {ticket.userId && (
            <p style={{ margin:'0 0 6px', fontSize:'10px', color:'#94a3b8', fontFamily:"'JetBrains Mono',monospace" }}>
              User ID: <span style={{ color:'#6366f1' }}>{ticket.userId}</span>
            </p>
          )}

          <p style={{ margin:'0 0 6px', fontSize:'13px', fontWeight:'700', color:'#334155' }}>
            <span style={{ background:'#f1f5f9', borderRadius:6, padding:'2px 8px', fontSize:11, color:'#6366f1', fontWeight:700 }}>
              {ticket.subject || 'General'}
            </span>
          </p>
          <p style={{ margin:'0 0 8px', fontSize:'13px', color:'#64748b', lineHeight:'1.6', fontFamily:"'Sora',sans-serif" }}>
            {ticket.message}
          </p>
          <p style={{ margin:0, fontSize:'11px', color:'#94a3b8', fontFamily:"'JetBrains Mono',monospace" }}>
            Submitted: {new Date(ticket.createdAt).toLocaleString('en-PK')}
            {ticket.resolvedAt && <span style={{ color:'#10b981' }}> · Resolved: {new Date(ticket.resolvedAt).toLocaleString('en-PK')}</span>}
          </p>

          {/* Admin reply area */}
          {ticket.adminReply && !showReply && (
            <div style={{ marginTop:10, background:'#f0fdf4', border:'1px solid #bbf7d0', borderRadius:10, padding:'10px 14px' }}>
              <p style={{ margin:'0 0 2px', fontSize:10, fontWeight:800, color:'#059669', textTransform:'uppercase', letterSpacing:'0.5px' }}>✍️ Admin Reply</p>
              <p style={{ margin:0, fontSize:12, color:'#334155', lineHeight:1.6 }}>{ticket.adminReply}</p>
            </div>
          )}
          {showReply && (
            <div style={{ marginTop:12 }}>
              <textarea
                style={{ width:'100%', padding:'10px 13px', border:'1.5px solid #e2e8f0', borderRadius:10, fontSize:13, fontFamily:"'Sora',sans-serif", color:'#1e293b', boxSizing:'border-box', resize:'vertical', minHeight:80, background:'#f8fafc' }}
                placeholder="Type your reply to the customer…"
                value={reply}
                onChange={e => setReply(e.target.value)}
              />
              <div style={{ display:'flex', gap:8, marginTop:8 }}>
                <button onClick={saveReply}
                  style={{ padding:'7px 16px', background:'linear-gradient(135deg,#6366f1,#4f46e5)', color:'#fff', border:'none', borderRadius:9, fontSize:12, fontWeight:700, cursor:'pointer', fontFamily:"'Sora',sans-serif" }}>
                  {saved ? '✓ Saved!' : '💾 Save Reply'}
                </button>
                <button onClick={() => setShowReply(false)}
                  style={{ padding:'7px 14px', background:'#f8fafc', border:'1px solid #e2e8f0', color:'#64748b', borderRadius:9, fontSize:12, fontWeight:700, cursor:'pointer' }}>
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
            background: ticket.status==='Open' ? '#fef3c7' : '#f0fdf4',
            color:      ticket.status==='Open' ? '#d97706'  : '#059669',
          }}>
            {ticket.status==='Open' ? '🟡 Open' : '✅ Resolved'}
          </span>

          {/* Reply button */}
          <button onClick={() => setShowReply(r => !r)}
            style={{ padding:'7px 16px', background:'#f0f0ff', color:'#4f46e5', border:'1px solid #c7d2fe', borderRadius:'9px', fontSize:'12px', fontWeight:'700', cursor:'pointer', fontFamily:"'Sora',sans-serif" }}>
            {showReply ? '✕ Cancel Reply' : '✍️ Reply'}
          </button>

          {ticket.status === 'Open' ? (
            <button style={{ padding:'7px 16px', background:'linear-gradient(135deg,#10b981,#059669)', color:'#fff', border:'none', borderRadius:'9px', fontSize:'12px', fontWeight:'700', cursor:'pointer', fontFamily:"'Sora',sans-serif" }}
              onClick={onResolve}>✓ Mark Resolved</button>
          ) : (
            <button style={{ padding:'7px 16px', background:'#fff', color:'#d97706', border:'1.5px solid #fde68a', borderRadius:'9px', fontSize:'12px', fontWeight:'700', cursor:'pointer', fontFamily:"'Sora',sans-serif" }}
              onClick={onReopen}>🔄 Reopen</button>
          )}
        </div>
      </div>
    </div>
  );
}

const ThumbCell = ({ p }) => {
  const [err, setErr] = useState(false);
  const img = p.images?.[0];
  return img && !err
    ? <img src={`http://localhost:5000/uploads/${img}`} alt={p.name}
        style={{ width:46, height:46, borderRadius:10, objectFit:'cover', border:'1.5px solid #e2e8f0', display:'block' }}
        onError={() => setErr(true)} />
    : <div style={{ width:46, height:46, borderRadius:10, background:'linear-gradient(135deg,#f0fdf4,#dcfce7)', display:'flex', alignItems:'center', justifyContent:'center', fontSize:18, fontWeight:900, color:'#10b981', border:'1.5px solid #d1fae5', fontFamily:"'Sora',sans-serif" }}>
        {p.name[0]}
      </div>;
};

const StockCell = ({ n }) => (
  <span style={{ fontWeight:800, fontFamily:"'JetBrains Mono',monospace", fontSize:13, color: n===0?'#ef4444':n<5?'#f97316':'#334155' }}>
    {n===0 ? '⊘ Out' : n<5 ? `⚠ ${n}` : n}
  </span>
);

/* ── styles ──────────────────────────────────────────────────── */
const S = {
  root:      { display:'flex', minHeight:'100vh', background:'#f1f5f9', fontFamily:"'Sora','Segoe UI',sans-serif" },
  centered:  { display:'flex', flexDirection:'column', alignItems:'center', justifyContent:'center', minHeight:'100vh', background:'#f1f5f9' },
  spinRing:  { width:40, height:40, border:'3px solid #e2e8f0', borderTop:'3px solid #10b981', borderRadius:'50%', animation:'spin .8s linear infinite' },

  side:      { width:226, minHeight:'100vh', background:'#0a1628', display:'flex', flexDirection:'column', flexShrink:0, position:'sticky', top:0, height:'100vh', overflowY:'auto', borderRight:'1px solid rgba(255,255,255,.04)' },
  sideLogo:  { display:'flex', alignItems:'center', gap:12, padding:'24px 18px 18px', borderBottom:'1px solid rgba(255,255,255,.06)' },
  mark:      { width:36, height:36, borderRadius:10, background:'linear-gradient(135deg,#10b981,#059669)', display:'flex', alignItems:'center', justifyContent:'center', flexShrink:0, boxShadow:'0 4px 14px rgba(16,185,129,.4)' },
  navBtn:    { display:'flex', alignItems:'center', gap:10, width:'100%', padding:'11px 18px', background:'none', border:'none', color:'#64748b', fontSize:13, fontWeight:600, cursor:'pointer', transition:'all .15s', outline:'none', borderLeft:'3px solid transparent', fontFamily:"'Sora',sans-serif" },
  navOn:     { background:'rgba(16,185,129,.1)', color:'#10b981', fontWeight:700, borderLeft:'3px solid #10b981' },
  navBadge:  { marginLeft:'auto', borderRadius:999, fontSize:10, fontWeight:800, padding:'2px 8px', minWidth:20, textAlign:'center' },
  miniStats: { display:'flex', justifyContent:'space-around', padding:'16px 18px', borderTop:'1px solid rgba(255,255,255,.06)', borderBottom:'1px solid rgba(255,255,255,.06)' },
  sideUser:  { padding:'16px 18px', display:'flex', alignItems:'center', gap:10, borderTop:'1px solid rgba(255,255,255,.06)', marginTop:'auto' },
  ava:       { width:34, height:34, borderRadius:'50%', background:'linear-gradient(135deg,#10b981,#6366f1)', display:'flex', alignItems:'center', justifyContent:'center', fontSize:13, fontWeight:800, color:'#fff', flexShrink:0 },
  logoutBtn: { background:'none', border:'1px solid rgba(255,255,255,.1)', color:'#475569', borderRadius:7, width:30, height:30, cursor:'pointer', fontSize:14, display:'flex', alignItems:'center', justifyContent:'center', flexShrink:0 },

  main:      { flex:1, padding:'30px 36px', maxWidth:1180, overflowX:'hidden' },
  pgTop:     { display:'flex', justifyContent:'space-between', alignItems:'flex-start', marginBottom:24, flexWrap:'wrap', gap:14 },
  pgTitle:   { margin:0, fontSize:26, fontWeight:900, color:'#0f172a', letterSpacing:'-0.8px', fontFamily:"'Sora',sans-serif" },
  pgSub:     { margin:'5px 0 0', fontSize:13, color:'#64748b', fontWeight:500 },

  card:      { background:'#fff', borderRadius:16, padding:24, boxShadow:'0 1px 6px rgba(0,0,0,.06)', border:'1px solid #e8eef4', marginBottom:20 },
  cardH:     { margin:0, fontSize:14, fontWeight:800, color:'#1e293b', fontFamily:"'Sora',sans-serif", letterSpacing:'-0.2px' },
  linkBtn:   { background:'none', border:'none', color:'#6366f1', fontSize:12, fontWeight:700, cursor:'pointer', fontFamily:"'Sora',sans-serif" },
  emptyState:{ textAlign:'center', padding:'60px 20px', color:'#94a3b8' },

  searchBox: { flex:1, minWidth:220, padding:'11px 16px', border:'1.5px solid #e2e8f0', borderRadius:11, fontSize:13, background:'#fff', outline:'none', fontFamily:"'Sora',sans-serif", fontWeight:500, color:'#1e293b' },
  sel:       { padding:'11px 14px', border:'1.5px solid #e2e8f0', borderRadius:11, fontSize:13, background:'#fff', cursor:'pointer', outline:'none', fontFamily:"'Sora',sans-serif", fontWeight:600, color:'#334155' },

  tbl:  { width:'100%', borderCollapse:'collapse', fontSize:13 },
  th:   { textAlign:'left', padding:'10px 14px', borderBottom:'2px solid #f1f5f9', color:'#94a3b8', fontWeight:700, fontSize:10, textTransform:'uppercase', letterSpacing:'.8px', whiteSpace:'nowrap', fontFamily:"'Sora',sans-serif" },
  td:   { padding:'14px 14px', borderBottom:'1px solid #f8fafc', verticalAlign:'middle', color:'#334155' },

  catTag:    { background:'#f1f5f9', color:'#475569', padding:'3px 10px', borderRadius:6, fontSize:11, fontWeight:700, fontFamily:"'Sora',sans-serif" },

  editBtn:   { background:'#f8faff', border:'1px solid #bfdbfe', color:'#2563eb', borderRadius:8, padding:'6px 12px', fontSize:12, cursor:'pointer', fontWeight:700, marginRight:6, transition:'background .15s', fontFamily:"'Sora',sans-serif" },
  deleteBtn: { background:'none', border:'1px solid #fecaca', color:'#ef4444', borderRadius:8, padding:'6px 10px', fontSize:12, cursor:'pointer', fontWeight:700, transition:'background .15s' },

  greenBtn:  { background:'linear-gradient(135deg,#10b981,#059669)', color:'#fff', border:'none', borderRadius:11, padding:'11px 24px', fontSize:13, fontWeight:700, cursor:'pointer', letterSpacing:'.2px', fontFamily:"'Sora',sans-serif", boxShadow:'0 4px 14px rgba(16,185,129,.35)' },
  ghostBtn:  { background:'#f8fafc', border:'1.5px solid #e2e8f0', color:'#475569', borderRadius:9, padding:'9px 16px', fontSize:12, fontWeight:700, cursor:'pointer', whiteSpace:'nowrap', fontFamily:"'Sora',sans-serif" },

  lbl:  { display:'block', fontSize:10, fontWeight:800, color:'#64748b', marginBottom:7, letterSpacing:'.8px', textTransform:'uppercase', fontFamily:"'Sora',sans-serif" },
  inp:  { padding:'11px 13px', border:'1.5px solid #e2e8f0', borderRadius:11, fontSize:13, background:'#f8fafc', outline:'none', boxSizing:'border-box', width:'100%', color:'#1e293b', fontFamily:"'Sora',sans-serif", fontWeight:500, transition:'border-color .15s' },
  pre:  { position:'absolute', left:12, top:'50%', transform:'translateY(-50%)', fontSize:11, fontWeight:800, color:'#94a3b8', pointerEvents:'none', zIndex:2, fontFamily:"'Sora',sans-serif", userSelect:'none' },

  grid2:     { display:'grid', gridTemplateColumns:'1fr 1fr', gap:16 },

  overlay:   { position:'fixed', inset:0, background:'rgba(2,6,23,.65)', display:'flex', alignItems:'center', justifyContent:'center', zIndex:1000, padding:20, backdropFilter:'blur(4px)' },
  modal:     { background:'#fff', borderRadius:22, width:'100%', maxWidth:640, maxHeight:'92vh', overflow:'hidden', display:'flex', flexDirection:'column', boxShadow:'0 32px 80px rgba(0,0,0,.4)' },
  mHead:     { display:'flex', justifyContent:'space-between', alignItems:'center', padding:'22px 26px', borderBottom:'1px solid #f1f5f9' },
  mBody:     { padding:'24px 26px', overflowY:'auto', flex:1 },
  mFoot:     { padding:'18px 26px', borderTop:'1px solid #f1f5f9', display:'flex', justifyContent:'flex-end', gap:10, background:'#fafbfc' },
  closeX:    { background:'#f1f5f9', border:'none', borderRadius:9, width:34, height:34, cursor:'pointer', fontSize:13, color:'#475569', fontWeight:800, display:'flex', alignItems:'center', justifyContent:'center' },
};
