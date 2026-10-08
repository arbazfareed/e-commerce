export default function ProductCardImage({
  configuredDiscountPercent,
  currentImageUrl,
  discountPercent,
  handleImageError,
  handleTouchEnd,
  handleTouchStart,
  hasUpcomingDiscount,
  idx,
  imgErrors,
  imgs,
  isLow,
  isOut,
  isRestricted,
  multi,
  next,
  p,
  prev,
  promotionCountdown,
  setIdx,
  styles,
  upcomingDateLabel
}) {
  return (
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
  );
}
