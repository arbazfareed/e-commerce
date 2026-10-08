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
  return (
    <nav className="site-nav" style={S.bar}>
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
      {(!adminPortal || isAdmin) && <div className="site-nav-links" style={S.links}>
        {isAdmin ? (
          /* ── Admin nav ── */
          <>
            <Link to="/admin" className={`site-nav-link${adminOn ? ' is-active' : ''}`} style={{ ...S.lnk, color:'#0d6a49', ...(adminOn ? { background:'#eaf5ee' } : {}) }}>⚙️ Admin Panel</Link>
            <Link to="/support" className={`site-nav-link${on('/support') ? ' is-active' : ''}`} style={{ ...S.lnk, ...(on('/support') ? S.lnkOn : {}) }}>🎧 Support</Link>
          </>
        ) : adminPortal ? null : (
          /* ── User nav ── */
          <>
            <Link to="/" className={`site-nav-link${on('/') ? ' is-active' : ''}`} style={{ ...S.lnk, ...(on('/') ? S.lnkOn : {}) }}>🏪 Shop</Link>
            <Link to="/cart" className={`site-nav-link${on('/cart') ? ' is-active' : ''}`} style={{ ...S.lnk, ...(on('/cart') ? S.lnkOn : {}), position: 'relative' }}>
              🛒 Cart
              {totalItems > 0 && <span style={S.bdg}>{totalItems}</span>}
            </Link>
            {user && <>
              <Link to="/orders" className={`site-nav-link${on('/orders') ? ' is-active' : ''}`} style={{ ...S.lnk, ...(on('/orders') ? S.lnkOn : {}) }}>📦 Orders</Link>
              <Link to="/wishlist" className={`site-nav-link${on('/wishlist') ? ' is-active' : ''}`} style={{ ...S.lnk, ...(on('/wishlist') ? S.lnkOn : {}) }}>♥ Wishlist</Link>
            </>}
            <Link to="/support" className={`site-nav-link${on('/support') ? ' is-active' : ''}`} style={{ ...S.lnk, ...(on('/support') ? S.lnkOn : {}) }}>🎧 Support</Link>
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
          <span aria-hidden="true" className="navbar-search-icon">⌕</span>
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
        {showAdminEntry && (
          <button
            type="button"
            className="navbar-admin-entry"
            aria-label="Store tools"
            title="Store tools"
            style={S.adminEntryBtn}
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
            <span aria-hidden="true" style={{ ...S.holdProgressRing, width: 34, height: 34, borderRadius: '50%', background: `conic-gradient(#b8f5d3 ${adminHoldProgress}%, rgba(255,255,255,0.14) 0deg)` }}>
              <svg viewBox="0 0 24 24" width="18" height="18" fill="none" aria-hidden="true" style={{ color:'#fff' }}>
                <path d="M12 3 19 6v5c0 4.6-2.9 8-7 10-4.1-2-7-5.4-7-10V6l7-3Z" stroke="currentColor" strokeWidth="1.8" strokeLinejoin="round" />
                <path d="m9 12 2 2 4-4" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
              </svg>
            </span>
          </button>
        )}
        {adminPortal && !user ? (
          <span className="navbar-portal-label">ADMIN PORTAL</span>
        ) : user ? (
          <div style={{ display:'flex', alignItems:'center', gap:'10px' }}>
            <div style={S.avatar}>{user.name[0].toUpperCase()}</div>
            <span style={{ fontSize:'13px', fontWeight:'600', color:'#334155' }}>
              {user.name.split(' ')[0]}
              {isAdmin && <span className="nav-admin-badge" style={{ marginLeft:6, fontSize:10, fontWeight:800, color:'#0d6a49', background:'#eaf5ee', padding:'2px 7px', borderRadius:6 }}>ADMIN</span>}
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
      {(!adminPortal || user) && <button
        className="site-nav-burger"
        style={S.burger}
        type="button"
        aria-label={open ? 'Close navigation menu' : 'Open navigation menu'}
        aria-expanded={open}
        onClick={() => setOpen(o => !o)}
      >{open ? '✕' : '☰'}</button>}
    </nav>
  );
}
