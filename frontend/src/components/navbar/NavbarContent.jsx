import { useEffect, useRef, useState } from 'react';
import API from '../../utils/axiosConfig';
import './premiumHeader.css';

// Simple line icons (inherit currentColor) used across the header.
const Icon = ({ name, size = 19 }) => {
  const paths = {
    shop: <><path d="M4 9h16l-1.2 10.2a2 2 0 0 1-2 1.8H7.2a2 2 0 0 1-2-1.8L4 9Z" /><path d="M8.5 9V7a3.5 3.5 0 0 1 7 0v2" /></>,
    cart: <><circle cx="9" cy="20" r="1.4" /><circle cx="17.5" cy="20" r="1.4" /><path d="M2.5 3.5h2.6l2.3 11.2a1.6 1.6 0 0 0 1.6 1.3h8.4a1.6 1.6 0 0 0 1.6-1.2L21 7H6" /></>,
    support: <><path d="M4 13v-1a8 8 0 0 1 16 0v1" /><rect x="3" y="13" width="4" height="6" rx="1.6" /><rect x="17" y="13" width="4" height="6" rx="1.6" /><path d="M19 19c0 1.5-1.8 2.5-5 2.5" /></>,
    orders: <><path d="M3.5 7.5 12 3l8.5 4.5v9L12 21l-8.5-4.5v-9Z" /><path d="m3.5 7.5 8.5 4.5 8.5-4.5M12 12v9" /></>,
    heart: <path d="M12 20s-7.5-4.4-7.5-10A4.3 4.3 0 0 1 12 7.3 4.3 4.3 0 0 1 19.5 10C19.5 15.6 12 20 12 20Z" />,
    user: <><circle cx="12" cy="8" r="3.6" /><path d="M4.5 20a7.5 7.5 0 0 1 15 0" /></>,
    logout: <><path d="M15 4h3a2 2 0 0 1 2 2v12a2 2 0 0 1-2 2h-3" /><path d="M10 16l-4-4 4-4M6 12h10" /></>,
    sun: <><circle cx="12" cy="12" r="4" /><path d="M12 2.5v2M12 19.5v2M4.6 4.6l1.4 1.4M18 18l1.4 1.4M2.5 12h2M19.5 12h2M4.6 19.4 6 18M18 6l1.4-1.4" /></>,
    moon: <path d="M20 14.5A8 8 0 0 1 9.5 4a8 8 0 1 0 10.5 10.5Z" />,
    search: <><circle cx="11" cy="11" r="6.5" /><path d="m20 20-4.2-4.2" /></>,
    admin: <><path d="M12 3 19 6v5c0 4.6-2.9 8-7 10-4.1-2-7-5.4-7-10V6l7-3Z" /><path d="m9 12 2 2 4-4" /></>,
    chevron: <path d="m6 9 6 6 6-6" />,
    truck: <><path d="M2.5 6h11v9h-11zM13.5 9h4l3 3v3h-7" /><circle cx="6.5" cy="17.5" r="1.6" /><circle cx="17" cy="17.5" r="1.6" /></>,
  };
  return <svg className="ph-icon" viewBox="0 0 24 24" width={size} height={size} fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">{paths[name]}</svg>;
};

export default function NavbarContent({
  BrandMark,
  Link,
  S,
  adminHoldProgress,
  adminOn,
  adminPortal,
  resolveAssetUrl,
  beginAdminHold,
  clearAdminHold,
  doLogout,
  isAdmin,
  isDark,
  navigate,
  on,
  open,
  searchLoading,
  searchOpen,
  searchQuery,
  searchRef,
  searchResults,
  setOpen,
  setSearchOpen,
  setSearchQuery,
  shopperPortalUrl,
  showAdminEntry,
  toggleTheme,
  totalItems,
  user
}) {
  const [menuOpen, setMenuOpen] = useState(false);
  const [promo, setPromo] = useState([]);
  const menuRef = useRef(null);

  // Close the account menu on outside click or Escape.
  useEffect(() => {
    if (!menuOpen) return undefined;
    const onPointer = event => { if (menuRef.current && !menuRef.current.contains(event.target)) setMenuOpen(false); };
    const onKey = event => { if (event.key === 'Escape') setMenuOpen(false); };
    document.addEventListener('pointerdown', onPointer);
    document.addEventListener('keydown', onKey);
    return () => { document.removeEventListener('pointerdown', onPointer); document.removeEventListener('keydown', onKey); };
  }, [menuOpen]);

  // Promo strip from the store's real settings (free delivery threshold, COD).
  useEffect(() => {
    if (isAdmin || adminPortal) return undefined;
    let active = true;
    Promise.resolve(API.get('/api/settings/public')).then(response => {
      const settings = response?.data;
      if (!active || !settings || Array.isArray(settings) || typeof settings !== 'object') return;
      const lines = [];
      const threshold = Number(settings.freeShippingThreshold) || 0;
      if (threshold > 0) lines.push(`Free delivery across Pakistan on orders over Rs ${threshold.toLocaleString('en-PK')}`);
      if (settings.codEnabled) lines.push('Cash on delivery available');
      if (settings.internationalEnabled) lines.push('We ship worldwide');
      setPromo(lines);
    }).catch(() => {});
    return () => { active = false; };
  }, [isAdmin, adminPortal]);

  const firstName = user?.name ? user.name.split(' ')[0] : '';

  return (
    <>
    {promo.length > 0 && <div className="ph-promo" role="note"><Icon name="truck" size={15} /><span>{promo.join('  ·  ')}</span></div>}
    <nav className="site-nav premium-header" style={S.bar}>
      {/* Brand */}
      <div className="navbar-brand-group" style={S.brandGroup}>
        <Link to={isAdmin ? '/admin' : adminPortal ? '/admin/login' : '/'} style={S.brand} onClick={() => setOpen(false)}>
          <BrandMark size={34} style={{ filter:'drop-shadow(0 7px 12px rgba(13,92,66,.22))' }} />
          <span className="brandText" style={S.brandText}>
            <span style={{ color:'#b58a4a' }}>IndusCart</span>
            <span className="brandSuffix">{adminPortal ? 'Valley Admin' : <>Valley <span style={{ opacity: 0.9 }}>🇵🇰</span></>}</span>
          </span>
        </Link>
        {adminPortal && <a className="navbar-portal-entry" href={shopperPortalUrl} aria-label="Shopper storefront" title="Shopper storefront" style={S.portalEntryBtn}>
          <svg viewBox="0 0 24 24" width="19" height="19" fill="none" aria-hidden="true">
            <path d="M5 8h14l1 12H4L5 8Z" stroke="currentColor" strokeWidth="1.8" strokeLinejoin="round" />
            <path d="M9 9V6a3 3 0 0 1 6 0v3" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" />
            <path d="M8 13h8" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" />
          </svg>
        </a>}
      </div>
    
      {/* Desktop nav */}
      {(!adminPortal || isAdmin) && <div className="site-nav-links">
        {isAdmin ? (
          /* ── Admin nav ── */
          <>
            <Link to="/admin" className={`site-nav-link${adminOn ? ' is-active' : ''}`}><Icon name="admin" size={17} />{user?.isSubAdmin && !user?.isAdmin ? 'My store' : 'Admin panel'}</Link>
            <Link to="/support" className={`site-nav-link${on('/support') ? ' is-active' : ''}`}><Icon name="support" size={17} />Support</Link>
          </>
        ) : adminPortal ? null : (
          /* ── User nav ── */
          <>
            <Link to="/" className={`site-nav-link${on('/') ? ' is-active' : ''}`}><Icon name="shop" size={17} />Shop</Link>
            {user && <Link to="/orders" className={`site-nav-link${on('/orders') ? ' is-active' : ''}`}><Icon name="orders" size={17} />Orders</Link>}
            <Link to="/support" className={`site-nav-link${on('/support') ? ' is-active' : ''}`}><Icon name="support" size={17} />Support</Link>
          </>
        )}
      </div>}
    
      {!isAdmin && !adminPortal && <div className="navbar-live-search" ref={searchRef}>
        <form className="navbar-search-form" role="search" onSubmit={event => {
          event.preventDefault();
          if (searchQuery.trim()) {
            navigate(`/?search=${encodeURIComponent(searchQuery.trim())}`);
            setSearchOpen(false);
          }
        }}>
          <span aria-hidden="true" className="navbar-search-icon"><Icon name="search" size={16} /></span>
          <input
            className="navbar-search-input"
            type="search"
            aria-label="Search products"
            aria-controls="navbar-search-results"
            aria-expanded={searchOpen && searchQuery.trim().length >= 2}
            placeholder="Search products"
            value={searchQuery}
            onFocus={() => setSearchOpen(true)}
            onChange={event => { setSearchQuery(event.target.value); setSearchOpen(true); }}
            onKeyDown={event => { if (event.key === 'Escape') setSearchOpen(false); }}
          />
          {searchQuery && <button className="navbar-search-clear" type="button" aria-label="Clear search" onClick={() => { setSearchQuery(''); setSearchOpen(false); }}>×</button>}
        </form>
        {searchOpen && searchQuery.trim().length >= 2 && <div className="navbar-search-popover" id="navbar-search-results" aria-label="Search results">
          {searchLoading ? <p className="navbar-search-state" role="status">Searching…</p>
            : searchResults.length ? searchResults.slice(0, 6).map(product => <Link key={product._id} className="navbar-search-result" to={`/products/${product._id}`} onClick={() => { setSearchOpen(false); setSearchQuery(''); }}>
              <span className="navbar-search-thumb">{product.images?.[0] ? <img src={resolveAssetUrl(product.images[0])} alt="" /> : product.name?.[0] || 'I'}</span>
              <span className="navbar-search-result-copy"><strong>{product.name}</strong><small>{[product.category, product.subcategory].filter(Boolean).join(' · ') || 'View product'}</small></span>
              <span className="navbar-search-arrow" aria-hidden="true">↗</span>
            </Link>)
            : <p className="navbar-search-state" role="status">No matching products found.</p>}
          {searchResults.length > 0 && <Link className="navbar-search-all" to={`/?search=${encodeURIComponent(searchQuery.trim())}`} onClick={() => setSearchOpen(false)}>See all search results <span aria-hidden="true">→</span></Link>}
        </div>}
      </div>}
    
      <div className="ph-actions">
      <button
        className="desktop-theme-toggle ph-icon-btn"
        type="button"
        aria-pressed={isDark}
        aria-label={`Switch to ${isDark ? 'light' : 'dark'} theme`}
        title={`${isDark ? 'Light' : 'Dark'} theme`}
        onClick={toggleTheme}
      >
        <Icon name={isDark ? 'sun' : 'moon'} />
      </button>
      {!isAdmin && !adminPortal && <>
        {user && <Link to="/wishlist" className={`ph-icon-btn ph-desktop-only${on('/wishlist') ? ' is-active' : ''}`} aria-label="Wishlist" title="Wishlist"><Icon name="heart" /></Link>}
        <Link to="/cart" className={`ph-icon-btn ph-desktop-only${on('/cart') ? ' is-active' : ''}`} aria-label={`Cart, ${totalItems} ${totalItems === 1 ? 'item' : 'items'}`} title="Cart">
          <Icon name="cart" />
          {totalItems > 0 && <span className="ph-badge">{totalItems > 99 ? '99+' : totalItems}</span>}
        </Link>
      </>}
      </div>
    
      {/* Desktop auth */}
      <div className="site-nav-auth">
        {showAdminEntry && (
          <button
            type="button"
            className="navbar-admin-entry ph-admin-entry"
            aria-label="Store tools - Admin"
            title="Store tools"
            onPointerDown={beginAdminHold}
            onPointerUp={() => clearAdminHold()}
            onPointerLeave={() => clearAdminHold()}
            onPointerCancel={() => clearAdminHold()}
            onKeyDown={event => {
              if (!event.repeat && (event.key === 'Enter' || event.key === ' ')) {
                event.preventDefault();
                beginAdminHold();
              }
            }}
            onKeyUp={event => {
              if (event.key === 'Enter' || event.key === ' ') {
                event.preventDefault();
                clearAdminHold();
              }
            }}
            onBlur={() => clearAdminHold()}
          >
            <span aria-hidden="true" style={{ ...S.holdProgressRing, width: 22, height: 22, borderRadius: '50%', background: `conic-gradient(#b8f5d3 ${adminHoldProgress}%, rgba(255,255,255,0.18) 0deg)`, '--hold': `${adminHoldProgress}%`, display: 'inline-flex', alignItems: 'center', justifyContent: 'center' }}>
              <svg viewBox="0 0 24 24" width="13" height="13" fill="none" aria-hidden="true" style={{ color:'#fff' }}>
                <path d="M12 3 19 6v5c0 4.6-2.9 8-7 10-4.1-2-7-5.4-7-10V6l7-3Z" stroke="currentColor" strokeWidth="2" strokeLinejoin="round" />
                <path d="m9 12 2 2 4-4" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
              </svg>
            </span>
            <span className="ph-admin-label">Admin</span>
          </button>
        )}
        {adminPortal && !user ? (
          <span className="navbar-portal-label">ADMIN PORTAL</span>
        ) : user ? (
          <div className="ph-account" ref={menuRef}>
            <button type="button" className="ph-account-btn" aria-haspopup="menu" aria-expanded={menuOpen} onClick={() => setMenuOpen(o => !o)}>
              <span className="ph-avatar" aria-hidden="true">{user.name[0].toUpperCase()}</span>
              <span className="ph-account-name">{firstName}{isAdmin && <span className="nav-admin-badge ph-admin-badge">{user?.isSubAdmin && !user?.isAdmin ? 'STORE' : 'ADMIN'}</span>}</span>
              <Icon name="chevron" size={15} />
            </button>
            {menuOpen && <div className="ph-menu" role="menu" aria-label="Account menu">
              <p className="ph-menu-head"><strong>{user.name}</strong><small>{user.email}</small></p>
              {!isAdmin && <>
                <Link role="menuitem" to="/account" onClick={() => setMenuOpen(false)}><Icon name="user" size={17} />My account</Link>
                <Link role="menuitem" to="/orders" onClick={() => setMenuOpen(false)}><Icon name="orders" size={17} />My orders</Link>
                <Link role="menuitem" to="/wishlist" onClick={() => setMenuOpen(false)}><Icon name="heart" size={17} />Wishlist</Link>
              </>}
              {isAdmin && <Link role="menuitem" to="/admin" onClick={() => setMenuOpen(false)}><Icon name="admin" size={17} />{user?.isSubAdmin && !user?.isAdmin ? 'My store' : 'Admin panel'}</Link>}
              <button type="button" role="menuitem" className="nav-logout-button ph-menu-logout" onClick={() => { setMenuOpen(false); doLogout(); }}><Icon name="logout" size={17} />Logout</button>
            </div>}
          </div>
        ) : (
          <div className="ph-guest">
            <Link to="/login" className="ph-login">Login</Link>
            <Link to="/register" className="ph-register">Register</Link>
          </div>
        )}
      </div>
    
      {/* Burger */}
      {(!adminPortal || user) && <button
        className="site-nav-burger"
        style={S.burger}
        type="button"
        aria-label={open ? 'Close navigation menu' : 'Open navigation menu'}
        aria-expanded={open}
        onClick={() => setOpen(o => !o)}
      >{open ? '✕' : '☰'}</button>}

      {/* Mobile Cart Quick Access */}
      {!adminPortal && (
        <Link
          to="/cart"
          className="mobile-header-cart"
          aria-label={`Shopping cart with ${totalItems} ${totalItems === 1 ? 'item' : 'items'}`}
          onClick={() => setOpen(false)}
        >
          <span aria-hidden="true" style={{ fontSize: '18px', lineHeight: 1 }}>🛒</span>
          {totalItems > 0 && <span className="mobile-header-cart-badge">{totalItems}</span>}
        </Link>
      )}
    </nav>
    </>
  );
}
