import { useState, useEffect, useRef, useCallback } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import BrandMark from '../components/BrandMark';
import { assetUrl } from '../utils/axiosConfig';
import { formatPKR, formatUSD, getActiveDiscountPercent, getDiscountedPrice, getWeightRates, saveWeightRates, getShippingRates, saveShippingRates, getUSDRate, saveUSDRate, pkrToUSD, getZoneRates, saveZoneRates, ZONE_LABELS } from '../utils/priceUtils';
import { CATEGORY_TREE, EMPTY_FORM, STATUS_CFG, STATUS_LIST } from './admin/adminConfig';
import { Badge, CategoryPicker, ImagePicker, MarketBadge, MarketPicker, Toast } from './admin/AdminPrimitives';
import { changeOwnPassword, createProduct, deleteProduct, getAdminData, getApiErrorMessage, getSalesAnalytics, getStoreSettings, getSupportTickets, recordManualCashSale, replyToSupportTicket, resetCustomerPassword, saveStoreSettings as persistStoreSettings, updateOrderStatus, updateProduct, updateSupportTicketStatus } from './admin/adminApi';

const THEME_KEY = 'ic_theme_preference';
const ADMIN_THEME_KEY = 'ic_admin_theme';

function readThemePreference() {
  try {
    const saved = localStorage.getItem(THEME_KEY) || localStorage.getItem(ADMIN_THEME_KEY);
    return saved === 'light' || saved === 'dark' ? saved : 'light';
  } catch {
    return 'light';
  }
}

/* ════════════════════════════════════════════════════════════ */
export default function AdminPage() {
  const { user, logout } = useAuth();
  const navigate         = useNavigate();
  const { section }      = useParams();
  const adminSections    = ['dashboard', 'products', 'add', 'orders', 'settings'];
  const savedSection     = localStorage.getItem('ic_admin_last_section');
  const initialSection   = adminSections.includes(section) ? section : adminSections.includes(savedSection) ? savedSection : 'dashboard';

  const [tab,       setTab]       = useState(initialSection);
  const [products,  setProducts]  = useState([]);
  const [orders,    setOrders]    = useState([]);
  const [analytics, setAnalytics] = useState(null);
  const [cashForm, setCashForm] = useState({ amount: '', notes: '', paidAt: new Date().toISOString().slice(0,16) });
  const [cats,      setCats]      = useState([]);
  const [loading,   setLoading]   = useState(true);
  const [toast,     setToast]     = useState(null);
  const [search,    setSearch]    = useState('');
  const [fCat,      setFCat]      = useState('All');
  const [fMarket,   setFMarket]   = useState('all');   // 'all' | 'local' | 'global'
  const [fStatus,   setFStatus]   = useState('All');
  const [themeMode, setThemeMode] = useState(readThemePreference);
  const [isCompact, setIsCompact] = useState(() => typeof window !== 'undefined' ? window.innerWidth <= 760 : false);
  const [hoveredKpi, setHoveredKpi] = useState(null);
  const [analyticsTab, setAnalyticsTab] = useState('overview');
  const [kpiFilter, setKpiFilter] = useState('all');
  const [timeWindow, setTimeWindow] = useState('all');

  const [form,      setForm]      = useState(EMPTY_FORM);
  const [previews,  setPreviews]  = useState([]);
  const [imgFiles,  setImgFiles]  = useState([]);
  const [saving,    setSaving]    = useState(false);
  const [newCat,    setNewCat]    = useState(false);
  const fileRef = useRef();

  const [shipRates,   setShipRates]   = useState(getShippingRates());
  const [shipSaved,   setShipSaved]   = useState(false);
  const [weightRates,  setWeightRates]  = useState(getWeightRates());
  const [wSaved,       setWSaved]       = useState(false);
  const [tickets,      setTickets]      = useState([]);
  const [ticketFilter, setTicketFilter] = useState('All');
  const [usdRate,   setUsdRate]   = useState(String(getUSDRate()));
  const [usdSaved,  setUsdSaved]  = useState(false);
  const [zoneRates, setZoneRates] = useState(getZoneRates());
  const [zoneSaved, setZoneSaved] = useState(false);
  const [storeSettings, setStoreSettings] = useState({
    codEnabled: true, codFeeMode: 'flat', codFee: 0, codThreshold: 0,
    courierProvider: '', courierApiKey: '',
  });
  const [settingsSaved, setSettingsSaved] = useState(false);
  const [ownPasswordForm, setOwnPasswordForm] = useState({ newPassword:'', confirmPassword:'' });
  const [customerPasswordForm, setCustomerPasswordForm] = useState({ email:'' });
  const [ownPasswordSaving, setOwnPasswordSaving] = useState(false);
  const [customerPasswordSaving, setCustomerPasswordSaving] = useState(false);

  const [editP,     setEditP]     = useState(null);
  const [eForm,     setEForm]     = useState({});
  const [ePrevs,    setEPrevs]    = useState([]);
  const [eNewFiles, setENewFiles] = useState([]);
  const [eNewCat,   setENewCat]   = useState(false);
  const [eSaving,   setESaving]   = useState(false);
  const eRef = useRef();

  const openSection = (nextSection, replace = false) => {
    const safeSection = adminSections.includes(nextSection) ? nextSection : 'dashboard';
    localStorage.setItem('ic_admin_last_section', safeSection);
    setTab(safeSection);
    navigate(safeSection === 'dashboard' ? '/admin' : `/admin/${safeSection}`, { replace });
  };

  useEffect(() => {
    if (section && adminSections.includes(section)) {
      if (tab !== section) setTab(section);
      localStorage.setItem('ic_admin_last_section', section);
    } else if (!section && initialSection !== 'dashboard' && window.location.pathname === '/admin') {
      navigate(`/admin/${initialSection}`, { replace: true });
    }
  }, [section, tab, initialSection, navigate]);

  /* auth guard */
  useEffect(() => {
    if (!user)         { navigate('/login'); return; }
    if (!user.isAdmin) { navigate('/');      return; }
  }, [user, navigate]);

  const load = useCallback(async () => {
    try {
      const { products: pR, orders: oR, categories: cR, failures } = await getAdminData();
      setProducts(Array.isArray(pR.data) ? pR.data : []);
      setOrders(Array.isArray(oR.data) ? oR.data : []);
      setCats(Array.isArray(cR.data) ? cR.data.filter(Boolean) : []);
      if (failures.length) {
        flash(`Some admin data could not load: ${failures.map(failure => failure.resource).join(', ')}.`, false);
      }
      try {
        const { data } = await getSalesAnalytics();
        setAnalytics(data);
      } catch (error) {
        flash(getApiErrorMessage(error, 'Failed to load analytics'), false);
      }
    } catch (error) { flash(getApiErrorMessage(error, 'Failed to load data'), false); }
    finally  { setLoading(false); }
  }, []);
  useEffect(() => { load(); }, [load]);

  useEffect(() => {
    const safeTheme = themeMode === 'light' || themeMode === 'dark' ? themeMode : 'light';
    document.documentElement.dataset.theme = safeTheme;
    try {
      localStorage.setItem(ADMIN_THEME_KEY, safeTheme);
      localStorage.setItem(THEME_KEY, safeTheme);
    } catch (error) { /* Theme still works for this session. */ }
  }, [themeMode]);

  useEffect(() => {
    const syncTheme = event => {
      if (event.detail?.theme === 'light' || event.detail?.theme === 'dark') setThemeMode(event.detail.theme);
    };
    window.addEventListener('ic-theme-change', syncTheme);
    return () => window.removeEventListener('ic-theme-change', syncTheme);
  }, []);

  const toggleThemeMode = () => setThemeMode(current => {
    const nextTheme = current === 'dark' ? 'light' : 'dark';
    window.dispatchEvent(new CustomEvent('ic-theme-change', { detail: { theme: nextTheme } }));
    return nextTheme;
  });

  useEffect(() => {
    const syncCompact = () => setIsCompact(window.innerWidth <= 760);
    syncCompact();
    window.addEventListener('resize', syncCompact);
    return () => window.removeEventListener('resize', syncCompact);
  }, []);

  useEffect(() => {
    if (!user?.isAdmin) return;
    getStoreSettings()
      .then(({ data }) => setStoreSettings(s => ({ ...s, ...data })))
      .catch(error => flash(getApiErrorMessage(error, 'Failed to load store settings'), false));
  }, [user]);

  const flash = (text, ok = true) => {
    setToast({ text, ok });
    setTimeout(() => setToast(null), 3500);
  };

  const saveStoreSettings = async () => {
    try {
      const { data } = await persistStoreSettings(storeSettings);
      setStoreSettings(s => ({ ...s, ...data }));
      setSettingsSaved(true);
      setTimeout(() => setSettingsSaved(false), 2500);
      flash('Store settings saved!');
    } catch (err) {
      flash(err.response?.data?.message || 'Failed to save store settings', false);
    }
  };

  const submitOwnPasswordChange = async (event) => {
    event.preventDefault();
    if (ownPasswordForm.newPassword !== ownPasswordForm.confirmPassword) {
      flash('The new password confirmation does not match.', false);
      return;
    }
    if (ownPasswordForm.newPassword.length < 12) {
      flash('Choose a new password with at least 12 characters.', false);
      return;
    }

    setOwnPasswordSaving(true);
    try {
      const { data } = await changeOwnPassword({
        newPassword: ownPasswordForm.newPassword,
      });
      setOwnPasswordForm({ newPassword:'', confirmPassword:'' });
      flash(data.message || 'Your password was changed successfully.');
    } catch (error) {
      flash(error.response?.data?.message || getApiErrorMessage(error, 'Password could not be changed.'), false);
    } finally {
      setOwnPasswordSaving(false);
    }
  };

  const submitCustomerPasswordReset = async (event) => {
    event.preventDefault();
    setCustomerPasswordSaving(true);
    try {
      const { data } = await resetCustomerPassword({
        email: customerPasswordForm.email.trim(),
      });
      setCustomerPasswordForm({ email:'' });
      flash(data.message || 'Customer password was reset successfully.');
    } catch (error) {
      flash(error.response?.data?.message || getApiErrorMessage(error, 'Customer password could not be reset.'), false);
    } finally {
      setCustomerPasswordSaving(false);
    }
  };

  /* ── image helpers ── */
  const pickImgs = (files, isEdit) => {
    const currentCount = isEdit ? ePrevs.length : previews.length;
    const available = Math.max(0, 5 - currentCount);
    const selected = Array.from(files);
    const allowedTypes = new Set(['image/jpeg', 'image/png', 'image/webp']);
    const validFiles = selected.filter(file => allowedTypes.has(file.type) && file.size <= 5 * 1024 * 1024);
    if (validFiles.length !== selected.length) flash('Choose JPG, PNG, or WEBP images no larger than 5 MiB each.', false);
    const arr = validFiles.slice(0, available);
    if (validFiles.length > arr.length) flash('A product can have at most 5 images.', false);
    const urls = arr.map(f => URL.createObjectURL(f));
    if (isEdit) { setENewFiles(p => [...p,...arr]); setEPrevs(p => [...p,...urls]); }
    else        { setImgFiles(p => [...p,...arr]);  setPreviews(p => [...p,...urls]); }
  };
  const revokePreview = (url) => {
    if (typeof url === 'string' && url.startsWith('blob:')) URL.revokeObjectURL(url);
  };
  const removeImg = (idx, isEdit) => {
    if (isEdit) {
      const existCount = eForm.existImgs?.length || 0;
      if (idx < existCount) setEForm(f => ({ ...f, existImgs: f.existImgs.filter((_,i) => i !== idx) }));
      else {
        const ni = idx - existCount;
        revokePreview(ePrevs[idx]);
        setENewFiles(p => p.filter((_,i) => i !== ni));
      }
      setEPrevs(p => p.filter((_,i) => i !== idx));
    } else {
      revokePreview(previews[idx]);
      setImgFiles(p => p.filter((_,i) => i !== idx));
      setPreviews(p => p.filter((_,i) => i !== idx));
    }
  };

  /* ── CRUD ── */
  const handleAdd = async (e) => {
    e.preventDefault();
    if (!form.category.trim()) { flash('Please select or type a category', false); return; }
    setSaving(true);
    try {
      const { data } = await createProduct(form, imgFiles);
      setProducts(p => [data, ...p]);
      if (!cats.includes(form.category)) setCats(c => [...c, form.category].sort());
      previews.forEach(revokePreview);
      setForm({ ...EMPTY_FORM, category: '' }); setImgFiles([]); setPreviews([]); setNewCat(false);
      if (fileRef.current) fileRef.current.value = '';
      flash('Product published!'); openSection('products');
    } catch (err) { flash(err.response?.data?.message || 'Failed to publish', false); }
    finally { setSaving(false); }
  };

  const openEdit = (p) => {
    setEditP(p);
    setEForm({ name:p.name, pricePKR:p.pricePKR, priceUSD:p.priceUSD, discountPercent:Number(p.discountPercent) || 0, discountStartDate:p.discountStartDate || '', discountEndDate:p.discountEndDate || '', category:p.category, subcategory:p.subcategory || '', brand:p.brand || '', model:p.model || '', colors:(p.colors || []).join(', '), sizes:(p.sizes || []).join(', '), isVisible:p.isVisible !== false, description:p.description, isLocal:p.isLocal, stock:p.stock, weightKg: p.weightKg != null ? p.weightKg : '', existImgs:[...(p.images||[])] });
    setEPrevs((p.images||[]).map(assetUrl));
    setENewFiles([]); setENewCat(false);
  };

  const handleEditSave = async () => {
    setESaving(true);
    try {
      const { data } = await updateProduct(editP._id, eForm, eForm.existImgs || [], eNewFiles);
      setProducts(ps => ps.map(p => p._id === data._id ? data : p));
      if (!cats.includes(eForm.category)) setCats(c => [...c, eForm.category].sort());
      setEditP(null); flash('Product updated!');
    } catch (err) { flash(getApiErrorMessage(err, 'Update failed'), false); }
    finally { setESaving(false); }
  };

  const handleDelete = async (id, name) => {
    if (!window.confirm(`Delete "${name}"? This cannot be undone.`)) return;
    try {
      await deleteProduct(id);
      setProducts(p => p.filter(x => x._id !== id)); flash('Product deleted.');
    } catch (error) { flash(getApiErrorMessage(error, 'Delete failed'), false); }
  };

  const changeStatus = async (id, status) => {
    try {
      await updateOrderStatus(id, status);
      setOrders(os => os.map(o => o._id === id ? {...o, status} : o));
      flash(`Order → ${status}`);
    } catch (error) { flash(getApiErrorMessage(error, 'Status update failed'), false); }
  };

  /* ── load server-backed tickets whenever the support tab is opened ── */
  useEffect(() => {
    if (tab !== 'support') return;
    getSupportTickets()
      .then(({ data }) => setTickets(Array.isArray(data) ? data : []))
      .catch(error => flash(getApiErrorMessage(error, 'Failed to load support tickets'), false));
  }, [tab]);

  const refreshTickets = async () => {
    try {
      const { data } = await getSupportTickets();
      setTickets(Array.isArray(data) ? data : []);
    } catch (error) {
      flash(getApiErrorMessage(error, 'Failed to refresh support tickets'), false);
    }
  };

  const changeTicketStatus = async (ticketId, status) => {
    try {
      const { data } = await updateSupportTicketStatus(ticketId, status);
      setTickets(current => current.map(ticket => ticket._id === ticketId ? data : ticket));
    } catch (error) {
      flash(getApiErrorMessage(error, 'Failed to update support ticket'), false);
    }
  };

  const saveTicketReply = async (ticketId, text) => {
    try {
      const { data } = await replyToSupportTicket(ticketId, text);
      setTickets(current => current.map(ticket => ticket._id === ticketId ? data : ticket));
    } catch (error) {
      flash(getApiErrorMessage(error, 'Failed to save support reply'), false);
      throw error;
    }
  };

  const saveWeight = () => { saveWeightRates(weightRates); setWSaved(true); setTimeout(() => setWSaved(false), 2000); };
  const saveShip = () => {
    saveShippingRates(shipRates); setShipSaved(true);
    setTimeout(() => setShipSaved(false), 2500); flash('Shipping rates saved!');
  };
  const saveRate = () => {
    const r = parseFloat(usdRate);
    if (!r || r <= 0) { flash('Enter a valid exchange rate', false); return; }
    saveUSDRate(r); setUsdSaved(true);
    setTimeout(() => setUsdSaved(false), 2500); flash(`Rate saved: 1 USD = Rs ${r}`);
  };
  const saveZone = () => {
    saveZoneRates(zoneRates); setZoneSaved(true);
    setTimeout(() => setZoneSaved(false), 2500); flash('Zone shipping rates saved!');
  };

  const formatCompactNumber = (value) => new Intl.NumberFormat('en-PK', {
    notation: 'compact',
    maximumFractionDigits: 1,
  }).format(Number(value || 0));

  const salesChartSections = [
    {
      title: 'Daily revenue',
      data: (analytics?.dailySeries || []).slice(-7).map((item) => ({
        label: new Date(item.date).toLocaleDateString('en-PK', { month: 'short', day: 'numeric' }),
        value: Number(item.totalRevenue || 0),
      })),
    },
    {
      title: 'Weekly revenue',
      data: (analytics?.weeklySeries || []).slice(-6).map((item) => ({
        label: new Date(item.weekStart).toLocaleDateString('en-PK', { month: 'short', day: 'numeric' }),
        value: Number(item.totalRevenue || 0),
      })),
    },
    {
      title: 'Monthly revenue',
      data: (analytics?.monthlySeries || []).slice(-6).map((item) => ({
        label: new Date(`${item.month}-01T00:00:00`).toLocaleDateString('en-PK', { month: 'short', year: '2-digit' }),
        value: Number(item.totalRevenue || 0),
      })),
    },
  ];

  const premiumRegionStrategy = {
    Lahore: { shopper: 'premium gift buyers', trigger: 'gift-led urgency', product: 'home décor, gifting, and premium kitchen essentials' },
    Karachi: { shopper: 'high-volume urban shoppers', trigger: 'social proof + fast delivery', product: 'fashion accessories, daily essentials, and bundle offers' },
    Islamabad: { shopper: 'trust-first professionals', trigger: 'quality reassurance + same-day confidence', product: 'wellness, home upgrades, and curated premium bundles' },
    Multan: { shopper: 'family repeat buyers', trigger: 'value-packed bundles', product: 'household essentials and seasonal bundles' },
    Rawalpindi: { shopper: 'gift-oriented families', trigger: 'bundle gifting + free-shipping threshold', product: 'giftable home and lifestyle bundles' },
    Faisalabad: { shopper: 'value-focused volume buyers', trigger: 'cross-sell / repeat-driving bundles', product: 'textile, home, and utility bundles' },
    'Punjab': { shopper: 'regional repeat buyers', trigger: 'bundle savings + local trust', product: 'home and daily-use bundles' },
    'Sindh': { shopper: 'city-driven shoppers', trigger: 'fast-turnover offers', product: 'daily essentials and lifestyle accessories' },
    'Khyber Pakhtunkhwa': { shopper: 'practical value seekers', trigger: 'seasonal promotions', product: 'home essentials and utility gifts' },
    'Balochistan': { shopper: 'high-intent discoverers', trigger: 'limited-time trust-building', product: 'bare essentials and gifting creates' },
  };

  const regionalCampaigns = (analytics?.regionBreakdown || []).slice(0, 4).map((region, index) => {
    const offerPercent = 12 + index * 5;
    const baseProduct = analytics?.topProducts?.[0]?.name || 'best-selling product';
    const strategy = premiumRegionStrategy[region.region] || {
      shopper: 'growth-market shoppers',
      trigger: 'limited-time value push',
      product: 'best-selling product bundles',
    };

    return {
      region: region.region,
      revenue: region.totalRevenue || 0,
      orders: region.orders || 0,
      offer: `${offerPercent}% ${strategy.trigger} offer`,
      message: `Position ${baseProduct} for ${strategy.shopper} in ${region.region} with a premium bundle story, clear proof points, and a strong local delivery promise.`,
      target: region.totalRevenue > 0 ? 'High-intent audience' : 'New market test',
      angle: strategy.product,
    };
  });

  const productRecommendations = (() => {
    if (!products.length) return [];
    const topNames = new Set((analytics?.topProducts || []).slice(0, 3).map((product) => product.name));
    const topProductsList = products.filter((product) => topNames.has(product.name));
    const fallbackProducts = products.filter((product) => !topNames.has(product.name));

    return (topProductsList.length ? topProductsList : products.slice(0, 3)).map((baseProduct) => {
      const categoryMatches = products.filter((product) => product.category === baseProduct.category && product.name !== baseProduct.name).slice(0, 2);
      const bundleItems = [baseProduct.name, ...categoryMatches.map((item) => item.name)];
      const offerValue = baseProduct.pricePKR ? Math.round(baseProduct.pricePKR * 0.15) : 0;
      const categoryMood = baseProduct.category === 'Home' ? 'gift-ready household edit'
        : baseProduct.category === 'Fashion' ? 'style-first bundle momentum'
        : baseProduct.category === 'Beauty' ? 'self-care premium upsell'
        : baseProduct.category === 'Kitchen' ? 'utility-led premium upgrade'
        : 'high-conversion bestseller stack';

      return {
        name: baseProduct.name,
        category: baseProduct.category || 'Featured',
        offer: `${offerValue ? 'Rs ' + formatCompactNumber(offerValue) : 'Bundle'} off`,
        bundle: bundleItems.length ? bundleItems : ['Quick-add accessory', 'Gift add-on'],
        rationale: `Best for ${categoryMood} and repeat-purchase conversion in Pakistan’s high-trust buying clusters.`,
      };
    }).concat((fallbackProducts.slice(0, 2) || []).map((product) => ({
      name: product.name,
      category: product.category || 'Suggested',
      offer: 'High-value bundle',
      bundle: [product.name, 'Fast-moving add-on', 'Top-ups pack'],
      rationale: 'Perfect for expanding category reach and increasing average order value without slashing margin.',
    }))).slice(0, 4);
  })();

  const exportCsvReport = () => {
    const rows = [
      ['Report', 'IndusCart Sales Intelligence Summary'],
      ['Generated At', new Date().toLocaleString('en-PK')],
      ['Total Revenue', formatPKR(analytics?.summary?.totalRevenue || 0)],
      ['Cash Revenue', formatPKR(analytics?.summary?.cashRevenue || 0)],
      ['Online Revenue', formatPKR(analytics?.summary?.onlineRevenue || 0)],
      ['Total Orders', String(analytics?.summary?.totalOrders || orders.length)],
      ['Top Product', analytics?.topProducts?.[0]?.name || 'No product'],
      ['Strongest Region', strongestRegion],
      ['', ''],
      ['Region', 'Revenue', 'Orders'],
      ...((analytics?.regionBreakdown || []).map((item) => [item.region, String(item.totalRevenue || 0), String(item.orders || 0)])),
      ['', ''],
      ['Recommendation', 'Action'],
      ...((analytics?.insights?.recommendedActions || []).slice(0, 6).map((action) => [action, 'Recommended'])),
    ];

    const csvContent = rows.map((row) => row.map((cell) => `"${String(cell).replace(/"/g, '""')}"`).join(',')).join('\n');
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = 'induscart-sales-report.csv';
    link.click();
    URL.revokeObjectURL(url);
  };

  const generatePdfReport = () => {
    const reportHtml = `
      <html>
        <head>
          <title>IndusCart Sales Intelligence Report</title>
          <style>
            body { font-family: Arial, sans-serif; background:#f8fafc; color:#0f172a; padding:24px; }
            .box { background:#fff; border:1px solid #e2e8f0; border-radius:16px; padding:18px; margin-bottom:16px; }
            h1 { margin:0 0 10px; }
            h2, h3 { margin:0 0 10px; }
            table { width:100%; border-collapse:collapse; }
            th, td { border:1px solid #e2e8f0; padding:8px 10px; text-align:left; }
            .meta { display:flex; justify-content:space-between; gap:12px; flex-wrap:wrap; }
            .kpi { display:grid; grid-template-columns:repeat(4,1fr); gap:12px; }
            .chip { display:inline-block; background:#ecfdf5; color:#065f46; padding:6px 10px; border-radius:999px; font-weight:700; }
            .campaign { background:#fef3c7; border:1px solid #fed7aa; padding:12px; border-radius:12px; margin-top:10px; }
          </style>
        </head>
        <body>
          <div class="box">
            <h1>IndusCart Premium Sales Intelligence Report</h1>
            <div class="meta">
              <p><strong>Generated:</strong> ${new Date().toLocaleString('en-PK')}</p>
              <p class="chip">Cash: ${formatPKR(analytics?.summary?.cashRevenue || 0)} · Online: ${formatPKR(analytics?.summary?.onlineRevenue || 0)}</p>
            </div>
          </div>
          <div class="kpi">
            <div class="box"><h3>Total Revenue</h3><p>${formatPKR(analytics?.summary?.totalRevenue || 0)}</p></div>
            <div class="box"><h3>Orders</h3><p>${analytics?.summary?.totalOrders || 0}</p></div>
            <div class="box"><h3>Top Product</h3><p>${analytics?.topProducts?.[0]?.name || '—'}</p></div>
            <div class="box"><h3>Avg Order</h3><p>${formatPKR(analytics?.summary?.averageOrderValue || 0)}</p></div>
          </div>
          <div class="box">
            <h2>Regional performance</h2>
            <table>
              <thead><tr><th>Region</th><th>Revenue</th><th>Orders</th></tr></thead>
              <tbody>
                ${(analytics?.regionBreakdown || []).map((region) => `<tr><td>${region.region}</td><td>${formatPKR(region.totalRevenue || 0)}</td><td>${region.orders || 0}</td></tr>`).join('') || '<tr><td colspan="3">No regional data yet</td></tr>'}
              </tbody>
            </table>
          </div>
          <div class="box">
            <h2>Regional marketing campaigns</h2>
            ${(regionalCampaigns || []).map((campaign) => `
              <div class="campaign">
                <strong>${campaign.region}</strong><br>
                ${campaign.offer} · ${campaign.target}<br>
                ${campaign.message}
              </div>
            `).join('') || '<p>No campaign recommendations yet.</p>'}
          </div>
          <div class="box">
            <h2>AI strategy summary</h2>
            <p>${analytics?.insights?.summaryText || 'No insight available yet.'}</p>
            <ul>
              ${(analytics?.insights?.recommendedActions || []).map(action => `<li>${action}</li>`).join('')}
            </ul>
          </div>
        </body>
      </html>
    `;

    const printWindow = window.open('', '_blank', 'width=1200,height=900');
    if (!printWindow) {
      flash('PDF export was blocked. Please allow pop-ups and try again.', false);
      return;
    }
    printWindow.document.write(reportHtml);
    printWindow.document.close();
    setTimeout(() => {
      printWindow.focus();
      printWindow.print();
    }, 300);
  };

  const handleManualCashSale = async () => {
    try {
      const amount = Number(cashForm.amount || 0);
      if (!amount || amount <= 0) {
        flash('Enter a valid cash amount', false);
        return;
      }
      const payload = {
        amount,
        notes: cashForm.notes || 'Cash sale recorded by admin.',
        paidAt: cashForm.paidAt ? new Date(cashForm.paidAt).toISOString() : new Date().toISOString(),
      };
      const { data } = await recordManualCashSale(payload);
      setOrders(os => [data, ...os]);
      setCashForm({ amount: '', notes: '', paidAt: new Date().toISOString().slice(0,16) });
      const { data: refresh } = await getSalesAnalytics();
      setAnalytics(refresh);
      flash('Cash sale recorded successfully');
    } catch (error) {
      flash(getApiErrorMessage(error, 'Cash sale could not be recorded'), false);
    }
  };

  /* ── derived stats ── */
  const revPKR    = orders.reduce((a,o) => a + (o.totalPrice||0), 0);
  const pending   = orders.filter(o => o.status === 'Pending').length;
  const delivered = orders.filter(o => o.status === 'Delivered').length;
  const oos       = products.filter(p => p.stock === 0).length;
  const localCnt  = products.filter(p =>  p.isLocal).length;
  const globalCnt = products.filter(p => !p.isLocal).length;

  const filteredProducts = products.filter(p => {
    const ms = p.name.toLowerCase().includes(search.toLowerCase());
    const mc = fCat === 'All' || p.category === fCat;
    const mm = fMarket === 'all'
      || (fMarket === 'local'  &&  p.isLocal)
      || (fMarket === 'global' && !p.isLocal);
    return ms && mc && mm;
  });

  const strongestRegion = analytics?.regionBreakdown?.[0]?.region || 'No region yet';
  const topProductName = analytics?.topProducts?.[0]?.name || 'No product yet';
  const strongestHour = analytics?.hourlySeries?.reduce((best, current) => (current.totalRevenue > best.totalRevenue ? current : best), { hour: '00', totalRevenue: 0 })?.hour || '00';
  const aiPulse = [
    { label: 'Lead Region', value: strongestRegion },
    { label: 'Peak Demand', value: `${strongestHour}:00` },
    { label: 'Best SKU', value: topProductName },
    { label: 'Best Channel', value: (analytics?.summary?.cashRevenue || 0) >= (analytics?.summary?.onlineRevenue || 0) ? 'Cash-led' : 'Online-led' },
  ];

  const aiStrategy = [
    { label: 'Urgency', value: 'High-intent PK buyers', tone: '#f59e0b' },
    { label: 'Focus', value: 'Bundle-led upsells', tone: '#10b981' },
    { label: 'Risk', value: 'Low-stock warnings', tone: '#f43f5e' },
    { label: 'Play', value: 'Regional retargeting', tone: '#60a5fa' },
  ];

  const executiveSummary = {
    momentum: analytics?.summary?.totalRevenue ? Math.min(98, Math.round((analytics.summary.totalRevenue / Math.max(revPKR, 1)) * 100 + 35)) : 76,
    cashShare: analytics?.summary?.totalRevenue ? Math.round(((analytics.summary.cashRevenue || 0) / Math.max(analytics.summary.totalRevenue, 1)) * 100) : 0,
    onlineShare: analytics?.summary?.totalRevenue ? Math.round(((analytics.summary.onlineRevenue || 0) / Math.max(analytics.summary.totalRevenue, 1)) * 100) : 0,
    outlook: analytics?.summary?.cashRevenue >= (analytics?.summary?.onlineRevenue || 0) ? 'Cash-led conversions are currently leading the growth curve.' : 'Online demand is accelerating and should be prioritized for higher-volume campaigns.',
  };

  const filteredSeries = {
    daily: (analytics?.dailySeries || []).slice(-7).map((item) => ({
      label: new Date(item.date).toLocaleDateString('en-PK', { month: 'short', day: 'numeric' }),
      value: kpiFilter === 'all' ? Number(item.totalRevenue || 0) : kpiFilter === 'cash' ? Number(item.cashRevenue || 0) : Number(item.onlineRevenue || 0),
      total: Number(item.totalRevenue || 0),
      cash: Number(item.cashRevenue || 0),
      online: Number(item.onlineRevenue || 0),
    })),
    weekly: (analytics?.weeklySeries || []).slice(-6).map((item) => ({
      label: new Date(item.weekStart).toLocaleDateString('en-PK', { month: 'short', day: 'numeric' }),
      value: kpiFilter === 'all' ? Number(item.totalRevenue || 0) : kpiFilter === 'cash' ? Number(item.cashRevenue || 0) : Number(item.onlineRevenue || 0),
      total: Number(item.totalRevenue || 0),
      cash: Number(item.cashRevenue || 0),
      online: Number(item.onlineRevenue || 0),
    })),
    monthly: (analytics?.monthlySeries || []).slice(-6).map((item) => ({
      label: new Date(`${item.month}-01T00:00:00`).toLocaleDateString('en-PK', { month: 'short', year: '2-digit' }),
      value: kpiFilter === 'all' ? Number(item.totalRevenue || 0) : kpiFilter === 'cash' ? Number(item.cashRevenue || 0) : Number(item.onlineRevenue || 0),
      total: Number(item.totalRevenue || 0),
      cash: Number(item.cashRevenue || 0),
      online: Number(item.onlineRevenue || 0),
    })),
  };

  const kpiValues = {
    all: analytics?.summary?.totalRevenue || revPKR,
    cash: analytics?.summary?.cashRevenue || 0,
    online: analytics?.summary?.onlineRevenue || 0,
  };

  const kpiRows = [
    { label: 'Gross Revenue', key: 'all', value: kpiValues.all, sub: `${analytics?.summary?.totalOrders || orders.length} paid orders` },
    { label: 'Cash Lift (PK)', key: 'cash', value: kpiValues.cash, sub: `${formatPKR(kpiValues.online)} online demand` },
    { label: 'Online Demand', key: 'online', value: kpiValues.online, sub: `${analytics?.topProducts?.[0]?.name || 'Top product'}` },
    { label: 'Top Category Driver', key: 'all', value: analytics?.topProducts?.[0]?.name || '—', sub: `${analytics?.topProducts?.[0]?.soldUnits || 0} units sold` },
  ];

  const performanceTabs = [
    { key: 'overview', label: 'Overview' },
    { key: 'products', label: 'Products' },
    { key: 'regions', label: 'Regions' },
    { key: 'channels', label: 'Channels' },
  ];

  const productBreakdown = (analytics?.topProducts || []).slice(0, 5).map((product) => ({
    name: product.name,
    revenue: product.revenue || 0,
    units: product.soldUnits || 0,
  }));

  const regionBreakdown = (analytics?.regionBreakdown || []).map((region) => ({
    ...region,
    revenue: kpiFilter === 'all' ? Number(region.totalRevenue || 0) : kpiFilter === 'cash' ? Number(region.cashRevenue || 0) : Number(region.onlineRevenue || 0),
  }));

  const channelBreakdown = [
    { label: 'Cash', value: Number(analytics?.summary?.cashRevenue || 0), share: analytics?.summary?.totalRevenue ? ((analytics?.summary?.cashRevenue || 0) / analytics.summary.totalRevenue) * 100 : 0 },
    { label: 'Online', value: Number(analytics?.summary?.onlineRevenue || 0), share: analytics?.summary?.totalRevenue ? ((analytics?.summary?.onlineRevenue || 0) / analytics.summary.totalRevenue) * 100 : 0 },
  ];

  const filteredOrders = fStatus === 'All' ? orders : orders.filter(o => o.status === fStatus);
  const editDiscountNow = getActiveDiscountPercent(eForm);
  const newDiscountNow = getActiveDiscountPercent(form);

  /* ── loading screen ── */
  if (loading) return (
    <div style={S.centered}>
      <div style={S.spinRing} />
      <p style={{ color:'#64748b', marginTop:18, fontFamily:"'Sora',sans-serif", fontWeight:600 }}>Loading admin panel…</p>
      <style>{`@keyframes spin{to{transform:rotate(360deg)}}`}</style>
    </div>
  );

  /* ══════════════════════════════════════════════════════════ */
  return (
    <div className="responsive-page admin-page" style={S.root}>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Sora:wght@400;600;700;800;900&family=JetBrains+Mono:wght@500;700&display=swap');
        @keyframes spin    { to { transform:rotate(360deg) } }
        @keyframes fadeUp  { from { opacity:0; transform:translateY(14px) } to { opacity:1; transform:none } }
        @keyframes slideUp { from { opacity:0; transform:translateY(20px) } to { opacity:1; transform:none } }
        :root[data-theme='dark'] .nav-btn:hover { background:rgba(16,185,129,.14) !important; color:#f8fffb !important; box-shadow:inset 0 0 0 1px rgba(167,243,208,.20) !important; }
        :root:not([data-theme='dark']) .admin-sidebar .nav-btn:hover { background:#eaf5ee !important; color:#075c43 !important; box-shadow:inset 0 0 0 1px rgba(5,150,105,.14) !important; }
        .admin-password-card input { width:100%; min-height:46px; margin-top:6px; padding:10px 12px; border:1px solid #b9cec0; border-radius:10px; box-sizing:border-box; background:#fbfdfb; color:#10251b; }
        .admin-password-card input:focus { outline:3px solid rgba(16,185,129,.2); border-color:#0b8059; }
        .admin-password-submit { width:100%; min-height:48px; justify-content:center; color:#062e22 !important; background:linear-gradient(135deg,#8ae0bb,#54c7a2) !important; }
        :root[data-theme='dark'] .admin-page .admin-main .admin-green-button { color:#062e22 !important; }
        .admin-page .admin-pdf-report-button { color:#fff !important; }
        :root[data-theme='dark'] .admin-password-card input { border-color:#557264 !important; background:#0b1510 !important; color:#f3faf5 !important; box-shadow:inset 0 1px 2px rgba(0,0,0,.4) !important; }
        :root[data-theme='dark'] .admin-password-card input:focus { outline:3px solid rgba(110,231,183,.22); border-color:#72c9a2 !important; }
        :root[data-theme='dark'] .admin-password-submit { color:#062e22 !important; background:linear-gradient(135deg,#8ae0bb,#54c7a2) !important; }
        .admin-add-product-submit { color:#062e22 !important; background:linear-gradient(135deg,#8ae0bb,#54c7a2) !important; }
        :root[data-theme='dark'] .admin-main .admin-add-product-submit { color:#062e22 !important; }
        :root[data-theme='dark'] .admin-page .admin-market-badge[data-market='local'] { color:#166534 !important; }
        :root[data-theme='dark'] .admin-page .admin-market-badge[data-market='global'] { color:#1d4ed8 !important; }
        :root[data-theme='dark'] .admin-page .admin-status-badge[data-status='pending'] { color:#9a3412 !important; }
        :root[data-theme='dark'] .admin-page .admin-status-badge[data-status='processing'] { color:#1d4ed8 !important; }
        :root[data-theme='dark'] .admin-page .admin-status-badge[data-status='shipped'] { color:#0369a1 !important; }
        :root[data-theme='dark'] .admin-page .admin-status-badge[data-status='delivered'] { color:#166534 !important; }
        :root[data-theme='dark'] .admin-page .admin-status-badge[data-status='cancelled'] { color:#be123c !important; }
        :root[data-theme='dark'] .admin-page .admin-category-new { background:#26322c !important; border-color:#53645a !important; color:#edf4f0 !important; }
        :root[data-theme='dark'] .admin-page .admin-market-summary-local-label { color:#a7f3d0 !important; }
        :root[data-theme='dark'] .admin-page .admin-market-summary-local-count { color:#86efac !important; }
        :root[data-theme='dark'] .admin-page .admin-market-summary-local-description { color:#b7f3cd !important; }
        :root[data-theme='dark'] .admin-page .admin-market-summary-local-share { color:#a7f3d0 !important; }
        :root[data-theme='dark'] .admin-page .admin-market-summary-global-label { color:#bfdbfe !important; }
        :root[data-theme='dark'] .admin-page .admin-market-summary-global-count { color:#93c5fd !important; }
        :root[data-theme='dark'] .admin-page .admin-market-summary-global-description { color:#c4ddf5 !important; }
        :root[data-theme='dark'] .admin-page .admin-market-summary-global-share { color:#bfdbfe !important; }
        .admin-image-picker-add { transition:background .15s ease,border-color .15s ease,transform .15s ease; }
        .admin-image-picker-add:hover { transform:translateY(-1px); }
        .admin-image-picker > div + p { color:#536b5c !important; }
        :root[data-theme='dark'] .admin-image-picker > div + p { color:#bdcbc3 !important; }
        :root[data-theme='dark'] .admin-image-picker-add { background:#26322c !important; border-color:#718479 !important; }
        :root[data-theme='dark'] .admin-image-picker-plus,
        :root[data-theme='dark'] .admin-image-picker-caption { color:#e2eee6 !important; }
        .admin-settings-page .admin-settings-card { border-radius:18px !important; padding:24px !important; }
        :root[data-theme='dark'] .admin-page .admin-main .admin-settings-page .admin-settings-card { background:#1c2320 !important; border-color:#39443f !important; box-shadow:0 14px 32px rgba(0,0,0,.24) !important; }
        :root:not([data-theme='dark']) .admin-page .admin-main .admin-settings-page .admin-settings-card { background:#fff !important; border-color:#dbe7df !important; box-shadow:0 12px 28px rgba(15,45,32,.07) !important; }
        :root[data-theme='dark'] .admin-page .admin-main .admin-settings-page .admin-settings-card h3,
        :root[data-theme='dark'] .admin-page .admin-main .admin-settings-page .admin-settings-card h4 { color:#edf4f0 !important; }
        :root:not([data-theme='dark']) .admin-page .admin-main .admin-settings-page .admin-settings-card h3,
        :root:not([data-theme='dark']) .admin-page .admin-main .admin-settings-page .admin-settings-card h4 { color:#183329 !important; }
        :root[data-theme='dark'] .admin-page .admin-main .admin-settings-page .admin-settings-card p { color:#b9c7bf !important; font-size:12px !important; line-height:1.65 !important; }
        :root:not([data-theme='dark']) .admin-page .admin-main .admin-settings-page .admin-settings-card p { color:#586b60 !important; font-size:12px !important; line-height:1.65 !important; }
        :root[data-theme='dark'] .admin-page .admin-main .admin-settings-page .admin-password-warning { color:#f2d58c !important; background:#342b1e !important; border-color:#6c5732 !important; }
        :root:not([data-theme='dark']) .admin-page .admin-main .admin-settings-page .admin-password-warning { color:#854d0e !important; background:#fffbeb !important; border-color:#f3d08a !important; }
        .admin-settings-page .admin-settings-card label { display:block; font-size:10px !important; font-weight:800 !important; letter-spacing:.65px !important; line-height:1.5; }
        :root[data-theme='dark'] .admin-page .admin-main .admin-settings-page .admin-settings-card label { color:#c9d5ce !important; }
        :root:not([data-theme='dark']) .admin-page .admin-main .admin-settings-page .admin-settings-card label { color:#40594a !important; }
        :root[data-theme='dark'] .admin-page .admin-main .admin-settings-page .admin-settings-card input:not([type='checkbox']),
        :root[data-theme='dark'] .admin-page .admin-main .admin-settings-page .admin-settings-card select,
        :root[data-theme='dark'] .admin-page .admin-main .admin-settings-page .admin-settings-card textarea { min-height:40px; border:1px solid #4a5b51 !important; border-radius:10px; background:#242b28 !important; color:#f0f5f1 !important; font-size:13px !important; box-shadow:inset 0 1px 2px rgba(0,0,0,.22) !important; }
        :root:not([data-theme='dark']) .admin-page .admin-main .admin-settings-page .admin-settings-card input:not([type='checkbox']),
        :root:not([data-theme='dark']) .admin-page .admin-main .admin-settings-page .admin-settings-card select,
        :root:not([data-theme='dark']) .admin-page .admin-main .admin-settings-page .admin-settings-card textarea { min-height:40px; border:1px solid #cbd9cf !important; border-radius:10px; background:#fbfdfb !important; color:#183329 !important; font-size:13px !important; }
        :root[data-theme='dark'] .admin-page .admin-main .admin-settings-page .admin-zone-rate-card { background:#252d29 !important; border-color:#48564e !important; }
        :root:not([data-theme='dark']) .admin-page .admin-main .admin-settings-page .admin-zone-rate-card { background:#f5f9f6 !important; border-color:#d4e1d8 !important; }
        .admin-settings-page .admin-settings-card button { min-height:42px; border-radius:10px; color:#062e22 !important; }
        :root[data-theme='dark'] .admin-page .admin-main .admin-settings-page .admin-settings-card button { background:linear-gradient(135deg,#8ae0bb,#54c7a2) !important; color:#062e22 !important; }
        :root[data-theme='dark'] .admin-main .market-picker-option-title,
        :root[data-theme='dark'] .admin-main .market-picker-option-check { color:#dce8e1 !important; }
        :root[data-theme='dark'] .admin-main .market-picker-option.is-active[data-market='global'] .market-picker-option-title,
        :root[data-theme='dark'] .admin-main .market-picker-option.is-active[data-market='global'] .market-picker-option-check { color:#bfdbfe !important; }
        :root[data-theme='dark'] .admin-main .market-picker-option.is-active[data-market='local'] .market-picker-option-title,
        :root[data-theme='dark'] .admin-main .market-picker-option.is-active[data-market='local'] .market-picker-option-check { color:#a7f3d0 !important; }
        :root[data-theme='dark'] .admin-main .market-picker-option-sub { color:#bdcbc3 !important; }
        :root[data-theme='dark'] .admin-main .market-picker-hint { color:#bcebd1 !important; }
        :root:not([data-theme='dark']) .admin-main .market-picker-option-title { color:#334155 !important; }
        :root:not([data-theme='dark']) .admin-main .market-picker-option.is-active[data-market='global'] .market-picker-option-title,
        :root:not([data-theme='dark']) .admin-main .market-picker-option.is-active[data-market='global'] .market-picker-option-check { color:#1d4ed8 !important; }
        :root:not([data-theme='dark']) .admin-main .market-picker-option.is-active[data-market='local'] .market-picker-option-title,
        :root:not([data-theme='dark']) .admin-main .market-picker-option.is-active[data-market='local'] .market-picker-option-check { color:#047857 !important; }
        :root:not([data-theme='dark']) .admin-main .market-picker-option-sub { color:#52675d !important; }
        :root:not([data-theme='dark']) .admin-main .market-picker-hint { color:#145c43 !important; }
        .row-hover:hover { background:#f8fafc; }
        .kpi-card:hover  { transform:translateY(-4px); box-shadow:0 16px 48px rgba(0,0,0,.2) !important; }
        .del-btn:hover   { background:#fef2f2 !important; }
        .edit-btn:hover  { background:#eff6ff !important; }
        .mkt-pill:hover  { opacity:.8; }
        select option    { font-family:'Sora',sans-serif; }
        .admin-mobile-heading { display:none; }
        .admin-main { min-width:0; width:100%; max-width:none; }
        .admin-main > * { max-width:100%; }
        ::-webkit-scrollbar       { width:5px; height:5px; }
        ::-webkit-scrollbar-track { background:transparent; }
        ::-webkit-scrollbar-thumb { background:#e2e8f0; border-radius:99px; }
        @media (max-width: 900px) {
          .admin-main { padding:24px 20px !important; }
          .admin-main [style*="repeat(4,1fr)"] { grid-template-columns:repeat(2,minmax(0,1fr)) !important; }
        }
        @media (max-width: 760px) {
          .admin-sidebar {
            width:100% !important;
            min-height:0 !important;
            height:auto !important;
            position:sticky !important;
            top:0 !important;
            z-index:100 !important;
            overflow:visible !important;
            border-right:0 !important;
            box-shadow:0 8px 24px rgba(15,23,42,.14);
          }
          .admin-sidebar > div:first-child { padding:12px 16px !important; }
          .admin-sidebar > nav {
            display:grid !important;
            grid-template-columns:repeat(2,minmax(0,1fr));
            overflow:hidden !important;
            padding:8px 10px 10px !important;
            gap:6px;
          }
          .admin-sidebar .nav-btn {
            width:100% !important;
            min-height:44px !important;
            justify-content:flex-start !important;
            border-left:0 !important;
            border:1px solid rgba(148,163,184,.12) !important;
            border-radius:9px !important;
            padding:10px 12px !important;
            white-space:nowrap !important;
          }
          .admin-sidebar .nav-btn[style*="border-left"] {
            border-color:#10b981 !important;
            background:rgba(16,185,129,.12) !important;
          }
          .admin-sidebar > div:nth-last-child(3),
          .admin-sidebar > div:nth-last-child(2),
          .admin-sidebar > div:last-child { display:none !important; }
          .admin-main {
            width:100% !important;
            max-width:none !important;
            padding:18px 12px 30px !important;
          }
          .admin-mobile-heading {
            display:block;
            padding:16px 16px 15px;
            margin-bottom:12px;
            border-radius:16px;
            color:#fff;
            background:linear-gradient(135deg,#0a3d2f,#12684c 58%,#1a7f5d);
            box-shadow:0 12px 28px rgba(10,61,47,.18);
          }
          .admin-mobile-heading p {
            margin:0 0 6px;
            color:#6ee7b7;
            font-size:9px;
            font-weight:800;
            letter-spacing:1.5px;
          }
          .admin-mobile-heading h1 {
            margin:0;
            font-family:'Sora',sans-serif;
            font-size:20px;
            letter-spacing:-.5px;
          }
          .admin-mobile-heading span {
            display:block;
            margin-top:6px;
            color:#cbd5e1;
            font-size:11px;
            line-height:1.45;
          }
          .admin-main [style*="repeat(4,1fr)"] { grid-template-columns:1fr 1fr !important; gap:10px !important; }
          .admin-main [style*="grid-template-columns:1fr 1fr"] { grid-template-columns:1fr !important; }
          .admin-main [style*="padding:24px"] { padding:16px !important; }
          .admin-main table { min-width:650px; }
          .admin-main [style*="overflow-x:auto"],
          .admin-main [style*="overflowX"] { max-width:100%; overflow-x:auto !important; }
          .admin-main h1 { font-size:22px !important; }
          .admin-main .pgTop { margin-bottom:16px; }
        }
        @media (max-width: 380px) {
          .admin-sidebar > nav { grid-template-columns:1fr; }
          .admin-sidebar .nav-btn { min-height:42px !important; }
          .admin-main { padding-left:10px !important; padding-right:10px !important; }
        }
      `}</style>
      <Toast toast={toast} />

      {/* ═══ EDIT MODAL ══════════════════════════════════════ */}
      {editP && (
        <div className="admin-edit-overlay" style={S.overlay} onClick={() => setEditP(null)}>
          <div className="admin-edit-modal" style={{
            ...S.modal,
            background: themeMode === 'dark' ? 'linear-gradient(180deg, rgba(15,23,42,0.98), rgba(12,20,24,0.98))' : '#ffffff',
            border: themeMode === 'dark' ? '1px solid rgba(148,163,184,0.18)' : '1px solid #e2e8f0',
            boxShadow: themeMode === 'dark' ? '0 28px 70px rgba(2,6,23,0.52)' : '0 32px 80px rgba(15,23,42,0.16)',
          }} onClick={e => e.stopPropagation()}>
            <div className="admin-modal-header" style={{
              ...S.mHead,
              background: themeMode === 'dark' ? 'linear-gradient(135deg, rgba(15,23,42,0.96), rgba(17,24,39,0.96))' : '#f8fafc',
              borderBottom: themeMode === 'dark' ? '1px solid rgba(148,163,184,0.18)' : '1px solid #f1f5f9',
            }}>
              <div>
                <h3 style={{ margin:0, fontSize:17, fontWeight:800, color: themeMode === 'dark' ? '#f8fafc' : '#0f172a', fontFamily:"'Sora',sans-serif" }}>Edit Product</h3>
                <p style={{ margin:'3px 0 0', fontSize:12, color: themeMode === 'dark' ? '#a5b4fc' : '#64748b', fontFamily:"'JetBrains Mono',monospace" }}>{editP._id.slice(-10).toUpperCase()}</p>
              </div>
              <button className="admin-modal-close" style={{ ...S.closeX, background: themeMode === 'dark' ? '#172033' : '#f1f5f9', color: themeMode === 'dark' ? '#e2e8f0' : '#475569', border: themeMode === 'dark' ? '1px solid rgba(148,163,184,0.18)' : 'none' }} onClick={() => setEditP(null)}>✕</button>
            </div>
            <div className="admin-modal-body" style={{ ...S.mBody, background: themeMode === 'dark' ? 'rgba(9,14,18,0.88)' : '#fff' }}>
              {/* images */}
              <div style={{ marginBottom:20 }}>
                <label style={S.lbl}>Product Images</label>
                  <ImagePicker previews={ePrevs} onPick={f => pickImgs(f, true)} onRemove={i => removeImg(i, true)} inputRef={eRef} darkMode={themeMode === 'dark'} />
              </div>
              <div style={S.grid2}>
                <div>
                  <label style={S.lbl}>Product Name *</label>
                  <input style={S.inp} value={eForm.name} onChange={e => setEForm(f => ({...f, name:e.target.value}))} />
                </div>
                <div>
                  <label style={S.lbl}>Category *</label>
                  <CategoryPicker value={eForm.category} onChange={v => setEForm(f => ({...f, category:v, subcategory:''}))} isNew={eNewCat} setIsNew={setENewCat} categories={[...new Set([...cats, ...Object.keys(CATEGORY_TREE)])].sort()} inputStyle={S.inp} buttonStyle={S.ghostBtn} />
                </div>
                <div>
                  <label style={S.lbl}>Subcategory</label>
                  <input list="edit-subcategory-options" style={S.inp} placeholder="e.g. Laptops or Handmade" value={eForm.subcategory || ''} onChange={e => setEForm(f => ({...f, subcategory:e.target.value}))} />
                  <datalist id="edit-subcategory-options">{(CATEGORY_TREE[eForm.category] || []).map(v => <option key={v} value={v} />)}</datalist>
                </div>
                <div>
                  <label style={S.lbl}>Brand</label>
                  <input style={S.inp} placeholder="e.g. HP, Lenovo" value={eForm.brand || ''} onChange={e => setEForm(f => ({...f, brand:e.target.value}))} />
                </div>
                <div>
                  <label style={S.lbl}>Model / Edition</label>
                  <input style={S.inp} placeholder="e.g. Pavilion 15" value={eForm.model || ''} onChange={e => setEForm(f => ({...f, model:e.target.value}))} />
                </div>
                <div>
                  <label style={S.lbl}>Colours <span style={S.optional}>optional · comma separated</span></label>
                  <input style={S.inp} placeholder="Black, Silver, Blue" value={eForm.colors || ''} onChange={e => setEForm(f => ({...f, colors:e.target.value}))} />
                </div>
                <div>
                  <label style={S.lbl}>Sizes / Variants <span style={S.optional}>optional · comma separated</span></label>
                  <input style={S.inp} placeholder="Small, Medium, Large" value={eForm.sizes || ''} onChange={e => setEForm(f => ({...f, sizes:e.target.value}))} />
                </div>
                <label className="admin-visibility-toggle" style={{ ...S.visibilityToggle, gridColumn:'1/-1' }}>
                  <input type="checkbox" checked={eForm.isVisible !== false} onChange={e => setEForm(f => ({...f, isVisible:e.target.checked}))} />
                  <span><strong>Show this product in the shop</strong><small>Hidden products remain available in Admin.</small></span>
                </label>
                <div style={{ position:'relative' }}>
                  <label style={S.lbl}>🇵🇰 Price PKR *</label>
                  <div style={{ position:'relative' }}>
                    <span style={S.pre}>Rs</span>
                    <input style={{ ...S.inp, paddingLeft:36 }} type="number" min="0" value={eForm.pricePKR}
                      onChange={e => {
                        const pkr = e.target.value;
                        const usd = pkr ? pkrToUSD(pkr) : '';
                        setEForm(f => ({...f, pricePKR:pkr, priceUSD: usd !== '' ? String(usd) : f.priceUSD}));
                      }} />
                  </div>
                </div>
                <div style={{ position:'relative' }}>
                  <label style={S.lbl}>🌍 Price USD <span style={{ color:'#10b981', fontWeight:500, fontSize:10, textTransform:'none', letterSpacing:0 }}>(auto)</span></label>
                  <div style={{ position:'relative' }}>
                    <span style={S.pre}>$</span>
                    <input style={{ ...S.inp, paddingLeft:28 }} type="number" min="0" step="0.01" value={eForm.priceUSD} onChange={e => setEForm(f => ({...f, priceUSD:e.target.value}))} />
                  </div>
                </div>
                <div className="admin-discount-editor" style={{ gridColumn:'1/-1' }}>
                  <div>
                    <label style={S.lbl}>🏷️ Discount (%)</label>
                    <input style={S.inp} type="number" min="0" max="100" step="1" value={eForm.discountPercent ?? 0}
                      onChange={e => setEForm(f => ({ ...f, discountPercent:Math.min(100, Math.max(0, Number(e.target.value) || 0)) }))} />
                    <small>Set 0 to show the regular price.</small>
                  </div>
                  <div className="admin-discount-dates">
                    <div>
                      <label style={S.lbl}>Starts on</label>
                      <input style={S.inp} type="date" value={eForm.discountStartDate || ''} onChange={e => setEForm(f => ({ ...f, discountStartDate:e.target.value }))} />
                    </div>
                    <div>
                      <label style={S.lbl}>Ends on</label>
                      <input style={S.inp} type="date" value={eForm.discountEndDate || ''} onChange={e => setEForm(f => ({ ...f, discountEndDate:e.target.value }))} />
                    </div>
                  </div>
                  <div className="admin-discount-preview">
                    <span>{editDiscountNow > 0 ? `${editDiscountNow}% OFF · Active now` : Number(eForm.discountPercent) > 0 ? 'Promotion scheduled or expired' : 'No discount applied'}</span>
                    {editDiscountNow > 0 && <strong>{formatPKR(getDiscountedPrice(eForm.pricePKR, editDiscountNow, 'PKR'))} <i>·</i> {formatUSD(getDiscountedPrice(eForm.priceUSD, editDiscountNow, 'USD'))}</strong>}
                  </div>
                </div>
                <div>
                  <label style={S.lbl}>Stock</label>
                  <input style={S.inp} type="number" min="0" value={eForm.stock} onChange={e => setEForm(f => ({...f, stock:e.target.value}))} />
                </div>
                <div>
                  <label style={S.lbl}>⚖️ Weight (kg) <span style={{ color:'#94a3b8', fontWeight:400, fontSize:10, textTransform:'none', letterSpacing:0 }}>(optional)</span></label>
                  <div style={{ position:'relative' }}>
                    <span style={{ position:'absolute', left:10, top:'50%', transform:'translateY(-50%)', fontSize:11, color:'#94a3b8', fontWeight:700 }}>kg</span>
                    <input style={{ ...S.inp, paddingLeft:30 }} type="number" min="0" step="0.1" placeholder="Leave blank if no weight" value={eForm.weightKg} onChange={e => setEForm(f => ({...f, weightKg:e.target.value}))} />
                  </div>
                  <p style={{ margin:'4px 0 0', fontSize:10, color:'#94a3b8' }}>Used to calculate shipping fee</p>
                </div>
                <div>
                  <label style={S.lbl}>Description</label>
                  <textarea style={{ ...S.inp, height:78, resize:'vertical' }} value={eForm.description} onChange={e => setEForm(f => ({...f, description:e.target.value}))} />
                </div>
                {/* ── MARKET VISIBILITY (full-width, improved) ── */}
                <div style={{ gridColumn:'1/-1' }}>
                  <label style={{ ...S.lbl, marginBottom:10 }}>Market Visibility *</label>
                  <MarketPicker value={eForm.isLocal} onChange={v => setEForm(f => ({...f, isLocal:v}))} darkMode={themeMode === 'dark'} />
                </div>
              </div>
            </div>
            <div className="admin-modal-footer" style={S.mFoot}>
              <button style={S.ghostBtn} onClick={() => setEditP(null)}>Cancel</button>
              <button className="admin-green-button" style={S.greenBtn} onClick={handleEditSave} disabled={eSaving}>
                {eSaving ? '⏳ Saving…' : '💾 Save Changes'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ═══ SIDEBAR ══════════════════════════════════════════ */}
      <aside className="admin-sidebar" style={{ ...S.side, background: themeMode === 'dark' ? 'linear-gradient(180deg, rgba(13,22,19,0.98), rgba(17,28,25,0.98))' : 'linear-gradient(180deg, #ffffff, #f3f8f5)', borderRight: themeMode === 'dark' ? '1px solid rgba(255,255,255,.08)' : '1px solid #dce8e0', boxShadow: themeMode === 'dark' ? S.side.boxShadow : '4px 0 18px rgba(15,23,42,.05)', backdropFilter:'blur(18px)', WebkitBackdropFilter:'blur(18px)' }}>
        <div style={{ ...S.sideLogo, background: themeMode === 'dark' ? 'rgba(15,23,42,0.18)' : 'rgba(15,92,66,0.035)', borderBottom: themeMode === 'dark' ? '1px solid rgba(255,255,255,0.10)' : '1px solid #e2ece6' }}>
          <div style={{ width:38, height:38, borderRadius:12, display:'flex', alignItems:'center', justifyContent:'center', background: themeMode === 'dark' ? 'rgba(255,255,255,0.08)' : '#e8f5ed', boxShadow:'0 12px 22px rgba(14,116,144,0.18)' }}>
            <BrandMark size={26} style={{ filter:'drop-shadow(0 5px 9px rgba(0,0,0,.22))' }} />
          </div>
          <div>
            <p style={{ margin:0, fontSize:15, fontWeight:900, color: themeMode === 'dark' ? '#f8fafc' : '#173a2d', fontFamily:"'Sora',sans-serif", letterSpacing:'-0.4px' }}>IndusCart</p>
            <p style={{ margin:0, fontSize:9, color: themeMode === 'dark' ? '#dfece7' : '#60766a', fontWeight:800, letterSpacing:'1.5px', textTransform:'uppercase' }}>Admin Console</p>
          </div>
        </div>

        <nav style={{ padding:'12px 10px 8px', flex:1 }}>
          {[
            { id:'dashboard', icon:'⬡', label:'Dashboard' },
            { id:'products',  icon:'⬢', label:'Products',   badge: products.length },
            { id:'add',       icon:'⊕', label:'Add Product' },
            { id:'orders',    icon:'◎', label:'Orders',      badge: pending, warn: true },
            { id:'settings',  icon:'⚙', label:'Settings' },
          ].map(item => (
            <button key={item.id} className="nav-btn"
              style={{
                ...S.navBtn,
                ...(tab === item.id ? S.navOn : {}),
                color: themeMode === 'dark' ? '#f8fffb' : '#334155',
                background: tab === item.id ? (themeMode === 'dark' ? 'linear-gradient(90deg, rgba(22,163,74,.20), rgba(16,185,129,.10))' : 'linear-gradient(90deg, #e5f5eb, #f0faf4)') : (themeMode === 'dark' ? 'rgba(255,255,255,0.02)' : 'rgba(15,23,42,0.025)'),
                borderRadius: 12,
                marginBottom: 6,
                padding: '12px 12px 12px 14px',
                boxShadow: tab === item.id ? (themeMode === 'dark' ? 'inset 0 0 0 1px rgba(167,243,208,.18), 0 10px 24px rgba(16,185,129,.08)' : 'inset 0 0 0 1px rgba(5,150,105,.14), 0 6px 14px rgba(15,23,42,.04)') : 'none',
              }}
              onClick={() => openSection(item.id)}>
              <span style={{
                fontSize:15,
                width:20,
                textAlign:'center',
                flexShrink:0,
                opacity: tab===item.id ? 1 : .96,
                color: tab===item.id ? (themeMode === 'dark' ? '#d1fae5' : '#08734e') : (themeMode === 'dark' ? '#f3fff8' : '#64766c'),
                display:'inline-flex',
                alignItems:'center',
                justifyContent:'center',
                background: tab===item.id ? (themeMode === 'dark' ? 'rgba(110,231,183,0.14)' : 'rgba(16,185,129,0.10)') : (themeMode === 'dark' ? 'rgba(255,255,255,0.06)' : 'rgba(15,23,42,0.045)'),
                borderRadius:8,
                height:26,
                border: tab===item.id ? (themeMode === 'dark' ? '1px solid rgba(167,243,208,0.32)' : '1px solid rgba(5,150,105,0.20)') : (themeMode === 'dark' ? '1px solid rgba(255,255,255,0.09)' : '1px solid rgba(15,23,42,0.07)'),
                boxShadow: 'inset 0 0 0 1px rgba(255,255,255,0.02)',
              }}>{item.icon}</span>
              <span style={{ flex:1, textAlign:'left', color: tab===item.id ? (themeMode === 'dark' ? '#f9fffc' : '#075c43') : (themeMode === 'dark' ? '#edfdf5' : '#334155'), fontSize:13, fontWeight:800 }}>{item.label}</span>
              {item.badge > 0 && (
                <span style={{ ...S.navBadge, background: item.warn ? '#ef4444' : 'rgba(16,185,129,.26)', color: item.warn ? '#fff' : '#ffffff', boxShadow:'inset 0 0 0 1px rgba(255,255,255,0.12)', fontWeight:900 }}>
                  {item.badge}
                </span>
              )}
            </button>
          ))}
        </nav>

        {/* ── market split in sidebar ── */}
        <div style={{ padding:'14px 18px', borderTop: themeMode === 'dark' ? '1px solid rgba(255,255,255,.06)' : '1px solid #e2ece6', borderBottom: themeMode === 'dark' ? '1px solid rgba(255,255,255,.06)' : '1px solid #e2ece6', background: themeMode === 'dark' ? 'rgba(15,23,42,0.10)' : 'rgba(15,23,42,0.015)' }}>
          <p style={{ margin:'0 0 10px', fontSize:9, color: themeMode === 'dark' ? '#d5e8e0' : '#64766c', fontWeight:800, textTransform:'uppercase', letterSpacing:'1.2px' }}>Market Split</p>
          <div style={{ display:'flex', gap:8 }}>
            <div style={{ flex:1, background: themeMode === 'dark' ? 'rgba(16,185,129,.12)' : '#ecfdf5', border: themeMode === 'dark' ? '1px solid rgba(16,185,129,.30)' : '1px solid #bbf7d0', borderRadius:12, padding:'10px 10px', textAlign:'center', boxShadow:'inset 0 0 0 1px rgba(16,185,129,.04)' }}>
              <p style={{ margin:0, fontSize:20, fontWeight:900, color: themeMode === 'dark' ? '#a7f3d0' : '#047857', lineHeight:1, fontFamily:"'Sora',sans-serif" }}>{localCnt}</p>
              <p style={{ margin:'4px 0 0', fontSize:9, color: themeMode === 'dark' ? '#d9fbe9' : '#166534', fontWeight:800, textTransform:'uppercase', letterSpacing:'.6px' }}>🇵🇰 Local</p>
            </div>
            <div style={{ flex:1, background: themeMode === 'dark' ? 'rgba(99,102,241,.12)' : '#eef2ff', border: themeMode === 'dark' ? '1px solid rgba(99,102,241,.30)' : '1px solid #c7d2fe', borderRadius:12, padding:'10px 10px', textAlign:'center', boxShadow:'inset 0 0 0 1px rgba(99,102,241,.04)' }}>
              <p style={{ margin:0, fontSize:20, fontWeight:900, color: themeMode === 'dark' ? '#c7d2fe' : '#4338ca', lineHeight:1, fontFamily:"'Sora',sans-serif" }}>{globalCnt}</p>
              <p style={{ margin:'4px 0 0', fontSize:9, color: themeMode === 'dark' ? '#ebebff' : '#4338ca', fontWeight:800, textTransform:'uppercase', letterSpacing:'.6px' }}>🌍 Global</p>
            </div>
          </div>
        </div>

        <div style={{ ...S.miniStats, background: themeMode === 'dark' ? 'rgba(15,23,42,0.10)' : 'rgba(15,23,42,0.015)', borderTopColor: themeMode === 'dark' ? 'rgba(255,255,255,.06)' : '#e2ece6', borderBottomColor: themeMode === 'dark' ? 'rgba(255,255,255,.06)' : '#e2ece6' }}>
          {[
            { label:'Products', value: products.length, color: themeMode === 'dark' ? '#34d399' : '#047857' },
            { label:'Orders',   value: orders.length,   color: themeMode === 'dark' ? '#fbbf24' : '#b45309' },
            { label:'OOS',      value: oos,             color: themeMode === 'dark' ? '#fda4af' : '#be123c' },
          ].map(s => (
            <div key={s.label} style={{ textAlign:'center', padding:'4px 0' }}>
              <p style={{ margin:0, fontSize:20, fontWeight:900, color:s.color, lineHeight:1, fontFamily:"'Sora',sans-serif" }}>{s.value}</p>
              <p style={{ margin:'4px 0 0', fontSize:9, color: themeMode === 'dark' ? '#e6f7ef' : '#64766c', fontWeight:800, textTransform:'uppercase', letterSpacing:'.8px' }}>{s.label}</p>
            </div>
          ))}
        </div>

        <div style={{ ...S.sideUser, background: themeMode === 'dark' ? 'rgba(15,23,42,.12)' : 'rgba(15,23,42,.025)', borderTopColor: themeMode === 'dark' ? 'rgba(255,255,255,.06)' : '#e2ece6' }}>
          <div style={S.ava}>{user?.name?.[0]?.toUpperCase()||'A'}</div>
          <div style={{ flex:1, minWidth:0 }}>
            <p style={{ margin:0, fontSize:12, fontWeight:700, color: themeMode === 'dark' ? '#f8fafc' : '#173a2d', overflow:'hidden', textOverflow:'ellipsis', whiteSpace:'nowrap', fontFamily:"'Sora',sans-serif" }}>{user?.name}</p>
            <p style={{ margin:0, fontSize:10, color: themeMode === 'dark' ? '#a7f3d0' : '#08734e', fontWeight:600 }}>Administrator</p>
          </div>
          <button title="Logout" style={{ ...S.logoutBtn, color: themeMode === 'dark' ? '#e2f9ef' : '#475569', borderColor: themeMode === 'dark' ? 'rgba(255,255,255,.15)' : '#d6e2da', background: themeMode === 'dark' ? 'rgba(255,255,255,.04)' : '#fff' }} onClick={() => { logout(); navigate('/login'); }}>⏻</button>
        </div>
      </aside>

      {/* ═══ MAIN ══════════════════════════════════════════════ */}
      <main className="admin-main" style={{ ...S.main, background: themeMode === 'dark' ? 'radial-gradient(circle at top, rgba(20,31,28,0.98) 0%, rgba(11,18,16,0.96) 35%, rgba(4,10,10,0.98) 100%)' : 'linear-gradient(180deg, rgba(245,250,246,0.95), rgba(245,250,246,0.92))', color: themeMode === 'dark' ? '#edf6f3' : '#14251d', backdropFilter: 'blur(2px)', WebkitBackdropFilter:'blur(2px)' }}>
        <div className="admin-mobile-heading" style={{ background: themeMode === 'dark' ? 'linear-gradient(135deg,#0f172a,#0f766e 58%,#14b8a6)' : 'linear-gradient(135deg,#0a3d2f,#12684c 58%,#1a7f5d)' }}>
          <p>INDUSCART ADMINISTRATION</p>
          <h1>Admin workspace</h1>
          <span>Run your catalog, orders, customers, and delivery operations from one place.</span>
          <button
            onClick={toggleThemeMode}
            style={{
              marginTop:12,
              border:'1px solid rgba(255,255,255,0.2)',
              background:'rgba(255,255,255,0.08)',
              color:'#ecfeff',
              borderRadius:999,
              padding:'8px 12px',
              fontWeight:800,
              fontSize:10,
              cursor:'pointer',
              letterSpacing:'1px',
              textTransform:'uppercase',
            }}
          >
            {themeMode === 'dark' ? 'Light mode' : 'Dark mode'}
          </button>
        </div>

        {/* ─── DASHBOARD ─────────────────────────────────────── */}
        {tab === 'dashboard' && (
          <div style={{ animation:'fadeUp .35s ease' }}>
            <div style={{ ...S.pgTop, padding:'10px 0 0' }}>
              <div>
                <h1 style={{ ...S.pgTitle, color: themeMode === 'dark' ? '#e2e8f0' : 'var(--ink, #14251d)' }}>Dashboard</h1>
                <p style={{ ...S.pgSub, color: themeMode === 'dark' ? '#cbd5e1' : '#64748b' }}>Welcome back, <strong style={{ color: themeMode === 'dark' ? '#f8fafc' : '#0f172a' }}>{user?.name}</strong>. Here is the latest health of your store.</p>
              </div>
              <button className="admin-green-button" style={{ ...S.greenBtn, boxShadow:'0 10px 20px rgba(76, 201, 157, 0.22)' }} onClick={() => openSection('add')}>+ Add Product</button>
            </div>

            <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center', gap:12, flexWrap:'wrap', marginBottom:18 }}>
              <div style={{ display:'flex', gap:8, flexWrap:'wrap' }}>
                {['all', 'cash', 'online'].map((mode) => (
                  <button
                    key={mode}
                    onClick={() => setKpiFilter(mode)}
                    style={{
                      border:'1px solid rgba(148,163,184,.25)',
                      background: kpiFilter === mode ? (themeMode === 'dark' ? '#0f766e' : '#d1fae5') : (themeMode === 'dark' ? '#0b1d2d' : '#f8fafc'),
                      color: kpiFilter === mode ? (themeMode === 'dark' ? '#ecfeff' : '#065f46') : (themeMode === 'dark' ? '#dbeafe' : '#334155'),
                      borderRadius:999,
                      padding:'8px 12px',
                      fontWeight:800,
                      fontSize:11,
                      cursor:'pointer',
                      textTransform:'uppercase',
                      letterSpacing:'0.8px',
                    }}
                  >
                    {mode === 'all' ? 'All' : mode === 'cash' ? 'Cash' : 'Online'}
                  </button>
                ))}
              </div>

              <div style={{ display:'flex', gap:8, flexWrap:'wrap' }}>
                {['all', '7d', '30d', '90d', '1y'].map((range) => (
                  <button
                    key={range}
                    onClick={() => setTimeWindow(range)}
                    style={{
                      border:'1px solid rgba(148,163,184,.25)',
                      background: timeWindow === range ? (themeMode === 'dark' ? '#1d4ed8' : '#dbeafe') : (themeMode === 'dark' ? '#0f172a' : '#f8fafc'),
                      color: timeWindow === range ? (themeMode === 'dark' ? '#eff6ff' : '#1e40af') : (themeMode === 'dark' ? '#dbeafe' : '#334155'),
                      borderRadius:999,
                      padding:'8px 10px',
                      fontWeight:800,
                      fontSize:10,
                      cursor:'pointer',
                      textTransform:'uppercase',
                      letterSpacing:'0.8px',
                    }}
                  >
                    {range === 'all' ? 'All time' : range}
                  </button>
                ))}
              </div>
            </div>

            <div style={{ display:'grid', gridTemplateColumns:'repeat(4,1fr)', gap:16, marginBottom:18 }}>
              {kpiRows.map((k) => {
                const value = typeof k.value === 'number' ? formatPKR(k.value) : k.value;
                const accent = k.label === 'Cash Sales' ? 'linear-gradient(135deg,#78350f,#d97706)' : k.label === 'Online Sales' ? 'linear-gradient(135deg,#1d4ed8,#3b82f6)' : k.label === 'Top Product' ? 'linear-gradient(135deg,#0f172a,#334155)' : 'linear-gradient(135deg,#064e3b,#059669)';
                const isActive = k.key === kpiFilter || (k.label === 'Total Revenue' && kpiFilter === 'all');
                const isHovered = hoveredKpi === k.label;
                return (
                  <div key={k.label} className="kpi-card"
                    title={`${k.label}: ${value}`}
                    onClick={() => (k.key !== 'all' ? setKpiFilter(k.key) : setKpiFilter('all'))}
                    onMouseEnter={() => setHoveredKpi(k.label)}
                    onMouseLeave={() => setHoveredKpi(null)}
                    style={{ background:accent, borderRadius:18, padding:'22px 20px', cursor:'pointer', transition:'transform .2s ease, box-shadow .2s ease, filter .2s ease, opacity .2s ease', boxShadow:`0 ${isHovered ? '10px' : '4px'} 24px ${isActive ? 'rgba(16,185,129,.18)' : 'rgba(15,23,42,.14)'}`, opacity: isActive || kpiFilter === 'all' ? 1 : 0.8, transform: isHovered ? 'translateY(-4px)' : 'translateY(0)', filter: isHovered ? 'saturate(1.08)' : 'saturate(1)' }}>
                    <p style={{ margin:'0 0 14px', fontSize:10, fontWeight:700, color:'rgba(255,255,255,.6)', textTransform:'uppercase', letterSpacing:'1px', fontFamily:"'Sora',sans-serif" }}>{k.label}</p>
                    <p style={{ margin:'0 0 6px', fontSize:28, fontWeight:900, color:'#fff', letterSpacing:'-1px', lineHeight:1, fontFamily:"'Sora',sans-serif" }}>{value}</p>
                    <p style={{ margin:0, fontSize:11, color:'rgba(255,255,255,.55)', fontWeight:500 }}>{k.sub}</p>
                  </div>
                );
              })}
            </div>

            <div style={{ ...S.card, marginBottom:20, background: themeMode === 'dark' ? 'linear-gradient(135deg,#0f172a,#0b1f1b)' : 'linear-gradient(135deg,#f8fafc,#ecfdf5)', borderColor: themeMode === 'dark' ? '#1e293b' : '#dfece4', boxShadow: themeMode === 'dark' ? '0 16px 32px rgba(2,6,23,.32)' : '0 16px 34px rgba(11,58,42,.06)' }}>
              <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center', gap:12, flexWrap:'wrap', marginBottom:14 }}>
                <div>
                  <p style={{ margin:0, fontSize:10, fontWeight:800, color: themeMode === 'dark' ? '#a7f3d0' : '#0f766e', letterSpacing:'1.2px', textTransform:'uppercase' }}>CEO summary</p>
                  <h3 style={{ ...S.cardH, color: themeMode === 'dark' ? '#f8fafc' : '#0f172a', marginTop:6 }}>Executive health snapshot</h3>
                </div>
                <span style={{ fontSize:10, fontWeight:800, color: themeMode === 'dark' ? '#dcfce7' : '#14532d', background: themeMode === 'dark' ? '#052e2b' : '#dcfce7', border:'1px solid rgba(20,83,45,.12)', borderRadius:999, padding:'6px 10px' }}>{executiveSummary.momentum}% momentum</span>
              </div>

              <div style={{ display:'grid', gridTemplateColumns:'1.5fr 1fr', gap:16 }}>
                <div>
                  <p style={{ margin:0, fontSize:13, color: themeMode === 'dark' ? '#dbeafe' : '#334155', lineHeight:1.8, fontWeight:600 }}>
                    {executiveSummary.outlook}
                  </p>
                  <div style={{ display:'flex', gap:10, flexWrap:'wrap', marginTop:14 }}>
                    {[
                      { label: 'Cash share', value: `${executiveSummary.cashShare}%` },
                      { label: 'Online share', value: `${executiveSummary.onlineShare}%` },
                      { label: 'Best channel', value: (analytics?.summary?.cashRevenue || 0) >= (analytics?.summary?.onlineRevenue || 0) ? 'Cash' : 'Online' },
                    ].map((chip) => (
                      <span key={chip.label} style={{ background: themeMode === 'dark' ? 'rgba(15,23,42,.72)' : '#f8fafc', border:'1px solid rgba(148,163,184,.32)', borderRadius:999, padding:'7px 10px', fontSize:10, fontWeight:800, color: themeMode === 'dark' ? '#e2e8f0' : '#334155', letterSpacing:'.7px', textTransform:'uppercase' }}>
                        {chip.label}: {chip.value}
                      </span>
                    ))}
                  </div>
                </div>

                <div style={{ display:'grid', gridTemplateColumns:'repeat(2, minmax(0, 1fr))', gap:10 }}>
                  <div style={{ background: themeMode === 'dark' ? '#111827' : '#f8fafc', border:'1px solid rgba(148,163,184,.24)', borderRadius:12, padding:'12px 14px' }}>
                    <p style={{ margin:0, fontSize:10, fontWeight:800, color: themeMode === 'dark' ? '#94a3b8' : '#64748b', textTransform:'uppercase', letterSpacing:'1px' }}>Revenue</p>
                    <p style={{ margin:'8px 0 0', fontSize:18, fontWeight:900, color: themeMode === 'dark' ? '#f8fafc' : '#0f172a', fontFamily:"'Sora',sans-serif" }}>{formatPKR(analytics?.summary?.totalRevenue || 0)}</p>
                  </div>
                  <div style={{ background: themeMode === 'dark' ? '#111827' : '#f8fafc', border:'1px solid rgba(148,163,184,.24)', borderRadius:12, padding:'12px 14px' }}>
                    <p style={{ margin:0, fontSize:10, fontWeight:800, color: themeMode === 'dark' ? '#94a3b8' : '#64748b', textTransform:'uppercase', letterSpacing:'1px' }}>Orders</p>
                    <p style={{ margin:'8px 0 0', fontSize:18, fontWeight:900, color: themeMode === 'dark' ? '#f8fafc' : '#0f172a', fontFamily:"'Sora',sans-serif" }}>{analytics?.summary?.totalOrders || orders.length}</p>
                  </div>
                </div>
              </div>
            </div>

            {/* ── Sales History & Payment Mix ── */}
            <div style={{ ...S.card, marginBottom:20, background: themeMode === 'dark' ? '#0f172a' : 'linear-gradient(180deg,#ffffff,#f7fbf8)', borderColor: themeMode === 'dark' ? '#1e293b' : '#dfece4', boxShadow: themeMode === 'dark' ? '0 12px 32px rgba(2,6,23,.38)' : '0 12px 30px rgba(11,58,42,.07)' }}>
              <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center', marginBottom:18, gap:12, flexWrap:'wrap' }}>
                <div>
                  <h3 style={{ ...S.cardH, color: themeMode === 'dark' ? '#e2e8f0' : '#1e293b' }}>📊 Sales History & Payment Mix</h3>
                  <p style={{ margin:'4px 0 0', fontSize:12, color: themeMode === 'dark' ? '#aebbb4' : '#64748b' }}>Date, day, week, month, and 3/6/9/12 month revenue trends with cash vs online totals</p>
                </div>
                <div style={{ display:'flex', gap:8, flexWrap:'wrap' }}>
                  <button style={{ ...S.linkBtn, color: themeMode === 'dark' ? '#93c5fd' : 'var(--brand-dark, #0d5c42)' }} onClick={() => openSection('orders')}>View orders →</button>
                  <button className="admin-green-button" style={{ ...S.greenBtn, padding:'9px 14px', fontSize:12 }} onClick={exportCsvReport}>📊 CSV export</button>
                  <button className="admin-pdf-report-button" style={{ ...S.greenBtn, padding:'9px 14px', fontSize:12, background:'linear-gradient(135deg,#7c3aed,#4f46e5)' }} onClick={generatePdfReport}>📄 PDF report</button>
                </div>
              </div>

              <div style={{ display:'grid', gridTemplateColumns:'repeat(2,minmax(0,1fr))', gap:14, marginBottom:18 }}>
                <div style={{ background: themeMode === 'dark' ? '#0b2f2a' : '#f0fdf4', border:'1.5px solid #bbf7d0', borderRadius:14, padding:'18px 18px' }}>
                  <p style={{ margin:'0 0 8px', fontSize:10, fontWeight:800, color: themeMode === 'dark' ? '#d1fae5' : '#166534', letterSpacing:'1px', textTransform:'uppercase' }}>Cash Earnings</p>
                  <p style={{ margin:0, fontSize:26, fontWeight:900, color: themeMode === 'dark' ? '#a7f3d0' : '#15803d', fontFamily:"'Sora',sans-serif" }}>{formatPKR(analytics?.summary?.cashRevenue || 0)}</p>
                </div>
                <div style={{ background: themeMode === 'dark' ? '#0f1d3d' : '#eff6ff', border:'1.5px solid #bfdbfe', borderRadius:14, padding:'18px 18px' }}>
                  <p style={{ margin:'0 0 8px', fontSize:10, fontWeight:800, color: themeMode === 'dark' ? '#bfdbfe' : '#1d4ed8', letterSpacing:'1px', textTransform:'uppercase' }}>Online Earnings</p>
                  <p style={{ margin:0, fontSize:26, fontWeight:900, color: themeMode === 'dark' ? '#bfdbfe' : '#2563eb', fontFamily:"'Sora',sans-serif" }}>{formatPKR(analytics?.summary?.onlineRevenue || 0)}</p>
                </div>
              </div>

              <div style={{ display:'grid', gridTemplateColumns:'repeat(auto-fit, minmax(150px, 1fr))', gap:12, marginBottom:18 }}>
                {Object.entries(analytics?.rangeBreakdown || {}).map(([key, item]) => (
                  <div key={key} style={{ background: themeMode === 'dark' ? '#111827' : '#f8fafc', border:'1px solid #e2e8f0', borderRadius:12, padding:'14px 12px' }}>
                    <p style={{ margin:'0 0 4px', fontSize:10, fontWeight:800, color: themeMode === 'dark' ? '#cbd5e1' : '#64748b', textTransform:'uppercase', letterSpacing:'1px' }}>{key}-Month</p>
                    <p style={{ margin:0, fontSize:18, fontWeight:900, color: themeMode === 'dark' ? '#f8fafc' : '#0f172a', fontFamily:"'Sora',sans-serif" }}>{formatPKR(item.totalRevenue || 0)}</p>
                    <p style={{ margin:'4px 0 0', fontSize:11, color: themeMode === 'dark' ? '#94a3b8' : '#64748b' }}>{item.orderCount || 0} orders</p>
                  </div>
                ))}
              </div>

              <div style={{ display:'flex', gap:8, marginBottom:16, flexWrap:'wrap' }}>
                {performanceTabs.map((tab) => (
                  <button
                    key={tab.key}
                    onClick={() => setAnalyticsTab(tab.key)}
                    style={{
                      background: analyticsTab === tab.key ? (themeMode === 'dark' ? '#0f766e' : '#d1fae5') : (themeMode === 'dark' ? '#111827' : '#f8fafc'),
                      border: '1px solid rgba(148,163,184,.22)',
                      color: analyticsTab === tab.key ? (themeMode === 'dark' ? '#ecfeff' : '#065f46') : (themeMode === 'dark' ? '#e2e8f0' : '#334155'),
                      borderRadius:999,
                      padding:'8px 12px',
                      fontWeight:800,
                      fontSize:11,
                      letterSpacing:'0.8px',
                      textTransform:'uppercase',
                      cursor:'pointer',
                    }}
                  >
                    {tab.label}
                  </button>
                ))}
              </div>

              {analyticsTab === 'overview' && (
                <div style={{ display:'grid', gridTemplateColumns:'1.2fr 0.8fr', gap:16 }}>
                  <div style={{ background: themeMode === 'dark' ? '#111827' : '#f8fafc', border:'1px solid #e2e8f0', borderRadius:14, padding:'18px 16px', transition:'all .25s ease' }}>
                    <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center', marginBottom:12, gap:12, flexWrap:'wrap' }}>
                      <h4 style={{ ...S.cardH, margin:0, color: themeMode === 'dark' ? '#e2e8f0' : '#1e293b' }}>🌍 Regional sales</h4>
                      <span style={{ fontSize:10, fontWeight:800, color:'#0f766e', background:'#ccfbf1', padding:'4px 8px', borderRadius:999, letterSpacing:'0.7px', textTransform:'uppercase' }}>{strongestRegion}</span>
                    </div>
                    {(analytics?.regionBreakdown || []).length === 0 ? (
                      <p style={{ margin:0, color: themeMode === 'dark' ? '#cbd5e1' : '#64748b', fontSize:12 }}>No regional sales yet.</p>
                    ) : (
                      <div style={{ display:'flex', flexDirection:'column', gap:10 }}>
                        {(analytics?.regionBreakdown || []).slice(0, 5).map((region) => (
                          <div key={region.region} style={{ display:'flex', justifyContent:'space-between', gap:10, alignItems:'center', borderBottom:'1px solid #e2e8f0', paddingBottom:8 }}>
                            <div>
                              <p style={{ margin:0, fontWeight:800, color: themeMode === 'dark' ? '#f8fafc' : '#0f172a', fontSize:14 }}>{region.region}</p>
                              <p style={{ margin:'2px 0 0', fontSize:11, color: themeMode === 'dark' ? '#cbd5e1' : '#64748b' }}>{region.orders || 0} orders</p>
                            </div>
                            <strong style={{ color:'#10b981', fontFamily:"'JetBrains Mono',monospace", fontSize:13 }}>{formatPKR(region.totalRevenue || 0)}</strong>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>

                  <div style={{ background: themeMode === 'dark' ? 'linear-gradient(135deg, rgba(12,18,22,0.98), rgba(18,24,31,0.98))' : 'linear-gradient(135deg,#f0fdfa,#f8fafc)', border: themeMode === 'dark' ? '1px solid rgba(93,175,143,0.28)' : '1px solid #cfe4da', borderRadius:14, padding:'18px 16px', boxShadow: themeMode === 'dark' ? '0 22px 40px rgba(5,10,14,0.32)' : '0 12px 28px rgba(15,45,32,.07)', transition:'all .25s ease' }}>
                    <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center', marginBottom:12, gap:8, flexWrap:'wrap' }}>
                      <h4 style={{ ...S.cardH, margin:0, color: themeMode === 'dark' ? '#e5f8ee' : '#173a2d' }}>🧠 AI growth strategy</h4>
                      <span style={{ fontSize:10, fontWeight:800, color: themeMode === 'dark' ? '#d8fff0' : '#115e59', background: themeMode === 'dark' ? 'rgba(15,118,110,0.30)' : '#ccfbf1', border:'1px solid rgba(110,231,183,0.4)', padding:'4px 8px', borderRadius:999, letterSpacing:'0.7px', textTransform:'uppercase' }}>smart plan</span>
                    </div>

                    <div style={{ display:'grid', gridTemplateColumns:'repeat(2,minmax(0,1fr))', gap:8, marginBottom:12 }}>
                      {aiPulse.map((chip) => (
                        <div key={chip.label} style={{ background: themeMode === 'dark' ? 'rgba(255,255,255,0.04)' : '#fff', border:'1px solid rgba(148,163,184,0.22)', borderRadius:10, padding:'8px 10px', backdropFilter:'blur(6px)' }}>
                          <p style={{ margin:0, fontSize:9, fontWeight:800, color: themeMode === 'dark' ? '#9ae6b4' : '#0f766e', textTransform:'uppercase', letterSpacing:'0.8px' }}>{chip.label}</p>
                          <p style={{ margin:'4px 0 0', fontSize:12, fontWeight:800, color: themeMode === 'dark' ? '#ecfeff' : '#173a2d', lineHeight:1.3 }}>{chip.value}</p>
                        </div>
                      ))}
                    </div>

                    <div style={{ display:'grid', gridTemplateColumns:'repeat(2,minmax(0,1fr))', gap:8, marginBottom:12 }}>
                      {aiStrategy.map((item) => (
                        <div key={item.label} style={{ background: themeMode === 'dark' ? 'rgba(255,255,255,0.03)' : '#fff', border:'1px solid rgba(148,163,184,0.22)', borderRadius:10, padding:'8px 10px' }}>
                          <p style={{ margin:0, fontSize:9, fontWeight:800, color: item.tone === '#10b981' ? (themeMode === 'dark' ? '#9ae6b4' : '#047857') : item.tone === '#f59e0b' ? (themeMode === 'dark' ? '#fbbf24' : '#92400e') : item.tone === '#f43f5e' ? (themeMode === 'dark' ? '#fda4af' : '#be123c') : (themeMode === 'dark' ? '#a5b4fc' : '#4338ca'), textTransform:'uppercase', letterSpacing:'0.8px' }}>{item.label}</p>
                          <p style={{ margin:'4px 0 0', fontSize:12, fontWeight:800, color: themeMode === 'dark' ? '#f8fafc' : '#173a2d', lineHeight:1.3 }}>{item.value}</p>
                        </div>
                      ))}
                    </div>

                    <p style={{ margin:'0 0 10px', fontSize:12, color: themeMode === 'dark' ? '#dbeafe' : '#334155', lineHeight:1.7, fontWeight:600 }}>{analytics?.insights?.summaryText || 'No insight available yet.'}</p>
                    <ul style={{ margin:0, paddingLeft:18, color: themeMode === 'dark' ? '#d6f4ee' : '#334155', fontSize:12, lineHeight:1.7 }}>
                      {(analytics?.insights?.recommendedActions || []).slice(0, 4).map((action) => (
                        <li key={action}>{action}</li>
                      ))}
                    </ul>
                  </div>
                </div>
              )}

              {analyticsTab === 'products' && (
                <div style={{ display:'grid', gridTemplateColumns:'repeat(auto-fit, minmax(230px, 1fr))', gap:14 }}>
                  {productBreakdown.length === 0 ? (
                    <p style={{ color: themeMode === 'dark' ? '#cbd5e1' : '#64748b', margin:0 }}>No product performance yet.</p>
                  ) : productBreakdown.map((product) => (
                    <div key={product.name} style={{ background: themeMode === 'dark' ? '#111827' : '#f8fafc', border:'1px solid rgba(148,163,184,.22)', borderRadius:14, padding:16 }}>
                      <div style={{ display:'flex', justifyContent:'space-between', gap:10, alignItems:'center', marginBottom:10 }}>
                        <strong style={{ fontSize:15, color: themeMode === 'dark' ? '#f8fafc' : '#0f172a' }}>{product.name}</strong>
                        <span style={{ fontSize:10, fontWeight:800, color:'#ecfeff', background:'#0f766e', padding:'4px 8px', borderRadius:999 }}>{product.units} units</span>
                      </div>
                      <div style={{ display:'flex', justifyContent:'space-between', fontSize:12, color: themeMode === 'dark' ? '#cbd5e1' : '#334155' }}>
                        <span>Revenue</span>
                        <strong>{formatPKR(product.revenue)}</strong>
                      </div>
                      <div style={{ height:8, background: themeMode === 'dark' ? '#1f2937' : '#e2e8f0', borderRadius:999, overflow:'hidden', marginTop:12 }}>
                        <div style={{ height:'100%', width: `${Math.min((product.revenue / Math.max(...productBreakdown.map(p => p.revenue), 1)) * 100, 100)}%`, background:'linear-gradient(135deg,#10b981,#14b8a6)', borderRadius:999 }} />
                      </div>
                    </div>
                  ))}
                </div>
              )}

              {analyticsTab === 'regions' && (
                <div style={{ display:'grid', gridTemplateColumns:'repeat(auto-fit, minmax(220px, 1fr))', gap:14 }}>
                  {regionBreakdown.length === 0 ? (
                    <p style={{ color: themeMode === 'dark' ? '#cbd5e1' : '#64748b', margin:0 }}>No regional performance yet.</p>
                  ) : regionBreakdown.slice(0, 6).map((region) => (
                    <div key={region.region} style={{ background: themeMode === 'dark' ? '#111827' : '#f8fafc', border:'1px solid rgba(148,163,184,.22)', borderRadius:14, padding:16 }}>
                      <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center', gap:6, marginBottom:10 }}>
                        <strong style={{ fontSize:15, color: themeMode === 'dark' ? '#f8fafc' : '#0f172a' }}>{region.region}</strong>
                        <span style={{ fontSize:10, fontWeight:800, color: themeMode === 'dark' ? '#d1fae5' : '#065f46', background: themeMode === 'dark' ? '#022c22' : '#d1fae5', padding:'4px 8px', borderRadius:999 }}>{region.orders} orders</span>
                      </div>
                      <div style={{ display:'flex', justifyContent:'space-between', fontSize:12, color: themeMode === 'dark' ? '#cbd5e1' : '#334155' }}>
                        <span>Revenue</span>
                        <strong>{formatPKR(region.revenue)}</strong>
                      </div>
                    </div>
                  ))}
                </div>
              )}

              {analyticsTab === 'channels' && (
                <div style={{ display:'grid', gridTemplateColumns:'repeat(auto-fit, minmax(220px, 1fr))', gap:14 }}>
                  {channelBreakdown.map((channel) => (
                    <div key={channel.label} style={{ background: themeMode === 'dark' ? '#111827' : '#f8fafc', border:'1px solid rgba(148,163,184,.22)', borderRadius:14, padding:16 }}>
                      <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center', gap:8, marginBottom:10 }}>
                        <strong style={{ fontSize:15, color: themeMode === 'dark' ? '#f8fafc' : '#0f172a' }}>{channel.label}</strong>
                        <span style={{ fontSize:10, fontWeight:800, color: themeMode === 'dark' ? '#dbeafe' : '#1d4ed8', background: themeMode === 'dark' ? '#172554' : '#dbeafe', padding:'4px 8px', borderRadius:999 }}>{Math.round(channel.share || 0)}%</span>
                      </div>
                      <div style={{ display:'flex', justifyContent:'space-between', fontSize:12, color: themeMode === 'dark' ? '#cbd5e1' : '#334155', marginBottom:8 }}>
                        <span>Revenue</span>
                        <strong>{formatPKR(channel.value)}</strong>
                      </div>
                      <div style={{ height:8, background: themeMode === 'dark' ? '#1f2937' : '#e2e8f0', borderRadius:999, overflow:'hidden' }}>
                        <div style={{ height:'100%', width:`${Math.min(channel.share || 0, 100)}%`, background: channel.label === 'Cash' ? 'linear-gradient(135deg,#f59e0b,#f97316)' : 'linear-gradient(135deg,#3b82f6,#60a5fa)', borderRadius:999 }} />
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>

            <div style={{
              ...S.card,
              marginBottom:20,
              background: themeMode === 'dark' ? 'linear-gradient(180deg, rgba(15,23,42,0.98), rgba(8,17,23,0.96))' : 'linear-gradient(135deg, rgba(255,255,255,0.88), rgba(255,255,255,0.74))',
              borderColor: themeMode === 'dark' ? 'rgba(148,163,184,0.18)' : 'rgba(148,163,184,0.18)',
              boxShadow: themeMode === 'dark' ? '0 18px 40px rgba(2,6,23,0.32)' : '0 16px 38px rgba(15,23,42,.08)',
            }}>
              <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center', marginBottom:16, flexWrap:'wrap', gap:12 }}>
                <div>
                  <h3 style={{ ...S.cardH, color: themeMode === 'dark' ? '#e2e8f0' : '#1e293b' }}>📈 Sales charts by day / week / month</h3>
                  <p style={{ margin:'4px 0 0', fontSize:12, color: themeMode === 'dark' ? '#cbd5e1' : '#94a3b8' }}>Trend view for revenue concentration across each comparison window</p>
                </div>
              </div>
              <div style={{ display:'grid', gridTemplateColumns:'repeat(auto-fit, minmax(220px, 1fr))', gap:16 }}>
                {salesChartSections.map((chart) => {
                  const maxValue = Math.max(...chart.data.map((entry) => entry.value || 0), 1);
                  return (
                    <div key={chart.title} style={{ background: themeMode === 'dark' ? '#0f172a' : '#f8fafc', border:'1px solid rgba(148,163,184,.22)', borderRadius:14, padding:16, transition:'all .25s ease' }}>
                      <p style={{ margin:'0 0 14px', fontSize:10, fontWeight:800, color: themeMode === 'dark' ? '#cbd5e1' : '#475569', textTransform:'uppercase', letterSpacing:'1px' }}>{chart.title}</p>
                      <div style={{ display:'flex', alignItems:'flex-end', gap:8, minHeight:120, height:120 }}>
                        {chart.data.length === 0 ? (
                          <p style={{ margin:0, color: themeMode === 'dark' ? '#94a3b8' : '#64748b', fontSize:12 }}>No data yet.</p>
                        ) : (
                          chart.data.map((entry) => (
                            <div key={`${chart.title}-${entry.label}`} title={`${entry.label}: ${formatPKR(entry.value)}`} style={{ flex:1, display:'flex', flexDirection:'column', alignItems:'center', gap:6, transition:'transform .25s ease' }}>
                              <strong style={{ fontSize:10, color: themeMode === 'dark' ? '#cbd5e1' : '#64748b', fontFamily:"'JetBrains Mono',monospace" }}>{formatCompactNumber(entry.value)}</strong>
                              <div style={{ width:'100%', minHeight:16, height:Math.max((entry.value / maxValue) * 70, 12), background:'linear-gradient(180deg,#d8b06a,#b67d30)', borderRadius:'10px 10px 6px 6px', boxShadow:'0 8px 20px rgba(182,125,48,.22)', transition:'height .55s ease, transform .25s ease, filter .25s ease', transform:'translateY(0)', filter:'saturate(1)', opacity:0.96 }} />
                              <span style={{ fontSize:9, color: themeMode === 'dark' ? '#94a3b8' : '#64748b', textAlign:'center', whiteSpace:'nowrap' }}>{entry.label}</span>
                            </div>
                          ))
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>

            <div style={{
              ...S.card,
              marginBottom:20,
              background: themeMode === 'dark' ? 'linear-gradient(180deg, rgba(15,23,42,0.98), rgba(8,17,23,0.96))' : '#fff',
              borderColor: themeMode === 'dark' ? '#1e293b' : '#dfece4',
              boxShadow: themeMode === 'dark' ? '0 12px 32px rgba(2,6,23,.38)' : '0 12px 32px rgba(11,58,42,.055)',
            }}>
              <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center', marginBottom:16, flexWrap:'wrap', gap:12 }}>
                <div>
                  <h3 style={{ ...S.cardH, color: themeMode === 'dark' ? '#e2e8f0' : '#1e293b' }}>🎯 Regional marketing campaign cards</h3>
                  <p style={{ margin:'4px 0 0', fontSize:12, color: themeMode === 'dark' ? '#cbd5e1' : '#94a3b8' }}>Localized offers that match each region’s strongest sales pattern</p>
                </div>
              </div>
              <div style={{ display:'grid', gridTemplateColumns:'repeat(auto-fit, minmax(220px, 1fr))', gap:12 }}>
                {(regionalCampaigns || []).map((campaign) => (
                  <div key={campaign.region} style={{ background: themeMode === 'dark' ? 'linear-gradient(135deg,#052e2b,#111827)' : 'linear-gradient(135deg,#f0fdf4,#ecfeff)', border:'1px solid #bae6fd', borderRadius:14, padding:16 }}>
                    <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center', gap:8, marginBottom:10 }}>
                      <strong style={{ fontSize:15, color: themeMode === 'dark' ? '#f8fafc' : '#0f172a' }}>{campaign.region}</strong>
                      <span style={{ fontSize:10, fontWeight:800, color: themeMode === 'dark' ? '#d1fae5' : '#065f46', background: themeMode === 'dark' ? '#022c22' : '#d1fae5', padding:'4px 8px', borderRadius:999 }}>{campaign.offer}</span>
                    </div>
                    <p style={{ margin:'0 0 10px', fontSize:12, color: themeMode === 'dark' ? '#cbd5e1' : '#475569', lineHeight:1.7 }}>{campaign.message}</p>
                    <div style={{ marginBottom:10, padding:'8px 10px', borderRadius:10, background: themeMode === 'dark' ? 'rgba(15,118,110,0.12)' : 'rgba(15,118,110,0.06)', border:'1px solid rgba(16,185,129,0.12)' }}>
                      <p style={{ margin:0, fontSize:9, fontWeight:800, color: themeMode === 'dark' ? '#a7f3d0' : '#0f766e', textTransform:'uppercase', letterSpacing:'0.8px' }}>Best angle</p>
                      <p style={{ margin:'4px 0 0', fontSize:11, fontWeight:700, color: themeMode === 'dark' ? '#ecfeff' : '#0f172a' }}>{campaign.angle}</p>
                    </div>
                    <div style={{ display:'flex', justifyContent:'space-between', fontSize:11, color: themeMode === 'dark' ? '#f8fafc' : '#334155', fontWeight:700 }}>
                      <span>{campaign.orders} orders</span>
                      <span>{formatPKR(campaign.revenue)}</span>
                    </div>
                    <p style={{ margin:'10px 0 0', fontSize:10, fontWeight:800, color: themeMode === 'dark' ? '#a7f3d0' : '#0f766e', textTransform:'uppercase', letterSpacing:'0.8px' }}>{campaign.target}</p>
                  </div>
                ))}
              </div>
            </div>

            <div style={{
              ...S.card,
              marginBottom:20,
              background: themeMode === 'dark' ? 'linear-gradient(180deg, rgba(15,23,42,0.98), rgba(8,17,23,0.96))' : '#fff',
              borderColor: themeMode === 'dark' ? '#1e293b' : '#dfece4',
              boxShadow: themeMode === 'dark' ? '0 12px 32px rgba(2,6,23,.38)' : '0 12px 32px rgba(11,58,42,.055)',
            }}>
              <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center', marginBottom:16, flexWrap:'wrap', gap:12 }}>
                <div>
                  <h3 style={{ ...S.cardH, color: themeMode === 'dark' ? '#e2e8f0' : '#1e293b' }}>🧩 Product recommendation engine</h3>
                  <p style={{ margin:'4px 0 0', fontSize:12, color: themeMode === 'dark' ? '#cbd5e1' : '#94a3b8' }}>Recommended bundles built around your top-selling products and best-performing categories</p>
                </div>
              </div>
              <div style={{ display:'grid', gridTemplateColumns:'repeat(auto-fit, minmax(220px, 1fr))', gap:12 }}>
                {(productRecommendations || []).map((recommendation) => (
                  <div key={recommendation.name} style={{ background: themeMode === 'dark' ? 'linear-gradient(135deg,#111827,#1e293b)' : 'linear-gradient(135deg,#eef2ff,#f8fafc)', border:'1px solid #c7d2fe', borderRadius:14, padding:16 }}>
                    <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center', gap:6, marginBottom:10 }}>
                      <strong style={{ fontSize:15, color: themeMode === 'dark' ? '#f8fafc' : '#111827' }}>{recommendation.name}</strong>
                      <span style={{ fontSize:10, fontWeight:800, color: themeMode === 'dark' ? '#dbeafe' : '#4338ca', background: themeMode === 'dark' ? '#172554' : '#e0e7ff', padding:'4px 8px', borderRadius:999 }}>{recommendation.offer}</span>
                    </div>
                    <p style={{ margin:'0 0 10px', fontSize:11, color: themeMode === 'dark' ? '#cbd5e1' : '#6b7280', fontWeight:700 }}>{recommendation.category}</p>
                    <p style={{ margin:'0 0 10px', fontSize:11, lineHeight:1.6, color: themeMode === 'dark' ? '#dbeafe' : '#374151' }}>{recommendation.rationale}</p>
                    <ul style={{ margin:0, paddingLeft:18, color: themeMode === 'dark' ? '#e2e8f0' : '#374151', fontSize:12, lineHeight:1.8 }}>
                      {(recommendation.bundle || []).slice(0, 3).map((item) => (
                        <li key={`${recommendation.name}-${item}`}>{item}</li>
                      ))}
                    </ul>
                  </div>
                ))}
              </div>
            </div>

            <div style={{
              ...S.card,
              marginBottom:20,
              background: themeMode === 'dark' ? 'linear-gradient(180deg, rgba(14,22,26,0.96), rgba(11,19,23,0.96))' : 'linear-gradient(135deg, rgba(255,255,255,0.88), rgba(255,255,255,0.74))',
              borderColor: themeMode === 'dark' ? 'rgba(148,163,184,0.18)' : 'rgba(148,163,184,0.18)',
              boxShadow: themeMode === 'dark' ? '0 16px 36px rgba(2,6,23,0.32)' : '0 16px 38px rgba(15,23,42,.08)',
            }}>
              <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center', marginBottom:18 }}>
                <div>
                  <h3 style={{ ...S.cardH, color: themeMode === 'dark' ? '#e2e8f0' : '#1e293b' }}>📊 Market Split Overview</h3>
                  <p style={{ margin:'4px 0 0', fontSize:12, color: themeMode === 'dark' ? '#aebbb4' : '#64748b' }}>How your catalog is distributed across customer markets</p>
                </div>
                <button style={S.linkBtn} onClick={() => openSection('products')}>Manage products →</button>
              </div>
              <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:16 }}>
                {/* Local card */}
                <div style={{ background: themeMode === 'dark' ? 'linear-gradient(135deg,#062f2a,#0f172a)' : 'linear-gradient(135deg,#f0fdf4,#dcfce7)', border: themeMode === 'dark' ? '1.5px solid rgba(34,197,94,.28)' : '1.5px solid #bbf7d0', borderRadius:14, padding:'20px 22px' }}>
                  <div style={{ display:'flex', justifyContent:'space-between', alignItems:'flex-start', marginBottom:14 }}>
                    <div>
                      <p className="admin-market-summary-local-label" style={{ margin:'0 0 4px', fontSize:10, fontWeight:700, color:'#166534', textTransform:'uppercase', letterSpacing:'1px' }}>🇵🇰 Pakistan / Local</p>
                      <p className="admin-market-summary-local-count" style={{ margin:0, fontSize:34, fontWeight:900, color:'#15803d', lineHeight:1, fontFamily:"'Sora',sans-serif" }}>{localCnt}</p>
                    </div>
                    <span style={{ fontSize:36, lineHeight:1 }}>🇵🇰</span>
                  </div>
                  <p className="admin-market-summary-local-description" style={{ margin:'0 0 12px', fontSize:12, color:'#4ade80', fontWeight:500 }}>
                    Only visible to customers shopping in <strong>Pakistan mode (PKR)</strong>
                  </p>
                  <div style={{ height:6, background:'rgba(0,0,0,.06)', borderRadius:99, overflow:'hidden' }}>
                    <div style={{ height:'100%', width: products.length ? `${(localCnt/products.length)*100}%` : '0%', background:'#16a34a', borderRadius:99, transition:'width 1.2s ease' }} />
                  </div>
                  <p className="admin-market-summary-local-share" style={{ margin:'6px 0 0', fontSize:11, color:'#16a34a', fontWeight:600 }}>
                    {products.length ? Math.round((localCnt/products.length)*100) : 0}% of total catalog
                  </p>
                </div>
                {/* Global card */}
                <div style={{ background: themeMode === 'dark' ? 'linear-gradient(135deg,#0f172a,#111827)' : 'linear-gradient(135deg,#eff6ff,#dbeafe)', border: themeMode === 'dark' ? '1.5px solid rgba(96,165,250,.28)' : '1.5px solid #bfdbfe', borderRadius:14, padding:'20px 22px' }}>
                  <div style={{ display:'flex', justifyContent:'space-between', alignItems:'flex-start', marginBottom:14 }}>
                    <div>
                      <p className="admin-market-summary-global-label" style={{ margin:'0 0 4px', fontSize:10, fontWeight:700, color:'#1d4ed8', textTransform:'uppercase', letterSpacing:'1px' }}>🌍 International / Global</p>
                      <p className="admin-market-summary-global-count" style={{ margin:0, fontSize:34, fontWeight:900, color:'#2563eb', lineHeight:1, fontFamily:"'Sora',sans-serif" }}>{globalCnt}</p>
                    </div>
                    <span style={{ fontSize:36, lineHeight:1 }}>🌍</span>
                  </div>
                  <p className="admin-market-summary-global-description" style={{ margin:'0 0 12px', fontSize:12, color:'#60a5fa', fontWeight:500 }}>
                    Visible to <strong>ALL customers</strong> — Pakistan + international buyers
                  </p>
                  <div style={{ height:6, background:'rgba(0,0,0,.06)', borderRadius:99, overflow:'hidden' }}>
                    <div style={{ height:'100%', width: products.length ? `${(globalCnt/products.length)*100}%` : '0%', background:'#3b82f6', borderRadius:99, transition:'width 1.2s ease' }} />
                  </div>
                  <p className="admin-market-summary-global-share" style={{ margin:'6px 0 0', fontSize:11, color:'#2563eb', fontWeight:600 }}>
                    {products.length ? Math.round((globalCnt/products.length)*100) : 0}% of total catalog
                  </p>
                </div>
              </div>
            </div>

            {/* bottom row */}
            <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:20, marginBottom:20 }}>
              <div style={{
                ...S.card,
                background: themeMode === 'dark' ? 'linear-gradient(180deg, rgba(14,22,26,0.96), rgba(11,19,23,0.96))' : 'linear-gradient(135deg, rgba(255,255,255,0.88), rgba(255,255,255,0.74))',
                borderColor: themeMode === 'dark' ? 'rgba(148,163,184,0.18)' : 'rgba(148,163,184,0.18)',
                boxShadow: themeMode === 'dark' ? '0 16px 36px rgba(2,6,23,0.32)' : '0 16px 38px rgba(15,23,42,.08)',
              }}>
                <h3 style={{ ...S.cardH, color: themeMode === 'dark' ? '#e2e8f0' : '#1e293b' }}>Order Status Breakdown</h3>
                <div style={{ marginTop:16 }}>
                  {STATUS_LIST.map(s => {
                    const cnt = orders.filter(o => o.status === s).length;
                    const pct = orders.length ? Math.round(cnt/orders.length*100) : 0;
                    const c   = STATUS_CFG[s];
                    return (
                      <div key={s} style={{ marginBottom:14 }}>
                        <div style={{ display:'flex', justifyContent:'space-between', marginBottom:5, alignItems:'center' }}>
                          <span style={{ fontSize:12, fontWeight:700, color:'#334155', display:'flex', alignItems:'center', gap:5 }}><span>{c.icon}</span>{s}</span>
                          <span style={{ fontSize:13, fontWeight:900, color:c.color, fontFamily:"'Sora',sans-serif" }}>{cnt}</span>
                        </div>
                        <div style={{ height:5, background:'#f1f5f9', borderRadius:99, overflow:'hidden' }}>
                          <div style={{ height:'100%', width:`${pct}%`, background:c.dot, borderRadius:99, transition:'width 1.2s ease', minWidth:cnt>0?'12px':'0' }} />
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
              <div style={{
                ...S.card,
                background: themeMode === 'dark' ? 'linear-gradient(180deg, rgba(14,22,26,0.96), rgba(11,19,23,0.96))' : 'linear-gradient(135deg, rgba(255,255,255,0.88), rgba(255,255,255,0.74))',
                borderColor: themeMode === 'dark' ? 'rgba(148,163,184,0.18)' : 'rgba(148,163,184,0.18)',
                boxShadow: themeMode === 'dark' ? '0 16px 36px rgba(2,6,23,0.32)' : '0 16px 38px rgba(15,23,42,.08)',
              }}>
                <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center', marginBottom:16 }}>
                  <h3 style={{ ...S.cardH, color: themeMode === 'dark' ? '#e2e8f0' : '#1e293b' }}>Latest Orders</h3>
                  <button style={{ ...S.linkBtn, color: themeMode === 'dark' ? '#93c5fd' : 'var(--brand-dark, #0d5c42)' }} onClick={() => openSection('orders')}>View all →</button>
                </div>
                {orders.length === 0
                  ? <div style={S.emptyState}><p style={{ fontSize:42 }}>📭</p><p style={{ margin:0, fontSize:13 }}>No orders yet</p></div>
                  : orders.slice(0,6).map(o => (
                    <div key={o._id} style={{ display:'flex', alignItems:'center', gap:12, padding:'10px 0', borderBottom:'1px solid #f8fafc' }}>
                      <div style={{ width:38, height:38, borderRadius:10, background:STATUS_CFG[o.status]?.bg||'#f1f5f9', display:'flex', alignItems:'center', justifyContent:'center', flexShrink:0, fontSize:16 }}>
                        {STATUS_CFG[o.status]?.icon || '◎'}
                      </div>
                      <div style={{ flex:1, minWidth:0 }}>
                        <p style={{ margin:0, fontSize:13, fontWeight:700, color:'#1e293b', overflow:'hidden', textOverflow:'ellipsis', whiteSpace:'nowrap', fontFamily:"'Sora',sans-serif" }}>{o.user?.name||'Guest'}</p>
                        <p style={{ margin:0, fontSize:11, color:'#94a3b8' }}>{o.paymentMethod} · {formatPKR(o.totalPrice)}</p>
                      </div>
                      <Badge status={o.status} config={STATUS_CFG} />
                    </div>
                  ))}
              </div>
            </div>

            {/* inventory snapshot */}
            <div style={{
              ...S.card,
              background: themeMode === 'dark' ? 'linear-gradient(180deg, rgba(14,22,26,0.96), rgba(11,19,23,0.96))' : 'linear-gradient(135deg, rgba(255,255,255,0.88), rgba(255,255,255,0.74))',
              borderColor: themeMode === 'dark' ? 'rgba(148,163,184,0.18)' : 'rgba(148,163,184,0.18)',
              boxShadow: themeMode === 'dark' ? '0 16px 36px rgba(2,6,23,0.32)' : '0 16px 38px rgba(15,23,42,.08)',
            }}>
              <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center', marginBottom:16 }}>
                <h3 style={{ ...S.cardH, color: themeMode === 'dark' ? '#e2e8f0' : '#1e293b' }}>Inventory Snapshot</h3>
                <button style={{ ...S.linkBtn, color: themeMode === 'dark' ? '#93c5fd' : 'var(--brand-dark, #0d5c42)' }} onClick={() => openSection('products')}>Manage all →</button>
              </div>
              <div style={{ overflowX:'auto' }}>
                <table style={S.tbl}>
                  <thead>
                    <tr>{['','Name','Category','Weight','PKR','USD','Discount','Stock','Market','Visibility'].map(h => <th key={h} style={S.th}>{h}</th>)}</tr>
                  </thead>
                  <tbody>
                    {products.slice(0,8).map(p => (
                      <tr key={p._id} className="row-hover">
                        <td style={S.td}><ThumbCell p={p} /></td>
                        <td style={{ ...S.td, fontWeight:700, color:'#1e293b', fontFamily:"'Sora',sans-serif" }}>{p.name}</td>
                        <td style={S.td}><span className="admin-cat-tag" style={S.catTag}>{p.category}</span></td>
                        <td style={S.td}><span style={{ fontSize:11, fontWeight:700, color:'#64748b' }}>{p.weightKg > 0 ? p.weightKg + 'kg' : '—'}</span></td>
                        <td style={{ ...S.td, fontWeight:800, color:'#10b981', fontFamily:"'JetBrains Mono',monospace" }}>{formatPKR(p.pricePKR)}</td>
                        <td style={{ ...S.td, fontWeight:800, color:'#6366f1', fontFamily:"'JetBrains Mono',monospace" }}>{formatUSD(p.priceUSD)}</td>
                        <td style={S.td}>{Number(p.discountPercent) > 0 ? <span className="admin-discount-chip">-{p.discountPercent}%</span> : '—'}</td>
                        <td style={S.td}><StockCell n={p.stock} /></td>
                        <td style={S.td}><MarketBadge isLocal={p.isLocal} /></td>
                        <td style={S.td}><span className={`admin-visibility-tag ${p.isVisible === false ? 'is-hidden' : 'is-visible'}`} style={{ ...S.catTag, background:p.isVisible === false ? '#fff1f2' : '#ecfdf5', color:p.isVisible === false ? '#be123c' : '#047857' }}>{p.isVisible === false ? 'Hidden' : 'Visible'}</span></td>
                      </tr>
                    ))}
                    {products.length === 0 && (
                      <tr><td colSpan={10} style={{ textAlign:'center', padding:'3rem', color:'#94a3b8', fontSize:14 }}>No products yet.</td></tr>
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        )}

        {/* ─── PRODUCTS ───────────────────────────────────────── */}
        {tab === 'products' && (
          <div style={{ animation:'fadeUp .35s ease' }}>
            <div style={S.pgTop}>
              <div>
                <h1 style={S.pgTitle}>Products</h1>
                <p style={S.pgSub}>{products.length} total · {localCnt} local · {globalCnt} global · {oos} out of stock</p>
              </div>
              <button className="admin-green-button" style={S.greenBtn} onClick={() => openSection('add')}>+ Add Product</button>
            </div>

            {/* filter bar */}
            <div style={{
              display:'grid',
              gap:10,
              marginBottom:18,
              gridTemplateColumns: isCompact ? '1fr' : 'minmax(0, 1fr) auto auto',
              alignItems:'center',
            }}>
              <input style={{
                ...S.searchBox,
                background: themeMode === 'dark' ? '#0f172a' : '#fff',
                borderColor: themeMode === 'dark' ? '#243244' : '#e2e8f0',
                color: themeMode === 'dark' ? '#e2e8f0' : '#1e293b',
                boxShadow: themeMode === 'dark' ? 'inset 0 1px 0 rgba(148,163,184,.08)' : 'inset 0 1px 1px rgba(15,23,42,0.03)',
                width: '100%',
              }} placeholder="🔍  Search products…" value={search} onChange={e => setSearch(e.target.value)} />
              <select style={{
                ...S.sel,
                background: themeMode === 'dark' ? '#0f172a' : '#fff',
                borderColor: themeMode === 'dark' ? '#243244' : '#e2e8f0',
                color: themeMode === 'dark' ? '#e2e8f0' : '#334155',
                width: isCompact ? '100%' : 'auto',
              }} value={fCat} onChange={e => setFCat(e.target.value)}>
                <option value="All">All Categories</option>
                {cats.map(c => <option key={c}>{c}</option>)}
              </select>
              {/* market filter pills */}
              <div style={{ display:'flex', gap:6, flexShrink:0, flexWrap:'wrap', justifyContent:isCompact ? 'stretch' : 'flex-start' }}>
                {[
                  { v:'all',    label:'All',       cnt: products.length,  activeColor:'#475569', activeBg:'#f1f5f9', activeBorder:'#cbd5e1' },
                  { v:'local',  label:'🇵🇰 Local',  cnt: localCnt,         activeColor:'#059669', activeBg:'#ecfdf5', activeBorder:'#6ee7b7' },
                  { v:'global', label:'🌍 Global', cnt: globalCnt,         activeColor:'#2563eb', activeBg:'#eff6ff', activeBorder:'#93c5fd' },
                ].map(o => {
                  const on = fMarket === o.v;
                  return (
                    <button key={o.v} className={`mkt-pill admin-filter-pill${on ? ' is-active' : ''}`} data-filter={o.v} aria-pressed={on} onClick={() => setFMarket(o.v)}
                      style={{
                        padding:'8px 14px', borderRadius:999, fontSize:12, fontWeight:700, cursor:'pointer',
                        border: `1.5px solid ${on ? o.activeBorder : '#e2e8f0'}`,
                        background: on ? o.activeBg : '#fff',
                        color: on ? o.activeColor : '#64748b',
                        transition:'all .15s', fontFamily:"'Sora',sans-serif",
                        flex: isCompact ? '1 1 95px' : '0 0 auto',
                      }}>
                      {o.label} <span style={{ opacity:.65 }}>({o.cnt})</span>
                    </button>
                  );
                })}
              </div>
            </div>

            <div style={{
              ...S.card,
              background: themeMode === 'dark' ? 'linear-gradient(180deg, rgba(15,23,42,0.96), rgba(9,16,22,0.96))' : 'linear-gradient(135deg, rgba(255,255,255,0.92), rgba(255,255,255,0.78))',
              borderColor: themeMode === 'dark' ? 'rgba(148,163,184,0.18)' : 'rgba(148,163,184,0.18)',
              boxShadow: themeMode === 'dark' ? '0 18px 40px rgba(2,6,23,0.36)' : '0 16px 38px rgba(15,23,42,.08)',
            }}>
              <div style={{ overflowX:'auto' }}>
                <table style={{
                  ...S.tbl,
                  color: themeMode === 'dark' ? '#e2e8f0' : '#334155',
                  display: isCompact ? 'block' : 'table',
                  width: isCompact ? '100%' : '100%',
                }}>
                  <thead style={{ display: isCompact ? 'none' : 'table-header-group' }}>
                    <tr>{['','Name','Category','PKR Price','USD Price','Discount','Stock','Market','Visibility','Actions'].map(h => <th key={h} style={S.th}>{h}</th>)}</tr>
                  </thead>
                  <tbody>
                    {filteredProducts.length === 0 && (
                      <tr><td colSpan={10} style={{ textAlign:'center', padding:'4rem', color:'#94a3b8', fontSize:14 }}>No products found.</td></tr>
                    )}
                    {filteredProducts.map(p => (
                      isCompact ? (
                        <tr key={p._id} className="row-hover" style={{ display:'block', marginBottom:12, border:'1px solid rgba(148,163,184,0.18)', borderRadius:14, background: themeMode === 'dark' ? 'rgba(15,23,42,0.96)' : '#fff', overflow:'hidden' }}>
                          <td colSpan={10} style={{ display:'block', padding:12 }}>
                            <div style={{ display:'grid', gridTemplateColumns:'44px minmax(0,1fr) auto', gap:12, alignItems:'flex-start' }}>
                              <div style={{ position:'relative', display:'inline-block' }}>
                                <ThumbCell p={p} />
                                {(p.images||[]).length > 1 && (
                                  <span style={{ position:'absolute', top:-5, right:-5, background:'#6366f1', color:'#fff', borderRadius:999, fontSize:9, fontWeight:800, padding:'2px 5px' }}>+{p.images.length-1}</span>
                                )}
                              </div>
                              <div style={{ minWidth:0 }}>
                                <p style={{ margin:'0 0 4px', fontWeight:800, color: themeMode === 'dark' ? '#f8fafc' : '#1e293b', fontFamily:"'Sora',sans-serif", fontSize:16, lineHeight:1.35 }}>{p.name}</p>
                                {p.description && <p style={{ margin:0, fontSize:12, color: themeMode === 'dark' ? '#a8b7b2' : '#64748b', lineHeight:1.5 }}>{p.description.slice(0,60)}{p.description.length>60?'…':''}</p>}
                              </div>
                              <div style={{ display:'flex', flexDirection:'column', alignItems:'flex-end', gap:8 }}>
                                <div style={{ fontWeight:900, color: themeMode === 'dark' ? '#a7f3d0' : '#10b981', whiteSpace:'nowrap', fontFamily:"'JetBrains Mono',monospace", fontSize:15 }}>{formatPKR(p.pricePKR)}</div>
                                <button className="edit-btn" style={{
                                  ...S.editBtn,
                                  background: themeMode === 'dark' ? 'linear-gradient(135deg, rgba(96,165,250,0.18), rgba(59,130,246,0.14))' : '#edf6ff',
                                  borderColor: themeMode === 'dark' ? 'rgba(96,165,250,0.35)' : '#bfdbfe',
                                  color: themeMode === 'dark' ? '#dbeafe' : '#1d4ed8',
                                  padding:'6px 10px',
                                  marginRight:0,
                                }} onClick={() => openEdit(p)}>✏️ Edit</button>
                              </div>
                            </div>

                            <div style={{ display:'grid', gridTemplateColumns:'repeat(2, minmax(0, 1fr))', gap:8, marginTop:12, paddingTop:10, borderTop:'1px solid rgba(148,163,184,0.14)' }}>
                              <div>
                                <div style={{ fontSize:10, letterSpacing:'0.7px', textTransform:'uppercase', color: themeMode === 'dark' ? '#9bb6af' : '#94a3b8', marginBottom:4, fontWeight:800 }}>Category</div>
                                <span className="admin-cat-tag" style={{ ...S.catTag, display:'inline-block', background: themeMode === 'dark' ? 'rgba(59,130,246,0.16)' : '#f1f5f9', color: themeMode === 'dark' ? '#dbeafe' : '#334155' }}>{p.category}</span>
                              </div>
                              <div>
                                <div style={{ fontSize:10, letterSpacing:'0.7px', textTransform:'uppercase', color: themeMode === 'dark' ? '#9bb6af' : '#94a3b8', marginBottom:4, fontWeight:800 }}>Stock</div>
                                <StockCell n={p.stock} />
                              </div>
                              <div>
                                <div style={{ fontSize:10, letterSpacing:'0.7px', textTransform:'uppercase', color: themeMode === 'dark' ? '#9bb6af' : '#94a3b8', marginBottom:4, fontWeight:800 }}>Market</div>
                                <MarketBadge isLocal={p.isLocal} />
                              </div>
                              <div>
                                <div style={{ fontSize:10, letterSpacing:'0.7px', textTransform:'uppercase', color: themeMode === 'dark' ? '#9bb6af' : '#94a3b8', marginBottom:4, fontWeight:800 }}>Visibility</div>
                                <span className={`admin-visibility-tag ${p.isVisible === false ? 'is-hidden' : 'is-visible'}`} style={{ ...S.catTag, display:'inline-block', background:p.isVisible === false ? (themeMode === 'dark' ? '#3b1d25' : '#fff1f2') : (themeMode === 'dark' ? '#133d2b' : '#ecfdf5'), color:p.isVisible === false ? (themeMode === 'dark' ? '#fecdd3' : '#9f1239') : (themeMode === 'dark' ? '#a7f3d0' : '#047857') }}>{p.isVisible === false ? 'Hidden' : 'Visible'}</span>
                              </div>
                            </div>
                          </td>
                        </tr>
                      ) : (
                        <tr key={p._id} className="row-hover">
                          <td style={S.td}>
                            <div style={{ position:'relative', display:'inline-block' }}>
                              <ThumbCell p={p} />
                              {(p.images||[]).length > 1 && (
                                <span style={{ position:'absolute', top:-5, right:-5, background:'#6366f1', color:'#fff', borderRadius:999, fontSize:9, fontWeight:800, padding:'2px 5px' }}>+{p.images.length-1}</span>
                              )}
                            </div>
                          </td>
                          <td style={{ ...S.td, maxWidth:180 }}>
                            <p style={{ margin:'0 0 2px', fontWeight:700, color: themeMode === 'dark' ? '#f8fafc' : '#1e293b', fontFamily:"'Sora',sans-serif" }}>{p.name}</p>
                            {p.description && <p style={{ margin:0, fontSize:11, color: themeMode === 'dark' ? '#a8b7b2' : '#64748b' }}>{p.description.slice(0,50)}{p.description.length>50?'…':''}</p>}
                          </td>
                          <td style={S.td}><span className="admin-cat-tag" style={{ ...S.catTag, background: themeMode === 'dark' ? 'rgba(59,130,246,0.16)' : '#f1f5f9', color: themeMode === 'dark' ? '#dbeafe' : '#334155' }}>{p.category}</span></td>
                          <td style={{ ...S.td, fontWeight:800, color: themeMode === 'dark' ? '#a7f3d0' : '#10b981', whiteSpace:'nowrap', fontFamily:"'JetBrains Mono',monospace" }}>{formatPKR(p.pricePKR)}</td>
                          <td style={{ ...S.td, fontWeight:800, color: themeMode === 'dark' ? '#dbeafe' : '#6366f1', whiteSpace:'nowrap', fontFamily:"'JetBrains Mono',monospace" }}>{formatUSD(p.priceUSD)}</td>
                          <td style={S.td}>{Number(p.discountPercent) > 0 ? <span className="admin-discount-chip" style={{ background: themeMode === 'dark' ? 'rgba(251,191,36,0.18)' : '#fef3c7', color: themeMode === 'dark' ? '#fef3c7' : '#a16207', borderRadius:999, padding:'4px 8px', fontWeight:800 }}>{`-${p.discountPercent}%`}</span> : '—'}</td>
                          <td style={S.td}><StockCell n={p.stock} /></td>
                          <td style={S.td}><MarketBadge isLocal={p.isLocal} /></td>
                          <td style={S.td}><span className={`admin-visibility-tag ${p.isVisible === false ? 'is-hidden' : 'is-visible'}`} style={{ ...S.catTag, background:p.isVisible === false ? (themeMode === 'dark' ? '#3b1d25' : '#fff1f2') : (themeMode === 'dark' ? '#133d2b' : '#ecfdf5'), color:p.isVisible === false ? (themeMode === 'dark' ? '#fecdd3' : '#9f1239') : (themeMode === 'dark' ? '#a7f3d0' : '#047857') }}>{p.isVisible === false ? 'Hidden' : 'Visible'}</span></td>
                          <td style={{ ...S.td, whiteSpace:'nowrap' }}>
                            <button className="edit-btn" style={{
                              ...S.editBtn,
                              background: themeMode === 'dark' ? 'linear-gradient(135deg, rgba(96,165,250,0.18), rgba(59,130,246,0.14))' : '#edf6ff',
                              borderColor: themeMode === 'dark' ? 'rgba(96,165,250,0.35)' : '#bfdbfe',
                              color: themeMode === 'dark' ? '#dbeafe' : '#1d4ed8',
                              boxShadow: themeMode === 'dark' ? 'inset 0 0 0 1px rgba(147,197,253,0.18)' : 'none',
                            }} onClick={() => openEdit(p)}>✏️ Edit</button>
                            <button className="del-btn" style={{
                              ...S.deleteBtn,
                              background: themeMode === 'dark' ? 'rgba(127,29,29,0.16)' : '#fff5f5',
                              borderColor: themeMode === 'dark' ? 'rgba(252,165,165,0.32)' : '#fecaca',
                              color: themeMode === 'dark' ? '#fecaca' : '#ef4444',
                            }} onClick={() => handleDelete(p._id, p.name)}>🗑️</button>
                          </td>
                        </tr>
                      )
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        )}

        {/* ─── ADD PRODUCT ────────────────────────────────────── */}
        {tab === 'add' && (
          <div style={{ animation:'fadeUp .35s ease' }}>
            <div style={S.pgTop}>
              <div>
                <h1 style={S.pgTitle}>Add New Product</h1>
                <p style={S.pgSub}>Fill all required (*) fields · USD auto-calculates from PKR</p>
              </div>
            </div>

            <div style={{ display:'grid', gridTemplateColumns:'minmax(0, 1.6fr) minmax(260px, 0.75fr)', gap:22, alignItems:'start' }}>
              <div style={{
                ...S.card,
                background: themeMode === 'dark' ? 'linear-gradient(180deg, rgba(15,23,42,0.98), rgba(9,17,21,0.96))' : 'linear-gradient(135deg, rgba(255,255,255,0.88), rgba(255,255,255,0.74))',
                borderColor: themeMode === 'dark' ? 'rgba(148,163,184,0.18)' : 'rgba(148,163,184,0.18)',
                boxShadow: themeMode === 'dark' ? '0 18px 40px rgba(2,6,23,0.32)' : '0 16px 38px rgba(15,23,42,.08)',
                color: themeMode === 'dark' ? '#e2e8f0' : '#1e293b',
                padding: 28,
              }}>
                <form onSubmit={handleAdd} style={{ display:'grid', gap:18 }}>
                  <div>
                    <label style={S.lbl}>Product Name *</label>
                    <input style={S.inp} placeholder="e.g. Multan Blue Pottery Vase" value={form.name} onChange={e => setForm(f=>({...f,name:e.target.value}))} required autoComplete='off' />
                  </div>

                  <div>
                    <label style={S.lbl}>
                      Category *{newCat && <span style={{ color:'#10b981', fontWeight:500, fontSize:10, textTransform:'none', letterSpacing:0 }}>{' '}— new category</span>}
                    </label>
                    <CategoryPicker value={form.category} onChange={v => setForm(f=>({...f,category:v,subcategory:''}))} isNew={newCat} setIsNew={setNewCat} categories={[...new Set([...cats, ...Object.keys(CATEGORY_TREE)])].sort()} inputStyle={S.inp} buttonStyle={S.ghostBtn} />
                    {cats.length === 0 && !newCat && (
                      <p style={{ margin:'6px 0 0', fontSize:11, color:'#f59e0b', fontWeight:600 }}>⚠️ No categories yet — click "+ New" to create your first one.</p>
                    )}
                  </div>

                  <div style={{ display:'grid', gridTemplateColumns:'repeat(3, minmax(0, 1fr))', gap:14 }}>
                    <div>
                      <label style={S.lbl}>Subcategory</label>
                      <input list="subcategory-options" style={S.inp} placeholder="e.g. Laptops or Handmade" value={form.subcategory} onChange={e => setForm(f=>({...f,subcategory:e.target.value}))} />
                      <datalist id="subcategory-options">{(CATEGORY_TREE[form.category] || []).map(v => <option key={v} value={v} />)}</datalist>
                    </div>
                    <div>
                      <label style={S.lbl}>Colours <span style={S.optional}>optional</span></label>
                      <input style={S.inp} placeholder="Black, Silver, Blue" value={form.colors} onChange={e => setForm(f=>({...f,colors:e.target.value}))} />
                    </div>
                    <div>
                      <label style={S.lbl}>Sizes / Variants <span style={S.optional}>optional</span></label>
                      <input style={S.inp} placeholder="Small, Medium, Large" value={form.sizes} onChange={e => setForm(f=>({...f,sizes:e.target.value}))} />
                    </div>
                  </div>

                  <div style={{ display:'grid', gridTemplateColumns:'repeat(2, minmax(0, 1fr))', gap:14 }}>
                    <div>
                      <label style={S.lbl}>Brand</label>
                      <input style={S.inp} placeholder="e.g. HP, Lenovo" value={form.brand} onChange={e => setForm(f=>({...f,brand:e.target.value}))} />
                    </div>
                    <div>
                      <label style={S.lbl}>Model / Edition</label>
                      <input style={S.inp} placeholder="e.g. Pavilion 15" value={form.model} onChange={e => setForm(f=>({...f,model:e.target.value}))} />
                    </div>
                  </div>

                  <label className="admin-visibility-toggle" style={{ ...S.visibilityToggle, marginBottom:0 }}>
                    <input type="checkbox" checked={form.isVisible} onChange={e => setForm(f=>({...f,isVisible:e.target.checked}))} />
                    <span><strong>Show this product in the shop</strong><small>Turn off to save it as hidden without deleting it.</small></span>
                  </label>

                  <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:16 }}>
                    <div>
                      <label style={S.lbl}>🇵🇰 Price PKR *</label>
                      <div style={{ position:'relative' }}>
                        <span style={S.pre}>Rs</span>
                        <input style={{ ...S.inp, paddingLeft:36 }} type="number" min="0" placeholder="0" value={form.pricePKR}
                          onChange={e => {
                            const pkr = e.target.value;
                            const usd = pkr ? pkrToUSD(pkr) : '';
                            setForm(f=>({...f, pricePKR:pkr, priceUSD: usd !== '' ? String(usd) : f.priceUSD}));
                          }} required />
                      </div>
                    </div>
                    <div>
                      <label style={S.lbl}>🌍 Price USD <span style={{ color:'#10b981', fontWeight:500, fontSize:10, textTransform:'none', letterSpacing:0 }}>(auto)</span></label>
                      <div style={{ position:'relative' }}>
                        <span style={S.pre}>$</span>
                        <input style={{ ...S.inp, paddingLeft:28 }} type="number" min="0" step="0.01" placeholder="0.00" value={form.priceUSD} onChange={e => setForm(f=>({...f,priceUSD:e.target.value}))} required />
                      </div>
                    </div>
                  </div>

                  <div className="admin-discount-editor" style={{ display:'grid', gap:12, marginTop:4 }}>
                    <div>
                      <label style={S.lbl}>🏷️ Discount (%)</label>
                      <input style={S.inp} type="number" min="0" max="100" step="1" value={form.discountPercent ?? 0}
                        onChange={e => setForm(f => ({ ...f, discountPercent:Math.min(100, Math.max(0, Number(e.target.value) || 0)) }))} />
                      <small style={{ display:'block', marginTop:6, color:'#94a3b8' }}>Optional · set 0 for no discount.</small>
                    </div>
                    <div className="admin-discount-dates" style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:12 }}>
                      <div>
                        <label style={S.lbl}>Starts on</label>
                        <input style={S.inp} type="date" value={form.discountStartDate || ''} onChange={e => setForm(f => ({ ...f, discountStartDate:e.target.value }))} />
                      </div>
                      <div>
                        <label style={S.lbl}>Ends on</label>
                        <input style={S.inp} type="date" value={form.discountEndDate || ''} onChange={e => setForm(f => ({ ...f, discountEndDate:e.target.value }))} />
                      </div>
                    </div>
                    <div className="admin-discount-preview" style={{ display:'flex', justifyContent:'space-between', gap:12, padding:'10px 12px', borderRadius:12, background: themeMode === 'dark' ? 'rgba(15,23,42,0.7)' : '#f8fafc', border:'1px solid rgba(148,163,184,0.18)', flexWrap:'wrap' }}>
                      <span style={{ fontSize:12, color: themeMode === 'dark' ? '#d1fae5' : '#166534', fontWeight:700 }}>{newDiscountNow > 0 ? `${newDiscountNow}% OFF · Active now` : Number(form.discountPercent) > 0 ? 'Promotion scheduled or expired' : 'No discount applied'}</span>
                      {newDiscountNow > 0 && <strong style={{ fontSize:12, color: themeMode === 'dark' ? '#f8fafc' : '#0f172a' }}>{formatPKR(getDiscountedPrice(form.pricePKR, newDiscountNow, 'PKR'))} <i>·</i> {formatUSD(getDiscountedPrice(form.priceUSD, newDiscountNow, 'USD'))}</strong>}
                    </div>
                  </div>

                  <div>
                    <label style={S.lbl}>Stock Quantity *</label>
                    <input style={S.inp} type="number" min="0" placeholder="0" value={form.stock} onChange={e => setForm(f=>({...f,stock:e.target.value}))} required />
                  </div>

                  <div>
                    <label style={S.lbl}>⚖️ Weight (kg) <span style={{ color:'#94a3b8', fontWeight:400, fontSize:10, textTransform:'none', letterSpacing:0 }}>(optional)</span></label>
                    <div style={{ position:'relative' }}>
                      <span style={{ position:'absolute', left:10, top:'50%', transform:'translateY(-50%)', fontSize:11, color:'#94a3b8', fontWeight:700 }}>kg</span>
                      <input style={{ ...S.inp, paddingLeft:30 }} type="number" min="0" step="0.1" placeholder="Leave blank for weightless items (glasses, etc.)" value={form.weightKg} onChange={e => setForm(f=>({...f,weightKg:e.target.value}))} />
                    </div>
                    <p style={{ margin:'6px 0 0', fontSize:10, color:'#94a3b8', lineHeight:1.5 }}>Items with no weight (glasses, accessories, digital) skip the per-kg shipping charge — only the flat base rate applies.</p>
                  </div>

                  <div>
                    <label style={S.lbl}>Description</label>
                    <textarea style={{ ...S.inp, height:90, resize:'vertical' }} placeholder="Describe this product clearly…" value={form.description} onChange={e => setForm(f=>({...f,description:e.target.value}))} />
                  </div>

                  <div>
                    <label style={{ ...S.lbl, marginBottom:10 }}>Market Visibility *</label>
                    <MarketPicker value={form.isLocal} onChange={v => setForm(f=>({...f,isLocal:v}))} darkMode={themeMode === 'dark'} />
                  </div>

                  <button className="admin-add-product-submit admin-green-button" type="submit" style={{ ...S.greenBtn, width:'100%', padding:15, fontSize:14 }} disabled={saving}>
                    {saving ? '⏳ Publishing…' : '+ Publish Product'}
                  </button>
                </form>
              </div>

              <div>
                <div style={{
                  ...S.card,
                  background: themeMode === 'dark' ? 'linear-gradient(180deg, rgba(15,23,42,0.98), rgba(9,17,21,0.96))' : 'linear-gradient(135deg, rgba(255,255,255,0.88), rgba(255,255,255,0.74))',
                  borderColor: themeMode === 'dark' ? 'rgba(148,163,184,0.18)' : 'rgba(148,163,184,0.18)',
                  boxShadow: themeMode === 'dark' ? '0 18px 40px rgba(2,6,23,0.32)' : '0 16px 38px rgba(15,23,42,.08)',
                  padding: 22,
                }}>
                  <h4 style={{ ...S.cardH, marginBottom:16, color: themeMode === 'dark' ? '#e2e8f0' : '#1e293b' }}>Product Photos</h4>
                  <ImagePicker previews={previews} onPick={f => pickImgs(f, false)} onRemove={i => removeImg(i, false)} inputRef={fileRef} darkMode={themeMode === 'dark'} />
                </div>
                <div style={{
                  ...S.card,
                  background: themeMode === 'dark' ? 'linear-gradient(135deg, rgba(6,95,70,0.18), rgba(15,23,42,0.92))' : 'linear-gradient(135deg,#f0fdf4,#ecfdf5)',
                  border: themeMode === 'dark' ? '1px solid rgba(110,231,183,0.22)' : '1px solid #bbf7d0',
                  marginTop:16,
                  padding: 22,
                }}>
                  <p style={{ margin:'0 0 12px', fontSize:10, fontWeight:800, color: themeMode === 'dark' ? '#a7f3d0' : '#065f46', letterSpacing:'1px', textTransform:'uppercase' }}>💡 Tips</p>
                  <ul style={{ margin:0, paddingLeft:18, fontSize:12, color: themeMode === 'dark' ? '#d1fae5' : '#166534', lineHeight:2.1, fontWeight:500 }}>
                    <li>First photo = main display image</li>
                    <li>Upload up to <strong>5 photos</strong></li>
                    <li>Type PKR → USD auto-fills</li>
                    <li><strong>Global</strong> = all customers see it</li>
                    <li><strong>Local</strong> = Pakistan mode only</li>
                    <li>Stock &lt;5 shows low-stock warning</li>
                  </ul>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* ─── ORDERS ─────────────────────────────────────────── */}
        {tab === 'orders' && (
          <div style={{ animation:'fadeUp .35s ease' }}>
            <div style={S.pgTop}>
              <div>
                <h1 style={S.pgTitle}>Orders</h1>
                <p style={S.pgSub}>{orders.length} total · {pending} pending · {delivered} delivered</p>
              </div>
            </div>

            <div style={{ display:'flex', gap:8, marginBottom:18, flexWrap:'wrap' }}>
              {['All', ...STATUS_LIST].map(s => {
                const cnt = s === 'All' ? orders.length : orders.filter(o => o.status === s).length;
                const c   = STATUS_CFG[s] || { bg:'#f1f5f9', color:'#475569', dot:'#94a3b8' };
                const on  = fStatus === s;
                return (
                  <button key={s} className={`admin-filter-pill status-filter-pill${on ? ' is-active' : ''}`} data-status={s.toLowerCase()} aria-pressed={on} onClick={() => setFStatus(s)} style={{
                    padding:'7px 16px', borderRadius:999, fontSize:12, fontWeight:700,
                    border: on ? `1.5px solid ${c.dot}` : '1.5px solid #e2e8f0',
                    background: on ? c.bg : '#fff', color: on ? c.color : '#64748b',
                    cursor:'pointer', transition:'all .15s', fontFamily:"'Sora',sans-serif",
                  }}>
                    {s} <span className="admin-filter-count" style={{ opacity:.7 }}>({cnt})</span>
                  </button>
                );
              })}
            </div>

            <div style={{
              ...S.card,
              background: themeMode === 'dark' ? 'linear-gradient(180deg, rgba(15,23,42,0.98), rgba(9,17,21,0.96))' : 'linear-gradient(135deg, rgba(255,255,255,0.88), rgba(255,255,255,0.74))',
              borderColor: themeMode === 'dark' ? 'rgba(148,163,184,0.18)' : 'rgba(148,163,184,0.18)',
              boxShadow: themeMode === 'dark' ? '0 18px 40px rgba(2,6,23,0.32)' : '0 16px 38px rgba(15,23,42,.08)',
            }}>
              {orders.length === 0 ? (
                <div style={S.emptyState}><p style={{ fontSize:52 }}>📭</p><p style={{ margin:0, fontWeight:700, fontSize:16, color: themeMode === 'dark' ? '#cbd5e1' : '#475569' }}>No orders yet</p></div>
              ) : (
                <div style={{ overflowX:'auto' }}>
                  <table style={{
                    ...S.tbl,
                    color: themeMode === 'dark' ? '#e2e8f0' : '#334155',
                  }}>
                    <thead>
                      <tr>{['Order ID','Customer','Items','Total','Payment','Status','Update'].map(h => <th key={h} style={{ ...S.th, color: themeMode === 'dark' ? '#a5b4c8' : '#94a3b8' }}>{h}</th>)}</tr>
                    </thead>
                    <tbody>
                      {filteredOrders.length === 0 && (
                        <tr><td colSpan={7} style={{ textAlign:'center', padding:'3rem', color: themeMode === 'dark' ? '#94a3b8' : '#94a3b8' }}>No orders with this status.</td></tr>
                      )}
                      {filteredOrders.map(o => (
                        <tr key={o._id} className="row-hover">
                          <td style={{ ...S.td, fontFamily:"'JetBrains Mono',monospace", fontWeight:700, color: themeMode === 'dark' ? '#9ae6b4' : '#6366f1', fontSize:13 }}>#{o._id.slice(-6).toUpperCase()}</td>
                          <td style={S.td}>
                            <p style={{ margin:'0 0 2px', fontWeight:700, color: themeMode === 'dark' ? '#f8fafc' : '#1e293b', fontSize:13, fontFamily:"'Sora',sans-serif" }}>{o.user?.name||'—'}</p>
                            <p style={{ margin:0, fontSize:11, color: themeMode === 'dark' ? '#94a3b8' : '#94a3b8' }}>{o.address?.city || '—'}</p>
                          </td>
                          <td style={{ ...S.td, maxWidth:160 }}>
                            <p style={{ margin:0, fontSize:12, color: themeMode === 'dark' ? '#dbeafe' : '#475569', lineHeight:1.7 }}>
                              {(o.products||[]).slice(0,2).map(p=>`${p.name}×${p.quantity}`).join(', ')}
                              {(o.products||[]).length > 2 && ` +${o.products.length-2} more`}
                            </p>
                          </td>
                          <td style={{ ...S.td, fontWeight:900, color: themeMode === 'dark' ? '#a7f3d0' : '#10b981', whiteSpace:'nowrap', fontFamily:"'JetBrains Mono',monospace" }}>{formatPKR(o.totalPrice)}</td>
                          <td style={S.td}>
                            <span style={{ background: themeMode === 'dark' ? 'rgba(124,58,237,0.14)' : '#faf5ff', color: themeMode === 'dark' ? '#d8b4fe' : '#7c3aed', padding:'4px 10px', borderRadius:7, fontSize:11, fontWeight:700 }}>{o.paymentMethod}</span>
                            <p style={{ margin:'5px 0 0', fontSize:10, color: themeMode === 'dark' ? '#a7b8b0' : '#64748b' }}>
                              Payment: {o.paymentStatus || (o.isPaid ? 'paid' : 'pending')} · Courier: {(o.courierDispatchStatus || 'not_configured').replaceAll('_', ' ')}
                            </p>
                          </td>
                          <td style={S.td}><Badge status={o.status} config={STATUS_CFG} /></td>
                          <td style={S.td}>
                            <select value={o.status} onChange={e => changeStatus(o._id, e.target.value)}
                              style={{ border: themeMode === 'dark' ? '1.5px solid rgba(148,163,184,.28)' : '1.5px solid #e2e8f0', borderRadius:9, padding:'7px 10px', fontSize:12, cursor:'pointer', background: themeMode === 'dark' ? '#0f172a' : '#fff', color: themeMode === 'dark' ? '#e2e8f0' : '#334155', outline:'none', fontFamily:"'Sora',sans-serif", fontWeight:600 }}>
                              {STATUS_LIST.map(s => <option key={s}>{s}</option>)}
                            </select>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          </div>
        )}

        {/* ─── SETTINGS ───────────────────────────────────────── */}
        {tab === 'settings' && (
          <div className="admin-settings-page" style={{ animation:'fadeUp .35s ease' }}>
            <div style={S.pgTop}>
              <div>
                <h1 style={S.pgTitle}>Settings</h1>
                <p style={S.pgSub}>Configure pricing, currency, and zone-based shipping rates</p>
              </div>
            </div>

            <div className="admin-password-card admin-settings-card" style={{ ...S.card, background: themeMode === 'dark' ? 'linear-gradient(180deg, rgba(15,23,42,0.98), rgba(9,17,21,0.96))' : 'linear-gradient(135deg, rgba(255,255,255,0.94), rgba(240,250,244,0.9))', borderColor: themeMode === 'dark' ? 'rgba(148,163,184,0.18)' : '#dfece4', boxShadow: themeMode === 'dark' ? '0 18px 40px rgba(2,6,23,0.32)' : '0 16px 38px rgba(15,23,42,.08)', marginBottom:20 }}>
              <h3 style={{ ...S.cardH, marginBottom:6, color: themeMode === 'dark' ? '#e2e8f0' : '#1e293b' }}>🔐 Password & account security</h3>
              <p style={{ margin:'0 0 18px', fontSize:12, color: themeMode === 'dark' ? '#cbd5e1' : '#64748b' }}>
                Set a new password without entering the old one. Customer resets email a one-time link (expires in 20 minutes). New passwords must have at least 12 characters.
              </p>
              <p className="admin-password-warning" style={{ margin:'0 0 18px', padding:'10px 12px', borderRadius:10, border: themeMode === 'dark' ? '1px solid rgba(251,191,36,.25)' : '1px solid #f3d08a', background: themeMode === 'dark' ? 'rgba(120,83,12,.16)' : '#fffbeb', color: themeMode === 'dark' ? '#fde68a' : '#854d0e', fontSize:11, lineHeight:1.5 }}>
                Keep this admin session private and sign out on shared devices. Anyone with access to your signed-in admin session can change account passwords.
              </p>

              <div style={{ display:'grid', gridTemplateColumns:'repeat(auto-fit,minmax(260px,1fr))', gap:16 }}>
                <section style={{ padding:16, borderRadius:14, border: themeMode === 'dark' ? '1px solid rgba(148,163,184,.2)' : '1px solid #e2ece6', background: themeMode === 'dark' ? 'rgba(15,23,42,.5)' : '#fff' }}>
                  <h4 style={{ ...S.cardH, color: themeMode === 'dark' ? '#e2e8f0' : '#1e293b', marginBottom:6 }}>Change your password</h4>
                  <p style={{ margin:'0 0 14px', fontSize:11, color: themeMode === 'dark' ? '#aebfba' : '#64748b' }}>Choose a new password you can remember and confirm it below.</p>
                  <form onSubmit={submitOwnPasswordChange} style={{ display:'grid', gap:11 }}>
                    <label style={S.lbl}>New password
                      <input style={S.inp} type="password" autoComplete="new-password" minLength={12} value={ownPasswordForm.newPassword} onChange={event => setOwnPasswordForm(form => ({ ...form, newPassword:event.target.value }))} required />
                    </label>
                    <label style={S.lbl}>Confirm new password
                      <input style={S.inp} type="password" autoComplete="new-password" minLength={12} value={ownPasswordForm.confirmPassword} onChange={event => setOwnPasswordForm(form => ({ ...form, confirmPassword:event.target.value }))} required />
                    </label>
                    <button className="admin-password-submit admin-green-button" type="submit" style={{ ...S.greenBtn, justifySelf:'start' }} disabled={ownPasswordSaving}>{ownPasswordSaving ? 'Saving…' : 'Update my password'}</button>
                  </form>
                </section>

                <section style={{ padding:16, borderRadius:14, border: themeMode === 'dark' ? '1px solid rgba(148,163,184,.2)' : '1px solid #e2ece6', background: themeMode === 'dark' ? 'rgba(15,23,42,.5)' : '#fff' }}>
                  <h4 style={{ ...S.cardH, color: themeMode === 'dark' ? '#e2e8f0' : '#1e293b', marginBottom:6 }}>Email a customer reset link</h4>
                  <p style={{ margin:'0 0 14px', fontSize:11, color: themeMode === 'dark' ? '#aebfba' : '#64748b' }}>The customer chooses their own password from a secure, single-use link.</p>
                  <form onSubmit={submitCustomerPasswordReset} style={{ display:'grid', gap:11 }}>
                    <label style={S.lbl}>Customer email
                      <input style={S.inp} type="email" autoComplete="off" value={customerPasswordForm.email} onChange={event => setCustomerPasswordForm(form => ({ ...form, email:event.target.value }))} required />
                    </label>
                    <button className="admin-password-submit admin-green-button" type="submit" style={{ ...S.greenBtn, justifySelf:'start' }} disabled={customerPasswordSaving}>{customerPasswordSaving ? 'Sending…' : 'Send password reset email'}</button>
                  </form>
                </section>
              </div>
            </div>

            <div className="admin-settings-card" style={{
              ...S.card,
              background: themeMode === 'dark' ? 'linear-gradient(180deg, rgba(15,23,42,0.98), rgba(9,17,21,0.96))' : 'linear-gradient(135deg, rgba(255,255,255,0.88), rgba(255,255,255,0.74))',
              borderColor: themeMode === 'dark' ? 'rgba(148,163,184,0.18)' : 'rgba(148,163,184,0.18)',
              boxShadow: themeMode === 'dark' ? '0 18px 40px rgba(2,6,23,0.32)' : '0 16px 38px rgba(15,23,42,.08)',
              marginBottom:20,
            }}>
              <h3 style={{ ...S.cardH, marginBottom:6, color: themeMode === 'dark' ? '#e2e8f0' : '#1e293b' }}>💵 Cash on Delivery & Auto Sales Log</h3>
              <p style={{ margin:'0 0 18px', fontSize:12, color: themeMode === 'dark' ? '#cbd5e1' : '#64748b' }}>
                Control COD availability, record manual cash collections at delivery, and keep admin earnings history organized by date, day, week, month, and time.
              </p>

              <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:14, marginBottom:18 }}>
                <div>
                  <label style={themeMode === 'dark' ? { ...S.lbl, color:'#dbeafe' } : S.lbl}>Cash amount collected</label>
                  <input style={themeMode === 'dark' ? { ...S.inp, background:'#0f172a', border:'1.5px solid rgba(148,163,184,0.28)', color:'#e2e8f0', boxShadow:'inset 0 1px 0 rgba(148,163,184,0.08)' } : S.inp} type="number" min="0" value={cashForm.amount} onChange={e => setCashForm(f => ({ ...f, amount: e.target.value }))} placeholder="e.g. 2500" />
                </div>
                <div>
                  <label style={themeMode === 'dark' ? { ...S.lbl, color:'#dbeafe' } : S.lbl}>Collection time</label>
                  <input style={themeMode === 'dark' ? { ...S.inp, background:'#0f172a', border:'1.5px solid rgba(148,163,184,0.28)', color:'#e2e8f0', boxShadow:'inset 0 1px 0 rgba(148,163,184,0.08)' } : S.inp} type="datetime-local" value={cashForm.paidAt} onChange={e => setCashForm(f => ({ ...f, paidAt: e.target.value }))} />
                </div>
                <div style={{ gridColumn:'1 / -1' }}>
                  <label style={themeMode === 'dark' ? { ...S.lbl, color:'#dbeafe' } : S.lbl}>Notes / cash details</label>
                  <textarea style={themeMode === 'dark' ? { ...S.inp, background:'#0f172a', border:'1.5px solid rgba(148,163,184,0.28)', color:'#e2e8f0', boxShadow:'inset 0 1px 0 rgba(148,163,184,0.08)', minHeight:80, resize:'vertical' } : { ...S.inp, minHeight:80, resize:'vertical' }} value={cashForm.notes} onChange={e => setCashForm(f => ({ ...f, notes: e.target.value }))} placeholder="Customer name, delivery note, cash collected at doorstep..." />
                </div>
              </div>
              <button className="admin-green-button" style={S.greenBtn} onClick={handleManualCashSale}>💰 Record cash sale</button>
            </div>

            <div className="admin-settings-card" style={{
              ...S.card,
              background: themeMode === 'dark' ? 'linear-gradient(180deg, rgba(15,23,42,0.98), rgba(9,17,21,0.96))' : 'linear-gradient(135deg, rgba(255,255,255,0.88), rgba(255,255,255,0.74))',
              borderColor: themeMode === 'dark' ? 'rgba(148,163,184,0.18)' : 'rgba(148,163,184,0.18)',
              boxShadow: themeMode === 'dark' ? '0 18px 40px rgba(2,6,23,0.32)' : '0 16px 38px rgba(15,23,42,.08)',
              marginBottom:20,
            }}>
              <h3 style={{ ...S.cardH, marginBottom:6, color: themeMode === 'dark' ? '#e2e8f0' : '#1e293b' }}>💵 Cash on Delivery & Courier</h3>
              <p style={{ margin:'0 0 18px', fontSize:12, color: themeMode === 'dark' ? '#cbd5e1' : '#64748b' }}>
                Control COD availability and the fee customers see at checkout. Courier API keys are stored server-side.
              </p>
              <div style={{ display:'grid', gridTemplateColumns:'repeat(2,minmax(0,1fr))', gap:14, marginBottom:16 }}>
                <label style={{ display:'flex', alignItems:'center', gap:10, cursor:'pointer', padding:'12px 14px', borderRadius:12, border: themeMode === 'dark' ? '1px solid rgba(110,231,183,0.22)' : '1px solid #bbf7d0', background: themeMode === 'dark' ? 'rgba(6,95,70,0.18)' : '#f0fdf4' }}>
                  <input type="checkbox" checked={storeSettings.codEnabled}
                    onChange={e => setStoreSettings(s => ({ ...s, codEnabled:e.target.checked }))} />
                  <span style={{ fontWeight:800, color: themeMode === 'dark' ? '#d1fae5' : '#166534', fontSize:13 }}>Enable COD checkout</span>
                </label>
                <div>
                  <label style={themeMode === 'dark' ? { ...S.lbl, color:'#dbeafe' } : S.lbl}>COD fee mode</label>
                  <select style={themeMode === 'dark' ? { ...S.inp, background:'#0f172a', border:'1.5px solid rgba(148,163,184,0.28)', color:'#e2e8f0', boxShadow:'inset 0 1px 0 rgba(148,163,184,0.08)' } : S.inp} value={storeSettings.codFeeMode}
                    onChange={e => setStoreSettings(s => ({ ...s, codFeeMode:e.target.value }))}>
                    <option value="flat">Flat fee (PKR)</option>
                    <option value="percentage">Percentage of subtotal</option>
                  </select>
                </div>
                <div>
                  <label style={themeMode === 'dark' ? { ...S.lbl, color:'#dbeafe' } : S.lbl}>{storeSettings.codFeeMode === 'percentage' ? 'COD fee (%)' : 'COD fee (PKR)'}</label>
                  <input style={themeMode === 'dark' ? { ...S.inp, background:'#0f172a', border:'1.5px solid rgba(148,163,184,0.28)', color:'#e2e8f0', boxShadow:'inset 0 1px 0 rgba(148,163,184,0.08)' } : S.inp} type="number" min="0" value={storeSettings.codFee}
                    onChange={e => setStoreSettings(s => ({ ...s, codFee:Number(e.target.value) }))} />
                </div>
                <div>
                  <label style={themeMode === 'dark' ? { ...S.lbl, color:'#dbeafe' } : S.lbl}>Free COD above (PKR, optional)</label>
                  <input style={themeMode === 'dark' ? { ...S.inp, background:'#0f172a', border:'1.5px solid rgba(148,163,184,0.28)', color:'#e2e8f0', boxShadow:'inset 0 1px 0 rgba(148,163,184,0.08)' } : S.inp} type="number" min="0" value={storeSettings.codThreshold}
                    onChange={e => setStoreSettings(s => ({ ...s, codThreshold:Number(e.target.value) }))} />
                </div>
                <div>
                  <label style={themeMode === 'dark' ? { ...S.lbl, color:'#dbeafe' } : S.lbl}>Courier provider</label>
                  <select style={themeMode === 'dark' ? { ...S.inp, background:'#0f172a', border:'1.5px solid rgba(148,163,184,0.28)', color:'#e2e8f0', boxShadow:'inset 0 1px 0 rgba(148,163,184,0.08)' } : S.inp} value={storeSettings.courierProvider}
                    onChange={e => setStoreSettings(s => ({ ...s, courierProvider:e.target.value }))}>
                    <option value="">No courier API</option>
                    <option value="PostEx">PostEx</option>
                    <option value="Trax">Trax</option>
                    <option value="TCS">TCS</option>
                    <option value="Leopards">Leopards</option>
                  </select>
                </div>
                <div>
                  <label style={themeMode === 'dark' ? { ...S.lbl, color:'#dbeafe' } : S.lbl}>Courier API key</label>
                  <input style={themeMode === 'dark' ? { ...S.inp, background:'#0f172a', border:'1.5px solid rgba(148,163,184,0.28)', color:'#e2e8f0', boxShadow:'inset 0 1px 0 rgba(148,163,184,0.08)' } : S.inp} type="password" placeholder={storeSettings.courierApiKeyConfigured ? 'Key already saved' : 'Enter provider key'}
                    value={storeSettings.courierApiKey} onChange={e => setStoreSettings(s => ({ ...s, courierApiKey:e.target.value }))} />
                </div>
              </div>
              <button className="admin-green-button" style={S.greenBtn} onClick={saveStoreSettings}>
                {settingsSaved ? '✓ Saved!' : '💾 Save COD Settings'}
              </button>
            </div>

            {/* Exchange rate card */}
            <div className="admin-settings-card" style={{
              ...S.card,
              background: themeMode === 'dark' ? 'linear-gradient(180deg, rgba(15,23,42,0.98), rgba(9,17,21,0.96))' : 'linear-gradient(135deg, rgba(255,255,255,0.88), rgba(255,255,255,0.74))',
              borderColor: themeMode === 'dark' ? 'rgba(148,163,184,0.18)' : 'rgba(148,163,184,0.18)',
              boxShadow: themeMode === 'dark' ? '0 18px 40px rgba(2,6,23,0.32)' : '0 16px 38px rgba(15,23,42,.08)',
              marginBottom:20,
            }}>
              <h3 style={{ ...S.cardH, marginBottom:6, color: themeMode === 'dark' ? '#e2e8f0' : '#1e293b' }}>💱 PKR → USD Exchange Rate</h3>
              <p style={{ margin:'0 0 18px', fontSize:12, color: themeMode === 'dark' ? '#cbd5e1' : '#64748b' }}>
                Used to auto-calculate USD price when you enter PKR. Current: <strong>1 USD = Rs {getUSDRate()}</strong>
              </p>
              <div style={{ display:'flex', gap:12, alignItems:'flex-end', maxWidth:380 }}>
                <div style={{ flex:1 }}>
                  <label style={themeMode === 'dark' ? { ...S.lbl, color:'#dbeafe' } : S.lbl}>1 USD equals (PKR)</label>
                  <div style={{ position:'relative' }}>
                    <span style={S.pre}>Rs</span>
                    <input style={themeMode === 'dark' ? { ...S.inp, background:'#0f172a', border:'1.5px solid rgba(148,163,184,0.28)', color:'#e2e8f0', boxShadow:'inset 0 1px 0 rgba(148,163,184,0.08)', paddingLeft:36 } : { ...S.inp, paddingLeft:36 }} type="number" min="1" step="0.01" value={usdRate} onChange={e => setUsdRate(e.target.value)} />
                  </div>
                </div>
                <button className="admin-green-button" style={{ ...S.greenBtn, whiteSpace:'nowrap', flexShrink:0 }} onClick={saveRate}>
                  {usdSaved ? '✓ Saved!' : '💾 Save Rate'}
                </button>
              </div>
              <p style={{ margin:'10px 0 0', fontSize:11, color: themeMode === 'dark' ? '#94a3b8' : '#94a3b8' }}>e.g. rate = 278 → Rs 1,000 = $3.60. USD auto-fills when you type PKR in Add/Edit Product.</p>
            </div>

            {/* Zone-based shipping card */}
            <div className="admin-settings-card" style={{
              ...S.card,
              background: themeMode === 'dark' ? 'linear-gradient(180deg, rgba(15,23,42,0.98), rgba(9,17,21,0.96))' : 'linear-gradient(135deg, rgba(255,255,255,0.88), rgba(255,255,255,0.74))',
              borderColor: themeMode === 'dark' ? 'rgba(148,163,184,0.18)' : 'rgba(148,163,184,0.18)',
              boxShadow: themeMode === 'dark' ? '0 18px 40px rgba(2,6,23,0.32)' : '0 16px 38px rgba(15,23,42,.08)',
            }}>
              <h3 style={{ ...S.cardH, marginBottom:4, color: themeMode === 'dark' ? '#e2e8f0' : '#1e293b' }}>🌍 Zone-Based Shipping Rates</h3>
              <p style={{ margin:'0 0 4px', fontSize:12, color: themeMode === 'dark' ? '#cbd5e1' : '#64748b' }}>
                Formula: <strong style={{ color: themeMode === 'dark' ? '#f8fafc' : '#0f172a' }}>Shipping = Base Rate + (Total Weight × Per-KG Rate)</strong>
              </p>
              <p style={{ margin:'0 0 18px', fontSize:11, color: themeMode === 'dark' ? '#94a3b8' : '#94a3b8' }}>
                Items with no weight entered (glasses, accessories, fruit) only pay the base rate — no per-kg charge.
                Zone is auto-detected from the customer's destination (e.g. Multan → Karachi = Domestic, Pakistan → Dubai = Middle East).
              </p>

              <div style={{ display:'grid', gridTemplateColumns:'repeat(auto-fill,minmax(280px,1fr))', gap:14, marginBottom:20 }}>
                {Object.entries(ZONE_LABELS).map(([zone, label]) => {
                  const r = zoneRates[zone] || { baseRate:0, perKg:0, minFee:0 };
                  return (
                    <div key={zone} className="admin-zone-rate-card" style={{ background: themeMode === 'dark' ? '#0f172a' : '#f8fafc', border: themeMode === 'dark' ? '1.5px solid rgba(148,163,184,0.28)' : '1.5px solid #e2e8f0', borderRadius:14, padding:'16px', boxShadow: themeMode === 'dark' ? 'inset 0 1px 0 rgba(148,163,184,0.08)' : 'none' }}>
                      <p style={{ margin:'0 0 12px', fontSize:11, fontWeight:800, color: themeMode === 'dark' ? '#e2e8f0' : '#334155', textTransform:'uppercase', letterSpacing:'0.8px' }}>{label}</p>
                      <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr 1fr', gap:8 }}>
                        <div>
                          <label style={{ ...S.lbl, fontSize:9, color: themeMode === 'dark' ? '#dbeafe' : '#64748b' }}>Base (Rs)</label>
                          <input style={themeMode === 'dark' ? { ...S.inp, padding:'8px 10px', fontSize:12, background:'#0f172a', border:'1.5px solid rgba(148,163,184,0.28)', color:'#e2e8f0' } : { ...S.inp, padding:'8px 10px', fontSize:12 }} type="number" min="0"
                            value={r.baseRate}
                            onChange={e => setZoneRates(z => ({...z, [zone]: {...z[zone], baseRate: Number(e.target.value)}}))} />
                        </div>
                        <div>
                          <label style={{ ...S.lbl, fontSize:9, color: themeMode === 'dark' ? '#dbeafe' : '#64748b' }}>Per KG (Rs)</label>
                          <input style={themeMode === 'dark' ? { ...S.inp, padding:'8px 10px', fontSize:12, background:'#0f172a', border:'1.5px solid rgba(148,163,184,0.28)', color:'#e2e8f0' } : { ...S.inp, padding:'8px 10px', fontSize:12 }} type="number" min="0"
                            value={r.perKg}
                            onChange={e => setZoneRates(z => ({...z, [zone]: {...z[zone], perKg: Number(e.target.value)}}))} />
                        </div>
                        <div>
                          <label style={{ ...S.lbl, fontSize:9, color: themeMode === 'dark' ? '#dbeafe' : '#64748b' }}>Min Fee (Rs)</label>
                          <input style={themeMode === 'dark' ? { ...S.inp, padding:'8px 10px', fontSize:12, background:'#0f172a', border:'1.5px solid rgba(148,163,184,0.28)', color:'#e2e8f0' } : { ...S.inp, padding:'8px 10px', fontSize:12 }} type="number" min="0"
                            value={r.minFee}
                            onChange={e => setZoneRates(z => ({...z, [zone]: {...z[zone], minFee: Number(e.target.value)}}))} />
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>

              <button className="admin-green-button" style={S.greenBtn} onClick={saveZone}>
                {zoneSaved ? '✓ Saved!' : '💾 Save Zone Rates'}
              </button>
              <p style={{ margin:'10px 0 0', fontSize:11, color: themeMode === 'dark' ? '#94a3b8' : '#94a3b8' }}>
                Customers see the shipping fee auto-calculated at checkout based on their delivery country/city.
              </p>
            </div>
          </div>
        )}

        {/* ── Support Tickets Tab ── */}
        {tab === 'support' && (
          <div style={{ animation:'fadeUp .35s ease' }}>
            <div style={S.pgTop}>
              <div>
                <h1 style={S.pgTitle}>🎧 Support Tickets</h1>
                <p style={S.pgSub}>Customer support requests · {tickets.filter(t=>t.status==='Open').length} open · {tickets.filter(t=>t.status==='Resolved').length} resolved</p>
              </div>
              <button className="admin-green-button" style={S.greenBtn} onClick={refreshTickets}>
                🔄 Refresh
              </button>
            </div>

            {/* KPI row */}
            <div style={{ display:'grid', gridTemplateColumns:'repeat(3,1fr)', gap:14, marginBottom:22 }}>
              {[
                { label:'Total Tickets', val: tickets.length,                                color:'#c7d2fe', bg: themeMode === 'dark' ? 'linear-gradient(135deg, rgba(30,41,59,0.96), rgba(17,24,39,0.96))' : '#eef2ff', border: themeMode === 'dark' ? '#3f4a62' : '#c7d2fe', icon:'🗂️' },
                { label:'Open',          val: tickets.filter(t=>t.status==='Open').length,     color:'#ffe0b5', bg: themeMode === 'dark' ? 'linear-gradient(135deg, rgba(62,45,25,0.96), rgba(35,26,14,0.96))' : '#fffbeb', border: themeMode === 'dark' ? '#7b5b3d' : '#fde68a', icon:'🟡' },
                { label:'Resolved',      val: tickets.filter(t=>t.status==='Resolved').length, color:'#a7f3d0', bg: themeMode === 'dark' ? 'linear-gradient(135deg, rgba(19,59,46,0.96), rgba(11,31,26,0.96))' : '#f0fdf4', border: themeMode === 'dark' ? '#3d7661' : '#bbf7d0', icon:'✅' },
              ].map(k => (
                <div key={k.label} style={{
                  background:k.bg,
                  border:`1.5px solid ${k.border}`,
                  borderRadius:14,
                  padding:'16px 20px',
                  display:'flex',
                  justifyContent:'space-between',
                  alignItems:'center',
                  boxShadow: themeMode === 'dark' ? '0 10px 24px rgba(0,0,0,0.18)' : '0 2px 8px rgba(15,23,42,0.05)',
                }}>
                  <div>
                    <p style={{ margin:'0 0 4px', fontSize:10, fontWeight:700, color:k.color, textTransform:'uppercase', letterSpacing:'1px', fontFamily:"'Sora',sans-serif" }}>{k.label}</p>
                    <p style={{ margin:0, fontSize:28, fontWeight:900, color: themeMode === 'dark' ? '#f8fbfa' : k.color, lineHeight:1, fontFamily:"'Sora',sans-serif" }}>{k.val}</p>
                  </div>
                  <span style={{ fontSize:24 }}>{k.icon}</span>
                </div>
              ))}
            </div>

            {/* Filter pills + search */}
            <div style={{ display:'flex', gap:'10px', marginBottom:'18px', flexWrap:'wrap', alignItems:'center' }}>
              <div style={{ display:'flex', gap:6 }}>
                {['All','Open','Resolved'].map(f => {
                  const isDark = themeMode === 'dark';
                  const isActive = ticketFilter === f;
                  const activeBg = f === 'Open' ? (isDark ? '#3d2f21' : '#10b981') : f === 'Resolved' ? (isDark ? '#1f3a31' : '#10b981') : (isDark ? '#163d34' : '#10b981');
                  const activeBorder = f === 'Open' ? (isDark ? '#7a5d3d' : '#10b981') : f === 'Resolved' ? (isDark ? '#4e7f68' : '#10b981') : (isDark ? '#4a8d76' : '#10b981');
                  return (
                    <button key={f} className={`admin-filter-pill ticket-filter-pill${ticketFilter===f ? ' is-active' : ''}`} data-filter={f.toLowerCase()} aria-pressed={ticketFilter===f} onClick={() => setTicketFilter(f)} style={{
                      padding:'7px 18px', borderRadius:'999px', border:'1.5px solid',
                      borderColor: isActive ? activeBorder : (isDark ? '#33473f' : '#e2e8f0'),
                      background: isActive ? activeBg : (isDark ? '#111915' : '#fff'),
                      color: isActive ? '#f8fbfa' : (isDark ? '#dfeae4' : '#64748b'),
                      fontSize:'13px', fontWeight:'700', cursor:'pointer',
                      fontFamily:"'Sora',sans-serif",
                    }}>
                      {f} {f==='Open' ? '('+tickets.filter(t=>t.status==='Open').length+')' : f==='Resolved' ? '('+tickets.filter(t=>t.status==='Resolved').length+')' : '('+tickets.length+')'}
                    </button>
                  );
                })}
              </div>
              <input
                style={{ ...S.searchBox, flex:1, minWidth:220, background: themeMode === 'dark' ? '#111915' : '#fff', borderColor: themeMode === 'dark' ? '#33473f' : '#e2e8f0', color: themeMode === 'dark' ? '#edf7f2' : '#1e293b' }}
                placeholder="🔍  Search by name, email, subject, order ID…"
                value={search}
                onChange={e => setSearch(e.target.value)}
              />
            </div>

            {[...tickets]
              .sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt))
              .filter(t => ticketFilter==='All' || t.status===ticketFilter)
              .filter(t => !search.trim() ||
                t.name?.toLowerCase().includes(search.toLowerCase()) ||
                t.email?.toLowerCase().includes(search.toLowerCase()) ||
                (t.subject||'').toLowerCase().includes(search.toLowerCase()) ||
                (t.message||'').toLowerCase().includes(search.toLowerCase()) ||
                (t.orderId||'').toLowerCase().includes(search.toLowerCase())
              ).length === 0 ? (
              <div style={{ ...S.emptyState, background: themeMode === 'dark' ? '#101915' : '#fff', borderRadius:16, border:`1px solid ${themeMode === 'dark' ? '#33473f' : '#e2e8f0'}`, boxShadow: themeMode === 'dark' ? '0 10px 24px rgba(0,0,0,.18)' : '0 2px 8px rgba(0,0,0,0.04)' }}>
                <p style={{ fontSize:'52px', margin:'0 0 12px' }}>🎧</p>
                <p style={{ margin:0, fontSize:'15px', fontWeight:'700', color: themeMode === 'dark' ? '#eff7f2' : '#334155' }}>No {ticketFilter==='All'?'':ticketFilter.toLowerCase()} tickets{search?' matching your search':''}</p>
                <p style={{ margin:'6px 0 0', fontSize:'13px', color: themeMode === 'dark' ? '#a7b8b0' : '#94a3b8' }}>Support tickets from customers will appear here</p>
              </div>
            ) : (
              <div style={{ display:'flex', flexDirection:'column', gap:'12px' }}>
                {[...tickets]
                  .sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt))
                  .filter(t => ticketFilter==='All' || t.status===ticketFilter)
                  .filter(t => !search.trim() ||
                    t.name?.toLowerCase().includes(search.toLowerCase()) ||
                    t.email?.toLowerCase().includes(search.toLowerCase()) ||
                    (t.subject||'').toLowerCase().includes(search.toLowerCase()) ||
                    (t.message||'').toLowerCase().includes(search.toLowerCase()) ||
                    (t.orderId||'').toLowerCase().includes(search.toLowerCase())
                  )
                  .map(ticket => (
                    <TicketCard
                      key={ticket._id}
                      ticket={ticket}
                      darkMode={themeMode === 'dark'}
                      onResolve={() => changeTicketStatus(ticket._id, 'Resolved')}
                      onReopen={() => changeTicketStatus(ticket._id, 'Open')}
                      onReply={saveTicketReply}
                    />
                  ))}
              </div>
            )}
          </div>
        )}

      </main>
    </div>
  );
}

/* ── helpers ─────────────────────────────────────────────────── */

/* TicketCard — shows user identity, userId badge, admin reply */
function TicketCard({ ticket, onResolve, onReopen, onReply, darkMode = false }) {
  const [showReply, setShowReply] = useState(false);
  const [reply, setReply]         = useState(ticket.adminReply || '');
  const [saved,  setSaved]        = useState(false);
  const [replyError, setReplyError] = useState('');
  const [saving, setSaving] = useState(false);

  const saveReply = async () => {
    setSaving(true);
    try {
      await onReply(ticket._id, reply.trim());
      setReplyError('');
      setSaved(true);
      setTimeout(() => setSaved(false), 2000);
    } catch (error) {
      setReplyError(error?.response?.data?.message || 'Reply could not be saved. Please try again.');
    } finally {
      setSaving(false);
    }
  };

  const cardBg = darkMode ? '#141d1a' : '#fff';
  const cardBorder = darkMode ? (ticket.status === 'Open' ? '#564930' : '#2d5d4d') : (ticket.status === 'Open' ? '#fde68a' : '#bbf7d0');
  const text = darkMode ? '#edf7f2' : '#0f172a';
  const subText = darkMode ? '#b7c9c1' : '#64748b';
  const muted = darkMode ? '#8ea49a' : '#94a3b8';
  const chipBg = darkMode ? '#1e2d2b' : '#f1f5f9';
  const chipText = darkMode ? '#dff7eb' : '#6366f1';
  const replyBg = darkMode ? '#172d29' : '#f0fdf4';
  const replyBorder = darkMode ? '#2b4d44' : '#bbf7d0';
  const replyText = darkMode ? '#d7ece3' : '#334155';
  const textareaBg = darkMode ? '#0f1715' : '#f8fafc';
  const textareaBorder = darkMode ? '#324c45' : '#e2e8f0';
  const buttonSecondary = darkMode ? '#1c2422' : '#f8fafc';
  const buttonSecondaryText = darkMode ? '#dcefe8' : '#64748b';
  const buttonSecondaryBorder = darkMode ? '#34453f' : '#e2e8f0';

  return (
    <div style={{ background:cardBg, borderRadius:'16px', border:`1.5px solid ${cardBorder}`, padding:'20px 24px', boxShadow: darkMode ? '0 10px 24px rgba(0,0,0,.15)' : '0 2px 8px rgba(0,0,0,0.05)' }}>
      <div style={{ display:'flex', justifyContent:'space-between', alignItems:'flex-start', flexWrap:'wrap', gap:'12px' }}>

        {/* Left: ticket info */}
        <div style={{ flex:1, minWidth:0 }}>
          <div style={{ display:'flex', alignItems:'center', gap:'10px', marginBottom:'8px', flexWrap:'wrap' }}>
            {/* Avatar */}
            <div style={{ width:32, height:32, borderRadius:'50%', background:'linear-gradient(135deg,#6366f1,#8b5cf6)', display:'flex', alignItems:'center', justifyContent:'center', flexShrink:0 }}>
              <span style={{ fontSize:13, fontWeight:800, color:'#fff', fontFamily:"'Sora',sans-serif" }}>{ticket.name?.[0]?.toUpperCase()||'?'}</span>
            </div>
            <span style={{ fontSize:'14px', fontWeight:'900', color:text, fontFamily:"'Sora',sans-serif" }}>{ticket.name}</span>
            <span style={{ fontSize:'12px', color:subText }}>{ticket.email}</span>

            {/* 👤 Registered user badge if userId present */}
            {ticket.user ? (
              <span style={{ fontSize:'10px', background: darkMode ? '#17382d' : '#ecfdf5', color: darkMode ? '#a9f0c7' : '#059669', padding:'3px 9px', borderRadius:'999px', fontWeight:'800', border: darkMode ? '1px solid #2a5b4c' : '1px solid #bbf7d0', fontFamily:"'Sora',sans-serif" }}>
                👤 Registered User
              </span>
            ) : (
              <span style={{ fontSize:'10px', background: darkMode ? '#1a2320' : '#f8fafc', color: darkMode ? '#b9c9bf' : '#94a3b8', padding:'3px 9px', borderRadius:'999px', fontWeight:'700', border: darkMode ? '1px solid #33463e' : '1px solid #e2e8f0', fontFamily:"'Sora',sans-serif" }}>
                👻 Guest
              </span>
            )}

            {ticket.orderId && (
              <span style={{ fontSize:'10px', background: darkMode ? '#1b2d3d' : '#eff6ff', color: darkMode ? '#b7d5ff' : '#2563eb', padding:'3px 9px', borderRadius:'999px', fontWeight:'700', fontFamily:"'JetBrains Mono',monospace" }}>
                Order: #{ticket.orderId}
              </span>
            )}
          </div>

          {/* User ID line */}
          {ticket.user && (
            <p style={{ margin:'0 0 6px', fontSize:'10px', color:muted, fontFamily:"'JetBrains Mono',monospace" }}>
              User ID: <span style={{ color: darkMode ? '#dfeafc' : '#6366f1' }}>{ticket.user._id || ticket.user}</span>
            </p>
          )}

          <p style={{ margin:'0 0 6px', fontSize:'13px', fontWeight:'700', color: darkMode ? '#dfeae4' : '#334155' }}>
            <span style={{ background:chipBg, borderRadius:6, padding:'2px 8px', fontSize:11, color:chipText, fontWeight:700 }}>
              {ticket.subject || 'General'}
            </span>
          </p>
          <p style={{ margin:'0 0 8px', fontSize:'13px', color:subText, lineHeight:'1.6', fontFamily:"'Sora',sans-serif" }}>
            {ticket.message}
          </p>
          <p style={{ margin:0, fontSize:'11px', color:muted, fontFamily:"'JetBrains Mono',monospace" }}>
            Submitted: {new Date(ticket.createdAt).toLocaleString('en-PK')}
            {ticket.resolvedAt && <span style={{ color: darkMode ? '#a7f3d0' : '#10b981' }}> · Resolved: {new Date(ticket.resolvedAt).toLocaleString('en-PK')}</span>}
          </p>

          {/* Admin reply area */}
          {ticket.adminReply && !showReply && (
            <div style={{ marginTop:10, background:replyBg, border:`1px solid ${replyBorder}`, borderRadius:10, padding:'10px 14px' }}>
              <p style={{ margin:'0 0 2px', fontSize:10, fontWeight:800, color: darkMode ? '#a7f3d0' : '#059669', textTransform:'uppercase', letterSpacing:'0.5px' }}>✍️ Admin Reply</p>
              <p style={{ margin:0, fontSize:12, color:replyText, lineHeight:1.6 }}>{ticket.adminReply}</p>
            </div>
          )}
          {showReply && (
            <div style={{ marginTop:12 }}>
              <textarea
                style={{ width:'100%', padding:'10px 13px', border:`1.5px solid ${textareaBorder}`, borderRadius:10, fontSize:13, fontFamily:"'Sora',sans-serif", color: darkMode ? '#edf7f2' : '#1e293b', boxSizing:'border-box', resize:'vertical', minHeight:80, background:textareaBg }}
                placeholder="Type your reply to the customer…"
                value={reply}
                onChange={e => setReply(e.target.value)}
              />
              {replyError && <p style={{ margin:'6px 0 0', fontSize:11, color:'#dc2626' }}>{replyError}</p>}
              <div style={{ display:'flex', gap:8, marginTop:8 }}>
                <button onClick={saveReply} disabled={saving || !reply.trim()}
                  style={{ padding:'7px 16px', background:'linear-gradient(135deg,#6366f1,#4f46e5)', color:'#fff', border:'none', borderRadius:9, fontSize:12, fontWeight:700, cursor:'pointer', fontFamily:"'Sora',sans-serif", opacity:saving ? 0.7 : 1 }}>
                  {saved ? '✓ Saved!' : saving ? 'Saving…' : '💾 Save Reply'}
                </button>
                <button onClick={() => setShowReply(false)}
                  style={{ padding:'7px 14px', background:buttonSecondary, border:`1px solid ${buttonSecondaryBorder}`, color:buttonSecondaryText, borderRadius:9, fontSize:12, fontWeight:700, cursor:'pointer' }}>
                  Cancel
                </button>
              </div>
            </div>
          )}
        </div>

        {/* Right: status + actions */}
        <div style={{ display:'flex', flexDirection:'column', alignItems:'flex-end', gap:'8px', flexShrink:0 }}>
          <span style={{
            padding:'5px 14px', borderRadius:'999px', fontSize:'12px', fontWeight:'800',
            background: ticket.status==='Open' ? (darkMode ? '#3f3022' : '#fef3c7') : (darkMode ? '#17382d' : '#f0fdf4'),
            color:      ticket.status==='Open' ? (darkMode ? '#ffe0b5' : '#d97706') : (darkMode ? '#a7f3d0' : '#059669'),
          }}>
            {ticket.status==='Open' ? '🟡 Open' : '✅ Resolved'}
          </span>

          {/* Reply button */}
          <button onClick={() => setShowReply(r => !r)}
            style={{ padding:'7px 16px', background: darkMode ? '#1a2421' : '#f0f0ff', color: darkMode ? '#dfeafc' : '#4f46e5', border:`1px solid ${darkMode ? '#3a4742' : '#c7d2fe'}`, borderRadius:'9px', fontSize:'12px', fontWeight:'700', cursor:'pointer', fontFamily:"'Sora',sans-serif" }}>
            {showReply ? '✕ Cancel Reply' : '✍️ Reply'}
          </button>

          {ticket.status === 'Open' ? (
            <button style={{ padding:'7px 16px', background:'linear-gradient(135deg,#10b981,#059669)', color:'#fff', border:'none', borderRadius:'9px', fontSize:'12px', fontWeight:'700', cursor:'pointer', fontFamily:"'Sora',sans-serif" }}
              onClick={onResolve}>✓ Mark Resolved</button>
          ) : (
            <button style={{ padding:'7px 16px', background: darkMode ? '#1d2d28' : '#fff', color: darkMode ? '#ffe0b5' : '#d97706', border:`1.5px solid ${darkMode ? '#564930' : '#fde68a'}`, borderRadius:'9px', fontSize:'12px', fontWeight:'700', cursor:'pointer', fontFamily:"'Sora',sans-serif" }}
              onClick={onReopen}>🔄 Reopen</button>
          )}
        </div>
      </div>
    </div>
  );
}

const ThumbCell = ({ p }) => {
  const [err, setErr] = useState(false);
  const img = p.images?.[0];
  return img && !err
    ? <img src={assetUrl(img)} alt={p.name}
        style={{ width:46, height:46, borderRadius:10, objectFit:'cover', border:'1.5px solid #e2e8f0', display:'block' }}
        onError={() => setErr(true)} />
    : <div style={{ width:46, height:46, borderRadius:10, background:'linear-gradient(135deg,#f0fdf4,#dcfce7)', display:'flex', alignItems:'center', justifyContent:'center', fontSize:18, fontWeight:900, color:'#10b981', border:'1.5px solid #d1fae5', fontFamily:"'Sora',sans-serif" }}>
        {p.name[0]}
      </div>;
};

const StockCell = ({ n }) => (
  <span style={{ fontWeight:800, fontFamily:"'JetBrains Mono',monospace", fontSize:13, color: n===0?'#ef4444':n<5?'#f97316':'#334155' }}>
    {n===0 ? '⊘ Out' : n<5 ? `⚠ ${n}` : n}
  </span>
);

/* ── styles ──────────────────────────────────────────────────── */
const S = {
  root:      { display:'flex', minHeight:'100vh', background:'var(--page, #f5faf6)', fontFamily:"'DM Sans','Segoe UI',sans-serif" },
  centered:  { display:'flex', flexDirection:'column', alignItems:'center', justifyContent:'center', minHeight:'100vh', background:'var(--page, #f5faf6)' },
  spinRing:  { width:40, height:40, border:'3px solid #e2e8f0', borderTop:'3px solid #10b981', borderRadius:'50%', animation:'spin .8s linear infinite' },

  side:      { width:226, minHeight:'100vh', background:'linear-gradient(180deg, rgba(6,20,17,0.98) 0%, rgba(10,26,22,0.98) 100%)', display:'flex', flexDirection:'column', flexShrink:0, position:'sticky', top:0, height:'100vh', overflowY:'auto', borderRight:'1px solid rgba(145,175,163,0.12)', boxShadow:'inset -1px 0 0 rgba(255,255,255,0.04), 0 18px 38px rgba(2,6,23,0.18)' },
  sideLogo:  { display:'flex', alignItems:'center', gap:12, padding:'24px 18px 18px', borderBottom:'1px solid rgba(255,255,255,.06)' },
  navBtn:    { display:'flex', alignItems:'center', gap:10, width:'100%', padding:'11px 18px', background:'none', border:'none', color:'#ecfeff', fontSize:13, fontWeight:700, cursor:'pointer', transition:'all .15s', outline:'none', borderLeft:'3px solid transparent', letterSpacing:'.15px', fontFamily:"'DM Sans','Segoe UI',sans-serif" },
  navOn:     { background:'linear-gradient(90deg, rgba(25,82,68,.46), rgba(16,185,129,.15))', color:'#f8fffb', fontWeight:900, borderLeft:'3px solid #7fe0bd', boxShadow:'inset 0 0 0 1px rgba(167,243,208,.18), 0 12px 24px rgba(16,185,129,.12)' },
  navBadge:  { marginLeft:'auto', borderRadius:999, fontSize:10, fontWeight:900, padding:'2px 8px', minWidth:20, textAlign:'center', boxShadow:'inset 0 0 0 1px rgba(255,255,255,.12)' },
  miniStats: { display:'flex', justifyContent:'space-around', padding:'16px 18px', borderTop:'1px solid rgba(255,255,255,.06)', borderBottom:'1px solid rgba(255,255,255,.06)' },
  sideUser:  { padding:'16px 18px', display:'flex', alignItems:'center', gap:10, borderTop:'1px solid rgba(255,255,255,.06)', marginTop:'auto', background:'rgba(15,23,42,.12)' },
  ava:       { width:34, height:34, borderRadius:'50%', background:'linear-gradient(135deg,#34d399,#0d5c42)', display:'flex', alignItems:'center', justifyContent:'center', fontSize:13, fontWeight:800, color:'#fff', flexShrink:0, boxShadow:'0 6px 14px rgba(16,185,129,.28)' },
  logoutBtn: { background:'rgba(255,255,255,.04)', border:'1px solid rgba(255,255,255,.16)', color:'#d1fae5', borderRadius:7, width:30, height:30, cursor:'pointer', fontSize:14, display:'flex', alignItems:'center', justifyContent:'center', flexShrink:0 },

  main:      { flex:1, padding:'30px 36px', maxWidth:1180, overflowX:'hidden', color:'var(--ink, #14251d)', background:'radial-gradient(circle at top, rgba(15,23,28,0.96) 0%, rgba(8,17,18,0.98) 35%, rgba(5,11,13,0.98) 100%)' },
  pgTop:     { display:'flex', justifyContent:'space-between', alignItems:'flex-start', marginBottom:24, flexWrap:'wrap', gap:14 },
  pgTitle:   { margin:0, fontSize:26, fontWeight:900, color:'var(--ink, #14251d)', letterSpacing:'-0.8px', fontFamily:"'DM Sans','Segoe UI',sans-serif" },
  pgSub:     { margin:'5px 0 0', fontSize:13, color:'#64748b', fontWeight:500 },

  card:      { background:'linear-gradient(180deg, rgba(11,19,26,0.96), rgba(7,15,19,0.96))', backdropFilter:'blur(18px)', WebkitBackdropFilter:'blur(18px)', borderRadius:20, padding:24, boxShadow:'0 18px 40px rgba(2,6,23,0.28)', border:'1px solid rgba(129,146,176,0.18)', marginBottom:20, transition:'all .25s ease' },
  cardH:     { margin:0, fontSize:14, fontWeight:800, color:'#1e293b', fontFamily:"'Sora',sans-serif", letterSpacing:'-0.2px' },
  linkBtn:   { background:'none', border:'none', color:'var(--brand-dark, #0d5c42)', fontSize:12, fontWeight:700, cursor:'pointer', fontFamily:"'DM Sans','Segoe UI',sans-serif" },
  emptyState:{ textAlign:'center', padding:'60px 20px', color:'#94a3b8' },

  searchBox: { flex:1, minWidth:220, padding:'11px 16px', border:'1.5px solid #e2e8f0', borderRadius:11, fontSize:13, background:'#fff', outline:'none', fontFamily:"'Sora',sans-serif", fontWeight:500, color:'#1e293b', boxShadow:'inset 0 1px 1px rgba(15,23,42,0.03)' },
  sel:       { padding:'11px 14px', border:'1.5px solid #e2e8f0', borderRadius:11, fontSize:13, background:'#fff', cursor:'pointer', outline:'none', fontFamily:"'Sora',sans-serif", fontWeight:600, color:'#334155', boxShadow:'inset 0 1px 1px rgba(15,23,42,0.03)' },

  tbl:  { width:'100%', borderCollapse:'collapse', fontSize:13 },
  th:   { textAlign:'left', padding:'10px 14px', borderBottom:'2px solid rgba(148,163,184,0.24)', color:'#64748b', fontWeight:800, fontSize:10, textTransform:'uppercase', letterSpacing:'.8px', whiteSpace:'nowrap', fontFamily:"'Sora',sans-serif" },
  td:   { padding:'14px 14px', borderBottom:'1px solid rgba(148,163,184,0.16)', verticalAlign:'middle', color:'#334155' },

  catTag:    { background:'#f1f5f9', color:'#475569', padding:'3px 10px', borderRadius:6, fontSize:11, fontWeight:700, fontFamily:"'Sora',sans-serif" },

  editBtn:   { background:'#edf6ff', border:'1px solid #bfdbfe', color:'#1d4ed8', borderRadius:10, padding:'7px 12px', fontSize:12, cursor:'pointer', fontWeight:800, marginRight:6, transition:'background .15s, transform .15s', fontFamily:"'Sora',sans-serif", boxShadow:'inset 0 0 0 1px rgba(147,197,253,0.15)' },
  deleteBtn: { background:'#fff5f5', border:'1px solid #fecaca', color:'#ef4444', borderRadius:10, padding:'7px 10px', fontSize:12, cursor:'pointer', fontWeight:800, transition:'background .15s, transform .15s', boxShadow:'inset 0 0 0 1px rgba(254,202,202,0.12)' },

  greenBtn:  { background:'linear-gradient(135deg,#8ae0bb,#54c7a2)', color:'#062e22', border:'1px solid rgba(120,216,180,0.28)', borderRadius:11, padding:'11px 24px', fontSize:13, fontWeight:800, cursor:'pointer', letterSpacing:'.2px', fontFamily:"'Sora',sans-serif", boxShadow:'0 8px 18px rgba(68,214,165,.20)' },
  ghostBtn:  { background:'#f8fafc', border:'1.5px solid #e2e8f0', color:'#475569', borderRadius:9, padding:'9px 16px', fontSize:12, fontWeight:700, cursor:'pointer', whiteSpace:'nowrap', fontFamily:"'Sora',sans-serif" },

  lbl:  { display:'block', fontSize:10, fontWeight:800, color:'#64748b', marginBottom:7, letterSpacing:'.8px', textTransform:'uppercase', fontFamily:"'Sora',sans-serif" },
  optional: { color:'#94a3b8', fontWeight:500, textTransform:'none', letterSpacing:0 },
  visibilityToggle: { display:'flex', alignItems:'flex-start', gap:10, padding:'12px 14px', marginBottom:18, border:'1px solid #bbf7d0', borderRadius:12, background:'#f0fdf4', color:'#166534', cursor:'pointer' },
  inp:  { padding:'11px 13px', border:'1.5px solid #dbe2ea', borderRadius:11, fontSize:13, background:'#f8fafc', outline:'none', boxSizing:'border-box', width:'100%', color:'#1e293b', fontFamily:"'Sora',sans-serif", fontWeight:500, transition:'border-color .15s, box-shadow .15s', boxShadow:'inset 0 1px 1px rgba(15,23,42,0.02)' },
  pre:  { position:'absolute', left:12, top:'50%', transform:'translateY(-50%)', fontSize:11, fontWeight:800, color:'#94a3b8', pointerEvents:'none', zIndex:2, fontFamily:"'Sora',sans-serif", userSelect:'none' },

  grid2:     { display:'grid', gridTemplateColumns:'1fr 1fr', gap:16 },

  overlay:   { position:'fixed', inset:0, background:'rgba(2,6,23,.65)', display:'flex', alignItems:'center', justifyContent:'center', zIndex:1000, padding:20, backdropFilter:'blur(4px)' },
  modal:     { background:'#fff', borderRadius:22, width:'100%', maxWidth:640, maxHeight:'92vh', overflow:'hidden', display:'flex', flexDirection:'column', boxShadow:'0 32px 80px rgba(0,0,0,.4)' },
  mHead:     { display:'flex', justifyContent:'space-between', alignItems:'center', padding:'22px 26px', borderBottom:'1px solid #f1f5f9' },
  mBody:     { padding:'24px 26px', overflowY:'auto', flex:1 },
  mFoot:     { padding:'18px 26px', borderTop:'1px solid #f1f5f9', display:'flex', justifyContent:'flex-end', gap:10, background:'#fafbfc' },
  closeX:    { background:'#f1f5f9', border:'none', borderRadius:9, width:34, height:34, cursor:'pointer', fontSize:13, color:'#475569', fontWeight:800, display:'flex', alignItems:'center', justifyContent:'center' },
};
