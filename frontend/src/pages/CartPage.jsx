import { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useCart }  from '../context/CartContext';
import { useAuth }  from '../context/AuthContext';
import API, { assetUrl } from '../utils/axiosConfig';
import { formatPKR, formatUSD, calcZoneShipping, getActiveDiscountPercent, getDiscountedPrice, getUSDRate } from '../utils/priceUtils';
import { S } from './cart/cartStyles';
import CartMainColumn from './cart/CartMainColumn';
import CartSummary from './cart/CartSummary';
import OrderConfirmation from './cart/OrderConfirmation';
import EmptyCart from './cart/EmptyCart';


const PAYMENTS = [
  { id:'COD',       icon:'💵', label:'Cash on Delivery',    desc:'Pay when order arrives' },
  { id:'JazzCash',  icon:'📱', label:'JazzCash',            desc:'Mobile wallet payment' },
  { id:'EasyPaisa', icon:'📲', label:'EasyPaisa',           desc:'Mobile wallet payment' },
  { id:'Stripe',    icon:'💳', label:'Credit / Debit Card', desc:'Powered by Stripe' },
  { id:'PayPal',    icon:'🅿️', label:'PayPal',              desc:'Pay via PayPal' },
];

export default function CartPage() {
  // useCart always returns safe defaults (never undefined)
  const { items = [], removeFromCart, updateQty, clearCart } = useCart();
  const { user }   = useAuth();
  const navigate   = useNavigate();

  const isPak = !user || user.country === 'Pakistan';
  const fmt   = (n) => isPak ? formatPKR(n ?? 0) : formatUSD(n ?? 0);
  const getItemPrice = (item) => isPak
    ? getDiscountedPrice(item.pricePKR, getActiveDiscountPercent(item), 'PKR')
    : getDiscountedPrice(item.priceUSD, getActiveDiscountPercent(item), 'USD');

  const [step,    setStep]    = useState('cart');
  const [addr,    setAddr]    = useState({
    street:  '',
    city:    user?.city    || '',
    country: user?.country || 'Pakistan',
  });
  const [guestContact, setGuestContact] = useState({ name:'', email:'', phone:'' });
  const [payment, setPayment] = useState('COD');
  const [placing, setPlacing] = useState(false);
  const [error,   setError]   = useState('');
  const [orderId, setOrderId] = useState(null);
  const [paymentStatus, setPaymentStatus] = useState('pending');
  const [checkoutSettings, setCheckoutSettings] = useState(null);
  const [couponInput, setCouponInput] = useState('');
  const [appliedCoupon, setAppliedCoupon] = useState(null);
  const [couponError, setCouponError] = useState('');
  const [couponChecking, setCouponChecking] = useState(false);

  useEffect(() => {
    API.get('/api/settings/public')
      .then(({ data }) => setCheckoutSettings(data))
      .catch(() => setCheckoutSettings(null));
  }, []);

  useEffect(() => {
    setAddr(prev => ({ ...prev, city: '', country: user?.country || 'Pakistan' }));
  }, [user?._id]);

  // Safe totals — always work even if items is []
  const safeItems  = Array.isArray(items) ? items : [];
  const cartSignature = safeItems.map(item => `${item._id}:${item.quantity}:${item.selectedColor || ''}:${item.selectedSize || ''}`).join('|');
  const couponProducts = safeItems.map(item => ({ product: item._id, quantity: item.quantity || 1, selectedColor: item.selectedColor || '', selectedSize: item.selectedSize || '' }));
  const subTotal   = safeItems.reduce((s, i) => s + getItemPrice(i) * (i.quantity||1), 0);
  // ✅ Zone-based shipping: detects domestic (Multan→Karachi), Middle East, US, etc.
  //    Items with no weight (glasses, fruit, etc.) incur only the base/flat rate.
  const shipCalc    = calcZoneShipping(safeItems, addr.country, addr.city);
  const shipFeePKR  = shipCalc.fee;                                  // always PKR
  const shipBreak   = shipCalc.breakdown;
  // For display & grand total: convert ship fee to the user's currency
  const USD_RATE    = getUSDRate();  // reads from localStorage (admin-configurable)
  const shipFee     = isPak ? shipFeePKR : parseFloat((shipFeePKR / USD_RATE).toFixed(2));
  const codSettings = checkoutSettings || { codEnabled: true, codFeeMode: 'flat', codFee: 0, codThreshold: 0 };
  const supportedPaymentMethods = checkoutSettings?.supportedPaymentMethods || ['COD'];
  const availablePaymentOptions = PAYMENTS.filter(option => supportedPaymentMethods.includes(option.id) && (option.id !== 'COD' || codSettings.codEnabled));
  const couponDiscount = appliedCoupon?.discountAmount || 0;
  const discountedSubtotal = Math.max(0, subTotal - couponDiscount);
  const codWaived = codSettings.codThreshold > 0 && discountedSubtotal >= codSettings.codThreshold;
  const codFeePKR = payment === 'COD' && !codWaived
    ? codSettings.codFeeMode === 'percentage'
      ? Math.round(discountedSubtotal * (Number(codSettings.codFee || 0) / 100))
      : Number(codSettings.codFee || 0)
    : 0;
  const codFee = isPak ? codFeePKR : parseFloat((codFeePKR / USD_RATE).toFixed(2));
  const grandTotal  = discountedSubtotal + shipFee + codFee;
  const totalQty    = safeItems.reduce((a, i) => a + (i.quantity||1), 0);

  const validateCoupon = async code => {
    const { data } = await API.post('/api/coupons/validate', { code, products: couponProducts, country: addr.country });
    return data;
  };

  const applyCoupon = async () => {
    setCouponError('');
    if (!couponInput.trim()) { setCouponError('Enter a promo code first.'); return; }
    setCouponChecking(true);
    try {
      const result = await validateCoupon(couponInput.trim());
      setAppliedCoupon({ ...result, cartSignature });
      setCouponInput(result.code);
    } catch (err) {
      setAppliedCoupon(null);
      setCouponError(err.response?.data?.message || 'That promo code could not be applied.');
    } finally { setCouponChecking(false); }
  };

  useEffect(() => {
    if (!appliedCoupon || appliedCoupon.cartSignature === cartSignature) return;
    let active = true;
    validateCoupon(appliedCoupon.code)
      .then(result => { if (active) setAppliedCoupon({ ...result, cartSignature }); })
      .catch(err => {
        if (!active) return;
        setAppliedCoupon(null);
        setCouponError(err.response?.data?.message || 'The promo code no longer applies to this cart.');
      });
    return () => { active = false; };
  }, [cartSignature, addr.country, appliedCoupon?.code, appliedCoupon?.cartSignature]);

  const handlePlaceOrder = async () => {
    setError('');
    if (!user && (!guestContact.name.trim() || !/^\S+@\S+\.\S+$/.test(guestContact.email.trim()))) {
      setError('Enter your name and a valid email address for the order.');
      return;
    }
    if (!addr.street.trim()) { setError('Please enter your street address.'); return; }
    if (!addr.city.trim())   { setError('Please enter your city.'); return; }
    if (!payment || !supportedPaymentMethods.includes(payment)) { setError('No working payment method is available. Please contact the store administrator.'); return; }
    setPlacing(true);
    try {
      const orderItems = safeItems.map(i => ({
        product:  i._id,
        name:     i.name,
        price:    getItemPrice(i),
        quantity: i.quantity || 1,
        image:    i.images?.[0] || '',
        selectedColor: i.selectedColor || '',
        selectedSize: i.selectedSize || '',
      }));
      const { data } = await API.post('/api/orders', {
        products:      orderItems,
        address:       addr,
        paymentMethod: payment,
        couponCode:    appliedCoupon?.code || '',
        ...(!user ? { guestContact: { name:guestContact.name.trim(), email:guestContact.email.trim(), phone:guestContact.phone.trim() } } : {}),
      });
      setOrderId(data._id);
      setPaymentStatus(data.paymentStatus || (data.isPaid ? 'paid' : 'pending'));
      clearCart();
      setStep('success');
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to place order. Please try again.');
    } finally { setPlacing(false); }
  };

  // ── Success ───────────────────────────────────────────────
  if (step === 'success') return (
    <OrderConfirmation {...{ S, navigate, orderId, payment, paymentStatus, user }} />
  );

  // ── Empty cart ────────────────────────────────────────────
  if (!safeItems.length) return (
    <EmptyCart {...{ Link, S }} />
  );

  // ── Cart / Checkout ───────────────────────────────────────
  return (
    <div className="responsive-page cart-page" style={S.page}>
      {/* Page header */}
      <div className="cart-topbar" style={S.topBar}>
        <div>
          <h1 style={{ margin:0, fontSize:'26px', fontWeight:'900', color:'#0f172a' }}>
            {step === 'cart' ? '🛒 Your Cart' : '📋 Checkout'}
          </h1>
          <p style={{ margin:'4px 0 0', fontSize:'13px', color:'#64748b' }}>
            {totalQty} item{totalQty !== 1 ? 's' : ''} in your cart
          </p>
        </div>
        {/* Step indicators */}
        <div style={{ display:'flex', gap:'6px', alignItems:'center' }}>
          {[['cart','1. Cart'],['checkout','2. Checkout']].map(([s, lbl]) => (
            <span key={s} className={`cart-step-pill ${step === s ? 'is-active' : (step === 'checkout' && s === 'cart') ? 'is-complete' : 'is-upcoming'}`} aria-current={step === s ? 'step' : undefined}>
              {lbl}
            </span>
          ))}
        </div>
      </div>

      <div className="cart-layout" style={S.layout}>

        {/* ── LEFT COLUMN ──────────────────────────────────── */}
        <CartMainColumn {...{ S, addr, assetUrl, availablePaymentOptions, error, fmt, getActiveDiscountPercent, getItemPrice, guestContact, isPak, payment, removeFromCart, safeItems, setAddr, setGuestContact, setPayment, step, updateQty, user }} />

        {/* ── ORDER SUMMARY SIDEBAR ────────────────────────── */}
        <CartSummary {...{ S, appliedCoupon, applyCoupon, assetUrl, codFee, codWaived, couponChecking, couponDiscount, couponError, couponInput, fmt, getItemPrice, grandTotal, handlePlaceOrder, payment, placing, safeItems, setAppliedCoupon, setCouponError, setCouponInput, setStep, shipBreak, shipCalc, shipFee, step, subTotal, totalQty }} />
      </div>
    </div>
  );
}

// ── Styles ────────────────────────────────────────────────────
