import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

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
      setError(err.response?.data?.message || 'Invalid email or password.');
    } finally { setLoading(false); }
  };

  return (
    <div style={S.page}>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Sora:wght@400;500;600;700;800;900&display=swap');
        .inp-focus:focus { border-color:#10b981 !important; background:#fff !important; box-shadow:0 0 0 3px rgba(16,185,129,0.12) !important; }
        .btn-hover:hover { opacity:0.92; transform:translateY(-1px); }
        .btn-hover { transition:all 0.15s; }
      `}</style>

      {/* Decorative background */}
      <div style={S.bgCircle1} />
      <div style={S.bgCircle2} />

      <div style={S.card}>
        {/* Logo */}
        <div style={S.logoRow}>
          <div style={S.mark}>
            <span style={{ fontSize:'14px', fontWeight:'900', color:'#fff', letterSpacing:'-0.5px' }}>IC</span>
          </div>
          <div>
            <p style={S.brand}><span style={{ color:'#10b981' }}>Indus</span>Cart 🇵🇰</p>
            <p style={S.brandSub}>Sign in to your account</p>
          </div>
        </div>

        {error && (
          <div style={S.errBox}>
            <span style={{ fontSize:'15px' }}>⚠️</span>
            <span>{error}</span>
          </div>
        )}

        <form onSubmit={submit}>
          <div style={S.fg}>
            <label style={S.lbl}>Email Address</label>
            <input
              className="inp-focus"
              style={S.inp}
              type="email"
              placeholder="you@example.com"
              value={email}
              onChange={e => setEmail(e.target.value)}
              required
              autoFocus
            />
          </div>

          <div style={S.fg}>
            <label style={S.lbl}>Password</label>
            <div style={{ position:'relative' }}>
              <input
                className="inp-focus"
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
  );
}

const S = {
  page: {
    minHeight:'100vh',
    background:'linear-gradient(145deg,#f0fdf4 0%,#ecfdf5 40%,#eff6ff 100%)',
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
    borderRadius:'24px',
    padding:'44px 38px',
    width:'100%', maxWidth:'420px',
    boxShadow:'0 8px 60px rgba(0,0,0,0.10)',
    border:'1px solid rgba(16,185,129,0.12)',
    position:'relative', zIndex:1,
  },
  logoRow: { display:'flex', alignItems:'center', gap:'14px', marginBottom:'34px' },
  mark: {
    width:'46px', height:'46px', borderRadius:'14px',
    background:'linear-gradient(135deg,#10b981,#059669)',
    display:'flex', alignItems:'center', justifyContent:'center',
    flexShrink:0, boxShadow:'0 6px 20px rgba(16,185,129,0.35)',
  },
  brand:    { margin:0, fontSize:'22px', fontWeight:'900', color:'#0f172a', letterSpacing:'-0.5px' },
  brandSub: { margin:'2px 0 0', fontSize:'13px', color:'#64748b', fontWeight:'500' },

  errBox: {
    background:'#fef2f2', border:'1px solid #fecaca', color:'#dc2626',
    padding:'12px 16px', borderRadius:'12px', fontSize:'13px', fontWeight:'600',
    marginBottom:'22px', display:'flex', alignItems:'center', gap:'10px',
  },

  fg:   { marginBottom:'18px' },
  lbl:  { display:'block', fontSize:'11px', fontWeight:'800', color:'#475569', marginBottom:'7px', letterSpacing:'0.5px', textTransform:'uppercase' },
  inp:  {
    width:'100%', padding:'13px 15px',
    border:'1.5px solid #e2e8f0', borderRadius:'12px',
    fontSize:'14px', boxSizing:'border-box', outline:'none',
    color:'#1e293b', background:'#f8fafc',
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
