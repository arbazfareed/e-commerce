export default function HomeProductCatalog({
  ProductCard,
  addToCart,
  addToRecentlyViewed,
  fetchProducts,
  hasFilters,
  isDarkTheme,
  isLocal,
  loadError,
  loading,
  market,
  maxPrice,
  minPrice,
  page,
  pagination,
  search,
  setActiveCat,
  setActiveSub,
  setMaxPrice,
  setMinPrice,
  setPage,
  setSearch,
  setSortBy,
  sortBy,
  sortedProducts,
  styles,
  validCat,
  validRecentlyViewed,
  validSub
}) {
  return (
    <main id="shop-collection" className="main" style={styles.main}>
      {/* Stats & Controls */}
      <div className="controls collection-heading" style={styles.controls}>
        <div>
          <p className="collection-kicker">SHOP THE COLLECTION</p>
          <h2 className="collection-title">Find something meaningful</h2>
          <p style={styles.stats}>
            {pagination.total} {pagination.total === 1 ? 'product' : 'products'} found
          </p>
          {!isLocal && (
            <p role="status" style={{ ...styles.stats, marginTop: 4, fontSize: 12 }}>
              International market: Pakistan-only products are hidden.
            </p>
          )}
          {hasFilters && (
            <div className="active-filter-row" aria-label="Active filters">
              <span className="active-filter-chip">
                {search.trim() ? `Search: “${search.trim()}”` : validSub !== 'all' ? validSub : validCat !== 'all' ? validCat : 'Filtered'}
              </span>
              <button type="button" className="clear-filters" onClick={() => { setSearch(''); setActiveCat('all'); setActiveSub('all'); setMinPrice(''); setMaxPrice(''); setPage(1); }}>
                Clear filters
              </button>
            </div>
          )}
        </div>
    
        <div className="collection-control-group" role="group" aria-label="Sort and refine products">
          <label className="collection-sort-field" htmlFor="product-sort">
            <span>Sort by</span>
            <select
              id="product-sort"
              name="productSort"
              aria-label="Sort products"
              value={sortBy}
              className="sort-select"
              onChange={(e) => setSortBy(e.target.value)}
              style={{ ...styles.sortSelect, width:'100%', minWidth:0, height:44 }}
            >
              <option value="newest">Newest First</option>
              <option value="price-asc">Price: Low to High</option>
              <option value="price-desc">Price: High to Low</option>
              <option value="popular">Most Popular</option>
              <option value="name">Name: A to Z</option>
            </select>
          </label>
    
          <div className="collection-price-range" role="group" aria-label="Filter products by price">
            <label className="collection-price-field" htmlFor="minimum-price">
              <span>Minimum price ({market === 'local' ? 'Rs' : '$'})</span>
              <input id="minimum-price" aria-label="Minimum price" type="number" min="0" step="0.01" value={minPrice} onChange={event => setMinPrice(event.target.value)} placeholder="No minimum" />
            </label>
            <label className="collection-price-field" htmlFor="maximum-price">
              <span>Maximum price ({market === 'local' ? 'Rs' : '$'})</span>
              <input id="maximum-price" aria-label="Maximum price" type="number" min="0" step="0.01" value={maxPrice} onChange={event => setMaxPrice(event.target.value)} placeholder="No maximum" />
            </label>
          </div>
        </div>
      </div>
    
      {/* Loading State */}
      {loading && (
        <div style={styles.loadingGrid}>
          {[...Array(6)].map((_, i) => (
            <div key={i} style={styles.skeletonCard} />
          ))}
        </div>
      )}
    
      {/* Load error */}
      {!loading && loadError && (
        <div style={styles.emptyState} role="alert">
          <p style={styles.emptyIcon}>⚠️</p>
          <h3 style={styles.emptyTitle}>Collection unavailable</h3>
          <p style={styles.emptyText}>{loadError}</p>
          <button onClick={fetchProducts} style={styles.resetBtn}>Try Again</button>
        </div>
      )}
    
      {/* Empty State */}
      {!loading && !loadError && sortedProducts.length === 0 && (
        <div style={styles.emptyState}>
          <p style={styles.emptyIcon}>🔍</p>
          <h3 style={styles.emptyTitle}>No products found</h3>
          <p style={styles.emptyText}>
            {market === 'global' && !search && validCat === 'all'
              ? 'No international products available. Switch to Pakistan mode to explore local products.'
              : 'Try adjusting your search or category filter.'}
          </p>
          <button onClick={() => { setSearch(''); setActiveCat('all'); setActiveSub('all'); setMinPrice(''); setMaxPrice(''); setPage(1); }} style={styles.resetBtn}>
            Clear Filters
          </button>
        </div>
      )}
    
      {/* Product Grid */}
      {!loading && sortedProducts.length > 0 && (
        <>
          <div className="product-row" style={styles.grid}>
            {sortedProducts.map(product => (
              <ProductCard
                key={product._id}
                product={product}
                onAddToCart={(prod) => {
                  addToRecentlyViewed(prod);
                  addToCart(prod);
                }}
              />
            ))}
          </div>
    
          {/* Recently Viewed Section */}
          {(() => {
            if (validRecentlyViewed.length === 0) return null;
    
            return (
              <div className="recent-section" style={styles.recentSection}>
                <h3 className="recent-title" style={styles.recentTitle}>
                  🕐 Recently Viewed
                  <span className="recent-count" style={styles.recentCount}>{validRecentlyViewed.length}</span>
                </h3>
                <div className="product-row recent-product-row" style={styles.recentGrid}>
                  {validRecentlyViewed.slice(0, 4).map(product => (
                    <ProductCard
                      key={product._id}
                      product={product}
                      onAddToCart={(prod) => {
                        addToRecentlyViewed(prod);
                        addToCart(prod);
                      }}
                    />
                  ))}
                </div>
              </div>
            );
          })()}
          {pagination.pages > 1 && <nav aria-label="Product result pages" style={{ display:'flex', justifyContent:'center', alignItems:'center', gap:12, margin:'24px 0 8px' }}>
            <button type="button" disabled={page <= 1 || loading} onClick={() => setPage(current => Math.max(1, current - 1))} style={{ ...styles.resetBtn, opacity:page <= 1 ? .5 : 1 }}>← Previous</button>
            <span aria-live="polite" style={{ color:isDarkTheme ? '#d1ded6' : '#475569', fontSize:12, fontWeight:700 }}>Page {pagination.page} of {pagination.pages}</span>
            <button type="button" disabled={page >= pagination.pages || loading} onClick={() => setPage(current => Math.min(pagination.pages, current + 1))} style={{ ...styles.resetBtn, opacity:page >= pagination.pages ? .5 : 1 }}>Next →</button>
          </nav>}
        </>
      )}
    </main>
  );
}
