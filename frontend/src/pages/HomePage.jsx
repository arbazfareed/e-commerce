// frontend/src/pages/HomePage.jsx
import { useState, useEffect, useCallback } from 'react';
import API, { API_BASE } from '../utils/axiosConfig';
import ProductCard from '../components/ProductCard';
import { useCart } from '../context/CartContext';
import { useAuth } from '../context/AuthContext';
import { formatPKR, formatUSD, getActiveDiscountPercent, getDiscountedPrice } from '../utils/priceUtils';

const MARKET_KEY = 'ic_market_mode';
const BRAND_NAME = 'IndusCart Ritual';
const CATEGORY_TREE = {
  Electronics: ['Laptops', 'Phones', 'Audio', 'Accessories'],
  Fashion: ['Men', 'Women', 'Children', 'Accessories'],
  Home: ['Decor', 'Kitchen', 'Furniture', 'Textiles'],
  Beauty: ['Skincare', 'Haircare', 'Fragrance', 'Makeup'],
  Food: ['Honey', 'Spices', 'Snacks', 'Beverages'],
  Crafts: ['Pottery', 'Woodwork', 'Textiles', 'Jewellery'],
  Books: ['Fiction', 'Education', 'Children', 'Local Authors'],
};

export default function HomePage() {
  const { addToCart, recentlyViewed = [], addToRecentlyViewed = () => {} } = useCart();
  const { user } = useAuth();

  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState('');
  const [search, setSearch] = useState('');
  const [activeCat, setActiveCat] = useState('all');
  const [activeSub, setActiveSub] = useState('all');
  const [sortBy, setSortBy] = useState('newest');
  const [market, setMarket] = useState(() => localStorage.getItem(MARKET_KEY) || 'local');
  const [themeMode, setThemeMode] = useState(() => document.documentElement.dataset.theme === 'dark' ? 'dark' : 'light');

  useEffect(() => {
    const syncTheme = () => {
      const next = document.documentElement.dataset.theme === 'dark' ? 'dark' : 'light';
      setThemeMode(next);
    };

    syncTheme();
    const observer = new MutationObserver(syncTheme);
    observer.observe(document.documentElement, { attributes: true, attributeFilter: ['data-theme'] });
    return () => observer.disconnect();
  }, []);

  const isDarkTheme = themeMode === 'dark';

  // Derive unique categories from products (auto-updates when products change)
  const categories = ['all', ...new Set(
    products.map(p => p.category).filter(Boolean).sort((a, b) => a.localeCompare(b))
  )];

  // Ensure activeCat is valid
  const validCat = categories.includes(activeCat) ? activeCat : 'all';
  const subcategories = ['all', ...new Set([
    ...(CATEGORY_TREE[validCat] || []),
    ...products
    .filter(p => validCat === 'all' || p.category === validCat)
    .map(p => p.subcategory).filter(Boolean),
  ].sort((a, b) => a.localeCompare(b)))];
  const validSub = subcategories.includes(activeSub) ? activeSub : 'all';
  const hasFilters = Boolean(search.trim() || validCat !== 'all' || validSub !== 'all');

  const fetchProducts = useCallback(async () => {
    setLoading(true);
    setLoadError('');
    try {
      const res = await API.get('/api/products');
      setProducts(res.data);
    } catch (err) {
      console.error('Failed to fetch products:', err);
      setLoadError(`Cannot connect to the store server at ${API_BASE}. Check that the phone and computer use the same Wi-Fi, then try again.`);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchProducts();
  }, [fetchProducts]);

  const chooseMarket = useCallback((next) => {
    localStorage.setItem(MARKET_KEY, next);
    setMarket(next);
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
    const matchesSubcategory = validSub === 'all' || p.subcategory === validSub;

    // Market filter
    const matchesMarket = isLocal ? true : !p.isLocal;

    return matchesSearch && matchesCategory && matchesSubcategory && matchesMarket;
  });

  // Sort products
  const sortedProducts = [...filteredProducts].sort((a, b) => {
    if (sortBy === 'newest') {
      return new Date(b.createdAt || 0).getTime() - new Date(a.createdAt || 0).getTime();
    }
    if (sortBy === 'price-asc') {
      const currency = isLocal ? 'PKR' : 'USD';
      const priceA = getDiscountedPrice(isLocal ? a.pricePKR : a.priceUSD, getActiveDiscountPercent(a), currency);
      const priceB = getDiscountedPrice(isLocal ? b.pricePKR : b.priceUSD, getActiveDiscountPercent(b), currency);
      return priceA - priceB;
    }
    if (sortBy === 'price-desc') {
      const currency = isLocal ? 'PKR' : 'USD';
      const priceA = getDiscountedPrice(isLocal ? a.pricePKR : a.priceUSD, getActiveDiscountPercent(a), currency);
      const priceB = getDiscountedPrice(isLocal ? b.pricePKR : b.priceUSD, getActiveDiscountPercent(b), currency);
      return priceB - priceA;
    }
    if (sortBy === 'name') {
      return String(a.name || '').localeCompare(String(b.name || ''), undefined, { sensitivity: 'base' });
    }
    return 0;
  });

  const getDisplayPrice = (product) => {
    return isLocal ? formatPKR(product.pricePKR) : formatUSD(product.priceUSD);
  };

  const styles = {
    page: {
      minHeight: '100vh',
      background: '#f8fafc',
    },
    hero: {
      backgroundColor: '#0a1715',
      backgroundImage: "linear-gradient(120deg, rgba(5, 19, 16, 0.92) 0%, rgba(16, 56, 48, 0.86) 42%, rgba(62, 52, 24, 0.58) 100%), url('/hero-cover.jpg')",
      backgroundPosition: 'center 46%',
      backgroundSize: 'cover',
      padding: '66px 24px 42px',
      position: 'relative',
      overflow: 'hidden',
      boxShadow: 'inset 0 1px 0 rgba(255,255,255,0.08)',
    },
    heroGlow: {
      position: 'absolute',
      width: '600px',
      height: '600px',
      right: '-200px',
      top: '-260px',
      borderRadius: '50%',
      background: 'radial-gradient(circle, rgba(212, 170, 94, 0.28), rgba(17, 49, 44, 0.08) 60%, transparent 72%)',
      filter: 'blur(2px)',
    },
    heroContent: {
      maxWidth: '1240px',
      margin: '0 auto',
      position: 'relative',
      zIndex: 1,
      display: 'grid',
      gridTemplateColumns: '1.2fr 0.8fr',
      gap: '22px',
      alignItems: 'center',
    },
    heroCopy: {
      maxWidth: '680px',
    },
    heroShell: {
      display: 'flex',
      justifyContent: 'flex-end',
      pointerEvents: 'none',
    },
    heroGlassCard: {
      width: '100%',
      maxWidth: '380px',
      borderRadius: '28px',
      padding: '18px',
      background: isDarkTheme ? 'linear-gradient(135deg, rgba(12,22,18,0.82), rgba(11,37,29,0.78))' : 'linear-gradient(135deg, rgba(255,255,255,0.20), rgba(255,255,255,0.08))',
      border: isDarkTheme ? '1px solid rgba(123,225,173,0.22)' : '1px solid rgba(255,255,255,0.20)',
      backdropFilter: 'blur(18px)',
      WebkitBackdropFilter: 'blur(18px)',
      boxShadow: '0 30px 64px rgba(7, 25, 23, 0.36), inset 0 1px 0 rgba(255,255,255,0.18)',
      color: '#fff',
    },
    heroGlassHeader: {
      display: 'flex',
      alignItems: 'center',
      gap: '10px',
      marginBottom: '18px',
    },
    heroGlyph: {
      display: 'inline-flex',
      alignItems: 'center',
      justifyContent: 'center',
      width: '30px',
      height: '30px',
      borderRadius: '10px',
      background: 'linear-gradient(135deg, rgba(212,170,94,0.35), rgba(255,255,255,0.14))',
      border: '1px solid rgba(255,255,255,0.18)',
      color: '#f9eec5',
      fontWeight: 800,
    },
    heroGlassTitle: {
      fontSize: '12px',
      textTransform: 'uppercase',
      letterSpacing: '1.1px',
      color: '#f5e3a8',
    },
    heroGlassGrid: {
      display: 'grid',
      gridTemplateColumns: 'repeat(2, minmax(0, 1fr))',
      gap: '12px',
    },
    heroGlassMetric: {
      padding: '12px 14px',
      borderRadius: '14px',
      background: 'rgba(255,255,255,0.08)',
      border: '1px solid rgba(255,255,255,0.12)',
    },
    heroMetricLabel: {
      display: 'block',
      fontSize: '9px',
      fontWeight: 700,
      letterSpacing: '0.9px',
      textTransform: 'uppercase',
      color: 'rgba(255,255,255,0.66)',
      marginBottom: '6px',
    },
    heroMetricValue: {
      fontSize: '16px',
      fontWeight: 800,
      color: '#ffffff',
      letterSpacing: '-0.03em',
    },
    eyebrow: {
      display: 'inline-flex',
      padding: '7px 13px',
      borderRadius: '999px',
      background: 'linear-gradient(135deg, rgba(255,255,255,0.18), rgba(194,220,200,0.12))',
      border: '1px solid rgba(212, 230, 219, 0.22)',
      color: '#fcedbf',
      fontSize: '12px',
      fontWeight: '700',
      letterSpacing: '0.2px',
      marginBottom: '15px',
      boxShadow: '0 10px 22px rgba(11, 58, 42, 0.12)',
    },
    title: {
      fontSize: 'clamp(40px, 5vw, 62px)',
      fontWeight: '800',
      color: '#fff',
      lineHeight: '1.08',
      marginBottom: '15px',
      letterSpacing: '-0.055em',
    },
    titleAccent: {
      color: '#f4d57f',
      display: 'inline-block',
      textShadow: '0 12px 28px rgba(244, 213, 127, 0.20)',
    },
    subtitle: {
      fontSize: '16px',
      color: 'rgba(255,255,255,0.84)',
      marginBottom: '22px',
      lineHeight: '1.65',
      maxWidth: '520px',
    },
    heroActions: {
      display: 'flex',
      alignItems: 'center',
      flexWrap: 'wrap',
      gap: '16px',
      marginBottom: '0',
    },
    exploreBtn: {
      border: isDarkTheme ? '1px solid rgba(255,255,255,0.16)' : '1px solid rgba(255,255,255,0.22)',
      borderRadius: '13px',
      padding: '14px 20px',
      background: 'linear-gradient(135deg, #f5d27c 0%, #d79b47 100%)',
      color: '#1d261d',
      fontSize: '13px',
      fontWeight: '800',
      cursor: 'pointer',
      boxShadow: '0 16px 32px rgba(208, 153, 67, 0.36)',
    },
    deliveryNote: {
      color: isDarkTheme ? 'rgba(255,255,255,0.82)' : 'rgba(255,255,255,0.78)',
      fontSize: '12px',
      fontWeight: '600',
    },
    heroStats: {
      display: 'flex',
      flexWrap: 'wrap',
      gap: '12px 22px',
      color: 'rgba(255,255,255,0.7)',
      fontSize: '11px',
    },
    heroStat: {
      color: '#fff',
    },
    heroTools: {
      maxWidth: '1240px',
      margin: '34px auto 0',
      position: 'relative',
      zIndex: 1,
    },
    featureSection: {
      maxWidth: '1280px',
      margin: '-18px auto 0',
      padding: '0 24px',
      position: 'relative',
      zIndex: 2,
    },
    featureGrid: {
      display: 'grid',
      gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))',
      gap: '18px',
    },
    featureCard: {
      background: isDarkTheme ? 'linear-gradient(180deg, rgba(15,24,20,0.96), rgba(17,31,26,0.96))' : 'linear-gradient(180deg, rgba(255,255,255,0.98), rgba(240,252,245,0.96))',
      border: isDarkTheme ? '1px solid rgba(125,173,156,0.18)' : '1px solid rgba(20,100,70,0.12)',
      borderRadius: '20px',
      padding: '18px 18px',
      display: 'flex',
      alignItems: 'flex-start',
      gap: '12px',
      boxShadow: isDarkTheme ? '0 18px 30px rgba(0, 0, 0, 0.18)' : '0 18px 30px rgba(11, 58, 42, 0.075)',
      backdropFilter: 'blur(10px)',
    },
    featureIcon: {
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      width: '42px',
      height: '42px',
      background: 'linear-gradient(135deg, #edfdf4, #daf7e7)',
      borderRadius: '12px',
      fontSize: '20px',
      flexShrink: 0,
      boxShadow: 'inset 0 0 0 1px rgba(26,127,93,0.08)',
    },
    featureTitle: {
      margin: '0 0 4px',
      fontSize: '15px',
      fontWeight: '800',
      color: isDarkTheme ? '#edf9f1' : '#0d2a22',
    },
    featureText: {
      margin: 0,
      fontSize: '12px',
      lineHeight: 1.55,
      color: isDarkTheme ? '#b2c5ba' : '#5e6e66',
    },
    marketToggle: {
      display: 'flex',
      gap: '12px',
      justifyContent: 'flex-start',
      marginBottom: '14px',
      flexWrap: 'wrap',
    },
    marketBtn: {
      display: 'inline-flex',
      alignItems: 'center',
      justifyContent: 'center',
      gap: '10px',
      padding: '12px 26px',
      borderRadius: '40px',
      fontSize: '14px',
      fontWeight: '600',
      cursor: 'pointer',
      transition: 'all 0.2s ease',
      border: 'none',
      minWidth: '220px',
      lineHeight: 1.2,
    },
    marketBtnActive: {
      background: '#2c4842',
      color: '#ffffff',
      boxShadow: '0 8px 18px rgba(15, 31, 27, 0.18)',
      border: '1px solid rgba(255,255,255,0.18)',
      fontWeight: 800,
    },
    marketBtnInactive: {
      background: isDarkTheme ? 'rgba(28, 39, 35, 0.94)' : 'rgba(255,255,255,0.12)',
      color: isDarkTheme ? '#edf8f3' : '#edfdf4',
      border: isDarkTheme ? '1px solid rgba(157, 179, 170, 0.24)' : '1px solid rgba(255,255,255,0.12)',
      fontWeight: 700,
      boxShadow: isDarkTheme ? 'inset 0 0 0 1px rgba(255,255,255,0.02)' : 'none',
    },
    searchWrapper: {
      maxWidth: '620px',
      position: 'relative',
    },
    searchInput: {
      width: '100%',
      padding: '15px 20px 15px 47px',
      borderRadius: '12px',
      border: isDarkTheme ? '1px solid rgba(128, 176, 160, 0.2)' : 'none',
      background: isDarkTheme ? 'rgba(14, 25, 20, 0.9)' : '#fff',
      color: isDarkTheme ? '#edf9f1' : '#1f2937',
      fontSize: '14px',
      outline: 'none',
      boxShadow: isDarkTheme ? '0 12px 24px rgba(2, 6, 4, 0.24)' : '0 12px 24px rgba(11, 58, 42, 0.14)',
    },
    searchIcon: {
      position: 'absolute',
      left: '18px',
      top: '10px',
      color: isDarkTheme ? '#9fe7c0' : '#0d5c42',
      fontSize: '26px',
      lineHeight: 1,
      zIndex: 1,
    },
    catBar: {
      background: isDarkTheme ? '#101d18' : '#fff',
      borderBottom: isDarkTheme ? '1px solid rgba(123, 164, 146, 0.18)' : '1px solid #eef2f6',
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
      border: isDarkTheme ? '1px solid rgba(143, 170, 159, 0.18)' : '1px solid #e2e8f0',
      background: isDarkTheme ? '#14261d' : '#fff',
      color: isDarkTheme ? '#dfece5' : '#475569',
      whiteSpace: 'nowrap',
    },
    catBtnActive: {
      background: 'linear-gradient(135deg, #0e8f6a, #0a6b50)',
      borderColor: '#0d7c60',
      color: '#f0fff8',
      boxShadow: '0 10px 20px rgba(10,107,80,0.18)',
    },
    subcatBar: {
      background: isDarkTheme ? '#0f1b16' : '#f8fafc',
      borderBottom: isDarkTheme ? '1px solid rgba(123, 164, 146, 0.18)' : '1px solid #eef2f6',
    },
    subcatContainer: {
      maxWidth: '1280px',
      margin: '0 auto',
      padding: '8px 24px',
      display: 'flex',
      gap: '7px',
      overflowX: 'auto',
    },
    subcatBtn: {
      padding: '6px 13px',
      borderRadius: '8px',
      fontSize: '11px',
      fontWeight: '700',
      cursor: 'pointer',
      border: isDarkTheme ? '1px solid rgba(143, 170, 159, 0.18)' : '1px solid transparent',
      background: isDarkTheme ? '#14261d' : 'transparent',
      color: isDarkTheme ? '#cfe2d9' : '#64748b',
      whiteSpace: 'nowrap',
    },
    subcatBtnActive: {
      background: 'linear-gradient(135deg, #e7f7ef, #d9f1ea)',
      color: '#0b5d45',
      borderColor: '#a8dcc3',
      boxShadow: 'inset 0 0 0 1px rgba(45, 122, 99, 0.08)',
    },
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
      color: isDarkTheme ? '#bacac0' : '#64748b',
      fontWeight: '500',
    },
    sortSelect: {
      padding: '8px 16px',
      borderRadius: '8px',
      border: isDarkTheme ? '1px solid rgba(143, 170, 159, 0.18)' : '1px solid #e2e8f0',
      fontSize: '13px',
      background: isDarkTheme ? '#14261d' : '#fff',
      color: isDarkTheme ? '#edf9f1' : '#1f2937',
      cursor: 'pointer',
    },
    grid: {
      display: 'grid',
      gridTemplateColumns: 'repeat(auto-fill, minmax(230px, 1fr))',
      gap: '20px',
      marginBottom: '48px',
    },
    loadingGrid: {
      display: 'grid',
      gridTemplateColumns: 'repeat(auto-fill, minmax(230px, 1fr))',
      gap: '20px',
    },
    skeletonCard: {
      height: '380px',
      background: isDarkTheme ? '#14261d' : '#fff',
      borderRadius: '12px',
      border: isDarkTheme ? '1px solid rgba(143, 170, 159, 0.18)' : '1px solid #eef2f6',
      animation: 'pulse 1.5s ease-in-out infinite',
    },
    emptyState: {
      textAlign: 'center',
      padding: '80px 24px',
      background: isDarkTheme ? '#132018' : '#fff',
      borderRadius: '16px',
      border: isDarkTheme ? '1px solid rgba(143, 170, 159, 0.18)' : '1px solid transparent',
    },
    emptyIcon: {
      fontSize: '64px',
      marginBottom: '16px',
    },
    emptyTitle: {
      fontSize: '20px',
      fontWeight: '600',
      color: isDarkTheme ? '#edf9f1' : '#1e293b',
      marginBottom: '8px',
    },
    emptyText: {
      fontSize: '14px',
      color: isDarkTheme ? '#bacac0' : '#64748b',
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
      gridTemplateColumns: 'repeat(auto-fill, minmax(230px, 1fr))',
      gap: '20px',
    },
  };

  return (
    <div className="home-page" style={styles.page}>
      {/* Hero Section */}
      <section className="hero" style={styles.hero}>
        <div style={styles.heroGlow} />
        <div className="hero-content" style={styles.heroContent}>
          <div className="hero-copy" style={styles.heroCopy}>
            <div style={styles.eyebrow}>🇵🇰 {BRAND_NAME} • Luxury skincare & home rituals</div>
            <h1 style={styles.title}>
              Rituals for
              <br />
              <span style={styles.titleAccent}>softer, richer living.</span>
            </h1>
            <p style={styles.subtitle}>
              Thoughtful finds for a slower, richer life—discover refined skincare, body rituals, and elevated home essentials crafted to calm the senses and enrich everyday routines.
            </p>
            <div className="hero-actions" style={styles.heroActions}>
              <button
                type="button"
                style={styles.exploreBtn}
                onClick={() => document.getElementById('shop-collection')?.scrollIntoView({ behavior: 'smooth' })}
              >
                Shop the collection <span aria-hidden="true">↓</span>
              </button>
              <span style={styles.deliveryNote}>Free shipping over PKR 10,000 • Trusted checkout</span>
            </div>
            <div className="hero-stats" style={styles.heroStats}>
              <span style={styles.heroStat}><strong>4.9/5</strong> customer rating</span>
              <span style={styles.heroStat}><strong>24h</strong> dispatch support</span>
              <span style={styles.heroStat}><strong>2k+</strong> happy shoppers</span>
            </div>
          </div>

          <div className="hero-shell" style={styles.heroShell}>
            <div style={styles.heroGlassCard}>
              <div style={styles.heroGlassHeader}>
                <span style={styles.heroGlyph}>✦</span>
                <strong style={styles.heroGlassTitle}>Ritual curation</strong>
              </div>
              <div style={styles.heroGlassGrid}>
                <div style={styles.heroGlassMetric}>
                  <span style={styles.heroMetricLabel}>Top ritual</span>
                  <strong style={styles.heroMetricValue}>Glow care</strong>
                </div>
                <div style={styles.heroGlassMetric}>
                  <span style={styles.heroMetricLabel}>Repeat buyers</span>
                  <strong style={styles.heroMetricValue}>63%</strong>
                </div>
                <div style={styles.heroGlassMetric}>
                  <span style={styles.heroMetricLabel}>Avg. order</span>
                  <strong style={styles.heroMetricValue}>Rs 8,400</strong>
                </div>
                <div style={styles.heroGlassMetric}>
                  <span style={styles.heroMetricLabel}>Loyalty</span>
                  <strong style={styles.heroMetricValue}>A+</strong>
                </div>
              </div>
            </div>
          </div>
        </div>

        <div className="hero-tools" style={styles.heroTools}>
          {/* Market Toggle */}
          <div className="market-toggle" style={styles.marketToggle}>
            <button
              type="button"
              aria-pressed={isLocal}
              onClick={() => chooseMarket('local')}
              style={{
                ...styles.marketBtn,
                ...(isLocal ? styles.marketBtnActive : styles.marketBtnInactive)
              }}
            >
              🇵🇰 Pakistan (PKR)
            </button>
            <button
              type="button"
              aria-pressed={!isLocal}
              onClick={() => chooseMarket('global')}
              style={{
                ...styles.marketBtn,
                ...(!isLocal ? styles.marketBtnActive : styles.marketBtnInactive)
              }}
            >
              🌍 International (USD)
            </button>
          </div>

          {/* Search Bar */}
          <div className="search-wrapper" style={styles.searchWrapper}>
            <span style={styles.searchIcon} aria-hidden="true">⌕</span>
            <input
              type="text"
              className="search-input"
              aria-label="Search products"
              style={styles.searchInput}
              placeholder="Search products, crafts, categories..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
          </div>
        </div>
      </section>

      <section className="feature-section" style={styles.featureSection}>
        <div className="feature-grid" style={styles.featureGrid}>
          <div className="feature-card" style={styles.featureCard}>
            <span style={styles.featureIcon}>🌿</span>
            <div>
              <h3 style={styles.featureTitle}>Premium curation</h3>
              <p style={styles.featureText}>Thoughtfully selected products that bring quality, style, and everyday ease to your routine.</p>
            </div>
          </div>
          <div className="feature-card" style={styles.featureCard}>
            <span style={styles.featureIcon}>🚚</span>
            <div>
              <h3 style={styles.featureTitle}>Faster fulfillment</h3>
              <p style={styles.featureText}>Smooth shipping coordination and order visibility designed for a premium shopping experience.</p>
            </div>
          </div>
          <div className="feature-card" style={styles.featureCard}>
            <span style={styles.featureIcon}>💚</span>
            <div>
              <h3 style={styles.featureTitle}>Support local growth</h3>
              <p style={styles.featureText}>Every purchase supports quality makers, independent sellers, and meaningful local brands.</p>
            </div>
          </div>
        </div>
      </section>

      {/* Category Bar */}
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

      {/* Main Content */}
      <main id="shop-collection" className="main" style={styles.main}>
        {/* Stats & Controls */}
        <div className="controls collection-heading" style={styles.controls}>
          <div>
            <p className="collection-kicker">SHOP THE COLLECTION</p>
            <h2 className="collection-title">Find something meaningful</h2>
            <p style={styles.stats}>
              {sortedProducts.length} {sortedProducts.length === 1 ? 'product' : 'products'} found
            </p>
            {hasFilters && (
              <div className="active-filter-row" aria-label="Active filters">
                <span className="active-filter-chip">
                  {search.trim() ? `Search: “${search.trim()}”` : validSub !== 'all' ? validSub : validCat !== 'all' ? validCat : 'Filtered'}
                </span>
                <button type="button" className="clear-filters" onClick={() => { setSearch(''); setActiveCat('all'); setActiveSub('all'); }}>
                  Clear filters
                </button>
              </div>
            )}
          </div>

          <select
            value={sortBy}
            className="sort-select"
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
            <button onClick={() => { setSearch(''); setActiveCat('all'); setActiveSub('all'); }} style={styles.resetBtn}>
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
              const validRecent = recentlyViewed.filter(rp =>
                products.some(p => p._id === rp._id)
              );
              if (validRecent.length === 0) return null;

              return (
                <div className="recent-section" style={styles.recentSection}>
                  <h3 className="recent-title" style={styles.recentTitle}>
                    🕐 Recently Viewed
                    <span className="recent-count" style={styles.recentCount}>{validRecent.length}</span>
                  </h3>
                  <div className="product-row recent-product-row" style={styles.recentGrid}>
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

      {/* ✅ ALL animations defined here — no module-level document.head injection */}
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
          to   { opacity: 1; transform: translateY(0); }
        }

        @keyframes pulse {
          0%, 100% { opacity: 1; }
          50%       { opacity: 0.5; }
        }

        .product-grid > * {
          animation: fadeIn 0.3s ease-out;
        }

        @media (max-width: 760px) {
          .hero {
            padding-top: 42px !important;
            padding-left: 20px !important;
            padding-right: 20px !important;
            padding-bottom: 28px !important;
            background-position: 72% center !important;
          }

          .hero-content {
            grid-template-columns: 1fr !important;
            gap: 20px !important;
          }

          .hero-copy {
            max-width: 100% !important;
          }

          .hero-shell {
            justify-content: stretch !important;
            width: 100% !important;
          }

          .hero-shell > div {
            max-width: none !important;
            width: 100% !important;
          }

          .hero-copy > div:first-child {
            margin-bottom: 14px !important;
          }

          .hero-copy h1 {
            font-size: clamp(34px, 9vw, 48px) !important;
            line-height: 1.02 !important;
            letter-spacing: -0.055em !important;
            margin-bottom: 13px !important;
          }

          .hero-copy p {
            font-size: 14px !important;
            line-height: 1.65 !important;
            margin-bottom: 18px !important;
            max-width: 440px !important;
          }

          .hero-tools {
            margin-top: 22px !important;
            width: 100% !important;
          }

          .hero-tools .search-wrapper {
            max-width: none !important;
          }

          .hero-tools .market-toggle {
            display: grid !important;
            grid-template-columns: 1fr 1fr;
            gap: 8px !important;
          }

          .hero-tools .market-toggle button {
            flex: 1 1 auto;
            min-width: 0 !important;
            padding-left: 12px !important;
            padding-right: 12px !important;
            font-size: 12px !important;
          }

          .hero-copy .hero-stats {
            display: grid !important;
            grid-template-columns: 1fr !important;
            gap: 10px 12px !important;
          }

          .hero-copy .hero-actions {
            flex-direction: row !important;
            align-items: center !important;
            gap: 10px !important;
            margin-bottom: 0 !important;
          }

          .hero-copy .hero-actions button {
            width: auto !important;
          }

          .feature-section {
            margin-top: 8px !important;
            padding: 0 16px !important;
          }

          .feature-grid {
            grid-template-columns: 1fr !important;
            gap: 12px !important;
          }

          .feature-card {
            padding: 14px 14px !important;
          }

          .cat-container,
          .subcat-container {
            padding-left: 16px !important;
            padding-right: 16px !important;
          }

          .main {
            padding: 22px 16px 32px !important;
          }

          .controls {
            margin-bottom: 20px !important;
            align-items: stretch !important;
          }

          .sort-select {
            width: 100% !important;
          }

          .grid,
          .recent-grid {
            grid-template-columns: 1fr !important;
            gap: 16px !important;
          }
        }

        @media (min-width: 761px) and (max-width: 980px) {
          .hero-copy h1 {
            font-size: 48px !important;
          }

          .hero-content,
          .hero-tools {
            max-width: 920px !important;
          }
        }

        @media (max-width: 420px) {
          .hero {
            background-position: 68% center !important;
            min-height: 0;
            padding-top: 34px !important;
          }

          .hero-copy h1 {
            font-size: clamp(32px, 9.2vw, 40px) !important;
          }

          .hero-copy .hero-actions {
            align-items: center;
            flex-direction: row;
            gap: 10px !important;
            margin-bottom: 0 !important;
          }

          .hero-copy .hero-actions button {
            width: auto;
            padding: 12px 16px !important;
          }

          .hero-tools .market-toggle {
            grid-template-columns: 1fr !important;
          }

          .hero-tools .market-toggle button {
            flex-basis: 100%;
            width: 100%;
            min-width: 0 !important;
          }

          .hero-tools .search-input {
            font-size: 15px !important;
          }

          .cat-btn,
          .subcat-btn {
            font-size: 11px !important;
            padding-left: 12px !important;
            padding-right: 12px !important;
          }
        }
      `}</style>
    </div>
  );
}

