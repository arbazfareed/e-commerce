import { useEffect, useState } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useCart } from '../context/CartContext';
import BrandMark from './BrandMark';

const THEME_KEY = 'ic_theme_preference';
const ADMIN_THEME_KEY = 'ic_admin_theme';

function readThemePreference() {
  try {
    const saved = localStorage.getItem(THEME_KEY) || localStorage.getItem(ADMIN_THEME_KEY);
    return saved === 'dark' ? 'dark' : 'light';
  } catch {
    return 'light';
  }
}

export default function Navbar() {
  const { user, logout } = useAuth();
  const { totalItems }   = useCart();
  const { pathname }     = useLocation();
  const navigate         = useNavigate();
  const [open, setOpen]  = useState(false);
  const [theme, setTheme] = useState(readThemePreference);

  const on = (p) => pathname === p;
  const adminOn = pathname.startsWith('/admin');

  const doLogout = () => { logout(); navigate('/login'); setOpen(false); };
  const isDark = theme === 'dark';
  const toggleTheme = () => setTheme(current => {
    const nextTheme = current === 'dark' ? 'light' : 'dark';
    window.dispatchEvent(new CustomEvent('ic-theme-change', { detail: { theme: nextTheme } }));
    return nextTheme;
  });

  useEffect(() => {
    document.documentElement.dataset.theme = theme;
    try { localStorage.setItem(THEME_KEY, theme); } catch { /* Theme still works for this session. */ }
  }, [theme]);

  useEffect(() => {
    const syncTheme = event => {
      if (event.detail?.theme === 'light' || event.detail?.theme === 'dark') setTheme(event.detail.theme);
    };
    window.addEventListener('ic-theme-change', syncTheme);
    return () => window.removeEventListener('ic-theme-change', syncTheme);
  }, []);

  // Admins get a different nav — only Admin panel + Support
  // Regular users get Shop, Cart, Orders, Support
  const isAdmin = user?.isAdmin;

  return (
    <>
      <nav className="site-nav" style={S.bar}>
        {/* Brand */}
        <Link to={isAdmin ? '/admin' : '/'} style={S.brand} onClick={() => setOpen(false)}>
          <BrandMark size={34} style={{ filter:'drop-shadow(0 7px 12px rgba(13,92,66,.22))' }} />
          <span className="brandText" style={S.brandText}>
            <span style={{ color:'#b58a4a' }}>IndusCart</span> Ritual <span style={{ opacity: 0.9 }}>🇵🇰</span>
          </span>
        </Link>

        {/* Desktop nav */}
        <div className="site-nav-links" style={S.links}>
          {isAdmin ? (
            /* ── Admin nav ── */
            <>
              <Link to="/admin" className={`site-nav-link${adminOn ? ' is-active' : ''}`} style={{ ...S.lnk, color:'#6366f1', ...(adminOn ? { background:'#eef2ff' } : {}) }}>⚙️ Admin Panel</Link>
              <Link to="/support" className={`site-nav-link${on('/support') ? ' is-active' : ''}`} style={{ ...S.lnk, ...(on('/support') ? S.lnkOn : {}) }}>🎧 Support</Link>
            </>
          ) : (
            /* ── User nav ── */
            <>
              <Link to="/" className={`site-nav-link${on('/') ? ' is-active' : ''}`} style={{ ...S.lnk, ...(on('/') ? S.lnkOn : {}) }}>🏪 Shop</Link>
              {user && <>
                <Link to="/cart" className={`site-nav-link${on('/cart') ? ' is-active' : ''}`} style={{ ...S.lnk, ...(on('/cart') ? S.lnkOn : {}), position: 'relative' }}>
                  🛒 Cart
                  {totalItems > 0 && <span style={S.bdg}>{totalItems}</span>}
                </Link>
                <Link to="/orders" className={`site-nav-link${on('/orders') ? ' is-active' : ''}`} style={{ ...S.lnk, ...(on('/orders') ? S.lnkOn : {}) }}>📦 Orders</Link>
                <Link to="/wishlist" className={`site-nav-link${on('/wishlist') ? ' is-active' : ''}`} style={{ ...S.lnk, ...(on('/wishlist') ? S.lnkOn : {}) }}>♥ Wishlist</Link>
              </>}
              <Link to="/support" className={`site-nav-link${on('/support') ? ' is-active' : ''}`} style={{ ...S.lnk, ...(on('/support') ? S.lnkOn : {}) }}>🎧 Support</Link>
            </>
          )}
        </div>

        <button
          className="desktop-theme-toggle"
          style={S.themeToggle}
          type="button"
          aria-pressed={isDark}
          aria-label={`Switch to ${isDark ? 'light' : 'dark'} theme`}
          onClick={toggleTheme}
        >
          <span aria-hidden="true">{isDark ? '☀' : '◐'}</span>
          <span>{isDark ? 'Light' : 'Dark'} theme</span>
        </button>

        {/* Desktop auth */}
        <div className="site-nav-auth" style={S.auth}>
          {user ? (
            <div style={{ display:'flex', alignItems:'center', gap:'10px' }}>
              <div style={S.avatar}>{user.name[0].toUpperCase()}</div>
              <span style={{ fontSize:'13px', fontWeight:'600', color:'#334155' }}>
                {user.name.split(' ')[0]}
                {isAdmin && <span className="nav-admin-badge" style={{ marginLeft:6, fontSize:10, fontWeight:800, color:'#6366f1', background:'#eef2ff', padding:'2px 7px', borderRadius:6 }}>ADMIN</span>}
              </span>
              <button className="nav-logout-button" style={S.outBtn} onClick={doLogout}>Logout</button>
            </div>
          ) : (
            <div style={{ display:'flex', gap:'8px' }}>
              <Link to="/login"    style={S.loginBtn}>Login</Link>
              <Link to="/register" style={S.regBtn}>Register →</Link>
            </div>
          )}
        </div>

        {/* Burger */}
        <button
          className="site-nav-burger"
          style={S.burger}
          type="button"
          aria-label={open ? 'Close navigation menu' : 'Open navigation menu'}
          aria-expanded={open}
          onClick={() => setOpen(o => !o)}
        >{open ? '✕' : '☰'}</button>
      </nav>

      {/* Mobile menu */}
      {open && (
        <div className="mobile-menu-layer">
          <button className="mobile-menu-backdrop" aria-label="Close menu" onClick={() => setOpen(false)} />
          <div className="mobile-drawer" style={S.mob}>
          <div className="mobile-drawer-brand">
            <BrandMark size={38} className="mobile-drawer-mark" />
            <div className="mobile-drawer-brand-copy">
              <strong>IndusCart Ritual</strong>
              <span>{isAdmin ? 'Admin workspace' : 'Skincare & home'}</span>
            </div>
            <button className="drawer-close" type="button" aria-label="Close navigation menu" onClick={() => setOpen(false)}>×</button>
          </div>
          <div className="mobile-menu-label">NAVIGATION</div>
          {isAdmin ? (
            /* ── Admin mobile nav ── */
            <>
              <Link to="/admin" className={`mobile-nav-link${on('/admin') ? ' is-active' : ''}`} aria-current={on('/admin') ? 'page' : undefined} onClick={() => setOpen(false)}>
                <span className="mobile-nav-icon" aria-hidden="true">⚙</span><span className="mobile-nav-text">Admin panel</span><span className="mobile-nav-arrow" aria-hidden="true">›</span>
              </Link>
              <Link to="/support" className={`mobile-nav-link${on('/support') ? ' is-active' : ''}`} aria-current={on('/support') ? 'page' : undefined} onClick={() => setOpen(false)}>
                <span className="mobile-nav-icon" aria-hidden="true">◌</span><span className="mobile-nav-text">Support</span><span className="mobile-nav-arrow" aria-hidden="true">›</span>
              </Link>
            </>
          ) : (
            /* ── User mobile nav ── */
            <>
              <Link to="/" className={`mobile-nav-link${on('/') ? ' is-active' : ''}`} aria-current={on('/') ? 'page' : undefined} onClick={() => setOpen(false)}>
                <span className="mobile-nav-icon" aria-hidden="true">⌂</span><span className="mobile-nav-text">Shop</span><span className="mobile-nav-arrow" aria-hidden="true">›</span>
              </Link>
              {user && <>
                <Link to="/cart" className={`mobile-nav-link${on('/cart') ? ' is-active' : ''}`} aria-current={on('/cart') ? 'page' : undefined} onClick={() => setOpen(false)}>
                  <span className="mobile-nav-icon" aria-hidden="true">▱</span><span className="mobile-nav-text">Cart{totalItems ? ` (${totalItems})` : ''}</span><span className="mobile-nav-arrow" aria-hidden="true">›</span>
                </Link>
                <Link to="/orders" className={`mobile-nav-link${on('/orders') ? ' is-active' : ''}`} aria-current={on('/orders') ? 'page' : undefined} onClick={() => setOpen(false)}>
                  <span className="mobile-nav-icon" aria-hidden="true">▤</span><span className="mobile-nav-text">Orders</span><span className="mobile-nav-arrow" aria-hidden="true">›</span>
                </Link>
                <Link to="/wishlist" className={`mobile-nav-link${on('/wishlist') ? ' is-active' : ''}`} aria-current={on('/wishlist') ? 'page' : undefined} onClick={() => setOpen(false)}>
                  <span className="mobile-nav-icon" aria-hidden="true">♥</span><span className="mobile-nav-text">Wishlist</span><span className="mobile-nav-arrow" aria-hidden="true">›</span>
                </Link>
              </>}
              <Link to="/support" className={`mobile-nav-link${on('/support') ? ' is-active' : ''}`} aria-current={on('/support') ? 'page' : undefined} onClick={() => setOpen(false)}>
                <span className="mobile-nav-icon" aria-hidden="true">◌</span><span className="mobile-nav-text">Support</span><span className="mobile-nav-arrow" aria-hidden="true">›</span>
              </Link>
            </>
          )}
          <div className="mobile-menu-divider">
            {user ? (
              <div className="mobile-account-card">
                <div className="mobile-account-avatar">{user.name?.[0]?.toUpperCase() || 'U'}</div>
                <div className="mobile-account-copy"><strong>{user.name?.split(' ')[0] || 'Account'}</strong><span>{isAdmin ? 'Administrator' : 'Signed in'}</span></div>
                <button className="mobile-logout" type="button" onClick={doLogout}>Log out</button>
              </div>
            ) : (
              <div className="mobile-guest-card">
                <strong>Welcome to IndusCart Ritual</strong>
                <span>Sign in or create an account to shop our ritual collection.</span>
                <div className="mobile-guest-actions">
                  <Link to="/login" className="mobile-login" onClick={() => setOpen(false)}>Sign in</Link>
                  <Link to="/register" className="mobile-register" onClick={() => setOpen(false)}>Join now <span aria-hidden="true">→</span></Link>
                </div>
              </div>
            )}
          </div>
          <button
            className="mobile-theme-toggle"
            type="button"
            aria-pressed={isDark}
            aria-label={`Switch to ${isDark ? 'light' : 'dark'} theme`}
            onClick={toggleTheme}
          >
            <span className="mobile-theme-icon" aria-hidden="true">{isDark ? '☀' : '◐'}</span>
            <span className="mobile-theme-copy">{isDark ? 'Light appearance' : 'Dark appearance'}<small>Applies across the whole store</small></span>
            <span className={`mobile-theme-switch${isDark ? ' is-dark' : ''}`} aria-hidden="true"><i /></span>
          </button>
          </div>
        </div>
      )}
      <style>{`
        @media (max-width: 760px) {
          .site-nav {
            height: 64px !important;
            padding: 0 16px !important;
            background: rgba(255,255,255,.97) !important;
            box-shadow: 0 5px 22px rgba(15,23,42,.08) !important;
          }
          .site-nav .brandText { font-size:16px !important; }
          .site-nav .mark { width:34px !important; height:34px !important; }

          .site-nav > a {
            min-width: 0;
            max-width: calc(100% - 76px);
            margin-left: auto;
          }
          .site-nav > a .brandText {
            overflow: hidden;
            text-overflow: ellipsis;
            white-space: nowrap;
          }

          .site-nav-links,
          .site-nav-auth,
          .desktop-theme-toggle {
            display: none !important;
          }

          .site-nav-burger {
            display: block !important;
            position: absolute !important;
            left: 16px !important;
            right: auto !important;
            transform: none !important;
            margin: 0 !important;
            width: 42px !important;
            height: 42px !important;
            border: 1.5px solid rgba(13,92,66,.2) !important;
            border-radius: 14px !important;
            background: linear-gradient(145deg, #f7fff9, #e8f9ee) !important;
            color: #0b5d43 !important;
            font-size: 22px !important;
            line-height: 1 !important;
            font-weight: 800 !important;
            box-shadow: 0 6px 16px rgba(13,92,66,.10) !important;
          }

          .mobile-menu-layer {
            position:fixed;
            inset:64px 0 0;
            z-index:199;
            animation: backdropIn .18s ease-out;
          }
          .mobile-menu-backdrop {
            position:absolute;
            inset:0;
            width:100%;
            border:0;
            background:rgba(7,28,20,.18);
            backdrop-filter:blur(2px);
          }
          .mobile-drawer {
            position:absolute !important;
            left: 10px !important;
            right: auto !important;
            width: min(78vw, 300px) !important;
            height: auto !important;
            max-height: calc(100dvh - 88px) !important;
            top: 12px !important;
            border: 1px solid rgba(255,255,255,.78) !important;
            border-radius: 24px !important;
            padding: 20px 16px max(20px, env(safe-area-inset-bottom)) !important;
            background: linear-gradient(165deg, #ffffff 0%, #f6fbf7 56%, #edf7f0 100%) !important;
            box-shadow: 0 24px 64px rgba(4,35,24,.24), 0 2px 8px rgba(4,35,24,.08) !important;
            animation: drawerIn .24s cubic-bezier(.2,.8,.2,1);
            overflow-y: auto;
          }
          .mobile-menu-label {
            padding: 17px 12px 8px;
            color:#668174;
            font-size:9px;
            font-weight:800;
            letter-spacing:1.5px;
            text-transform: uppercase;
          }
          .mobile-drawer-brand {
            display:flex;
            align-items:center;
            gap:11px;
            padding:13px;
            border-radius:18px;
            color:#fff;
            background:linear-gradient(135deg,#0a3d2f,#12684c 68%,#1a7f5d);
            box-shadow:0 12px 24px rgba(10,61,47,.2);
          }
          .mobile-drawer-mark {
            filter:drop-shadow(0 5px 10px rgba(0,0,0,.18));
          }
          .mobile-drawer-brand-copy {
            display:flex;
            flex:1;
            min-width:0;
            flex-direction:column;
            gap:3px;
          }
          .mobile-drawer-brand-copy strong {
            color:#fff;
            font-size:14px;
            font-weight:800;
            letter-spacing:-.3px;
          }
          .mobile-drawer-brand-copy span {
            color:#c9f2db;
            font-size:10px;
            font-weight:600;
          }
          .mobile-drawer .drawer-close {
            display:flex !important;
            align-items:center;
            justify-content:center;
            flex:0 0 34px;
            width:34px !important;
            min-width:34px !important;
            height:34px !important;
            min-height:34px !important;
            padding:0 !important;
            border:1px solid rgba(255,255,255,.25) !important;
            border-radius:11px !important;
            background:rgba(255,255,255,.12) !important;
            color:#fff !important;
            font-size:21px;
            line-height:1;
            cursor:pointer;
          }
          .mobile-drawer a,
          .mobile-drawer button {
            display:flex !important;
            align-items:center;
            gap:12px;
            min-height:50px;
            border-radius:14px !important;
            padding: 0 14px !important;
          }
          .mobile-drawer .mobile-nav-link {
            gap:11px;
            margin-bottom:5px;
            border:1px solid transparent !important;
            color:#40564b;
            font-size:13px;
            font-weight:700;
            text-decoration:none;
            transition:background .16s ease, border-color .16s ease, color .16s ease, transform .16s ease;
          }
          .mobile-drawer .mobile-nav-link:hover {
            background:#f0f8f2;
            color:#0d5c42;
            transform:translateX(2px);
          }
          .mobile-drawer .mobile-nav-link.is-active {
            border-color:#d4eadb !important;
            background:linear-gradient(135deg,#eaf7ee,#dff2e5) !important;
            color:#0b6043 !important;
            box-shadow:0 6px 14px rgba(13,92,66,.07);
          }
          .mobile-nav-icon {
            display:flex;
            align-items:center;
            justify-content:center;
            flex:0 0 36px !important;
            width:36px;
            height:36px;
            border:1px solid #e1eee5;
            border-radius:12px;
            background:#f5faf6;
            color:#3b755a;
            font-size:18px;
            line-height:1;
          }
          .mobile-nav-link.is-active .mobile-nav-icon {
            border-color:#c5e2ce;
            background:#fff;
            color:#0d6a49;
          }
          .mobile-nav-text { flex:1; }
          .mobile-nav-arrow {
            flex:0 0 auto !important;
            color:#91a79a;
            font-size:22px;
            font-weight:400;
          }
          .mobile-nav-link.is-active .mobile-nav-arrow { color:#0d6a49; }
          .mobile-drawer .mobile-guest-card {
            display:flex;
            flex-direction:column;
            gap:5px;
            margin-top:3px;
            padding:14px;
            border:1px solid #e0ebe4;
            border-radius:16px;
            background:rgba(255,255,255,.78);
          }
          .mobile-guest-card > strong,
          .mobile-account-copy strong {
            color:#173a2d;
            font-size:12px;
            font-weight:800;
          }
          .mobile-guest-card > span,
          .mobile-account-copy span {
            color:#718278;
            font-size:10px;
            line-height:1.45;
          }
          .mobile-guest-actions {
            display:flex;
            gap:8px;
            margin-top:8px;
          }
          .mobile-drawer .mobile-guest-actions a {
            justify-content:center;
            flex:1;
            min-height:40px;
            padding:0 10px !important;
            border-radius:11px !important;
            font-size:11px;
            font-weight:800;
            text-decoration:none;
          }
          .mobile-drawer .mobile-guest-actions .mobile-login {
            border:1px solid #dce9e0 !important;
            background:#fff;
            color:#375b49;
          }
          .mobile-drawer .mobile-guest-actions .mobile-register {
            border:1px solid #0d5c42 !important;
            background:linear-gradient(135deg,#167b56,#0d5c42);
            color:#fff;
            box-shadow:0 6px 13px rgba(13,92,66,.16);
          }
          .mobile-drawer .mobile-guest-actions .mobile-register span { flex:0 0 auto; }
          .mobile-account-card {
            display:flex;
            align-items:center;
            gap:9px;
            padding:10px;
            border:1px solid #e0ebe4;
            border-radius:15px;
            background:rgba(255,255,255,.78);
          }
          .mobile-account-avatar {
            display:flex;
            align-items:center;
            justify-content:center;
            flex:0 0 34px;
            width:34px;
            height:34px;
            border-radius:50%;
            background:linear-gradient(135deg,#34b77b,#0d5c42);
            color:#fff;
            font-size:12px;
            font-weight:800;
          }
          .mobile-account-copy {
            display:flex;
            flex:1;
            min-width:0;
            flex-direction:column;
            gap:2px;
          }
          .mobile-drawer .mobile-logout {
            flex:0 0 auto;
            min-height:34px !important;
            padding:0 9px !important;
            border:1px solid #f0d8d6 !important;
            border-radius:9px !important;
            background:#fff8f7;
            color:#a6473d;
            font-size:10px;
            font-weight:800;
            cursor:pointer;
          }
          .mobile-menu-divider {
            border-top:1px solid #dcebe1;
            margin-top:12px;
            padding-top:12px;
          }
          .mobile-theme-toggle {
            display:flex !important;
            align-items:center;
            gap:10px !important;
            width:100%;
            min-height:56px !important;
            margin-top:12px;
            padding:9px 10px !important;
            border:1px solid #e0ebe4 !important;
            border-radius:15px !important;
            background:rgba(255,255,255,.72) !important;
            color:#385449;
            text-align:left;
            cursor:pointer;
          }
          .mobile-theme-icon {
            display:flex;
            flex:0 0 34px !important;
            align-items:center;
            justify-content:center;
            width:34px;
            height:34px;
            border:1px solid #dce9e0;
            border-radius:11px;
            background:#f5faf6;
            color:#0d5c42;
            font-size:18px;
          }
          .mobile-theme-copy {
            display:flex;
            flex:1;
            flex-direction:column;
            gap:2px;
            font-size:11px;
            font-weight:800;
          }
          .mobile-theme-copy small { color:#819187; font-size:9px; font-weight:500; }
          .mobile-theme-switch {
            display:flex;
            align-items:center;
            flex:0 0 36px !important;
            width:36px;
            height:21px;
            padding:2px;
            border-radius:99px;
            background:#d7e3da;
            transition:background .2s ease;
          }
          .mobile-theme-switch i {
            width:17px;
            height:17px;
            border-radius:50%;
            background:#fff;
            box-shadow:0 1px 4px rgba(0,0,0,.18);
            transition:transform .2s ease;
          }
          .mobile-theme-switch.is-dark { background:#16845d; }
          .mobile-theme-switch.is-dark i { transform:translateX(15px); }

          @keyframes drawerIn {
            from { opacity: 0; transform: translateX(-22px); }
            to { opacity: 1; transform: translateX(0); }
          }
          @keyframes backdropIn {
            from { opacity: 0; }
            to { opacity: 1; }
          }
        }
      `}</style>
    </>
  );
}

const S = {
  bar:      { position:'sticky', top:0, zIndex:200, height:'60px', background:'linear-gradient(180deg, rgba(7,19,16,0.96), rgba(8,27,22,0.96))', backdropFilter:'blur(16px)', borderBottom:'1px solid rgba(143,204,164,0.18)', boxShadow:'0 12px 28px rgba(2, 12, 9, 0.22)', display:'flex', alignItems:'center', justifyContent:'space-between', padding:'0 24px', fontFamily:"'DM Sans','Segoe UI',sans-serif" },
  brand:    { display:'flex', alignItems:'center', gap:'10px', textDecoration:'none', borderRadius:'12px' },
  brandText:{ fontSize:'18px', fontWeight:'800', color:'#173a2d' },
  links:    { display:'flex', alignItems:'center', gap:'4px' },
  lnk:      { padding:'8px 14px', borderRadius:'10px', textDecoration:'none', fontSize:'14px', fontWeight:'700', color:'#334155', transition:'all 0.15s ease' },
  lnkOn:    { background:'linear-gradient(135deg, #e7f7ef, #d9f1e7)', color:'#075c43', boxShadow:'inset 0 0 0 1px rgba(13,92,66,0.14)' },
  bdg:      { position:'absolute', top:'-2px', right:'-2px', background:'linear-gradient(135deg,#f5b04c,#e77a2d)', color:'#fff', borderRadius:'999px', fontSize:'10px', fontWeight:'800', minWidth:'16px', height:'16px', display:'flex', alignItems:'center', justifyContent:'center', padding:'0 3px', boxShadow:'0 8px 16px rgba(231,122,45,0.25)' },
  auth:     { display:'flex', alignItems:'center' },
  avatar:   { width:'30px', height:'30px', borderRadius:'50%', background:'linear-gradient(135deg,#19a76d,#0f4d39)', display:'flex', alignItems:'center', justifyContent:'center', fontSize:'12px', fontWeight:'800', color:'#fff', boxShadow:'0 10px 22px rgba(13,92,66,0.22)' },
  outBtn:   { background:'rgba(245,250,247,0.9)', border:'1px solid #dfece4', color:'#587163', borderRadius:'9px', padding:'5px 12px', fontSize:'12px', fontWeight:'600', cursor:'pointer' },
  loginBtn: { padding:'7px 16px', borderRadius:'10px', fontSize:'13px', fontWeight:'600', color:'#355145', textDecoration:'none', border:'1px solid #dfece4', background:'#fff' },
  regBtn:   { padding:'7px 16px', borderRadius:'10px', fontSize:'13px', fontWeight:'700', color:'#fff', textDecoration:'none', background:'linear-gradient(135deg,#19a76d,#0d5c42)', boxShadow:'0 12px 22px rgba(13,92,66,0.22)' },
  themeToggle: { display:'flex', alignItems:'center', gap:7, padding:'8px 11px', border:'1px solid #dfece4', borderRadius:10, background:'#f8fcf9', color:'#385449', fontSize:12, fontWeight:700, cursor:'pointer' },
  burger:   { display:'none', background:'none', border:'none', fontSize:'20px', cursor:'pointer', color:'#334155', padding:'4px' },
  mob:      { position:'fixed', top:'60px', left:0, right:0, background:'#fff', borderBottom:'1px solid #e2e8f0', padding:'12px 16px', zIndex:199, boxShadow:'0 8px 24px rgba(0,0,0,0.1)', display:'flex', flexDirection:'column', gap:'2px' },
};
