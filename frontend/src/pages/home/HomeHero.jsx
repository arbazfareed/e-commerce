export default function HomeHero({
  BRAND_NAME,
  chooseMarket,
  internationalEnabled,
  isDarkTheme,
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
          <div className="hero-image-slide"><img src="/hero-cover.jpg" alt="Pure Mountain Honey" loading="eager" /></div>
          <div className="hero-image-slide"><img src="/botanical-ritual-cover.jpg" alt="Botanical Facial Oils & Saffron" loading="lazy" /></div>
          <div className="hero-image-slide"><img src="/mountain-honey-cover.jpg" alt="Wild Mountain Raw Honeycomb" loading="lazy" /></div>
          <div className="hero-image-slide"><img src="/artisan-sanctuary-cover.jpg" alt="Artisan Botanical Soaps & Hydrosols" loading="lazy" /></div>
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
            <span style={styles.deliveryNote}>
              • Free shipping over PKR 10,000 • Trusted checkout
            </span>
          </div>
          <div className="hero-stats" style={styles.heroStats}>
            <span className="hero-stat" style={styles.heroStat}><strong>★ 4.9/5</strong> customer rating</span>
            <span className="hero-stat" style={styles.heroStat}><strong>24h</strong> dispatch support</span>
            <span className="hero-stat" style={styles.heroStat}><strong>2k+</strong> happy shoppers</span>
          </div>
        </div>
    
        <div className="hero-shell" style={styles.heroShell}>
          <div className="hero-glass-interactive" style={styles.heroGlassCard}>
            <div style={styles.heroGlassHeader}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <span style={styles.heroGlyph}>✦</span>
                <strong style={styles.heroGlassTitle}>Ritual curation</strong>
              </div>
              <span style={styles.heroGlassBadge}>
                Active Batch 04
              </span>
            </div>

            {/* Featured Visual Showcase with smooth 3D animated styling */}
            <div style={styles.heroGlassMediaWrap}>
              <img
                src="/curation-neroli-saffron.png"
                alt="Cold-Pressed Neroli & Saffron"
                className="curation-media-img"
                style={{
                  width: '100%',
                  height: '130px',
                  objectFit: 'cover',
                  display: 'block',
                }}
              />
            </div>

            <div style={styles.heroGlassGrid}>
              <div style={styles.heroGlassMetric}>
                <span style={styles.heroMetricLabel}>Top ritual</span>
                <strong style={styles.heroMetricValue}>Glow care</strong>
                <span style={styles.heroMetricSub}>★ 4.97 • 1,280 reviews</span>
              </div>
              <div style={styles.heroGlassMetric}>
                <span style={styles.heroMetricLabel}>Repeat buyers</span>
                <strong style={styles.heroMetricValue}>63%</strong>
                <span style={styles.heroMetricSub}>Exceptional loyalty</span>
              </div>
              <div style={styles.heroGlassMetric}>
                <span style={styles.heroMetricLabel}>Avg. order</span>
                <strong style={styles.heroMetricValue}>Rs 8,400</strong>
                <span style={styles.heroMetricSub}>Complimentary sampler</span>
              </div>
              <div style={styles.heroGlassMetric}>
                <span style={styles.heroMetricLabel}>Loyalty</span>
                <strong style={styles.heroMetricValue}>A+</strong>
                <span style={styles.heroMetricSub}>Organic Harvested</span>
              </div>
            </div>

            {/* Card Footer */}
            <div style={styles.heroGlassFooter}>
              <span style={styles.heroGlassFooterText}>
                <span style={styles.heroGlassFooterDot} />
                Handcrafted in small batches
              </span>
              <button
                type="button"
                className="hero-glass-explore-btn"
                onClick={() => document.getElementById('shop-collection')?.scrollIntoView({ behavior: 'smooth' })}
                style={styles.heroGlassExploreBtn}
                onMouseEnter={(e) => e.currentTarget.style.color = isDarkTheme ? '#fef08a' : '#78350f'}
                onMouseLeave={(e) => e.currentTarget.style.color = isDarkTheme ? '#fcd34d' : '#92400e'}
              >
                Explore this ritual →
              </button>
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
          <button
            type="button"
            onClick={() => document.getElementById('shop-collection')?.scrollIntoView({ behavior: 'smooth' })}
            style={{
              position: 'absolute',
              right: '8px',
              top: '50%',
              transform: 'translateY(-50%)',
              background: 'rgba(255, 255, 255, 0.10)',
              border: '1px solid rgba(255, 255, 255, 0.18)',
              color: '#ffffff',
              padding: '6px 16px',
              borderRadius: '999px',
              fontSize: '12px',
              fontWeight: 700,
              cursor: 'pointer',
              letterSpacing: '0.3px',
              transition: 'background 0.2s ease',
            }}
            onMouseEnter={(e) => e.currentTarget.style.background = 'rgba(255, 255, 255, 0.18)'}
            onMouseLeave={(e) => e.currentTarget.style.background = 'rgba(255, 255, 255, 0.10)'}
          >
            Filter
          </button>
        </div>
      </div>
    </section>
  );
}
