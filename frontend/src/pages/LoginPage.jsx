import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { API_BASE } from '../utils/axiosConfig';
import BrandMark from '../components/BrandMark';

export default function LoginPage() {
  const { login }  = useAuth();
  const navigate   = useNavigate();
  const [email,    setEmail]    = useState('');
  const [password, setPassword] = useState('');
  const [error,    setError]    = useState('');
  const [loading,  setLoading]  = useState(false);
  const [showPw,   setShowPw]   = useState(false);

  const submit = async (e) => {
    e.preventDefault();
    setError(''); setLoading(true);
    try {
      const u = await login(email.trim(), password);
      navigate(u.isAdmin ? '/admin' : '/');
    } catch (err) {
      setError(err.response?.data?.message || `Cannot connect to the server at ${API_BASE}.`);
    } finally { setLoading(false); }
  };

  return (
    <div className="responsive-page login-page" style={S.page}>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Sora:wght@400;500;600;700;800;900&display=swap');
        .inp-focus:focus { border-color:#16845d !important; background:#fff !important; box-shadow:0 0 0 4px rgba(22,132,93,0.12), 0 3px 10px rgba(13,92,66,0.06) !important; }
        .inp-focus:hover:not(:focus) { border-color:#b8d1c1 !important; background:#fff !important; }
        .inp-focus { transition:border-color .18s ease, box-shadow .18s ease, background .18s ease; }
        .btn-hover:hover { opacity:0.92; transform:translateY(-1px); }
        .btn-hover { transition:all 0.15s; }
        :root[data-theme='dark'] .login-page .login-error-box { background:#3b1f20 !important; border-color:#8b3434 !important; color:#fecaca !important; }
        :root[data-theme='dark'] .login-page .login-error-message { color:#fecaca !important; }
        .login-shell {
          width:min(100%, 980px);
          display:grid;
          grid-template-columns: minmax(0, .9fr) minmax(380px, .72fr);
          min-height:570px;
          border-radius:30px;
          overflow:hidden;
          background:#fff;
          box-shadow:0 24px 80px rgba(15,23,42,.16);
          position:relative;
          z-index:1;
        }
        .login-shell > div {
          display:flex;
          flex-direction:column;
          justify-content:center;
        }
        .login-visual {
          min-height:570px;
          position:relative;
          background:#064e3b;
          overflow:hidden;
        }
        .auth-visual-image {
          position:absolute;
          inset:0;
          width:100%;
          height:100%;
          object-fit:cover;
          object-position:center;
        }
        .login-visual::after {
          content:'';
          position:absolute;
          inset:0;
          background:linear-gradient(135deg,rgba(2,44,34,.08),rgba(2,44,34,.72));
          pointer-events:none;
        }
        .login-visual-overlay {
          position:absolute;
          inset:auto 34px 36px;
          color:#fff;
          z-index:1;
        }
        .login-kicker {
          color:#a7f3d0;
          font-size:10px;
          font-weight:800;
          letter-spacing:1.8px;
        }
        .login-visual h1 {
          margin:12px 0 12px;
          font-family:'Sora',sans-serif;
          font-size:34px;
          line-height:1.12;
          letter-spacing:-1.2px;
        }
        .login-visual h1 em { color:#fcd34d; font-style:normal; }
        .login-visual p {
          max-width:340px;
          margin:0;
          color:rgba(255,255,255,.8);
          font-size:13px;
          line-height:1.6;
        }
        .login-perks {
          display:flex;
          flex-wrap:wrap;
          gap:8px;
          margin-top:20px;
        }
        .login-perks span {
          padding:7px 10px;
          border:1px solid rgba(255,255,255,.22);
          border-radius:99px;
          background:rgba(255,255,255,.1);
          font-size:10px;
          font-weight:700;
        }
        @media (max-width: 760px) {
          .login-page { padding:14px !important; align-items:flex-start !important; }
          .login-shell {
            display:block;
            min-height:0;
            max-width:440px;
            border-radius:22px;
            margin:10px auto 20px;
          }
          .login-shell > div { display:block; }
          .login-form-card { padding:30px 22px 26px !important; border:0 !important; }
          .login-visual {
            display:block;
            min-height:190px;
            background-position:center 42%;
          }
          .login-visual-overlay { inset:24px 22px auto; }
          .login-visual h1 { font-size:24px; margin:8px 0; }
          .login-visual p { font-size:11px; max-width:290px; }
          .login-perks { display:none; }
        }
      `}</style>

      {/* Decorative background */}
      <div style={S.bgCircle1} />
      <div style={S.bgCircle2} />

      <div className="login-shell">
        <section className="login-visual">
          <img className="auth-visual-image" src="/signin-welcome.svg" alt="Pakistani artisan basket and pottery" />
          <div className="login-visual-overlay">
            <span className="login-kicker">WELCOME TO INDUSCART</span>
            <h1>Thoughtful finds.<br /><em>Made in Pakistan.</em></h1>
            <p>Discover beautiful products from trusted local makers and sellers, delivered with care.</p>
            <div className="login-perks">
              <span>✦ Curated collection</span>
              <span>✦ Trusted local sellers</span>
              <span>✦ Easy, secure ordering</span>
            </div>
          </div>
        </section>
        <div className="login-form-card" style={S.card}>
        {/* Logo */}
        <div style={S.logoRow}>
          <BrandMark size={46} style={{ filter:'drop-shadow(0 6px 10px rgba(13,92,66,.2))' }} />
          <div>
            <p style={S.brand}><span style={{ color:'#10b981' }}>Indus</span>Cart 🇵🇰</p>
            <p style={S.brandSub}>Sign in to your account</p>
          </div>
        </div>

        {error && (
          <div className="login-error-box" style={S.errBox}>
            <span style={{ fontSize:'15px' }}>⚠️</span>
            <span className="login-error-message">{error}</span>
          </div>
        )}

        <form onSubmit={submit}>
          <div style={S.fg}>
            <label htmlFor="login-identifier" style={S.lbl}>Email or Username</label>
            <input
              className="inp-focus"
              id="login-identifier"
              style={S.inp}
              type="text"
              placeholder="you@example.com or username"
              value={email}
              onChange={e => setEmail(e.target.value)}
              required
              autoComplete="username"
              autoFocus
            />
          </div>

          <div style={S.fg}>
            <label htmlFor="login-password" style={S.lbl}>Password</label>
            <div style={{ position:'relative' }}>
              <input
                className="inp-focus"
                id="login-password"
                style={S.inp}
                type={showPw ? 'text' : 'password'}
                placeholder="Your password"
                value={password}
                onChange={e => setPassword(e.target.value)}
                required
              />
              <button
                type="button"
                style={S.eyeBtn}
                onClick={() => setShowPw(v => !v)}
                tabIndex={-1}
              >
                {showPw ? '🙈' : '👁️'}
              </button>
            </div>
          </div>

          <button
            className="btn-hover"
            style={{ ...S.btn, opacity: loading ? 0.75 : 1 }}
            type="submit"
            disabled={loading}
          >
            {loading
              ? <span style={{ display:'flex', alignItems:'center', gap:'8px', justifyContent:'center' }}>
                  <span style={S.spinner} /> Signing in…
                </span>
              : 'Sign In →'}
          </button>
        </form>

        {/* ✅ FIX: No admin credential hints shown to users */}
        <div style={S.divider}>
          <span style={S.divLine} />
          <span style={S.divTxt}>or</span>
          <span style={S.divLine} />
        </div>

        <p style={S.footer}>
          Don't have an account?{' '}
          <Link to="/register" style={S.link}>Create one free →</Link>
        </p>
      </div>
      </div>
    </div>
  );
}

const S = {
  page: {
    minHeight:'100vh',
    background:'linear-gradient(145deg,#f7f4eb 0%,#f1f8f3 52%,#eef5f1 100%)',
    display:'flex', alignItems:'center', justifyContent:'center',
    padding:'24px',
    fontFamily:"'Sora','Segoe UI',sans-serif",
    position:'relative', overflow:'hidden',
  },
  bgCircle1: {
    position:'fixed', width:'600px', height:'600px', borderRadius:'50%',
    background:'radial-gradient(circle,rgba(16,185,129,0.08),transparent 70%)',
    top:'-200px', right:'-100px', pointerEvents:'none',
  },
  bgCircle2: {
    position:'fixed', width:'500px', height:'500px', borderRadius:'50%',
    background:'radial-gradient(circle,rgba(99,102,241,0.06),transparent 70%)',
    bottom:'-150px', left:'-100px', pointerEvents:'none',
  },
  card: {
    background:'#fff',
    borderRadius:0,
    padding:'44px 38px',
    width:'100%', maxWidth:'420px',
    boxShadow:'none',
    border:'1px solid rgba(16,185,129,0.12)',
    position:'relative', zIndex:1,
  },
  logoRow: { display:'flex', alignItems:'center', gap:'14px', marginBottom:'34px' },
  brand:    { margin:0, fontSize:'22px', fontWeight:'900', color:'#0f172a', letterSpacing:'-0.5px' },
  brandSub: { margin:'2px 0 0', fontSize:'13px', color:'#64748b', fontWeight:'500' },

  errBox: {
    background:'#fef2f2', border:'1px solid #fecaca', color:'#dc2626',
    padding:'12px 16px', borderRadius:'12px', fontSize:'13px', fontWeight:'600',
    marginBottom:'22px', display:'flex', alignItems:'center', gap:'10px',
  },

  fg:   { marginBottom:'18px' },
  lbl:  { display:'block', fontSize:'10px', fontWeight:'800', color:'#40594a', marginBottom:'8px', letterSpacing:'0.7px', textTransform:'uppercase' },
  inp:  {
    width:'100%', minHeight:'50px', padding:'13px 15px',
    border:'1px solid #d8e5dc', borderRadius:'13px',
    fontSize:'14px', boxSizing:'border-box', outline:'none',
    color:'#18372a', background:'linear-gradient(180deg,#ffffff 0%,#f9fcfa 100%)',
    boxShadow:'0 1px 2px rgba(10,61,47,.035)',
    fontFamily:"'Sora',sans-serif", fontWeight:'500',
    transition:'all 0.15s',
  },
  eyeBtn: {
    position:'absolute', right:'13px', top:'50%', transform:'translateY(-50%)',
    background:'none', border:'none', cursor:'pointer', fontSize:'16px', padding:'4px',
    lineHeight:1,
  },
  btn: {
    width:'100%', padding:'15px',
    background:'linear-gradient(135deg,#10b981,#059669)',
    color:'#fff', border:'none', borderRadius:'13px',
    fontSize:'15px', fontWeight:'700', cursor:'pointer',
    marginTop:'6px', letterSpacing:'0.2px',
    fontFamily:"'Sora',sans-serif",
    boxShadow:'0 6px 20px rgba(16,185,129,0.35)',
  },
  spinner: {
    width:'14px', height:'14px', border:'2px solid rgba(255,255,255,0.4)',
    borderTop:'2px solid #fff', borderRadius:'50%',
    display:'inline-block', animation:'spin 0.7s linear infinite',
  },

  divider: { display:'flex', alignItems:'center', gap:'12px', margin:'26px 0 22px' },
  divLine: { flex:1, height:'1px', background:'#e2e8f0' },
  divTxt:  { fontSize:'12px', color:'#94a3b8', fontWeight:'600' },

  footer: { textAlign:'center', fontSize:'13px', color:'#64748b', margin:0 },
  link:   { color:'#10b981', fontWeight:'700', textDecoration:'none' },
};
