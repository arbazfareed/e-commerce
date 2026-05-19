// frontend/src/components/ProductCard.jsx
import { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { formatPKR, formatUSD } from '../utils/priceUtils';

const BASE = process.env.REACT_APP_API_URL || 'http://localhost:5000';

export default function ProductCard({ product: p, onAddToCart }) {
  const { user } = useAuth();
  const isPak = !user || user.country === 'Pakistan';

  const imgs = Array.isArray(p.images) && p.images.length > 0 ? p.images : [];
  const multi = imgs.length > 1;
  const [idx, setIdx] = useState(0);
  const [imgErrors, setImgErrors] = useState({});

  // Reset index when product changes
  useEffect(() => {
    setIdx(0);
    setImgErrors({});
  }, [p._id]);

  const prev = (e) => { 
    e.stopPropagation(); 
    setIdx(i => (i - 1 + imgs.length) % imgs.length);
  };
  
  const next = (e) => { 
    e.stopPropagation(); 
    setIdx(i => (i + 1) % imgs.length);
  };

  const handleImageError = (imgIndex) => {
    setImgErrors(prev => ({ ...prev, [imgIndex]: true }));
  };

  const isLow = p.stock > 0 && p.stock < 5;
  const isOut = p.stock === 0;
  const isRestricted = p.isLocal && !isPak;

  // Get current image URL
  const getCurrentImageUrl = () => {
    if (!imgs.length || imgErrors[idx]) return null;
    const imgPath = imgs[idx];
    // Handle both formats: with or without uploads/ prefix
    const cleanPath = imgPath.startsWith('uploads/') ? imgPath : `uploads/${imgPath}`;
    return `${BASE}/${cleanPath}`;
  };

  const currentImageUrl = getCurrentImageUrl();

  return (
    <div style={styles.card}>
      {/* Image Section */}
      <div style={styles.imageWrapper}>
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

        {/* Image Navigation Buttons - Only show if multiple images */}
        {multi && imgs.length > 1 && !imgErrors[idx] && (
          <>
            <button 
              style={{ ...styles.navBtn, left: 6 }} 
              onClick={prev}
              onMouseEnter={(e) => e.currentTarget.style.opacity = '1'}
              onMouseLeave={(e) => e.currentTarget.style.opacity = '0'}
            >
              ‹
            </button>
            <button 
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
                style={{
                  ...styles.dot,
                  ...(i === idx ? styles.dotActive : {})
                }}
                onClick={(e) => {
                  e.stopPropagation();
                  setIdx(i);
                }}
              />
            ))}
          </div>
        )}

        {/* Badges */}
        <div style={styles.badges}>
          {p.isLocal && !isRestricted && (
            <span style={styles.badgeLocal}>🇵🇰 Local</span>
          )}
          {isRestricted && (
            <span style={styles.badgeRestricted}>🇵🇰 Pakistan Only</span>
          )}
          {!isOut && isLow && (
            <span style={styles.badgeLowStock}>⚠️ Only {p.stock} left</span>
          )}
          {isOut && (
            <span style={styles.badgeSoldOut}>✕ Sold Out</span>
          )}
        </div>
      </div>

      {/* Content Section */}
      <div style={styles.content}>
        <p style={styles.category}>{p.category}</p>
        <h3 style={styles.name}>{p.name}</h3>
        {p.description && (
          <p style={styles.description}>
            {p.description.length > 60 ? p.description.slice(0, 60) + '...' : p.description}
          </p>
        )}
        
        <div style={styles.priceRow}>
          <span style={styles.price}>
            {isPak ? formatPKR(p.pricePKR) : formatUSD(p.priceUSD)}
          </span>
          <span style={styles.priceAlt}>
            {isPak ? `$${(p.priceUSD || 0).toFixed(2)}` : formatPKR(p.pricePKR)}
          </span>
        </div>

        <button
          style={{
            ...styles.addButton,
            ...((isOut || isRestricted) ? styles.addButtonDisabled : {})
          }}
          onClick={() => !isOut && !isRestricted && onAddToCart(p)}
          disabled={isOut || isRestricted}
        >
          {isRestricted ? '🇵🇰 Pakistan Only' : isOut ? 'Out of Stock' : 'Add to Cart'}
        </button>
      </div>

      <style>{`
        .product-card {
          transition: transform 0.2s ease, box-shadow 0.2s ease;
        }
        .product-card:hover {
          transform: translateY(-4px);
          box-shadow: 0 12px 24px rgba(0,0,0,0.1);
        }
      `}</style>
    </div>
  );
}

const styles = {
  card: {
    background: '#fff',
    borderRadius: '12px',
    overflow: 'hidden',
    border: '1px solid #eef2f6',
    transition: 'all 0.2s ease',
    cursor: 'pointer',
    height: '380px',
    display: 'flex',
    flexDirection: 'column',
    position: 'relative',
  },
  imageWrapper: {
    position: 'relative',
    height: '200px',
    backgroundColor: '#f8fafc',
    overflow: 'hidden',
    flexShrink: 0,
  },
  image: {
    width: '100%',
    height: '100%',
    objectFit: 'cover',
    transition: 'transform 0.3s ease',
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
    left: '8px',
    display: 'flex',
    gap: '6px',
    flexWrap: 'wrap',
    zIndex: 10,
  },
  badgeLocal: {
    background: '#059669',
    color: '#fff',
    fontSize: '10px',
    fontWeight: '600',
    padding: '3px 10px',
    borderRadius: '20px',
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
    padding: '12px 14px',
    flex: 1,
    display: 'flex',
    flexDirection: 'column',
    justifyContent: 'space-between',
  },
  category: {
    margin: '0 0 4px',
    fontSize: '10px',
    fontWeight: '600',
    color: '#10b981',
    textTransform: 'uppercase',
    letterSpacing: '0.5px',
  },
  name: {
    margin: '0 0 6px',
    fontSize: '15px',
    fontWeight: '700',
    color: '#1e293b',
    lineHeight: '1.3',
    overflow: 'hidden',
    textOverflow: 'ellipsis',
    whiteSpace: 'nowrap',
  },
  description: {
    margin: '0 0 10px',
    fontSize: '11px',
    color: '#64748b',
    lineHeight: '1.4',
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
    fontSize: '17px',
    fontWeight: '800',
    color: '#059669',
  },
  priceAlt: {
    fontSize: '11px',
    color: '#94a3b8',
    fontWeight: '500',
  },
  addButton: {
    background: '#059669',
    color: '#fff',
    border: 'none',
    borderRadius: '8px',
    padding: '10px 12px',
    fontSize: '12px',
    fontWeight: '600',
    cursor: 'pointer',
    transition: 'all 0.2s',
    marginTop: 'auto',
  },
  addButtonDisabled: {
    background: '#e2e8f0',
    color: '#94a3b8',
    cursor: 'not-allowed',
  },
};
