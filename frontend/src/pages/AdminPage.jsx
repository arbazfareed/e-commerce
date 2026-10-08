import { useState, useEffect, useRef, useCallback } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import BrandMark from '../components/BrandMark';
import { assetUrl } from '../utils/axiosConfig';
import { formatPKR, formatUSD, getActiveDiscountPercent, getDiscountedPrice, getWeightRates, saveWeightRates, getShippingRates, saveShippingRates, getUSDRate, saveUSDRate, pkrToUSD, getZoneRates, saveZoneRates, ZONE_LABELS } from '../utils/priceUtils';
import { CATEGORY_TREE, EMPTY_FORM, STATUS_CFG, STATUS_LIST } from './admin/adminConfig';

import { Badge, CategoryPicker, ImagePicker, MarketBadge, MarketPicker, Toast } from './admin/AdminPrimitives';
import CouponsPanel from './admin/CouponsPanel';
import ReviewsPanel from './admin/ReviewsPanel';
import ShipmentTrackingEditor from './admin/ShipmentTrackingEditor';
import AdminDashboard from './admin/AdminDashboard';
import { buildAdminDashboardModel } from './admin/adminDashboardModel';
import AdminProductEditModal from './admin/AdminProductEditModal';
import { S } from './admin/adminStyles';
import { StockCell, ThumbCell } from './admin/ProductTableCells';
import AdminGlobalStyles from './admin/AdminGlobalStyles';
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
  const adminSections    = ['dashboard', 'products', 'add', 'orders', 'coupons', 'reviews', 'settings'];
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
      .then(({ data }) => setStoreSettings(s => ({ ...s, ...data })))
      .catch(error => flash(getApiErrorMessage(error, 'Failed to load store settings'), false));
  }, [user]);

  const flash = (text, ok = true) => {
    setToast({ text, ok });
    setTimeout(() => setToast(null), 3500);
  };

  const saveStoreSettings = async () => {
    try {
      const payload = { ...storeSettings };
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
            { id:'coupons',   icon:'🏷', label:'Promo Codes' },
            { id:'reviews',   icon:'★', label:'Reviews' },
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
          <button title="Logout" style={{ ...S.logoutBtn, color: themeMode === 'dark' ? '#e2f9ef' : '#475569', borderColor: themeMode === 'dark' ? 'rgba(255,255,255,.15)' : '#d6e2da', background: themeMode === 'dark' ? 'rgba(255,255,255,.04)' : '#fff' }} onClick={() => { logout(); navigate('/admin/login'); }}>⏻</button>
        </div>
      </aside>

      {/* ═══ MAIN ══════════════════════════════════════════════ */}
      <main className="admin-main" style={{ ...S.main, background: themeMode === 'dark' ? '#111815' : '#f5f7f5', color: themeMode === 'dark' ? '#edf6f3' : '#20392e' }}>
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
        {tab === 'dashboard' && <AdminDashboard {...dashboardProps} />}

        {/* ─── PRODUCTS ───────────────────────────────────────── */}
        {tab === 'products' && <AdminProductsPanel {...adminPanelProps.products} />}

        {/* ─── ADD PRODUCT ────────────────────────────────────── */}
        {tab === 'add' && <AdminAddProductPanel {...adminPanelProps.add} />}

        {/* ─── ORDERS ─────────────────────────────────────────── */}
        {tab === 'orders' && <AdminOrdersPanel {...adminPanelProps.orders} />}

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
