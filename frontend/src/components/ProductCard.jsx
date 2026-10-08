// frontend/src/components/ProductCard.jsx
import { useState, useEffect, useRef } from 'react';
import { useAuth } from '../context/AuthContext';
import { formatPKR, formatUSD, getActiveDiscountPercent, getDiscountedPrice } from '../utils/priceUtils';
import { assetUrl } from '../utils/axiosConfig';
import { Link, useNavigate } from 'react-router-dom';
import { useCart } from '../context/CartContext';
import styles from './productCard/productCardStyles';
import ProductCardImage from './productCard/ProductCardImage';
import ProductCardContent from './productCard/ProductCardContent';

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
      <ProductCardImage {...{ configuredDiscountPercent, currentImageUrl, discountPercent, handleImageError, handleTouchEnd, handleTouchStart, hasUpcomingDiscount, idx, imgErrors, imgs, isLow, isOut, isRestricted, multi, next, p, prev, promotionCountdown, setIdx, styles, upcomingDateLabel }} />

      {/* Content Section */}
      <ProductCardContent {...{ Link, addToWishlist, alternatePrice, currentPrice, discountPercent, formatPKR, formatUSD, isOut, isPak, isRestricted, isWishlisted, navigate, onAddToCart, originalPrice, p, removeFromWishlist, styles, user }} />

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
          font-family: var(--font-body) !important;
          font-size: 25px !important;
          font-weight: 700 !important;
          text-align: center !important;
          appearance: none !important;
        }
        .product-card {
          font-family: var(--font-body) !important;
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
