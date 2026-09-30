// frontend/src/components/ProductCard.jsx
import { useState, useEffect, useRef } from 'react';
import { useAuth } from '../context/AuthContext';
import { formatPKR, formatUSD, getActiveDiscountPercent, getDiscountedPrice } from '../utils/priceUtils';
import { assetUrl } from '../utils/axiosConfig';
import { Link, useNavigate } from 'react-router-dom';
import { useCart } from '../context/CartContext';

export const getPromotionCountdown = (endDate, now) => {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(endDate || '')) return '';
  const deadline = new Date(`${endDate}T23:59:59.999Z`).getTime();
  const remaining = deadline - now.getTime();
  if (!Number.isFinite(deadline) || remaining <= 0) return '';
  const days = Math.floor(remaining / 86400000);
  if (days > 0) return `ENDS IN ${days}D`;
  const hours = Math.floor((remaining % 86400000) / 3600000);
  if (hours > 0) return `ENDS IN ${hours}H`;
  const minutes = Math.max(1, Math.ceil((remaining % 3600000) / 60000));
  return `ENDS IN ${minutes}M`;
};

export default function ProductCard({ product: p, onAddToCart }) {
  const { user } = useAuth();
  const { addToWishlist, removeFromWishlist, isWishlisted } = useCart();
  const navigate = useNavigate();
  const isPak = !user || user.country === 'Pakistan';

  const imgs = Array.isArray(p.images) && p.images.length > 0 ? p.images : [];
  const multi = imgs.length > 1;
  const [idx, setIdx] = useState(0);
  const [imgErrors, setImgErrors] = useState({});
  const [clockNow, setClockNow] = useState(() => new Date());
  const touchStartX = useRef(null);

  // Reset index when product changes
  useEffect(() => {
    setIdx(0);
    setImgErrors({});
  }, [p._id]);

  useEffect(() => {
    if (!p.discountEndDate || !p.discountPercent) return undefined;
    const timer = setInterval(() => setClockNow(new Date()), 60_000);
    return () => clearInterval(timer);
  }, [p.discountEndDate, p.discountPercent]);

  const prev = (e) => { 
    e.stopPropagation(); 
    setIdx(i => (i - 1 + imgs.length) % imgs.length);
  };
  
  const next = (e) => { 
    e.stopPropagation(); 
    setIdx(i => (i + 1) % imgs.length);
  };

  const handleTouchStart = (e) => {
    touchStartX.current = e.touches[0]?.clientX ?? null;
  };

  const handleTouchEnd = (e) => {
    if (touchStartX.current == null || !multi) return;
    const endX = e.changedTouches[0]?.clientX ?? touchStartX.current;
    const delta = endX - touchStartX.current;
    touchStartX.current = null;
    if (Math.abs(delta) < 35) return;
    setIdx(i => delta < 0 ? (i + 1) % imgs.length : (i - 1 + imgs.length) % imgs.length);
  };

  const handleImageError = (imgIndex) => {
    setImgErrors(prev => ({ ...prev, [imgIndex]: true }));
  };

  const isLow = p.stock > 0 && p.stock < 5;
  const isOut = p.stock === 0;
  const isRestricted = p.isLocal && !isPak;
  const configuredDiscountPercent = Math.min(100, Math.max(0, Number(p.discountPercent) || 0));
  const discountPercent = getActiveDiscountPercent(p, clockNow);
  const today = clockNow.toISOString().slice(0, 10);
  const hasUpcomingDiscount = configuredDiscountPercent > 0 && discountPercent === 0 && p.discountStartDate && today < p.discountStartDate;
  const upcomingDateLabel = hasUpcomingDiscount
    ? new Date(`${p.discountStartDate}T00:00:00Z`).toLocaleDateString('en', { month:'short', day:'numeric', timeZone:'UTC' }).toUpperCase()
    : '';
  const promotionCountdown = discountPercent > 0 ? getPromotionCountdown(p.discountEndDate, clockNow) : '';
  const originalPrice = Number(isPak ? p.pricePKR : p.priceUSD) || 0;
  const currentPrice = getDiscountedPrice(originalPrice, discountPercent, isPak ? 'PKR' : 'USD');
  const alternatePrice = isPak
    ? getDiscountedPrice(p.priceUSD, discountPercent, 'USD')
    : getDiscountedPrice(p.pricePKR, discountPercent, 'PKR');

  // Get current image URL
  const getCurrentImageUrl = () => {
    if (!imgs.length || imgErrors[idx]) return null;
    return assetUrl(imgs[idx]);
  };

  const currentImageUrl = getCurrentImageUrl();

  return (
    <article
      className="product-card"
      style={styles.card}
      onClick={() => navigate(`/products/${p._id}`)}
    >
      {/* Image Section */}
      <div
        className="product-card-image"
        style={styles.imageWrapper}
        onTouchStart={handleTouchStart}
        onTouchEnd={handleTouchEnd}
      >
        {currentImageUrl ? (
          <img
            key={`${p._id}-${idx}`}
            src={currentImageUrl}
            alt={p.name}
            style={styles.image}
            onError={() => handleImageError(idx)}
            loading="lazy"
          />
        ) : (
          <div style={styles.placeholder}>
            <span style={styles.placeholderText}>{p.name?.[0]?.toUpperCase() || '?'}</span>
          </div>
        )}

        <div style={styles.imageOverlay} />

        {/* Image Navigation Buttons - Only show if multiple images */}
        {multi && imgs.length > 1 && !imgErrors[idx] && (
          <>
            <button 
              type="button"
              className="product-image-nav"
              aria-label={`Previous image for ${p.name}`}
              style={{ ...styles.navBtn, left: 6 }} 
              onClick={prev}
              onMouseEnter={(e) => e.currentTarget.style.opacity = '1'}
              onMouseLeave={(e) => e.currentTarget.style.opacity = '0'}
            >
              ‹
            </button>
            <button 
              type="button"
              className="product-image-nav"
              aria-label={`Next image for ${p.name}`}
              style={{ ...styles.navBtn, right: 6 }} 
              onClick={next}
              onMouseEnter={(e) => e.currentTarget.style.opacity = '1'}
              onMouseLeave={(e) => e.currentTarget.style.opacity = '0'}
            >
              ›
            </button>
            <div style={styles.counter}>
              {idx + 1}/{imgs.length}
            </div>
          </>
        )}

        {/* Dot Indicators for multiple images */}
        {multi && imgs.length > 1 && !imgErrors[idx] && (
          <div style={styles.dots}>
            {imgs.map((_, i) => (
              <button
                key={i}
                type="button"
                className="product-image-dot"
                aria-label={`Show image ${i + 1} of ${p.name}`}
                style={{
                  ...styles.dotButton,
                }}
                onClick={(e) => {
                  e.stopPropagation();
                  setIdx(i);
                }}
              >
                <span aria-hidden="true" style={{ ...styles.dot, ...(i === idx ? styles.dotActive : {}) }} />
              </button>
            ))}
          </div>
        )}

        {p.category && (
          <span className="product-category-badge" style={styles.categoryBadge}>{p.category}</span>
        )}

        {/* Badges */}
        <div style={styles.badges}>
          {discountPercent > 0 && <span style={styles.badgeDiscount}>SAVE {discountPercent}%</span>}
          {promotionCountdown && <span className="product-discount-countdown" title={`Promotion ends ${p.discountEndDate}`} aria-label={`Promotion ends in ${promotionCountdown.replace('ENDS IN ', '')}`}>⏳ {promotionCountdown}</span>}
          {hasUpcomingDiscount && <span className="product-discount-upcoming" style={styles.badgeDiscountUpcoming} title={`Promotion starts ${p.discountStartDate}`}>{configuredDiscountPercent}% OFF · {upcomingDateLabel}</span>}
          {p.isLocal && !isRestricted && (
            <span style={styles.badgeLocal}>🇵🇰 Local</span>
          )}
          {isRestricted && (
            <span style={styles.badgeRestricted}>🇵🇰 Pakistan Only</span>
          )}
          {!isOut && isLow && (
            <span className="product-scarcity-badge" style={styles.badgeLowStock} aria-label={`Low stock: only ${p.stock} left`}>⚠️ Only {p.stock} left</span>
          )}
          {isOut && (
            <span style={styles.badgeSoldOut}>✕ Sold Out</span>
          )}
        </div>
      </div>

      {/* Content Section */}
      <div className="product-card-content" style={styles.content}>
        <h3 style={styles.name}>
          <Link to={`/products/${p._id}`} onClick={event => event.stopPropagation()} style={styles.nameLink}>{p.name}</Link>
        </h3>
        {Number(p.reviewCount) > 0 && <p aria-label={`${p.averageRating} out of 5 stars, ${p.reviewCount} reviews`} style={{ margin:'-7px 0 9px', color:'#a66b12', fontSize:12, fontWeight:800 }}>
          {'★'.repeat(Math.round(Number(p.averageRating) || 0))}{'☆'.repeat(5 - Math.round(Number(p.averageRating) || 0))} <span style={{ color:'#64748b', fontWeight:600 }}>({p.reviewCount})</span>
        </p>}
        {(p.subcategory || p.brand || p.model) && (
          <p style={styles.productMeta}>
            {[p.subcategory, p.brand, p.model].filter(Boolean).join(' · ')}
          </p>
        )}
        {p.description && (
          <p style={styles.description}>
            {p.description.length > 60 ? p.description.slice(0, 60) + '...' : p.description}
          </p>
        )}

        <div style={styles.priceRow}>
          <span className={`product-card-price${discountPercent > 0 ? ' has-discount' : ''}`} style={styles.price}>
            {isPak ? formatPKR(currentPrice) : formatUSD(currentPrice)}
          </span>
          {discountPercent > 0 && <del className="product-card-original" style={styles.originalPrice}>{isPak ? formatPKR(originalPrice) : formatUSD(originalPrice)}</del>}
        </div>
        <span className="product-card-price-alt" style={styles.priceAlt}>
          Approx. {isPak ? formatUSD(alternatePrice) : formatPKR(alternatePrice)}
        </span>

        <div style={{ display:'flex', gap:8, alignItems:'stretch' }}>
          <button
            className="product-card-add-button"
            style={{ ...styles.addButton, flex:1, ...((isOut || isRestricted) ? styles.addButtonDisabled : {}) }}
            onClick={(e) => { e.stopPropagation(); if (!isOut && !isRestricted) onAddToCart(p); }}
            disabled={isOut || isRestricted}
          >
            {isRestricted ? '🇵🇰 Pakistan Only' : isOut ? 'Out of Stock' : 'Add to Cart'}
          </button>
          <button type="button" aria-label={isWishlisted(p._id) ? `Remove ${p.name} from wishlist` : `Save ${p.name} to wishlist`} aria-pressed={isWishlisted(p._id)} onClick={event => {
            event.stopPropagation();
            if (!user) { navigate('/login'); return; }
            if (isWishlisted(p._id)) removeFromWishlist(p._id); else addToWishlist(p);
          }} className="product-card-wishlist" style={{ minWidth:42, minHeight:42, display:'inline-flex', alignItems:'center', justifyContent:'center', border:'1px solid #fda4af', borderRadius:10, background:isWishlisted(p._id) ? '#fff1f2' : '#fff', color:isWishlisted(p._id) ? '#be123c' : '#64748b', fontSize:22, lineHeight:1, cursor:'pointer', flexShrink:0 }}>
            {isWishlisted(p._id) ? '♥' : '♡'}
          </button>
        </div>
      </div>

      <style>{`
        .product-image-nav {
          min-width: 32px !important;
          min-height: 32px !important;
          width: 32px !important;
          height: 32px !important;
          max-width: 32px !important;
          max-height: 32px !important;
          line-height: 30px !important;
          padding: 0 !important;
          font-family: Arial, sans-serif !important;
          font-size: 25px !important;
          font-weight: 400 !important;
          text-align: center !important;
          appearance: none !important;
        }
        .product-image-dot {
          min-width: 24px !important;
          min-height: 24px !important;
          width: 24px !important;
          height: 24px !important;
          max-width: 24px !important;
          max-height: 24px !important;
          display: flex !important;
          align-items: center !important;
          justify-content: center !important;
          line-height: 0 !important;
          appearance: none !important;
        }
        .product-card {
          transition: transform 0.2s ease, box-shadow 0.2s ease;
        }
        @media (hover:hover) and (pointer:fine) {
          .product-card:hover {
            transform: translateY(-4px);
            box-shadow: 0 18px 38px rgba(15,23,42,0.12);
            border-color: rgba(16,185,129,0.3);
          }
          .product-card:hover img { transform: scale(1.04); }
          .product-card:hover .product-card-add-button {
            background: linear-gradient(135deg,#059669,#047857) !important;
          }
          .product-card:hover .product-image-nav {
            background: rgba(0,0,0,0.72) !important;
            transform: translateY(-50%) !important;
          }
        }
        @media (max-width: 760px) {
          .product-image-nav {
            opacity: .92 !important;
          }
        }
        @media (hover:none) {
          .product-card:hover { transform:none; }
          .product-card:hover img { transform:none; }
        }
      `}</style>
    </article>
  );
}

const styles = {
  card: {
    background: 'linear-gradient(180deg, rgba(255,255,255,0.96) 0%, rgba(248,252,250,0.98) 100%)',
    borderRadius: '22px',
    overflow: 'hidden',
    border: '1px solid rgba(20,100,70,0.12)',
    transition: 'all 0.22s ease',
    cursor: 'pointer',
    minHeight: '366px',
    display: 'flex',
    flexDirection: 'column',
    position: 'relative',
    boxShadow: '0 16px 34px rgba(11, 58, 42, 0.08)',
    backdropFilter: 'blur(10px)',
  },
  imageWrapper: {
    position: 'relative',
    height: '190px',
    backgroundColor: '#edf7f1',
    overflow: 'hidden',
    flexShrink: 0,
  },
  imageOverlay: {
    position: 'absolute',
    inset: 0,
    background: 'linear-gradient(180deg, rgba(16, 39, 28, 0.04) 0%, rgba(16, 39, 28, 0.18) 100%)',
    pointerEvents: 'none',
  },
  image: {
    width: '100%',
    height: '100%',
    objectFit: 'cover',
    transition: 'transform 0.45s cubic-bezier(.2,.8,.2,1)',
    display: 'block',
  },
  placeholder: {
    width: '100%',
    height: '100%',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    background: 'linear-gradient(135deg, #f0fdf4, #dcfce7)',
  },
  placeholderText: {
    fontSize: '48px',
    fontWeight: '700',
    color: '#86efac',
  },
  navBtn: {
    position: 'absolute',
    top: '50%',
    transform: 'translateY(-50%)',
    background: 'rgba(0,0,0,0.6)',
    color: '#fff',
    border: 'none',
    borderRadius: '50%',
    width: '30px',
    height: '30px',
    fontSize: '20px',
    fontWeight: 'bold',
    cursor: 'pointer',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    opacity: 0,
    transition: 'opacity 0.2s',
    zIndex: 10,
  },
  counter: {
    position: 'absolute',
    bottom: '8px',
    right: '8px',
    background: 'rgba(0,0,0,0.7)',
    color: '#fff',
    fontSize: '10px',
    fontWeight: '600',
    padding: '2px 8px',
    borderRadius: '12px',
    zIndex: 10,
  },
  dots: {
    position: 'absolute',
    bottom: '8px',
    left: '50%',
    transform: 'translateX(-50%)',
    display: 'flex',
    gap: '6px',
    zIndex: 10,
  },
  dotButton: {
    width: '24px',
    height: '24px',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 0,
    border: 0,
    background: 'transparent',
    cursor: 'pointer',
  },
  dot: {
    width: '6px',
    height: '6px',
    borderRadius: '50%',
    background: 'rgba(255,255,255,0.5)',
    border: 'none',
    cursor: 'pointer',
    padding: 0,
    transition: 'all 0.2s',
  },
  dotActive: {
    width: '18px',
    borderRadius: '3px',
    background: '#fff',
  },
  badges: {
    position: 'absolute',
    top: '8px',
    right: '8px',
    display: 'flex',
    gap: '6px',
    flexWrap: 'wrap',
    justifyContent: 'flex-end',
    zIndex: 10,
  },
  categoryBadge: {
    position: 'absolute',
    top: '8px',
    left: '8px',
    maxWidth: '55%',
    overflow: 'hidden',
    textOverflow: 'ellipsis',
    whiteSpace: 'nowrap',
    background: 'linear-gradient(135deg, rgba(255,255,255,0.96), rgba(231,255,242,0.92))',
    color: '#0d5c42',
    fontSize: '10px',
    fontWeight: '800',
    letterSpacing: '0.5px',
    textTransform: 'uppercase',
    padding: '6px 10px',
    borderRadius: '20px',
    border: '1px solid rgba(15, 118, 110, 0.18)',
    boxShadow: '0 4px 12px rgba(15,23,42,0.14)',
    zIndex: 10,
  },
  badgeLocal: {
    background: '#047857',
    color: '#fff',
    fontSize: '10px',
    fontWeight: '600',
    padding: '3px 10px',
    borderRadius: '20px',
  },
  badgeDiscount: {
    background: 'linear-gradient(135deg,#b95f3b,#963f35)',
    color: '#fff',
    fontSize: '10px',
    fontWeight: '800',
    letterSpacing: '.3px',
    padding: '4px 10px',
    borderRadius: '20px',
    boxShadow: '0 4px 12px rgba(111,46,31,.24)',
  },
  badgeDiscountUpcoming: {
    background: 'linear-gradient(135deg,#543d24,#795322)',
    border: '1px solid rgba(255,239,201,.45)',
    color: '#fff4d6',
    fontSize: '9px',
    fontWeight: '900',
    letterSpacing: '.25px',
    padding: '4px 8px',
    borderRadius: '20px',
    boxShadow: '0 4px 12px rgba(73,48,19,.24)',
    whiteSpace: 'nowrap',
  },
  badgeRestricted: {
    background: '#7c3aed',
    color: '#fff',
    fontSize: '10px',
    fontWeight: '600',
    padding: '3px 10px',
    borderRadius: '20px',
  },
  badgeLowStock: {
    background: '#f97316',
    color: '#fff',
    fontSize: '10px',
    fontWeight: '600',
    padding: '3px 10px',
    borderRadius: '20px',
  },
  badgeSoldOut: {
    background: '#dc2626',
    color: '#fff',
    fontSize: '10px',
    fontWeight: '600',
    padding: '3px 10px',
    borderRadius: '20px',
  },
  content: {
    padding: '16px 17px 17px',
    display: 'flex',
    flexDirection: 'column',
    justifyContent: 'space-between',
    flex: 1,
  },
  name: {
    margin: '0 0 6px',
    fontSize: '16px',
    fontWeight: '800',
    color: '#0f172a',
    lineHeight: '1.2',
    letterSpacing: '-0.03em',
    overflow: 'hidden',
    textOverflow: 'ellipsis',
    whiteSpace: 'nowrap',
  },
  nameLink: {
    color: 'inherit',
    textDecoration: 'none',
  },
  description: {
    margin: '0 0 10px',
    fontSize: '12px',
    color: '#64748b',
    lineHeight: '1.45',
    overflow: 'hidden',
    textOverflow: 'ellipsis',
    whiteSpace: 'nowrap',
  },
  productMeta: {
    margin: '-2px 0 8px',
    fontSize: '12px',
    color: '#64748b',
    fontWeight: '700',
    letterSpacing: '0.02em',
    overflow: 'hidden',
    textOverflow: 'ellipsis',
    whiteSpace: 'nowrap',
  },
  priceRow: {
    display: 'flex',
    alignItems: 'baseline',
    gap: '8px',
    marginBottom: '12px',
  },
  price: {
    fontSize: '20px',
    fontWeight: '800',
    color: '#0f172a',
    letterSpacing: '-0.04em',
  },
  priceAlt: {
    fontSize: '11px',
    color: '#94a3b8',
    fontWeight: '600',
    marginTop: '-8px',
    marginBottom: '10px',
  },
  originalPrice: {
    fontSize: '12px',
    color: '#829087',
    fontWeight: '600',
  },
  addButton: {
    background: 'linear-gradient(135deg,#19a76d,#0d5c42)',
    color: '#fff',
    border: 'none',
    borderRadius: '12px',
    padding: '10px 12px',
    fontSize: '12px',
    fontWeight: '700',
    cursor: 'pointer',
    transition: 'all 0.2s ease',
    boxShadow: '0 14px 24px rgba(13,92,66,0.18)',
    marginTop: 'auto',
    letterSpacing: '0.2px',
  },
  addButtonDisabled: {
    background: '#e2e8f0',
    color: '#94a3b8',
    cursor: 'not-allowed',
    boxShadow: 'none',
  },
};
