import { Link } from 'react-router-dom';
import { assetUrl } from '../../utils/axiosConfig';

const Check = () => (
  <svg viewBox="0 0 24 24" width="15" height="15" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><path d="m5 12.5 4.2 4.2L19 7" /></svg>
);

// Home hero: honest promises from the store settings and real newest products.
export default function HomeHero({
  BRAND_NAME,
  chooseMarket,
  featured = [],
  getDisplayPrice,
  internationalEnabled,
  isLocal,
  marketSettingsLoaded,
  storePromises = {},
  styles
}) {
  const scrollTo = id => document.getElementById(id)?.scrollIntoView({ behavior: 'smooth' });
  const promises = [
    storePromises.freeShippingThreshold > 0 && `Free delivery over Rs ${Number(storePromises.freeShippingThreshold).toLocaleString('en-PK')}`,
    storePromises.codEnabled !== false && 'Cash on delivery',
    'Secure checkout',
  ].filter(Boolean);

  return (
    <section className="hero lux-hero" style={styles.hero}>
      <div className="hero-image-slider" aria-hidden="true">
        <div className="hero-image-track">
          <div className="hero-image-slide"><img src="/hero-cover.jpg" alt="" loading="eager" /></div>
          <div className="hero-image-slide"><img src="/botanical-ritual-cover.jpg" alt="" loading="lazy" /></div>
          <div className="hero-image-slide"><img src="/mountain-honey-cover.jpg" alt="" loading="lazy" /></div>
          <div className="hero-image-slide"><img src="/artisan-sanctuary-cover.jpg" alt="" loading="lazy" /></div>
        </div>
      </div>
      <div className="lux-hero-veil" aria-hidden="true" />

      <div className="lux-hero-inner">
        <div className="lux-hero-copy">
          <p className="lux-eyebrow"><span className="lux-eyebrow-dot" aria-hidden="true" />{BRAND_NAME} · Skincare, home &amp; handmade finds</p>
          <h1 className="lux-title">
            Rituals for
            <span className="lux-title-accent"> softer, richer living.</span>
          </h1>
          <p className="lux-subtitle">
            Refined skincare, body rituals and home essentials from makers across Pakistan, chosen to calm the senses and last.
          </p>
          <div className="lux-actions hero-actions">
            <button type="button" className="lux-btn-gold" onClick={() => scrollTo('shop-collection')}>
              Shop the collection <span aria-hidden="true">→</span>
            </button>
            <button type="button" className="lux-btn-ghost" onClick={() => scrollTo('shop-categories')}>
              Browse categories
            </button>
          </div>
          <ul className="lux-promises" aria-label="Store promises">
            {promises.map(text => <li key={text}><Check />{text}</li>)}
          </ul>

          <div className="lux-market market-toggle" role="group" aria-label="Show prices in">
            <span className="lux-market-label">Prices in</span>
            <button type="button" aria-pressed={isLocal} className={isLocal ? 'is-on' : ''} onClick={() => chooseMarket('local')}>Pakistan (PKR)</button>
            {marketSettingsLoaded && internationalEnabled && (
              <button type="button" aria-pressed={!isLocal} className={!isLocal ? 'is-on' : ''} onClick={() => chooseMarket('global')}>International (USD)</button>
            )}
          </div>
        </div>

        <aside className="lux-showcase" aria-label="New in the shop">
          <div className="lux-showcase-head">
            <span>New in the shop</span>
            <button type="button" onClick={() => scrollTo('shop-collection')}>View all →</button>
          </div>
          {featured.length > 0 ? (
            <div className="lux-showcase-grid">
              {featured.map((product, index) => (
                <Link key={product._id} to={`/products/${product._id}`} className={`lux-showcase-card${index === 0 ? ' is-main' : ''}`}>
                  <img src={assetUrl(product.images[0])} alt="" loading={index === 0 ? 'eager' : 'lazy'} />
                  <span className="lux-showcase-meta">
                    <strong>{product.name}</strong>
                    <span>{getDisplayPrice?.(product)}</span>
                  </span>
                </Link>
              ))}
            </div>
          ) : (
            <div className="lux-showcase-empty">
              <img src="/curation-neroli-saffron.png" alt="" />
              <p>Handpicked pieces, added every week.</p>
            </div>
          )}
        </aside>
      </div>
    </section>
  );
}
