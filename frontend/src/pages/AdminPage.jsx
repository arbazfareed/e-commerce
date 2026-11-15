import { useState, useEffect, useRef, useCallback } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { assetUrl } from '../utils/axiosConfig';
import { optimizeImageFile } from '../utils/imageCompressor';
import { applyStoreRates, formatPKR, formatUSD, getActiveDiscountPercent, getDiscountedPrice, getWeightRates, saveWeightRates, getShippingRates, saveShippingRates, getUSDRate, saveUSDRate, pkrToUSD, getZoneRates, saveZoneRates, ZONE_LABELS } from '../utils/priceUtils';
import { CATEGORY_TREE, EMPTY_FORM, STATUS_CFG, STATUS_LIST } from './admin/adminConfig';

import { Badge, CategoryPicker, ImagePicker, MarketBadge, MarketPicker, Toast } from './admin/AdminPrimitives';
import CouponsPanel from './admin/CouponsPanel';
import StoresPanel from './admin/StoresPanel';
import ReviewsPanel from './admin/ReviewsPanel';
import ShipmentTrackingEditor from './admin/ShipmentTrackingEditor';
import AdminDashboard from './admin/AdminDashboard';
import { buildAdminDashboardModel } from './admin/adminDashboardModel';
import AdminProductEditModal from './admin/AdminProductEditModal';
import { S } from './admin/adminStyles';
import { StockCell, ThumbCell } from './admin/ProductTableCells';
import AdminGlobalStyles from './admin/AdminGlobalStyles';
import AdminSidebar from './admin/AdminSidebar';
import './admin/premiumAdmin.css';
import TicketCard from './admin/TicketCard';
import AdminProductsPanel from './admin/AdminProductsPanel';
import AdminAddProductPanel from './admin/AdminAddProductPanel';
import AdminOrdersPanel from './admin/AdminOrdersPanel';
import AdminSettingsPanel from './admin/AdminSettingsPanel';
import AdminSupportPanel from './admin/AdminSupportPanel';
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
  const adminSections    = ['dashboard', 'products', 'add', 'orders', 'stores', 'coupons', 'reviews', 'settings'];
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
    const lowStockProducts = products.filter(product => product.isVisible !== false && Number(product.stock) < 5).sort((a, b) => Number(a.stock) - Number(b.stock));
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
    internationalEnabled: true,
    codEnabled: true, codFeeMode: 'flat', codFee: 0, codThreshold: 0,
    courierProvider: '', courierEnabled: false, courierMode: 'sandbox', courierApiKey: '',
    easypaisaEnabled: false, easypaisaMode: 'sandbox', easypaisaMerchantId: '', easypaisaApiKey: '',
    courierApiKeyConfigured: false, easypaisaApiKeyConfigured: false, credentialEncryptionReady: false, legacySecretsNeedEncryption: false,
    clearCourierApiKey: false, clearEasypaisaApiKey: false,
  });
  const [settingsSaved, setSettingsSaved] = useState(false);
  const [ownPasswordForm, setOwnPasswordForm] = useState({ currentPassword:'', newPassword:'', confirmPassword:'' });
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
    if (!user)         { navigate('/admin/login'); return; }
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
      .then(({ data }) => {
        setStoreSettings(s => ({ ...s, ...data }));
        applyStoreRates(data);
        if (Number(data?.usdRate) > 0) setUsdRate(String(data.usdRate));
        if (data?.zoneRates) setZoneRates(data.zoneRates);
      })
      .catch(error => flash(getApiErrorMessage(error, 'Failed to load store settings'), false));
  }, [user]);

  const flash = (text, ok = true) => {
    setToast({ text, ok });
    setTimeout(() => setToast(null), 3500);
  };

  const saveStoreSettings = async () => {
    try {
      const payload = { ...storeSettings };
      // Exchange and zone rates have their own Save buttons; never resend stale copies here.
      delete payload.usdRate;
      delete payload.email;
      delete payload.zoneRates;
      delete payload.courierApiKeyConfigured;
      delete payload.easypaisaApiKeyConfigured;
      delete payload.credentialEncryptionReady;
      delete payload.legacySecretsNeedEncryption;
      if (!payload.courierApiKey?.trim()) delete payload.courierApiKey;
      if (!payload.easypaisaApiKey?.trim()) delete payload.easypaisaApiKey;
      const { data } = await persistStoreSettings(payload);
      setStoreSettings(s => ({ ...s, ...data, courierApiKey:'', easypaisaApiKey:'', clearCourierApiKey:false, clearEasypaisaApiKey:false }));
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
        currentPassword: ownPasswordForm.currentPassword,
        newPassword: ownPasswordForm.newPassword,
      });
      setOwnPasswordForm({ currentPassword:'', newPassword:'', confirmPassword:'' });
      // Older tokens are revoked on the server; keep this browser signed in with the new one.
      if (data.token) {
        try {
          const stored = JSON.parse(localStorage.getItem('user') || 'null');
          if (stored) localStorage.setItem('user', JSON.stringify({ ...stored, token: data.token }));
        } catch { /* the next request will ask the admin to sign in again */ }
      }
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
  const pickImgs = async (files, isEdit) => {
    const currentCount = isEdit ? ePrevs.length : previews.length;
    const available = Math.max(0, 5 - currentCount);
    const selected = Array.from(files);
    const allowedTypes = new Set(['image/jpeg', 'image/png', 'image/webp']);
    const validFiles = selected.filter(file => allowedTypes.has(file.type) && file.size <= 10 * 1024 * 1024);
    if (validFiles.length !== selected.length) flash('Choose JPG, PNG, or WEBP images.', false);
    const arr = validFiles.slice(0, available);
    if (validFiles.length > arr.length) flash('A product can have at most 5 images.', false);
    const optimized = await Promise.all(arr.map(f => optimizeImageFile(f)));
    const urls = optimized.map(f => URL.createObjectURL(f));
    if (isEdit) { setENewFiles(p => [...p,...optimized]); setEPrevs(p => [...p,...urls]); }
    else        { setImgFiles(p => [...p,...optimized]);  setPreviews(p => [...p,...urls]); }
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
  // Rates are saved on the server so every shopper and every order uses them.
  const saveRate = async () => {
    const r = parseFloat(usdRate);
    if (!r || r < 1) { flash('Enter a valid exchange rate', false); return; }
    try {
      const { data } = await persistStoreSettings({ usdRate: r });
      applyStoreRates(data);
      setUsdSaved(true);
      setTimeout(() => setUsdSaved(false), 2500); flash(`Rate saved: 1 USD = Rs ${r}`);
    } catch (err) {
      flash(getApiErrorMessage(err, 'Failed to save exchange rate'), false);
    }
  };
  const saveZone = async () => {
    try {
      const { data } = await persistStoreSettings({ zoneRates });
      applyStoreRates(data);
      if (data?.zoneRates) setZoneRates(data.zoneRates);
      setZoneSaved(true);
      setTimeout(() => setZoneSaved(false), 2500); flash('Zone shipping rates saved!');
    } catch (err) {
      flash(getApiErrorMessage(err, 'Failed to save zone shipping rates'), false);
    }
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






















    const {
    formatCompactNumber,
    salesChartSections,
    premiumRegionStrategy,
    regionalCampaigns,
    productRecommendations,
    exportCsvReport,
    exportProductsCsv,
    exportOrdersCsv,
    generatePdfReport,
    strongestRegion,
    topProductName,
    strongestHour,
    aiPulse,
    aiStrategy,
    executiveSummary,
    filteredSeries,
    kpiValues,
    kpiRows,
    performanceTabs,
    productBreakdown,
    regionBreakdown,
    channelBreakdown
  } = buildAdminDashboardModel({ analytics, flash, kpiFilter, orders, products, revPKR });


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
  const dashboardProps = {
    aiPulse,
    aiStrategy,
    analytics,
    analyticsTab,
    channelBreakdown,
    executiveSummary,
    exportCsvReport,
    formatCompactNumber,
    generatePdfReport,
    globalCnt,
    hoveredKpi,
    kpiFilter,
    kpiRows,
    localCnt,
    lowStockProducts,
    openEdit,
    openSection,
    orders,
    performanceTabs,
    productBreakdown,
    productRecommendations,
    products,
    regionBreakdown,
    regionalCampaigns,
    salesChartSections,
    setAnalyticsTab,
    setHoveredKpi,
    setKpiFilter,
    setTimeWindow,
    strongestRegion,
    themeMode,
    timeWindow,
    user,
    S,
    StockCell,
    ThumbCell,
  };

  const adminPanelProps = {
    products: {
      MarketBadge,
      S,
      StockCell,
      ThumbCell,
      cats,
      exportProductsCsv,
      fCat,
      fMarket,
      filteredProducts,
      formatPKR,
      formatUSD,
      globalCnt,
      handleDelete,
      isCompact,
      localCnt,
      oos,
      openEdit,
      openSection,
      products,
      search,
      setFCat,
      setFMarket,
      setSearch,
      themeMode
    },
    add: {
      CATEGORY_TREE,
      CategoryPicker,
      ImagePicker,
      MarketPicker,
      S,
      cats,
      fileRef,
      form,
      formatPKR,
      formatUSD,
      getDiscountedPrice,
      handleAdd,
      newCat,
      newDiscountNow,
      pickImgs,
      pkrToUSD,
      previews,
      removeImg,
      saving,
      setForm,
      setNewCat,
      themeMode
    },
    orders: {
      Badge,
      S,
      STATUS_CFG,
      STATUS_LIST,
      ShipmentTrackingEditor,
      changeStatus,
      delivered,
      exportOrdersCsv,
      fStatus,
      filteredOrders,
      flash,
      formatPKR,
      navigate,
      orders,
      pending,
      setFStatus,
      setOrders,
      themeMode
    },
    settings: {
      S,
      ZONE_LABELS,
      cashForm,
      customerPasswordForm,
      customerPasswordSaving,
      getUSDRate,
      handleManualCashSale,
      ownPasswordForm,
      ownPasswordSaving,
      saveRate,
      saveStoreSettings,
      saveZone,
      setCashForm,
      setCustomerPasswordForm,
      setOwnPasswordForm,
      setStoreSettings,
      setUsdRate,
      setZoneRates,
      settingsSaved,
      storeSettings,
      submitCustomerPasswordReset,
      submitOwnPasswordChange,
      themeMode,
      usdRate,
      usdSaved,
      zoneRates,
      zoneSaved
    },
    support: {
      S,
      TicketCard,
      changeTicketStatus,
      refreshTickets,
      saveTicketReply,
      search,
      setSearch,
      setTicketFilter,
      themeMode,
      ticketFilter,
      tickets
    },
  };

    const editModalProps = {
    CATEGORY_TREE,
    CategoryPicker,
    ImagePicker,
    MarketPicker,
    S,
    cats,
    eForm,
    eNewCat,
    ePrevs,
    eRef,
    eSaving,
    editDiscountNow,
    editP,
    formatPKR,
    formatUSD,
    getDiscountedPrice,
    handleEditSave,
    pickImgs,
    pkrToUSD,
    removeImg,
    setEForm,
    setENewCat,
    setEditP,
    themeMode
  };

return (
    <div className="responsive-page admin-page" style={S.root}>
      <AdminGlobalStyles />
      <Toast toast={toast} />

      {/* ═══ EDIT MODAL ══════════════════════════════════════ */}
      {editP && <AdminProductEditModal {...editModalProps} />}

      <AdminSidebar
        tab={tab}
        openSection={openSection}
        counts={{ products: products.length, orders: orders.length, pending, oos, local: localCnt, global: globalCnt }}
        user={user}
        onLogout={() => { logout(); navigate('/admin/login'); }}
      />

      {/* ═══ MAIN ══════════════════════════════════════════════ */}
      <main className="admin-main" style={{ ...S.main, background: themeMode === 'dark' ? '#0d1612' : '#f6f4ee', color: themeMode === 'dark' ? '#edf6f3' : '#20392e' }}>
        <div
          className="admin-mobile-heading"
          style={{
            background: themeMode === 'dark'
              ? 'linear-gradient(135deg, rgba(16,42,34,0.98) 0%, rgba(13,31,25,0.98) 100%)'
              : '#ffffff',
            border: themeMode === 'dark'
              ? '1px solid rgba(52,211,153,0.28)'
              : '1px solid #dce8e0',
            boxShadow: themeMode === 'dark'
              ? '0 14px 32px rgba(0,0,0,0.35), inset 0 1px 0 rgba(255,255,255,0.08)'
              : '0 4px 20px rgba(15,23,42,0.06)',
            borderRadius: 18,
            padding: '18px 18px 16px',
            marginBottom: 16,
          }}
        >
          <p style={{
            margin:'0 0 6px',
            color: themeMode === 'dark' ? '#6ee7b7' : '#047857',
            fontSize: 10,
            fontWeight: 800,
            letterSpacing: '1.5px',
            textTransform: 'uppercase',
          }}>
            INDUSCART ADMINISTRATION
          </p>
          <h1 style={{
            margin:'0 0 6px',
            fontSize: 22,
            fontWeight: 800,
            color: themeMode === 'dark' ? '#ffffff' : '#0f172a',
            letterSpacing: '-0.4px',
            lineHeight: 1.25,
          }}>
            Admin workspace
          </h1>
          <span style={{
            display: 'block',
            marginBottom: 12,
            color: themeMode === 'dark' ? '#d1ded6' : '#475569',
            fontSize: 12.5,
            lineHeight: 1.5,
            fontWeight: 500,
          }}>
            Run your catalog, orders, customers, and delivery operations from one place.
          </span>
          <button
            type="button"
            onClick={toggleThemeMode}
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: 6,
              border: themeMode === 'dark' ? '1px solid rgba(255,255,255,0.28)' : '1px solid #cbd5e1',
              background: themeMode === 'dark' ? 'rgba(255,255,255,0.10)' : '#f1f5f9',
              color: themeMode === 'dark' ? '#ffffff' : '#1e293b',
              borderRadius: 999,
              padding: '7px 14px',
              fontWeight: 800,
              fontSize: 11,
              cursor: 'pointer',
              letterSpacing: '0.8px',
              textTransform: 'uppercase',
            }}
          >
            {themeMode === 'dark' ? 'Light mode' : 'Dark mode'}
          </button>
        </div>

        {/* ─── DASHBOARD ─────────────────────────────────────── */}
        {tab === 'dashboard' && <AdminDashboard {...dashboardProps} />}

        {/* ─── PRODUCTS ───────────────────────────────────────── */}
        {tab === 'products' && <AdminProductsPanel {...adminPanelProps.products} />}

        {/* ─── ADD PRODUCT ────────────────────────────────────── */}
        {tab === 'add' && <AdminAddProductPanel {...adminPanelProps.add} />}

        {/* ─── ORDERS ─────────────────────────────────────────── */}
        {tab === 'orders' && <AdminOrdersPanel {...adminPanelProps.orders} />}

        {tab === 'stores' && <StoresPanel themeMode={themeMode} flash={flash} />}
        {tab === 'coupons' && <CouponsPanel darkMode={themeMode === 'dark'} flash={flash} />}
        {tab === 'reviews' && <ReviewsPanel darkMode={themeMode === 'dark'} flash={flash} />}

        {/* ─── SETTINGS ───────────────────────────────────────── */}
        {tab === 'settings' && <AdminSettingsPanel {...adminPanelProps.settings} />}

        {/* ── Support Tickets Tab ── */}
        {tab === 'support' && <AdminSupportPanel {...adminPanelProps.support} />}

      </main>
    </div>
  );
}

/* ── helpers ─────────────────────────────────────────────────── */







/* ── styles ──────────────────────────────────────────────────── */
