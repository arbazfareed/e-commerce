export function getCategoryMeta(cat) {
  if (!cat || cat === 'all') return { icon: '✦', label: 'All Products' };
  const c = cat.toLowerCase().trim();
  if (c.includes('animal') || c.includes('pet') || c.includes('goat') || c.includes('cow') || c.includes('cattle')) {
    return { icon: '🐾', label: cat };
  }
  if (c.includes('cloth') || c.includes('apparel') || c.includes('fashion') || c.includes('wear') || c.includes('kurta')) {
    return { icon: '👕', label: cat };
  }
  if (c.includes('honey')) {
    return { icon: '🍯', label: cat };
  }
  if (c.includes('dry fruit') || c.includes('nut') || c.includes('almond') || c.includes('walnut')) {
    return { icon: '🥜', label: cat };
  }
  if (c.includes('fruit') || c.includes('mango') || c.includes('apple')) {
    return { icon: '🍎', label: cat };
  }
  if (c.includes('spice') || c.includes('herb') || c.includes('masala')) {
    return { icon: '🌿', label: cat };
  }
  if (c.includes('food') || c.includes('foos') || c.includes('grain') || c.includes('rice') || c.includes('snack') || c.includes('sweet')) {
    return { icon: '🍲', label: cat };
  }
  if (c.includes('handicraft') || c.includes('craft') || c.includes('pottery') || c.includes('art') || c.includes('carpet')) {
    return { icon: '🏺', label: cat };
  }
  if (c.includes('beauty') || c.includes('skincare') || c.includes('cosmetic') || c.includes('soap')) {
    return { icon: '✨', label: cat };
  }
  if (c.includes('electron') || c.includes('gadget') || c.includes('mobile') || c.includes('tech')) {
    return { icon: '⚡', label: cat };
  }
  if (c.includes('home') || c.includes('decor') || c.includes('living') || c.includes('kitchen')) {
    return { icon: '🏡', label: cat };
  }
  if (c.includes('book') || c.includes('stationery')) {
    return { icon: '📚', label: cat };
  }
  if (c.includes('leather') || c.includes('bag') || c.includes('wallet')) {
    return { icon: '👜', label: cat };
  }
  if (c.includes('organic') || c.includes('nature') || c.includes('plant')) {
    return { icon: '🌱', label: cat };
  }
  return { icon: '🏷️', label: cat };
}

export default function HomeCategoryBar({
  categories,
  setActiveCat,
  setActiveSub,
  styles,
  subcategories,
  validCat,
  validSub
}) {
  return (
    <div className="cat-bar" style={styles.catBar}>
      <div className="cat-container" style={styles.catContainer}>
        {categories.map(cat => {
          const meta = getCategoryMeta(cat);
          const isActive = validCat === cat;
          return (
            <button
              key={cat}
              className={`cat-btn${isActive ? ' is-active' : ''}`}
              type="button"
              aria-pressed={isActive}
              onClick={() => { setActiveCat(cat); setActiveSub('all'); }}
              style={{
                ...styles.catBtn,
                ...(isActive ? styles.catBtnActive : {})
              }}
            >
              <span className="cat-icon" aria-hidden="true" style={{ fontSize: '15px', lineHeight: 1 }}>{meta.icon}</span>
              <span>{meta.label}</span>
            </button>
          );
        })}
      </div>
      {subcategories.length > 1 && (
        <div className="subcat-bar" style={styles.subcatBar}>
          <div className="subcat-container" style={styles.subcatContainer}>
            {subcategories.map(sub => {
              const isActive = validSub === sub;
              const label = sub === 'all'
                ? (validCat !== 'all' ? `All ${validCat}` : 'All')
                : sub;
              return (
                <button
                  key={sub}
                  className={`subcat-btn${isActive ? ' is-active' : ''}`}
                  type="button"
                  aria-pressed={isActive}
                  onClick={() => setActiveSub(sub)}
                  style={{
                    ...styles.subcatBtn,
                    ...(isActive ? styles.subcatBtnActive : {})
                  }}
                >
                  {isActive && <span className="subcat-active-dot" aria-hidden="true" style={{ fontSize: '8px', lineHeight: 1, marginRight: 2 }}>●</span>}
                  <span>{label}</span>
                </button>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}
