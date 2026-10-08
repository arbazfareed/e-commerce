export default function HomeHero({
  BRAND_NAME,
  chooseMarket,
  internationalEnabled,
  isLocal,
  marketSettingsLoaded,
  search,
  setSearch,
  styles
}) {
  return (
    <section className="hero" style={styles.hero}>
      <div className="hero-image-slider" aria-hidden="true">
        <div className="hero-image-track">
          <div className="hero-image-slide"><img src="/hero-cover.jpg" alt="" loading="eager" /></div>
          <div className="hero-image-slide"><img src="/home-ritual-still-life.svg" alt="" /></div>
          <div className="hero-image-slide"><img src="/home-botanical-still-life.svg" alt="" /></div>
          <div className="hero-image-slide"><img src="/home-local-craft-still-life.svg" alt="" /></div>
          <div className="hero-image-slide"><img src="/honey-cover.jpg" alt="" /></div>
        </div>
      </div>
      <div style={styles.heroGlow} />
      <div className="hero-content" style={styles.heroContent}>
        <div className="hero-copy" style={styles.heroCopy}>
          <div style={styles.eyebrow}>🇵🇰 {BRAND_NAME} • Luxury skincare & home rituals</div>
          <h1 style={styles.title}>
            Rituals for
            <br />
            <span style={styles.titleAccent}>softer, richer living.</span>
          </h1>
          <p style={styles.subtitle}>
            Thoughtful finds for a slower, richer life—discover refined skincare, body rituals, and elevated home essentials crafted to calm the senses and enrich everyday routines.
          </p>
          <div className="hero-actions" style={styles.heroActions}>
            <button
              type="button"
              style={styles.exploreBtn}
              onClick={() => document.getElementById('shop-collection')?.scrollIntoView({ behavior: 'smooth' })}
            >
              Shop the collection <span aria-hidden="true">↓</span>
            </button>
            <span style={styles.deliveryNote}>Free shipping over PKR 10,000 • Trusted checkout</span>
          </div>
          <div className="hero-stats" style={styles.heroStats}>
            <span className="hero-stat" style={styles.heroStat}><strong>4.9/5</strong> customer rating</span>
            <span className="hero-stat" style={styles.heroStat}><strong>24h</strong> dispatch support</span>
            <span className="hero-stat" style={styles.heroStat}><strong>2k+</strong> happy shoppers</span>
          </div>
        </div>
    
        <div className="hero-shell" style={styles.heroShell}>
          <div style={styles.heroGlassCard}>
            <div style={styles.heroGlassHeader}>
              <span style={styles.heroGlyph}>✦</span>
              <strong style={styles.heroGlassTitle}>Ritual curation</strong>
            </div>
            <div style={styles.heroGlassGrid}>
              <div style={styles.heroGlassMetric}>
                <span style={styles.heroMetricLabel}>Top ritual</span>
                <strong style={styles.heroMetricValue}>Glow care</strong>
              </div>
              <div style={styles.heroGlassMetric}>
                <span style={styles.heroMetricLabel}>Repeat buyers</span>
                <strong style={styles.heroMetricValue}>63%</strong>
              </div>
              <div style={styles.heroGlassMetric}>
                <span style={styles.heroMetricLabel}>Avg. order</span>
                <strong style={styles.heroMetricValue}>Rs 8,400</strong>
              </div>
              <div style={styles.heroGlassMetric}>
                <span style={styles.heroMetricLabel}>Loyalty</span>
                <strong style={styles.heroMetricValue}>A+</strong>
              </div>
            </div>
          </div>
        </div>
      </div>
    
      <div className="hero-tools" style={styles.heroTools}>
        {/* Market Toggle */}
        <div className="market-toggle" style={styles.marketToggle}>
          <button
            type="button"
            aria-pressed={isLocal}
            onClick={() => chooseMarket('local')}
            style={{
              ...styles.marketBtn,
              gridColumn: internationalEnabled ? undefined : '1 / -1',
              ...(isLocal ? styles.marketBtnActive : styles.marketBtnInactive)
            }}
          >
            🇵🇰 Pakistan (PKR)
          </button>
          {marketSettingsLoaded && internationalEnabled && <button
            type="button"
            aria-pressed={!isLocal}
            onClick={() => chooseMarket('global')}
            style={{
              ...styles.marketBtn,
              ...(!isLocal ? styles.marketBtnActive : styles.marketBtnInactive)
            }}
          >
            🌍 International (USD)
          </button>}
        </div>
    
        {/* Search Bar */}
        <div className="search-wrapper" style={styles.searchWrapper}>
          <span style={styles.searchIcon} aria-hidden="true">⌕</span>
          <input
            id="product-search"
            name="productSearch"
            type="text"
            className="search-input"
            aria-label="Search products"
            style={styles.searchInput}
            placeholder="Search products, crafts, categories..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>
      </div>
    </section>
  );
}
