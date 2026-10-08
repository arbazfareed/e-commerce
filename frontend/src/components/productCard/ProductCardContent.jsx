export default function ProductCardContent({
  Link,
  addToWishlist,
  alternatePrice,
  currentPrice,
  discountPercent,
  formatPKR,
  formatUSD,
  isOut,
  isPak,
  isRestricted,
  isWishlisted,
  navigate,
  onAddToCart,
  originalPrice,
  p,
  removeFromWishlist,
  styles,
  user
}) {
  return (
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
  );
}
