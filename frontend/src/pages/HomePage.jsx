// frontend/src/pages/HomePage.jsx
import { useState, useEffect, useCallback } from 'react';
import API from '../utils/axiosConfig';
import ProductCard from '../components/ProductCard';
import { useCart } from '../context/CartContext';
import { useAuth } from '../context/AuthContext';
import { formatPKR, formatUSD } from '../utils/priceUtils';

const MARKET_KEY = 'ic_market_mode';

export default function HomePage() {
  const { addToCart, recentlyViewed = [], addToRecentlyViewed = () => {} } = useCart();
  const { user } = useAuth();

  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [activeCat, setActiveCat] = useState('all');
  const [sortBy, setSortBy] = useState('newest');
  const [market, setMarket] = useState(() => localStorage.getItem(MARKET_KEY) || 'local');

  // Derive unique categories from products (auto-updates when products change)
  const categories = ['all', ...new Set(products.map(p => p.category).filter(Boolean))];

  // Ensure activeCat is valid
  const validCat = categories.includes(activeCat) ? activeCat : 'all';

  const fetchProducts = useCallback(async () => {
    setLoading(true);
    try {
      const res = await API.get('/api/products');
      setProducts(res.data);
    } catch (err) {
      console.error('Failed to fetch products:', err);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchProducts();
  }, [fetchProducts]);

  const toggleMarket = useCallback(() => {
    setMarket(m => {
      const next = m === 'local' ? 'global' : 'local';
      localStorage.setItem(MARKET_KEY, next);
      return next;
    });
  }, []);

  const isLocal = market === 'local';

  // Filter products
  const filteredProducts = products.filter(p => {
    // Search filter
    const matchesSearch = !search || 
      p.name.toLowerCase().includes(search.toLowerCase()) ||
      (p.description || '').toLowerCase().includes(search.toLowerCase());
    
    // Category filter
    const matchesCategory = validCat === 'all' || p.category === validCat;
    
    // Market filter
    const matchesMarket = isLocal ? true : !p.isLocal;
    
    return matchesSearch && matchesCategory && matchesMarket;
  });

  // Sort products
  const sortedProducts = [...filteredProducts].sort((a, b) => {
    if (sortBy === 'newest') {
      return new Date(b.createdAt) - new Date(a.createdAt);
    }
    if (sortBy === 'price-asc') {
      return (isLocal ? a.pricePKR : a.priceUSD) - (isLocal ? b.pricePKR : b.priceUSD);
    }
    if (sortBy === 'price-desc') {
      return (isLocal ? b.pricePKR : b.priceUSD) - (isLocal ? a.pricePKR : a.priceUSD);
    }
    if (sortBy === 'name') {
      return a.name.localeCompare(b.name);
    }
    return 0;
  });

  const getDisplayPrice = (product) => {
    return isLocal ? formatPKR(product.pricePKR) : formatUSD(product.priceUSD);
  };

  return (
    <div style={styles.page}>
      {/* Hero Section - Simplified */}
      <section style={styles.hero}>
        <div style={styles.heroContent}>
          <h1 style={styles.title}>
            Discover Pakistani
            <br />
            <span style={styles.titleAccent}>Crafts & Heritage</span>
          </h1>
          <p style={styles.subtitle}>
            Handpicked authentic products from Pakistan's finest artisans
          </p>

          {/* Market Toggle */}
          <div style={styles.marketToggle}>
            <button
              onClick={() => setMarket('local')}
              style={{
                ...styles.marketBtn,
                ...(isLocal ? styles.marketBtnActive : styles.marketBtnInactive)
              }}
            >
              🇵🇰 Pakistan (PKR)
            </button>
            <button
              onClick={() => setMarket('global')}
              style={{
                ...styles.marketBtn,
                ...(!isLocal ? styles.marketBtnActive : styles.marketBtnInactive)
              }}
            >
              🌍 International (USD)
            </button>
          </div>

          {/* Search Bar */}
          <div style={styles.searchWrapper}>
            <input
              type="text"
              style={styles.searchInput}
              placeholder="Search products..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
          </div>
        </div>
      </section>

      {/* Category Bar - Clean & Simple */}
      <div style={styles.catBar}>
        <div style={styles.catContainer}>
          {categories.map(cat => (
            <button
              key={cat}
              onClick={() => setActiveCat(cat)}
              style={{
                ...styles.catBtn,
                ...(validCat === cat ? styles.catBtnActive : {})
              }}
            >
              {cat === 'all' ? 'All Products' : cat}
            </button>
          ))}
        </div>
      </div>

      {/* Main Content */}
      <main style={styles.main}>
        {/* Stats & Controls */}
        <div style={styles.controls}>
          <p style={styles.stats}>
            {sortedProducts.length} {sortedProducts.length === 1 ? 'product' : 'products'} found
          </p>
          
          <select
            value={sortBy}
            onChange={(e) => setSortBy(e.target.value)}
            style={styles.sortSelect}
          >
            <option value="newest">Newest First</option>
            <option value="price-asc">Price: Low to High</option>
            <option value="price-desc">Price: High to Low</option>
            <option value="name">Name: A to Z</option>
          </select>
        </div>

        {/* Loading State */}
        {loading && (
          <div style={styles.loadingGrid}>
            {[...Array(6)].map((_, i) => (
              <div key={i} style={styles.skeletonCard} />
            ))}
          </div>
        )}

        {/* Empty State */}
        {!loading && sortedProducts.length === 0 && (
          <div style={styles.emptyState}>
            <p style={styles.emptyIcon}>🔍</p>
            <h3 style={styles.emptyTitle}>No products found</h3>
            <p style={styles.emptyText}>
              {market === 'global' && !search && validCat === 'all'
                ? 'No international products available. Switch to Pakistan mode to explore local products.'
                : 'Try adjusting your search or category filter.'}
            </p>
            <button onClick={() => { setSearch(''); setActiveCat('all'); }} style={styles.resetBtn}>
              Clear Filters
            </button>
          </div>
        )}

        {/* Product Grid */}
        {!loading && sortedProducts.length > 0 && (
          <>
            <div style={styles.grid}>
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
              const validRecent = recentlyViewed.filter(rp => 
                products.some(p => p._id === rp._id)
              );
              if (validRecent.length === 0) return null;
              
              return (
                <div style={styles.recentSection}>
                  <h3 style={styles.recentTitle}>
                    🕐 Recently Viewed
                    <span style={styles.recentCount}>{validRecent.length}</span>
                  </h3>
                  <div style={styles.recentGrid}>
                    {validRecent.slice(0, 4).map(product => (
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
          </>
        )}
      </main>

      <style>{`
        * {
          margin: 0;
          padding: 0;
          box-sizing: border-box;
        }
        
        body {
          font-family: 'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif;
        }
        
        @keyframes fadeIn {
          from { opacity: 0; transform: translateY(10px); }
          to { opacity: 1; transform: translateY(0); }
        }
        
        .product-grid > * {
          animation: fadeIn 0.3s ease-out;
        }
      `}</style>
    </div>
  );
}

const styles = {
  page: {
    minHeight: '100vh',
    background: '#f8fafc',
  },
  
  // Hero Section
  hero: {
    background: 'linear-gradient(135deg, #0a3622 0%, #064e3b 100%)',
    padding: '48px 24px 64px',
    position: 'relative',
  },
  heroContent: {
    maxWidth: '900px',
    margin: '0 auto',
    textAlign: 'center',
  },
  title: {
    fontSize: 'clamp(36px, 5vw, 52px)',
    fontWeight: '800',
    color: '#fff',
    lineHeight: '1.2',
    marginBottom: '16px',
    letterSpacing: '-0.02em',
  },
  titleAccent: {
    color: '#6ee7b7',
    display: 'inline-block',
  },
  subtitle: {
    fontSize: '16px',
    color: 'rgba(255,255,255,0.8)',
    marginBottom: '32px',
    lineHeight: '1.6',
  },
  marketToggle: {
    display: 'flex',
    gap: '12px',
    justifyContent: 'center',
    marginBottom: '32px',
    flexWrap: 'wrap',
  },
  marketBtn: {
    padding: '10px 24px',
    borderRadius: '40px',
    fontSize: '14px',
    fontWeight: '600',
    cursor: 'pointer',
    transition: 'all 0.2s',
    border: 'none',
  },
  marketBtnActive: {
    background: '#fff',
    color: '#059669',
    boxShadow: '0 2px 8px rgba(0,0,0,0.1)',
  },
  marketBtnInactive: {
    background: 'rgba(255,255,255,0.2)',
    color: '#fff',
  },
  searchWrapper: {
    maxWidth: '500px',
    margin: '0 auto',
  },
  searchInput: {
    width: '100%',
    padding: '14px 20px',
    borderRadius: '40px',
    border: 'none',
    fontSize: '14px',
    outline: 'none',
    boxShadow: '0 4px 12px rgba(0,0,0,0.1)',
  },
  
  // Category Bar
  catBar: {
    background: '#fff',
    borderBottom: '1px solid #eef2f6',
    position: 'sticky',
    top: 0,
    zIndex: 100,
  },
  catContainer: {
    maxWidth: '1280px',
    margin: '0 auto',
    padding: '12px 24px',
    display: 'flex',
    gap: '8px',
    overflowX: 'auto',
    scrollbarWidth: 'thin',
  },
  catBtn: {
    padding: '8px 20px',
    borderRadius: '40px',
    fontSize: '13px',
    fontWeight: '600',
    cursor: 'pointer',
    transition: 'all 0.2s',
    border: '1px solid #e2e8f0',
    background: '#fff',
    color: '#475569',
    whiteSpace: 'nowrap',
  },
  catBtnActive: {
    background: '#059669',
    borderColor: '#059669',
    color: '#fff',
  },
  
  // Main Content
  main: {
    maxWidth: '1280px',
    margin: '0 auto',
    padding: '32px 24px',
  },
  controls: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: '32px',
    flexWrap: 'wrap',
    gap: '16px',
  },
  stats: {
    fontSize: '14px',
    color: '#64748b',
    fontWeight: '500',
  },
  sortSelect: {
    padding: '8px 16px',
    borderRadius: '8px',
    border: '1px solid #e2e8f0',
    fontSize: '13px',
    background: '#fff',
    cursor: 'pointer',
  },
  
  // Grid Layout
  grid: {
    display: 'grid',
    gridTemplateColumns: 'repeat(auto-fill, minmax(260px, 1fr))',
    gap: '24px',
    marginBottom: '48px',
  },
  
  // Loading Skeleton
  loadingGrid: {
    display: 'grid',
    gridTemplateColumns: 'repeat(auto-fill, minmax(260px, 1fr))',
    gap: '24px',
  },
  skeletonCard: {
    height: '380px',
    background: '#fff',
    borderRadius: '12px',
    border: '1px solid #eef2f6',
    animation: 'pulse 1.5s ease-in-out infinite',
  },
  
  // Empty State
  emptyState: {
    textAlign: 'center',
    padding: '80px 24px',
    background: '#fff',
    borderRadius: '16px',
  },
  emptyIcon: {
    fontSize: '64px',
    marginBottom: '16px',
  },
  emptyTitle: {
    fontSize: '20px',
    fontWeight: '600',
    color: '#1e293b',
    marginBottom: '8px',
  },
  emptyText: {
    fontSize: '14px',
    color: '#64748b',
    marginBottom: '24px',
  },
  resetBtn: {
    padding: '10px 24px',
    background: '#059669',
    color: '#fff',
    border: 'none',
    borderRadius: '8px',
    fontSize: '14px',
    fontWeight: '600',
    cursor: 'pointer',
  },
  
  // Recently Viewed
  recentSection: {
    marginTop: '32px',
    paddingTop: '32px',
    borderTop: '1px solid #eef2f6',
  },
  recentTitle: {
    fontSize: '18px',
    fontWeight: '700',
    color: '#1e293b',
    marginBottom: '20px',
    display: 'flex',
    alignItems: 'center',
    gap: '10px',
  },
  recentCount: {
    fontSize: '13px',
    fontWeight: '500',
    color: '#64748b',
    background: '#f1f5f9',
    padding: '2px 10px',
    borderRadius: '20px',
  },
  recentGrid: {
    display: 'grid',
    gridTemplateColumns: 'repeat(auto-fill, minmax(260px, 1fr))',
    gap: '24px',
  },
};

// Add pulse animation to global styles
const styleSheet = document.createElement('style');
styleSheet.textContent = `
  @keyframes pulse {
    0%, 100% { opacity: 1; }
    50% { opacity: 0.5; }
  }
`;
document.head.appendChild(styleSheet);
