import { useState } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useCart } from '../context/CartContext';

export default function Navbar() {
  const { user, logout } = useAuth();
  const { totalItems }   = useCart();
  const { pathname }     = useLocation();
  const navigate         = useNavigate();
  const [open, setOpen]  = useState(false);

  const on = (p) => pathname === p;

  const doLogout = () => { logout(); navigate('/login'); setOpen(false); };

  // Admins get a different nav — only Admin panel + Support
  // Regular users get Shop, Cart, Orders, Support
  const isAdmin = user?.isAdmin;

  return (
    <>
      <nav style={S.bar}>
        {/* Brand */}
        <Link to={isAdmin ? '/admin' : '/'} style={S.brand} onClick={() => setOpen(false)}>
          <div style={S.mark}>IC</div>
          <span style={S.brandText}>
            <span style={{ color:'#10b981' }}>Indus</span>Cart 🇵🇰
          </span>
        </Link>

        {/* Desktop nav */}
        <div style={S.links}>
          {isAdmin ? (
            /* ── Admin nav ── */
            <>
              <Link to="/admin"   style={{ ...S.lnk, color:'#6366f1', ...(on('/admin')   ? { background:'#eef2ff' } : {}) }}>⚙️ Admin Panel</Link>
              <Link to="/support" style={{ ...S.lnk, ...(on('/support') ? S.lnkOn : {}) }}>🎧 Support</Link>
            </>
          ) : (
            /* ── User nav ── */
            <>
              <Link to="/" style={{ ...S.lnk, ...(on('/') ? S.lnkOn : {}) }}>🏪 Shop</Link>
              {user && <>
                <Link to="/cart"   style={{ ...S.lnk, ...(on('/cart')   ? S.lnkOn : {}), position: 'relative' }}>
                  🛒 Cart
                  {totalItems > 0 && <span style={S.bdg}>{totalItems}</span>}
                </Link>
                <Link to="/orders" style={{ ...S.lnk, ...(on('/orders') ? S.lnkOn : {}) }}>📦 Orders</Link>
              </>}
              <Link to="/support" style={{ ...S.lnk, ...(on('/support') ? S.lnkOn : {}) }}>🎧 Support</Link>
            </>
          )}
        </div>

        {/* Desktop auth */}
        <div style={S.auth}>
          {user ? (
            <div style={{ display:'flex', alignItems:'center', gap:'10px' }}>
              <div style={S.avatar}>{user.name[0].toUpperCase()}</div>
              <span style={{ fontSize:'13px', fontWeight:'600', color:'#334155' }}>
                {user.name.split(' ')[0]}
                {isAdmin && <span style={{ marginLeft:6, fontSize:10, fontWeight:800, color:'#6366f1', background:'#eef2ff', padding:'2px 7px', borderRadius:6 }}>ADMIN</span>}
              </span>
              <button style={S.outBtn} onClick={doLogout}>Logout</button>
            </div>
          ) : (
            <div style={{ display:'flex', gap:'8px' }}>
              <Link to="/login"    style={S.loginBtn}>Login</Link>
              <Link to="/register" style={S.regBtn}>Register →</Link>
            </div>
          )}
        </div>

        {/* Burger */}
        <button style={S.burger} onClick={() => setOpen(o => !o)}>{open ? '✕' : '☰'}</button>
      </nav>

      {/* Mobile menu */}
      {open && (
        <div style={S.mob}>
          {isAdmin ? (
            /* ── Admin mobile nav ── */
            <>
              <Link to="/admin"   style={S.mLnk} onClick={() => setOpen(false)}>⚙️ Admin Panel</Link>
              <Link to="/support" style={S.mLnk} onClick={() => setOpen(false)}>🎧 Support</Link>
            </>
          ) : (
            /* ── User mobile nav ── */
            <>
              <Link to="/"       style={S.mLnk} onClick={() => setOpen(false)}>🏪 Shop</Link>
              {user && <>
                <Link to="/cart"   style={S.mLnk} onClick={() => setOpen(false)}>🛒 Cart{totalItems ? ` (${totalItems})` : ''}</Link>
                <Link to="/orders" style={S.mLnk} onClick={() => setOpen(false)}>📦 Orders</Link>
              </>}
              <Link to="/support" style={S.mLnk} onClick={() => setOpen(false)}>🎧 Support</Link>
            </>
          )}
          <div style={{ borderTop:'1px solid #f1f5f9', marginTop:'6px', paddingTop:'6px' }}>
            {user
              ? <button style={{ ...S.mLnk, background:'none', border:'none', color:'#ef4444', cursor:'pointer', width:'100%', textAlign:'left' }} onClick={doLogout}>⏻ Logout</button>
              : <>
                  <Link to="/login"    style={S.mLnk} onClick={() => setOpen(false)}>Login</Link>
                  <Link to="/register" style={S.mLnk} onClick={() => setOpen(false)}>Register</Link>
                </>
            }
          </div>
        </div>
      )}
    </>
  );
}

const S = {
  bar:      { position:'sticky', top:0, zIndex:200, height:'60px', background:'#fff', borderBottom:'1px solid #e2e8f0', boxShadow:'0 1px 8px rgba(0,0,0,0.06)', display:'flex', alignItems:'center', justifyContent:'space-between', padding:'0 24px', fontFamily:"'DM Sans','Segoe UI',sans-serif" },
  brand:    { display:'flex', alignItems:'center', gap:'10px', textDecoration:'none' },
  mark:     { width:'32px', height:'32px', borderRadius:'8px', background:'linear-gradient(135deg,#10b981,#059669)', display:'flex', alignItems:'center', justifyContent:'center', fontSize:'12px', fontWeight:'900', color:'#fff' },
  brandText:{ fontSize:'18px', fontWeight:'800', color:'#0f172a' },
  links:    { display:'flex', alignItems:'center', gap:'2px' },
  lnk:      { padding:'6px 14px', borderRadius:'8px', textDecoration:'none', fontSize:'14px', fontWeight:'600', color:'#475569', transition:'all 0.15s' },
  lnkOn:    { background:'#f0fdf4', color:'#059669' },
  bdg:      { position:'absolute', top:'-2px', right:'-2px', background:'#ef4444', color:'#fff', borderRadius:'999px', fontSize:'10px', fontWeight:'800', minWidth:'16px', height:'16px', display:'flex', alignItems:'center', justifyContent:'center', padding:'0 3px' },
  auth:     { display:'flex', alignItems:'center' },
  avatar:   { width:'30px', height:'30px', borderRadius:'50%', background:'linear-gradient(135deg,#10b981,#6366f1)', display:'flex', alignItems:'center', justifyContent:'center', fontSize:'12px', fontWeight:'800', color:'#fff' },
  outBtn:   { background:'none', border:'1px solid #e2e8f0', color:'#64748b', borderRadius:'7px', padding:'5px 12px', fontSize:'12px', fontWeight:'600', cursor:'pointer' },
  loginBtn: { padding:'7px 16px', borderRadius:'8px', fontSize:'13px', fontWeight:'600', color:'#475569', textDecoration:'none', border:'1px solid #e2e8f0' },
  regBtn:   { padding:'7px 16px', borderRadius:'8px', fontSize:'13px', fontWeight:'700', color:'#fff', textDecoration:'none', background:'linear-gradient(135deg,#10b981,#059669)' },
  burger:   { display:'none', background:'none', border:'none', fontSize:'20px', cursor:'pointer', color:'#334155', padding:'4px' },
  mob:      { position:'fixed', top:'60px', left:0, right:0, background:'#fff', borderBottom:'1px solid #e2e8f0', padding:'12px 16px', zIndex:199, boxShadow:'0 8px 24px rgba(0,0,0,0.1)', display:'flex', flexDirection:'column', gap:'2px' },
  mLnk:    { display:'block', padding:'10px 12px', borderRadius:'8px', textDecoration:'none', fontSize:'14px', fontWeight:'600', color:'#334155' },
};
