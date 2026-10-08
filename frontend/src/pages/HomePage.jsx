// frontend/src/pages/HomePage.jsx
import { useState, useEffect, useCallback } from 'react';
import { useSearchParams } from 'react-router-dom';
import API, { API_BASE } from '../utils/axiosConfig';
import ProductCard from '../components/ProductCard';
import HomeHero from './home/HomeHero';
import HomeFeatureSection from './home/HomeFeatureSection';
import HomeCategoryBar from './home/HomeCategoryBar';
import HomeProductCatalog from './home/HomeProductCatalog';
import HomeStyles from './home/HomeStyles';
import { getHomePageStyles } from './home/homePageStyles';
import { useCart } from '../context/CartContext';
import { useAuth } from '../context/AuthContext';
import { formatPKR, formatUSD } from '../utils/priceUtils';

const MARKET_KEY = 'ic_market_mode';
const BRAND_NAME = 'IndusCart Valley';
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
  const [searchParams] = useSearchParams();
  const { addToCart, recentlyViewed = [], addToRecentlyViewed = () => {} } = useCart();
  const { user } = useAuth();

  const [products, setProducts] = useState([]);
  const [allCategories, setAllCategories] = useState([]);
  const [allSubcategories, setAllSubcategories] = useState([]);
  const [pagination, setPagination] = useState({ page:1, pageSize:24, total:0, pages:0 });
  const [page, setPage] = useState(1);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState('');
  const [search, setSearch] = useState(() => searchParams.get('search') || '');
  const [debouncedSearch, setDebouncedSearch] = useState('');
  const [activeCat, setActiveCat] = useState('all');
  const [activeSub, setActiveSub] = useState('all');
  const [sortBy, setSortBy] = useState('newest');
  const [minPrice, setMinPrice] = useState('');
  const [maxPrice, setMaxPrice] = useState('');
  const [market, setMarket] = useState(() => localStorage.getItem(MARKET_KEY) || 'local');
  const [internationalEnabled, setInternationalEnabled] = useState(true);
  const [marketSettingsLoaded, setMarketSettingsLoaded] = useState(false);
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

  useEffect(() => {
    setSearch(searchParams.get('search') || '');
  }, [searchParams]);

  useEffect(() => {
    let active = true;
    API.get('/api/settings/public')
      .then(({ data }) => {
        if (!active) return;
        const enabled = data?.internationalEnabled !== false;
        setInternationalEnabled(enabled);
        if (!enabled) {
          setMarket('local');
          localStorage.setItem(MARKET_KEY, 'local');
        }
      })
      .catch(() => { if (active) setInternationalEnabled(true); })
      .finally(() => { if (active) setMarketSettingsLoaded(true); });
    return () => { active = false; };
  }, []);

  const categories = ['all', ...new Set(allCategories.filter(value => typeof value === 'string' && value).sort((a, b) => a.localeCompare(b)))];

  // Ensure activeCat is valid
  const validCat = categories.includes(activeCat) ? activeCat : 'all';
  const subcategories = ['all', ...new Set([...(CATEGORY_TREE[validCat] || []), ...allSubcategories.filter(value => typeof value === 'string' && value)].filter(Boolean).sort((a, b) => a.localeCompare(b)))];
  const validSub = subcategories.includes(activeSub) ? activeSub : 'all';
  const hasFilters = Boolean(search.trim() || validCat !== 'all' || validSub !== 'all' || minPrice || maxPrice);

  useEffect(() => {
    const timer = setTimeout(() => setDebouncedSearch(search.trim()), 280);
    return () => clearTimeout(timer);
  }, [search]);

  useEffect(() => { setPage(1); }, [validCat, validSub, market, debouncedSearch, minPrice, maxPrice, sortBy]);

  useEffect(() => {
    API.get('/api/products/categories').then(({ data }) => setAllCategories(Array.isArray(data) ? data.filter(value => typeof value === 'string') : [])).catch(() => {});
  }, []);

  useEffect(() => {
    let active = true;
    API.get(`/api/products/subcategories${validCat !== 'all' ? `?category=${encodeURIComponent(validCat)}` : ''}`)
      .then(({ data }) => { if (active) setAllSubcategories(Array.isArray(data) ? data.filter(value => typeof value === 'string') : []); }).catch(() => {});
    return () => { active = false; };
  }, [validCat]);

  const fetchProducts = useCallback(async () => {
    if (!marketSettingsLoaded) return;
    setLoading(true);
    setLoadError('');
    try {
      const params = new URLSearchParams();
      if (validCat !== 'all') params.set('category', validCat);
      if (validSub !== 'all') params.set('subcategory', validSub);
      if (market === 'global') params.set('isLocal', 'false');
      if (debouncedSearch) params.set('search', debouncedSearch);
      if (minPrice !== '') params.set('minPrice', minPrice);
      if (maxPrice !== '') params.set('maxPrice', maxPrice);
      params.set('sort', sortBy);
      params.set('currency', market === 'local' ? 'PKR' : 'USD');
      params.set('page', String(page));
      params.set('limit', '24');
      const res = await API.get(`/api/products?${params}`);
      const items = Array.isArray(res.data) ? res.data : res.data.items || [];
      setProducts(items);
      setPagination(res.data.pagination || { page:1, pageSize:items.length, total:items.length, pages:1 });
    } catch (err) {
      console.error('Failed to fetch products:', err);
      setLoadError(`Cannot connect to the store server at ${API_BASE}. Check that the phone and computer use the same Wi-Fi, then try again.`);
    } finally {
      setLoading(false);
    }
  }, [marketSettingsLoaded, validCat, validSub, market, debouncedSearch, minPrice, maxPrice, sortBy, page]);

  useEffect(() => {
    fetchProducts();
  }, [fetchProducts]);

  const chooseMarket = useCallback((next) => {
    if (next === 'global' && !internationalEnabled) return;
    localStorage.setItem(MARKET_KEY, next);
    setMarket(next);
  }, [internationalEnabled]);

  const isLocal = market === 'local';

  const sortedProducts = products;

  const currentProductsById = new Map(products.map(product => [product._id, product]));
  // Recent history is independent of the active catalog filters: filtering to
  // Fruit should not hide a Honey item the customer viewed earlier.
  const validRecentlyViewed = recentlyViewed
    .map(product => currentProductsById.get(product._id))
    .filter(Boolean);

  const getDisplayPrice = (product) => {
    return isLocal ? formatPKR(product.pricePKR) : formatUSD(product.priceUSD);
  };

    const styles = getHomePageStyles(isDarkTheme);

  return (
    <div className="home-page" style={styles.page}>
      {/* Hero Section */}
      <HomeHero {...{ BRAND_NAME, chooseMarket, internationalEnabled, isLocal, marketSettingsLoaded, search, setSearch, styles }} />

      <HomeFeatureSection {...{ styles }} />

      {/* Category Bar */}
      <HomeCategoryBar {...{ categories, setActiveCat, setActiveSub, styles, subcategories, validCat, validSub }} />

      {/* Main Content */}
      <HomeProductCatalog {...{ ProductCard, addToCart, addToRecentlyViewed, fetchProducts, hasFilters, isDarkTheme, isLocal, loadError, loading, market, maxPrice, minPrice, page, pagination, search, setActiveCat, setActiveSub, setMaxPrice, setMinPrice, setPage, setSearch, setSortBy, sortBy, sortedProducts, styles, validCat, validRecentlyViewed, validSub }} />

      {/* ✅ ALL animations defined here — no module-level document.head injection */}
      <HomeStyles {...{  }} />
    </div>
  );
}
