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
        {categories.map(cat => (
          <button
            key={cat}
            className="cat-btn"
            type="button"
            aria-pressed={validCat === cat}
            onClick={() => { setActiveCat(cat); setActiveSub('all'); }}
            style={{
              ...styles.catBtn,
              ...(validCat === cat ? styles.catBtnActive : {})
            }}
          >
            {cat === 'all' ? 'All Products' : cat}
          </button>
        ))}
      </div>
      {subcategories.length > 1 && (
        <div style={styles.subcatBar}>
          <div className="subcat-container" style={styles.subcatContainer}>
            {subcategories.map(sub => (
              <button key={sub} className="subcat-btn" type="button" aria-pressed={validSub === sub} onClick={() => setActiveSub(sub)} style={{ ...styles.subcatBtn, ...(validSub === sub ? styles.subcatBtnActive : {}) }}>
                {sub === 'all' ? 'All in category' : sub}
              </button>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
