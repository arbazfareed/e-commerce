import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import BrandMark from '../components/BrandMark';

const COUNTRIES = [
  'Afghanistan','Albania','Algeria','Andorra','Angola','Antigua and Barbuda',
  'Argentina','Armenia','Australia','Austria','Azerbaijan','Bahamas','Bahrain',
  'Bangladesh','Barbados','Belarus','Belgium','Belize','Benin','Bhutan',
  'Bolivia','Bosnia and Herzegovina','Botswana','Brazil','Brunei','Bulgaria',
  'Burkina Faso','Burundi','Cabo Verde','Cambodia','Cameroon','Canada',
  'Central African Republic','Chad','Chile','China','Colombia','Comoros',
  'Congo (Brazzaville)','Congo (Kinshasa)','Costa Rica','Croatia','Cuba',
  'Cyprus','Czech Republic','Denmark','Djibouti','Dominica','Dominican Republic',
  'Ecuador','Egypt','El Salvador','Equatorial Guinea','Eritrea','Estonia',
  'Eswatini','Ethiopia','Fiji','Finland','France','Gabon','Gambia','Georgia',
  'Germany','Ghana','Greece','Grenada','Guatemala','Guinea','Guinea-Bissau',
  'Guyana','Haiti','Honduras','Hungary','Iceland','India','Indonesia','Iran',
  'Iraq','Ireland','Israel','Italy','Jamaica','Japan','Jordan','Kazakhstan',
  'Kenya','Kiribati','Kuwait','Kyrgyzstan','Laos','Latvia','Lebanon','Lesotho',
  'Liberia','Libya','Liechtenstein','Lithuania','Luxembourg','Madagascar',
  'Malawi','Malaysia','Maldives','Mali','Malta','Marshall Islands','Mauritania',
  'Mauritius','Mexico','Micronesia','Moldova','Monaco','Mongolia','Montenegro',
  'Morocco','Mozambique','Myanmar','Namibia','Nauru','Nepal','Netherlands',
  'New Zealand','Nicaragua','Niger','Nigeria','North Korea','North Macedonia',
  'Norway','Oman','Pakistan','Palau','Palestine','Panama','Papua New Guinea',
  'Paraguay','Peru','Philippines','Poland','Portugal','Qatar','Romania',
  'Russia','Rwanda','Saint Kitts and Nevis','Saint Lucia',
  'Saint Vincent and the Grenadines','Samoa','San Marino',
  'Sao Tome and Principe','Saudi Arabia','Senegal','Serbia','Seychelles',
  'Sierra Leone','Singapore','Slovakia','Slovenia','Solomon Islands','Somalia',
  'South Africa','South Korea','South Sudan','Spain','Sri Lanka','Sudan',
  'Suriname','Sweden','Switzerland','Syria','Taiwan','Tajikistan','Tanzania',
  'Thailand','Timor-Leste','Togo','Tonga','Trinidad and Tobago','Tunisia',
  'Turkey','Turkmenistan','Tuvalu','Uganda','Ukraine','United Arab Emirates',
  'United Kingdom','United States','Uruguay','Uzbekistan','Vanuatu',
  'Vatican City','Venezuela','Vietnam','Yemen','Zambia','Zimbabwe','Other',
];

export default function RegisterPage() {
  const { register } = useAuth();
  const navigate     = useNavigate();

  // ── step: 1 = account info, 2 = location + password ──
  const [step, setStep] = useState(1);

  const [form, setForm] = useState({
    name:'', email:'', password:'', confirm:'',
    phone:'', country:'Pakistan', city:'',
  });
  const [error,   setError]   = useState('');
  const [loading, setLoading] = useState(false);

  const set = (k) => (e) => setForm(f => ({ ...f, [k]: e.target.value }));

  // ── Step 1 → Step 2 validation ──
  const goNext = (e) => {
    e.preventDefault();
    setError('');
    if (!form.name.trim())  { setError('Please enter your full name.');     return; }
    if (!form.email.trim()) { setError('Please enter your email address.'); return; }
    if (!/\S+@\S+\.\S+/.test(form.email)) { setError('Please enter a valid email address.'); return; }
    setStep(2);
  };

  // ── Final submit (step 2) ──
  const submit = async (e) => {
    e.preventDefault();
    setError('');
    if (form.password.length < 8)       { setError('Password must be at least 8 characters.'); return; }
    if (form.password !== form.confirm) { setError('Passwords do not match.');                 return; }

    // Guard: make sure register exists and is a function
    if (typeof register !== 'function') {
      setError('Auth error: register is not available. Check AuthContext.');
      return;
    }

    setLoading(true);
    try {
      await register({
        name:     form.name.trim(),
        email:    form.email.trim().toLowerCase(),
        password: form.password,
        phone:    form.phone.trim(),
        country:  form.country,
        city:     form.city.trim(),
      });
      navigate('/');
    } catch (err) {
      console.error('Registration error full:', err);
      console.error('Response data:', err?.response?.data);
      const msg =
        err?.response?.data?.message ||
        err?.response?.data?.error   ||
        err?.message                 ||
        'Registration failed. Please try again.';
      setError(msg);
    } finally {
      setLoading(false);
    }
  };

  const isPak = form.country === 'Pakistan';

  return (
    <div className="responsive-page register-page" style={S.page}>
      <style>{`
        @keyframes fadeIn  { from{opacity:0;transform:translateY(14px)} to{opacity:1;transform:translateY(0)} }
        @keyframes spin    { to { transform:rotate(360deg); } }
        .inp:focus { border-color:#16845d !important; background:#fff !important;
               box-shadow:0 0 0 4px rgba(22,132,93,0.12), 0 3px 10px rgba(13,92,66,0.06) !important; outline:none; }
        .inp:hover:not(:focus) { border-color:#b8d1c1 !important; background:#fff !important; }
        .inp { transition:border-color .18s ease, box-shadow .18s ease, background .18s ease; }
        .reg-btn:hover:not(:disabled) { opacity:0.92; transform:translateY(-1px); }
        .reg-btn { transition:all 0.15s; }
        .back-btn:hover { background:#f1f5f9 !important; }
        .back-btn { transition:background 0.15s; }
        .register-shell {
          width:min(100%, 980px);
          display:grid;
          grid-template-columns:minmax(0,.86fr) minmax(430px,.9fr);
          border-radius:30px;
          overflow:hidden;
          background:#fff;
          box-shadow:0 24px 80px rgba(15,23,42,.16);
          position:relative;
          z-index:1;
        }
        .register-shell > div {
          display:flex;
          flex-direction:column;
          justify-content:center;
        }
        .register-visual {
          min-height:650px;
          position:relative;
          background:#78350f;
          overflow:hidden;
        }
        .register-visual::after {
          content:'';
          position:absolute;
          inset:0;
          background:linear-gradient(145deg,rgba(69,26,3,.08),rgba(69,26,3,.72));
          pointer-events:none;
        }
        .register-visual .auth-visual-image {
          object-position:center;
        }
        .register-visual-content {
          position:absolute;
          inset:auto 32px 34px;
          color:#fff;
          z-index:1;
        }
        .register-visual-kicker {
          color:#fef3c7;
          font-size:10px;
          font-weight:800;
          letter-spacing:1.7px;
        }
        .register-visual h1 {
          margin:12px 0;
          font-family:'Sora',sans-serif;
          font-size:32px;
          line-height:1.12;
          letter-spacing:-1px;
        }
        .register-visual h1 em { color:#fcd34d; font-style:normal; }
        .register-visual p {
          max-width:315px;
          margin:0;
          color:rgba(255,255,255,.8);
          font-size:13px;
          line-height:1.6;
        }
        .register-note {
          display:inline-flex;
          margin-top:20px;
          padding:8px 12px;
          border:1px solid rgba(255,255,255,.24);
          border-radius:99px;
          background:rgba(255,255,255,.1);
          font-size:10px;
          font-weight:700;
        }
        @media (max-width:760px) {
          .register-page { padding:14px !important; align-items:flex-start !important; }
          .register-shell { display:block; max-width:440px; border-radius:22px; }
          .register-shell > div { display:block; }
          .register-form-card { padding:28px 22px 24px !important; border:0 !important; }
          .register-visual { min-height:180px; background-position:center; }
          .register-visual-content { inset:22px 22px auto; }
          .register-visual h1 { font-size:24px; margin:7px 0; }
          .register-visual p { font-size:11px; max-width:290px; }
          .register-note { display:none; }
        }
      `}</style>

      <div style={S.blob1} />
      <div style={S.blob2} />

      <div className="register-shell">
        <section className="register-visual">
          <img className="auth-visual-image" src="/honey-register.svg" alt="Honey and handcrafted goods from Pakistan" />
          <div className="register-visual-content">
            <span className="register-visual-kicker">JOIN THE INDUSCART COMMUNITY</span>
            <h1>Create your<br /><em>everyday story.</em></h1>
            <p>Save your favorite finds, checkout faster, and discover makers worth supporting.</p>
            <span className="register-note">✦ Your new collection starts here</span>
          </div>
        </section>
        <div className="register-form-card" style={S.card}>

        {/* ── Header ── */}
        <div style={S.header}>
          <BrandMark size={48} style={{ filter:'drop-shadow(0 6px 10px rgba(13,92,66,.2))' }} />
          <div>
            <h1 style={S.brand}><span style={{ color:'#10b981' }}>Indus</span>Cart 🇵🇰</h1>
            <p style={S.brandSub}>Create your free account</p>
            </div>
          </div>
        {/* ── Step indicator ── */}
        <div style={S.stepRow}>
          {[1, 2].map(n => (
            <div key={n} style={S.stepItem}>
              <div style={{
                ...S.stepDot,
                background: step >= n ? '#10b981' : '#e2e8f0',
                color:      step >= n ? '#fff'    : '#94a3b8',
              }}>{n}</div>
              <span style={{ ...S.stepLabel, color: step >= n ? '#10b981' : '#94a3b8' }}>
                {n === 1 ? 'Account Info' : 'Location & Password'}
              </span>
            </div>
          ))}
          <div style={S.stepLine}>
            <div style={{ ...S.stepLineFill, width: step === 2 ? '100%' : '0%' }} />
          </div>
        </div>

        {/* ── Error box ── */}
        {error && (
          <div style={S.errBox}>
            <span>⚠️</span> {error}
          </div>
        )}

        {/* ════════════════ STEP 1 ════════════════ */}
        {step === 1 && (
          <form onSubmit={goNext} noValidate style={{ animation:'fadeIn 0.3s ease' }}>
            <div style={S.fg}>
              <label htmlFor="register-name" style={S.lbl}>Full Name *</label>
              <input
                className="inp" style={S.inp}
                id="register-name"
                placeholder="e.g. Muhammad Ali"
                value={form.name} onChange={set('name')} required
              />
            </div>

            <div style={S.fg}>
              <label htmlFor="register-email" style={S.lbl}>Email Address *</label>
              <input
                className="inp" style={S.inp}
                id="register-email"
                type="email" placeholder="you@example.com"
                value={form.email} onChange={set('email')} required
              />
            </div>

            <div style={{ ...S.fg, marginBottom:'24px' }}>
              <label htmlFor="register-phone" style={S.lbl}>
                Phone Number
                <span style={S.optTag}>(optional)</span>
              </label>
              <input
                className="inp" style={S.inp}
                id="register-phone"
                type="tel"
                placeholder="+92 300 1234567"
                value={form.phone} onChange={set('phone')} autoComplete="tel"
              />
            </div>

            <button className="reg-btn" style={S.btn} type="submit">
              Continue → &nbsp;Step 2
            </button>
          </form>
        )}

        {/* ════════════════ STEP 2 ════════════════ */}
        {step === 2 && (
          <form onSubmit={submit} noValidate style={{ animation:'fadeIn 0.3s ease' }}>

            {/* Country + City */}
            <div style={S.twoCol}>
              <div style={S.fg}>
                <label htmlFor="register-country" style={S.lbl}>Country *</label>
                <select id="register-country" className="inp" style={S.inp} value={form.country} onChange={set('country')} required>
                  {COUNTRIES.map(c => <option key={c} value={c}>{c}</option>)}
                </select>
              </div>
              <div style={S.fg}>
                <label htmlFor="register-city" style={S.lbl}>
                  City
                  <span style={S.optTag}>(optional)</span>
                </label>
                <input
                  className="inp" style={S.inp}
                  id="register-city"
                  placeholder={isPak ? 'e.g. Karachi' : 'e.g. London'}
                  value={form.city} onChange={set('city')} autoComplete="off"
                />
              </div>
            </div>

            {/* Currency badge */}
            <div style={{
              ...S.infoBadge,
              background: isPak ? '#f0fdf4' : '#eff6ff',
              border: `1px solid ${isPak ? '#bbf7d0' : '#bfdbfe'}`,
              color:  isPak ? '#166534' : '#1d4ed8',
            }}>
              {isPak
                ? '🇵🇰 Prices will be shown in Pakistani Rupees (PKR) for you.'
                : '🌍 Prices will be shown in US Dollars (USD) for international customers.'}
            </div>

            {/* Password */}
            <div style={S.fg}>
              <label htmlFor="register-password" style={S.lbl}>Password *</label>
              <input
                className="inp" style={S.inp}
                id="register-password"
                type="password" minLength={8} placeholder="At least 8 characters"
                value={form.password} onChange={set('password')} required
              />
            </div>

            {/* Confirm */}
            <div style={{ ...S.fg, marginBottom:'22px' }}>
              <label htmlFor="register-confirm-password" style={S.lbl}>Confirm Password *</label>
              <input
                className="inp" style={S.inp}
                id="register-confirm-password"
                type="password" placeholder="Re-enter your password"
                value={form.confirm} onChange={set('confirm')} required
              />
            </div>

            {/* Buttons */}
            <div style={{ display:'flex', gap:'10px' }}>
              <button
                type="button"
                className="back-btn"
                style={S.backBtn}
                onClick={() => { setStep(1); setError(''); }}
              >
                ← Back
              </button>
              <button
                className="reg-btn"
                style={{ ...S.btn, flex:1, opacity: loading ? 0.75 : 1 }}
                type="submit"
                disabled={loading}
              >
                {loading
                  ? <span style={{ display:'flex', alignItems:'center', gap:'8px', justifyContent:'center' }}>
                      <span style={S.spinner} /> Creating account…
                    </span>
                  : 'Create Account →'}
              </button>
            </div>
          </form>
        )}

        <p style={S.footer}>
          Already have an account?{' '}
          <Link to="/login" style={S.link}>Sign in →</Link>
        </p>
      </div>
      </div>
    </div>
  );
}

/* ── Styles ── */
const S = {
  page: {
    minHeight:'100vh',
    background:'linear-gradient(145deg,#f7f4eb 0%,#f1f8f3 52%,#eef5f1 100%)',
    display:'flex', alignItems:'center', justifyContent:'center',
    padding:'24px', fontFamily:"'DM Sans','Segoe UI',sans-serif",
    position:'relative', overflow:'hidden',
  },
  blob1: {
    position:'fixed', width:'500px', height:'500px', borderRadius:'50%',
    background:'radial-gradient(circle,rgba(16,185,129,0.07),transparent 70%)',
    top:'-150px', right:'-80px', pointerEvents:'none',
  },
  blob2: {
    position:'fixed', width:'400px', height:'400px', borderRadius:'50%',
    background:'radial-gradient(circle,rgba(99,102,241,0.06),transparent 70%)',
    bottom:'-120px', left:'-80px', pointerEvents:'none',
  },
  card: {
    background:'#fff', borderRadius:0, padding:'40px 36px',
    width:'100%', maxWidth:'480px',
    boxShadow:'none',
    border:'1px solid rgba(16,185,129,0.10)',
    position:'relative', zIndex:1,
    animation:'fadeIn 0.4s ease',
  },
  header:  { display:'flex', alignItems:'center', gap:'14px', marginBottom:'24px' },
  brand:    { margin:0, fontSize:'22px', fontWeight:'900', color:'#0f172a', letterSpacing:'-0.5px' },
  brandSub: { margin:'2px 0 0', fontSize:'13px', color:'#64748b' },

  /* Step indicator */
  stepRow: {
    display:'flex', alignItems:'center', gap:'8px',
    marginBottom:'28px', position:'relative',
  },
  stepItem:  { display:'flex', alignItems:'center', gap:'6px', zIndex:1 },
  stepDot: {
    width:'26px', height:'26px', borderRadius:'50%',
    display:'flex', alignItems:'center', justifyContent:'center',
    fontSize:'12px', fontWeight:'800', transition:'all 0.3s',
  },
  stepLabel: { fontSize:'11px', fontWeight:'700', whiteSpace:'nowrap', transition:'color 0.3s' },
  stepLine: {
    flex:1, height:'3px', background:'#e2e8f0',
    borderRadius:'4px', position:'relative', overflow:'hidden',
  },
  stepLineFill: {
    position:'absolute', top:0, left:0, height:'100%',
    background:'#10b981', borderRadius:'4px', transition:'width 0.4s ease',
  },

  errBox: {
    background:'#fef2f2', border:'1px solid #fecaca', color:'#dc2626',
    padding:'11px 14px', borderRadius:'12px', fontSize:'13px', fontWeight:'600',
    marginBottom:'20px', display:'flex', alignItems:'center', gap:'8px',
  },

  fg:     { marginBottom:'16px' },
  twoCol: { display:'grid', gridTemplateColumns:'1fr 1fr', gap:'12px' },
  lbl:    {
    display:'block', fontSize:'10px', fontWeight:'800', color:'#40594a',
    marginBottom:'8px', letterSpacing:'0.7px', textTransform:'uppercase',
  },
  optTag: { color:'#94a3b8', fontWeight:'500', marginLeft:'6px', fontSize:'11px' },
  inp: {
    width:'100%', minHeight:'50px', padding:'13px 15px', border:'1px solid #d8e5dc',
    borderRadius:'13px', fontSize:'14px', boxSizing:'border-box',
    color:'#18372a', background:'linear-gradient(180deg,#ffffff 0%,#f9fcfa 100%)',
    boxShadow:'0 1px 2px rgba(10,61,47,.035)',
    fontFamily:"'DM Sans','Segoe UI',sans-serif", fontWeight:'500',
  },
  infoBadge: {
    borderRadius:'12px', padding:'11px 14px',
    marginBottom:'14px', fontSize:'13px', fontWeight:'600',
  },
  btn: {
    width:'100%', padding:'14px',
    background:'linear-gradient(135deg,#10b981,#059669)',
    color:'#fff', border:'none', borderRadius:'13px',
    fontSize:'15px', fontWeight:'700', cursor:'pointer',
    fontFamily:"'DM Sans',sans-serif",
    boxShadow:'0 6px 20px rgba(16,185,129,0.3)',
  },
  backBtn: {
    padding:'14px 20px', background:'#f8fafc',
    color:'#475569', border:'1.5px solid #e2e8f0',
    borderRadius:'13px', fontSize:'15px', fontWeight:'700',
    cursor:'pointer', fontFamily:"'DM Sans',sans-serif",
    whiteSpace:'nowrap',
  },
  spinner: {
    width:'14px', height:'14px',
    border:'2px solid rgba(255,255,255,0.4)',
    borderTop:'2px solid #fff', borderRadius:'50%',
    display:'inline-block', animation:'spin 0.7s linear infinite',
  },
  footer: { textAlign:'center', marginTop:'22px', fontSize:'13px', color:'#64748b' },
  link:   { color:'#10b981', fontWeight:'700', textDecoration:'none' },
};
