import { useEffect, useRef, useState } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useCart } from '../context/CartContext';
import BrandMark from './BrandMark';
import API, { assetUrl } from '../utils/axiosConfig';
import NavbarContent from './navbar/NavbarContent';
import NavbarStyles from './navbar/NavbarStyles';

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

export default function Navbar({ adminPortal = false }) {
  const { user, logout } = useAuth();
  const { totalItems }   = useCart();
  const { pathname }     = useLocation();
  const navigate         = useNavigate();
  const [open, setOpen]  = useState(false);
  const [theme, setTheme] = useState(readThemePreference);
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState([]);
  const [searchOpen, setSearchOpen] = useState(false);
  const [searchLoading, setSearchLoading] = useState(false);
  const [adminAccessOpen, setAdminAccessOpen] = useState(false);
  const [adminAccessCode, setAdminAccessCode] = useState('');
  const [adminAccessError, setAdminAccessError] = useState('');
  const [adminHoldActive, setAdminHoldActive] = useState(false);
  const [adminHoldProgress, setAdminHoldProgress] = useState(0);
  const [failedAttempts, setFailedAttempts] = useState(0);
  const searchRef = useRef(null);
  const adminHoldTimerRef = useRef(null);
  const adminHoldIntervalRef = useRef(null);
  const adminLockoutTimerRef = useRef(null);

  const on = (p) => pathname === p;
  const adminOn = pathname.startsWith('/admin');

  const doLogout = () => { const loginPath = user?.isAdmin ? '/admin/login' : '/login'; logout(); navigate(loginPath); setOpen(false); };
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

  useEffect(() => {
    const query = searchQuery.trim();
    if (query.length < 2) {
      setSearchResults([]);
      setSearchLoading(false);
      return undefined;
    }
    let active = true;
    const timer = setTimeout(() => {
      setSearchLoading(true);
      API.get('/api/products', { params:{ search:query, page:1, limit:6 } })
        .then(({ data }) => {
          if (active) setSearchResults(Array.isArray(data) ? data : data?.items || []);
        })
        .catch(() => { if (active) setSearchResults([]); })
        .finally(() => { if (active) setSearchLoading(false); });
    }, 220);
    return () => { active = false; clearTimeout(timer); };
  }, [searchQuery]);

  useEffect(() => {
    const closeOnOutsidePress = event => {
      if (!searchRef.current?.contains(event.target)) setSearchOpen(false);
    };
    document.addEventListener('pointerdown', closeOnOutsidePress);
    return () => document.removeEventListener('pointerdown', closeOnOutsidePress);
  }, []);

  // Admins get a different nav — only Admin panel + Support
  // Regular users get Shop, Cart, Orders, Support
  const isAdmin = user?.isAdmin;
  const adminPortalUrl = import.meta.env.VITE_ADMIN_PORTAL_URL
    || `${window.location.protocol}//${window.location.hostname}:3001/admin/login`;
  const shopperPortalUrl = import.meta.env.VITE_SHOPPER_PORTAL_URL
    || (import.meta.env.VITE_APP_MODE === 'admin' ? `${window.location.protocol}//${window.location.hostname}:3000/` : '/');
  const showAdminEntry = !adminPortal;

  const clearAdminHold = (resetProgress = true) => {
    if (adminHoldTimerRef.current) {
      clearTimeout(adminHoldTimerRef.current);
      adminHoldTimerRef.current = null;
    }
    if (adminHoldIntervalRef.current) {
      clearInterval(adminHoldIntervalRef.current);
      adminHoldIntervalRef.current = null;
    }
    if (resetProgress) {
      setAdminHoldActive(false);
      setAdminHoldProgress(0);
    }
  };

  const beginAdminHold = () => {
    if (adminHoldTimerRef.current) return;
    setAdminHoldActive(true);

    const startedAt = Date.now();
    const updateProgress = () => {
      const elapsed = Date.now() - startedAt;
      const nextProgress = Math.min((elapsed / 10000) * 100, 100);
      setAdminHoldProgress(nextProgress);

      if (nextProgress >= 100) {
        clearAdminHold();
        setAdminAccessError('');
        setAdminAccessCode('');
        setAdminAccessOpen(true);
      }
    };

    adminHoldIntervalRef.current = setInterval(updateProgress, 50);
    adminHoldTimerRef.current = setTimeout(() => {
      clearAdminHold();
      setAdminAccessError('');
      setAdminAccessCode('');
      setAdminAccessOpen(true);
    }, 10000);
  };

  const submitAdminAccess = event => {
    event.preventDefault();
    if (adminAccessCode.trim() === 'IndusCartValley') {
      setAdminAccessOpen(false);
      setFailedAttempts(0);
      setAdminAccessError('');
      setAdminAccessCode('');
      window.location.assign(adminPortalUrl);
      return;
    }

    const nextAttempts = failedAttempts + 1;
    setFailedAttempts(nextAttempts);

    if (nextAttempts >= 3) {
      setAdminAccessError('Invalid code. Access reset after 3 failed attempts.');
      setAdminAccessCode('');
      adminLockoutTimerRef.current = setTimeout(() => {
        setAdminAccessOpen(false);
        setAdminAccessError('');
        setFailedAttempts(0);
        adminLockoutTimerRef.current = null;
      }, 1300);
      return;
    }

    setAdminAccessError('Invalid code. Please try again.');
  };

  useEffect(() => () => {
    clearAdminHold(false);
    if (adminLockoutTimerRef.current) clearTimeout(adminLockoutTimerRef.current);
  }, []);

  return (
    <>
      <NavbarContent {...{ BrandMark, Link, S, adminHoldProgress, adminOn, adminPortal, resolveAssetUrl: path => assetUrl(path), beginAdminHold, clearAdminHold, doLogout, isAdmin, isDark, navigate, on, open, searchLoading, searchOpen, searchQuery, searchRef, searchResults, setOpen, setSearchOpen, setSearchQuery, shopperPortalUrl, showAdminEntry, toggleTheme, totalItems, user }} />

      {adminAccessOpen && (
        <div className="admin-access-overlay" style={S.accessOverlay} onClick={() => setAdminAccessOpen(false)}>
          <div className="admin-access-modal" style={S.accessModal} role="dialog" aria-modal="true" aria-labelledby="admin-access-title" onClick={event => event.stopPropagation()}>
            <div style={S.accessHeader}>
              <span aria-hidden="true" style={{ fontSize:'20px' }}>🛡</span>
              <strong id="admin-access-title" style={{ fontSize:'15px', fontWeight:800 }}>IndusCart Valley admin</strong>
            </div>
            <p style={S.accessLabel}>Enter admin access code</p>
            <form onSubmit={submitAdminAccess}>
              <label htmlFor="admin-access-code" style={S.accessInputLabel}>Admin access code</label>
              <input
                id="admin-access-code"
                type="password"
                value={adminAccessCode}
                onChange={event => setAdminAccessCode(event.target.value)}
                placeholder="••••••••••••"
                autoComplete="off"
                required
                style={S.accessInput}
                autoFocus
              />
              {adminAccessError && <div style={S.errorBox}>{adminAccessError}</div>}
              <div style={S.accessActions}>
                <button type="button" style={S.secondaryBtn} onClick={() => setAdminAccessOpen(false)}>Cancel</button>
                <button type="submit" style={S.primaryBtn}>Continue</button>
              </div>
            </form>
          </div>
        </div>
      )}

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
          ) : adminPortal ? null : (
            /* ── User mobile nav ── */
            <>
              <Link to="/" className={`mobile-nav-link${on('/') ? ' is-active' : ''}`} aria-current={on('/') ? 'page' : undefined} onClick={() => setOpen(false)}>
                <span className="mobile-nav-icon" aria-hidden="true">⌂</span><span className="mobile-nav-text">Shop</span><span className="mobile-nav-arrow" aria-hidden="true">›</span>
              </Link>
              <Link to="/cart" className={`mobile-nav-link${on('/cart') ? ' is-active' : ''}`} aria-current={on('/cart') ? 'page' : undefined} onClick={() => setOpen(false)}>
                <span className="mobile-nav-icon" aria-hidden="true">▱</span><span className="mobile-nav-text">Cart{totalItems ? ` (${totalItems})` : ''}</span><span className="mobile-nav-arrow" aria-hidden="true">›</span>
              </Link>
              {user && <>
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
          {showAdminEntry && <div className="mobile-admin-entry">
            <button type="button" className="mobile-admin-entry-link" aria-label="Store tools" onPointerDown={beginAdminHold} onPointerUp={() => clearAdminHold()} onPointerLeave={() => clearAdminHold()} onPointerCancel={() => clearAdminHold()} onClick={() => setOpen(false)}>
              <span className="mobile-admin-entry-icon" aria-hidden="true">
                <svg viewBox="0 0 24 24" width="17" height="17" fill="none" aria-hidden="true">
                  <path d="M12 3 19 6v5c0 4.6-2.9 8-7 10-4.1-2-7-5.4-7-10V6l7-3Z" stroke="currentColor" strokeWidth="1.8" strokeLinejoin="round" />
                  <path d="m9 12 2 2 4-4" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
                </svg>
              </span>
              <span>Store tools</span>
              <span className="mobile-nav-arrow" aria-hidden="true">›</span>
            </button>
          </div>}
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
      <NavbarStyles {...{  }} />
    </>
  );
}

const S = {
    holdProgressRing: { display:'inline-flex', alignItems:'center', justifyContent:'center', padding:'2px', border:'1px solid rgba(255,255,255,.12)', boxShadow:'inset 0 0 0 1px rgba(255,255,255,.05)' },
  bar:      { position:'sticky', top:0, zIndex:200, height:'60px', background:'linear-gradient(180deg, rgba(7,19,16,0.96), rgba(8,27,22,0.96))', backdropFilter:'blur(16px)', borderBottom:'1px solid rgba(143,204,164,0.18)', boxShadow:'0 12px 28px rgba(2, 12, 9, 0.22)', display:'flex', alignItems:'center', justifyContent:'space-between', padding:'0 24px', fontFamily:"'DM Sans','Segoe UI',sans-serif" },
  brandGroup:{ display:'flex', alignItems:'center', gap:'12px', minWidth:0 },
  brand:    { display:'flex', alignItems:'center', gap:'10px', textDecoration:'none', borderRadius:'12px' },
  brandText:{ fontSize:'18px', fontWeight:'800', color:'#173a2d' },
  links:    { display:'flex', alignItems:'center', gap:'4px' },
  lnk:      { padding:'8px 14px', borderRadius:'10px', textDecoration:'none', fontSize:'14px', fontWeight:'700', color:'#334155', transition:'all 0.15s ease' },
  lnkOn:    { background:'linear-gradient(135deg, #e7f7ef, #d9f1e7)', color:'#075c43', boxShadow:'inset 0 0 0 1px rgba(13,92,66,0.14)' },
  bdg:      { position:'absolute', top:'-2px', right:'-2px', background:'linear-gradient(135deg,#f5b04c,#e77a2d)', color:'#fff', borderRadius:'999px', fontSize:'10px', fontWeight:'800', minWidth:'16px', height:'16px', display:'flex', alignItems:'center', justifyContent:'center', padding:'0 3px', boxShadow:'0 8px 16px rgba(231,122,45,0.25)' },
  auth:     { display:'flex', alignItems:'center' },
  adminEntryBtn: { display:'inline-flex', alignItems:'center', justifyContent:'center', padding:0, minWidth:'46px', width:'46px', height:'44px', marginRight:'8px', border:'1px solid rgba(187,247,208,0.56)', borderRadius:'14px', background:'linear-gradient(145deg,#0b5d43,#0f766e)', color:'#f8fafc', boxShadow:'0 8px 18px rgba(11,93,67,0.28)', cursor:'pointer', touchAction:'none' },
  portalEntryBtn: { display:'grid', placeItems:'center', width:'42px', height:'42px', border:'1px solid rgba(187,247,208,.56)', borderRadius:'13px', background:'linear-gradient(145deg,#0b5d43,#0f766e)', color:'#f8fafc', boxShadow:'0 8px 18px rgba(11,93,67,.24)', textDecoration:'none' },
  avatar:   { width:'30px', height:'30px', borderRadius:'50%', background:'linear-gradient(135deg,#19a76d,#0f4d39)', display:'flex', alignItems:'center', justifyContent:'center', fontSize:'12px', fontWeight:'800', color:'#fff', boxShadow:'0 10px 22px rgba(13,92,66,0.22)' },
  outBtn:   { background:'rgba(245,250,247,0.9)', border:'1px solid #dfece4', color:'#587163', borderRadius:'9px', padding:'5px 12px', fontSize:'12px', fontWeight:'600', cursor:'pointer' },
  loginBtn: { padding:'7px 16px', borderRadius:'10px', fontSize:'13px', fontWeight:'600', color:'#355145', textDecoration:'none', border:'1px solid #dfece4', background:'#fff' },
  regBtn:   { padding:'7px 16px', borderRadius:'10px', fontSize:'13px', fontWeight:'700', color:'#fff', textDecoration:'none', background:'linear-gradient(135deg,#19a76d,#0d5c42)', boxShadow:'0 12px 22px rgba(13,92,66,0.22)' },
  themeToggle: { display:'flex', alignItems:'center', gap:7, padding:'8px 11px', border:'1px solid #dfece4', borderRadius:10, background:'#f8fcf9', color:'#385449', fontSize:12, fontWeight:700, cursor:'pointer' },
  burger:   { display:'none', background:'none', border:'none', fontSize:'20px', cursor:'pointer', color:'#334155', padding:'4px' },
  accessOverlay: { position:'fixed', inset:0, zIndex:300, display:'flex', alignItems:'center', justifyContent:'center', background:'rgba(3,12,9,0.62)', backdropFilter:'blur(6px)' },
  accessModal: { width:'min(92vw, 420px)', borderRadius:'22px', border:'1px solid rgba(160,219,188,0.24)', background:'linear-gradient(180deg, rgba(10,25,20,0.98), rgba(8,19,16,0.98))', boxShadow:'0 32px 80px rgba(0,0,0,0.35)', padding:'22px 20px 18px' },
  accessHeader: { display:'flex', alignItems:'center', gap:'10px', marginBottom:'8px', color:'#f4fff7' },
  accessLabel: { margin:'0 0 16px', color:'#d8efe2', fontSize:'14px', lineHeight:1.5 },
  accessInputLabel: { display:'block', marginBottom:'8px', color:'#dfeee4', fontSize:'11px', fontWeight:700, letterSpacing:'1.2px', textTransform:'uppercase' },
  accessInput: { width:'100%', borderRadius:'12px', border:'1px solid rgba(146, 206, 170, 0.2)', background:'rgba(15, 26, 22, 0.9)', color:'#f4fff7', padding:'12px 14px', fontSize:'15px', outline:'none', boxSizing:'border-box' },
  errorBox: { marginTop:'12px', padding:'10px 12px', borderRadius:'10px', background:'rgba(127, 29, 29, 0.35)', color:'#fca5a5', border:'1px solid rgba(252,165,165,0.35)', fontSize:'12px', fontWeight:600 },
  accessActions: { display:'flex', justifyContent:'flex-end', gap:'10px', marginTop:'18px' },
  secondaryBtn: { border:'1px solid rgba(146,206,170,0.28)', background:'rgba(255,255,255,0.04)', color:'#e4f7eb', borderRadius:'10px', padding:'10px 14px', fontWeight:700, cursor:'pointer' },
  primaryBtn: { border:'none', background:'linear-gradient(135deg,#1fc083,#0d6a4f)', color:'#f5fff9', borderRadius:'10px', padding:'10px 16px', fontWeight:800, cursor:'pointer', boxShadow:'0 12px 22px rgba(13,92,66,0.22)' },
  mob:      { position:'fixed', top:'60px', left:0, right:0, background:'#fff', borderBottom:'1px solid #e2e8f0', padding:'12px 16px', zIndex:199, boxShadow:'0 8px 24px rgba(0,0,0,0.1)', display:'flex', flexDirection:'column', gap:'2px' },
};
