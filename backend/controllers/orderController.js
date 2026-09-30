const Order   = require('../models/Order');
const mongoose = require('mongoose');
const Product = require('../models/Product');
const { getActiveDiscountPercent, getDiscountedUnitPrice } = require('../utils/discountPricing');
const { buildSalesAnalytics } = require('../utils/salesAnalytics');
const { validateManualCashSale } = require('../utils/manualCashSale');
const SystemSettings = require('../models/SystemSettings');
const Coupon = require('../models/Coupon');
const { dispatchOrder } = require('../services/courierService');
const { isOrderStatus, shouldRestoreStockAfterCancellation } = require('../utils/orderStatus');
const { validateCouponForSubtotal } = require('../utils/couponPricing');
const { normalizeShipmentTracking } = require('../utils/shipmentTracking');
const { ordersCounter } = require('../middleware/metrics');

// ─── Zone-based shipping rates (mirrors priceUtils.js defaults) ───────────────
// These are the server-side defaults. The frontend uses localStorage overrides;
// here we use the same defaults so order totals match what the cart showed.
const DEFAULT_ZONE_RATES = {
  domestic_pak:  { baseRate:  80,  perKg:  30,  minFee:  80  },
  south_asia:    { baseRate: 500,  perKg: 150,  minFee: 500  },
  middle_east:   { baseRate: 900,  perKg: 250,  minFee: 900  },
  east_asia:     { baseRate:1100,  perKg: 300,  minFee:1100  },
  europe:        { baseRate:1800,  perKg: 400,  minFee:1800  },
  north_america: { baseRate:2200,  perKg: 500,  minFee:2200  },
  australia:     { baseRate:2000,  perKg: 450,  minFee:2000  },
  rest_of_world: { baseRate:2500,  perKg: 600,  minFee:2500  },
};

// External payment adapters are not implemented yet, so shopper checkout accepts COD only.
const PAYMENT_METHODS = new Set(['COD']);
const ZONE_MAP = {
  india:'south_asia', bangladesh:'south_asia', 'sri lanka':'south_asia',
  nepal:'south_asia', bhutan:'south_asia', maldives:'south_asia',
  uae:'middle_east', 'united arab emirates':'middle_east', dubai:'middle_east',
  'saudi arabia':'middle_east', qatar:'middle_east', kuwait:'middle_east',
  bahrain:'middle_east', oman:'middle_east', jordan:'middle_east',
  lebanon:'middle_east', iraq:'middle_east', iran:'middle_east',
  china:'east_asia', japan:'east_asia', 'south korea':'east_asia',
  korea:'east_asia', 'hong kong':'east_asia', taiwan:'east_asia',
  singapore:'east_asia', malaysia:'east_asia', indonesia:'east_asia',
  thailand:'east_asia', vietnam:'east_asia', philippines:'east_asia',
  uk:'europe', 'united kingdom':'europe', germany:'europe', france:'europe',
  italy:'europe', spain:'europe', netherlands:'europe', sweden:'europe',
  norway:'europe', denmark:'europe', finland:'europe', poland:'europe',
  austria:'europe', switzerland:'europe', portugal:'europe', turkey:'europe',
  russia:'europe',
  usa:'north_america', 'united states':'north_america',
  'united states of america':'north_america', us:'north_america', canada:'north_america',
  australia:'australia', 'new zealand':'australia',
};

const PAK_CITIES = new Set([
  'karachi','lahore','islamabad','rawalpindi','faisalabad','multan','peshawar',
  'quetta','sialkot','gujranwala','hyderabad','bahawalpur','sargodha','abbottabad',
  'sukkur','larkana','sahiwal','rahim yar khan','kot addu','attock','jhelum',
  'muzaffargarh','dera ghazi khan','gujrat','khanewal','lodhran','narowal',
  'mianwali','bahawalnagar','vehari','toba tek singh','muzaffarabad','turbat',
  'khuzdar','hub','chaman','zhob','gwadar','mardan','mingora','kohat',
  'mansehra','haripur','nowshera','swat','charsadda','swabi','bannu',
]);

const detectZone = (toCountry = 'Pakistan', toCity = '') => {
  const tc    = (toCountry || '').trim().toLowerCase();
  const tCity = (toCity    || '').trim().toLowerCase();
  if (tc === 'pakistan') return 'domestic_pak';
  if (PAK_CITIES.has(tCity)) return 'domestic_pak';
  if (ZONE_MAP[tc])    return ZONE_MAP[tc];
  if (ZONE_MAP[tCity]) return ZONE_MAP[tCity];
  return 'rest_of_world';
};

/**
 * Calculate zone-based shipping fee (server-side, mirrors priceUtils.js).
 * Items with weightKg = 0 do NOT contribute per-kg charge.
 */
const calcZoneShipping = (items, toCountry, toCity) => {
  const zone      = detectZone(toCountry, toCity);
  const zoneRate  = DEFAULT_ZONE_RATES[zone] || DEFAULT_ZONE_RATES.rest_of_world;

  const totalWeight = items.reduce((sum, item) => {
    const w = Number(item.weightKg);
    if (!w || w <= 0) return sum;           // weightless item — no per-kg charge
    return sum + w * Number(item.quantity || 1);
  }, 0);

  const roundedWeight = parseFloat(totalWeight.toFixed(2));
  const rawFee        = zoneRate.baseRate + Math.round(roundedWeight * zoneRate.perKg);
  const fee           = Math.max(rawFee, zoneRate.minFee);

  return { fee, totalWeight: roundedWeight, zone };
};

const placeOrder = async (req, res) => {
  const reservedItems = [];
  let reservedCouponId = null;
  try {
    const { products, address, paymentMethod } = req.body;
    let guestContact = null;
    if (!req.user) {
      const submittedContact = req.body?.guestContact || {};
      const name = typeof submittedContact.name === 'string' ? submittedContact.name.trim() : '';
      const email = typeof submittedContact.email === 'string' ? submittedContact.email.trim().toLowerCase() : '';
      const phone = typeof submittedContact.phone === 'string' ? submittedContact.phone.trim() : '';
      if (!name || name.length > 120 || !/^\S+@\S+\.\S+$/.test(email) || email.length > 254 || phone.length > 40)
        return res.status(400).json({ message: 'Guest checkout requires a valid name and email address.' });
      guestContact = { name, email, phone };
    }
    const requestedCouponCode = typeof req.body?.couponCode === 'string' ? req.body.couponCode.trim().toUpperCase() : '';
    if (!products || products.length === 0)
      return res.status(400).json({ message: 'No products in order.' });
    if (!PAYMENT_METHODS.has(paymentMethod))
      return res.status(400).json({ message: 'Please choose a supported payment method.' });
    const paymentChannel = paymentMethod === 'COD' || paymentMethod === 'Cash' || paymentMethod === 'Manual Cash' ? 'cash' : 'online';
    if (!address?.street?.trim() || !address?.city?.trim() || !address?.country?.trim())
      return res.status(400).json({ message: 'Complete delivery address is required.' });

    const country       = address?.country || 'Pakistan';
    const city          = address?.city    || '';
    const settings = await SystemSettings.findOne({ key: 'global' }).lean()
      || { internationalEnabled: true, codEnabled: true, codFeeMode: 'flat', codFee: 0, codThreshold: 0 };
    if (country !== 'Pakistan' && settings.internationalEnabled === false)
      return res.status(400).json({ message: 'International orders are currently unavailable.' });
    const enrichedItems = [];

    for (const item of products) {
      const db = await Product.findById(item.product || item._id);
      if (!db) return res.status(404).json({ message: `Product not found: ${item.name}` });
      if (db.isVisible === false)
        return res.status(400).json({ message: `"${db.name}" is no longer available.` });
      if (db.isLocal && country !== 'Pakistan')
        return res.status(400).json({ message: `"${db.name}" is only available within Pakistan.` });
      const quantity = Number(item.quantity);
      if (!Number.isInteger(quantity) || quantity < 1)
        return res.status(400).json({ message: `Invalid quantity for "${db.name}".` });
      if (db.stock < quantity)
        return res.status(400).json({ message: `Only ${db.stock} unit(s) of "${db.name}" available.` });
      if (item.selectedColor && !db.colors.includes(item.selectedColor))
        return res.status(400).json({ message: `Selected colour is unavailable for "${db.name}".` });
      if (item.selectedSize && !db.sizes.includes(item.selectedSize))
        return res.status(400).json({ message: `Selected size or variant is unavailable for "${db.name}".` });
      // ✅ Use actual weightKg from DB (0 = weightless — no per-kg charge)
      const originalPrice = country === 'Pakistan' ? db.pricePKR : db.priceUSD;
      const discountPercent = getActiveDiscountPercent(db);
      const price = getDiscountedUnitPrice(originalPrice, discountPercent, country === 'Pakistan' ? 'PKR' : 'USD');
      enrichedItems.push({
        product: db._id,
        name: db.name,
        price,
        originalPrice,
        discountPercent,
        quantity,
        image: db.images?.[0] || '',
        selectedColor: item.selectedColor || '',
        selectedSize: item.selectedSize || '',
        weightKg: db.weightKg ?? 0,
      });
    }

    const currency = country === 'Pakistan' ? 'PKR' : 'USD';
    let coupon = null;
    let couponDiscount = 0;
    if (requestedCouponCode) {
      coupon = await Coupon.findOne({ code: requestedCouponCode, isActive: true });
      if (!coupon) return res.status(400).json({ message: 'That coupon code is not valid.' });
      const couponResult = validateCouponForSubtotal(coupon, enrichedItems.reduce((sum, item) => sum + item.price * item.quantity, 0), currency);
      if (couponResult.error) return res.status(400).json({ message: couponResult.error });
      couponDiscount = couponResult.discountAmount;
    }

    if (paymentMethod === 'COD' && !settings.codEnabled)
      return res.status(400).json({ message: 'Cash on delivery is currently unavailable.' });

    for (const item of enrichedItems) {
      const reserved = await Product.findOneAndUpdate(
        { _id: item.product, isVisible: { $ne: false }, stock: { $gte: item.quantity } },
        { $inc: { stock: -item.quantity } },
        { new: true }
      );
      if (!reserved) {
        const error = new Error(`Stock changed while ordering "${item.name}". Please review your cart and try again.`);
        error.statusCode = 409;
        throw error;
      }
      reservedItems.push(item);
    }

    // ✅ Zone-based shipping — correct for Multan→Karachi, Pakistan→Dubai, etc.
    const { fee: shippingFee, totalWeight, zone: shippingZone } = calcZoneShipping(enrichedItems, country, city);
    const productTotal = enrichedItems.reduce((s, i) => s + i.price * i.quantity, 0);
    let codFee = 0;
    const discountedProductTotal = Math.max(0, productTotal - couponDiscount);
    if (paymentMethod === 'COD' && (!settings.codThreshold || discountedProductTotal < settings.codThreshold))
      codFee = settings.codFeeMode === 'percentage'
        ? Math.round(discountedProductTotal * Number(settings.codFee) / 100)
        : Number(settings.codFee) || 0;
    const totalPrice   = discountedProductTotal + shippingFee + codFee;

    if (coupon) {
      const today = new Date().toISOString().slice(0, 10);
      const claimFilter = {
        _id: coupon._id,
        isActive: true,
        $or: [{ expiresAt: '' }, { expiresAt: { $gte: today } }, { expiresAt: { $exists: false } }],
        $expr: { $or: [
          { $eq: [{ $ifNull: ['$usageLimit', null] }, null] },
          { $lt: [{ $ifNull: ['$usageCount', 0] }, '$usageLimit'] },
        ] },
      };
      const claimed = await Coupon.findOneAndUpdate(claimFilter, { $inc: { usageCount: 1 } }, { new: true });
      if (!claimed) {
        const error = new Error('This coupon has expired or reached its usage limit. Please remove it and try again.');
        error.statusCode = 409;
        throw error;
      }
      reservedCouponId = coupon._id;
    }

    const order = await Order.create({
      user: req.user?._id || null, guestContact, products: enrichedItems,
      productTotal, shippingFee, codFee, couponCode: coupon?.code || '', couponDiscount, currency, totalWeight, shippingZone, totalPrice,
      address, paymentMethod, paymentChannel,
      isPaid: false,
      paymentStatus: 'pending',
      paidAt: null,
      courierDispatchStatus: 'pending',
    });
    ordersCounter.labels(order.paymentMethod).inc();
    dispatchOrder(order)
      .then(result => Order.findByIdAndUpdate(order._id, {
        courierDispatchStatus: result.dispatched ? 'dispatched' : (result.status || 'unsupported'),
      }))
      .catch(error => {
        console.error('Courier dispatch failed:', error.message);
        return Order.findByIdAndUpdate(order._id, { courierDispatchStatus: 'failed' });
      });
    res.status(201).json(order);
  } catch (e) {
    for (const item of reservedItems)
      await Product.findByIdAndUpdate(item.product, { $inc: { stock: item.quantity } });
    if (reservedCouponId) await Coupon.findByIdAndUpdate(reservedCouponId, { $inc: { usageCount: -1 } });
    console.error(e);
    res.status(e.statusCode || 500).json({ message: e.message });
  }
};

const getMyOrders = async (req, res) => {
  try { res.json(await Order.find({ user: req.user._id }).sort({ createdAt:-1 })); }
  catch (e) { res.status(500).json({ message: e.message }); }
};

const getOrderById = async (req, res) => {
  try {
    const o = await Order.findById(req.params.id).populate('user','name email');
    if (!o) return res.status(404).json({ message: 'Order not found.' });
    const isOwner = o.user && String(o.user._id || o.user) === String(req.user._id);
    if (!isOwner && !req.user.isAdmin)
      return res.status(403).json({ message: 'Not authorized.' });
    res.json(o);
  } catch (e) { res.status(500).json({ message: e.message }); }
};

const getAllOrders = async (req, res) => {
  try { res.json(await Order.find().populate('user','name email').sort({ createdAt:-1 })); }
  catch (e) { res.status(500).json({ message: e.message }); }
};

const getSalesAnalytics = async (req, res) => {
  try {
    const orders = await Order.find().populate('user', 'name email').sort({ createdAt: -1 });
    res.json(buildSalesAnalytics(orders, new Date(), [3, 6, 9, 12]));
  } catch (e) {
    res.status(500).json({ message: e.message });
  }
};

const recordManualCashSale = async (req, res) => {
  try {
    const { products, amount, notes, paidAt } = req.body || {};
    const validated = validateManualCashSale({ products, amount });
    if (validated.error) return res.status(400).json({ message: validated.error });
    if (paidAt !== undefined && Number.isNaN(new Date(paidAt).getTime()))
      return res.status(400).json({ message: 'Collection time must be a valid date.' });
    if (notes !== undefined && typeof notes !== 'string')
      return res.status(400).json({ message: 'Notes must be text.' });
    const { items, totalAmount } = validated;

    const manualOrder = await Order.create({
      user: req.user._id,
      products: items.map((item) => ({
        product: null,
        name: item.name,
        price: item.price,
        originalPrice: item.price,
        discountPercent: 0,
        quantity: item.quantity,
        image: '',
        selectedColor: '',
        selectedSize: '',
        weightKg: 0,
      })),
      productTotal: totalAmount,
      shippingFee: 0,
      codFee: 0,
      totalWeight: 0,
      shippingZone: 'domestic_pak',
      totalPrice: totalAmount,
      address: { street: 'Manual cash collection', city: 'Manual', country: 'Pakistan' },
      paymentMethod: 'Cash',
      paymentChannel: 'cash',
      isPaid: true,
      paymentStatus: 'paid',
      paidAt: paidAt ? new Date(paidAt) : new Date(),
      isManualCash: true,
      cashCollectedAt: paidAt ? new Date(paidAt) : new Date(),
      recordedBy: req.user._id,
      notes: notes || 'Cash sale recorded manually by admin.',
      status: 'Delivered',
    });
    ordersCounter.labels(manualOrder.paymentMethod).inc();

    res.status(201).json(manualOrder);
  } catch (e) {
    res.status(500).json({ message: e.message });
  }
};

const updateOrderStatus = async (req, res) => {
  try {
    const o = await Order.findById(req.params.id);
    if (!o) return res.status(404).json({ message: 'Order not found.' });
    const nextStatus = req.body?.status;
    if (!isOrderStatus(nextStatus))
      return res.status(400).json({ message: 'Invalid order status.' });
    const previousStatus = o.status;
    if (nextStatus === 'Cancelled' && shouldRestoreStockAfterCancellation(previousStatus))
      for (const item of o.products) {
        if (item.product)
          await Product.findByIdAndUpdate(item.product, { $inc: { stock: item.quantity } });
      }
    if (nextStatus === 'Cancelled' && !o.isPaid) o.paymentStatus = 'cancelled';
    o.status = nextStatus;
    if (nextStatus === 'Delivered' && ['COD', 'Cash'].includes(o.paymentMethod)) {
      o.isPaid = true;
      o.paymentStatus = 'paid';
      o.paidAt = new Date();
    }
    res.json(await o.save());
  } catch (e) { res.status(500).json({ message: e.message }); }
};

const updateOrderShipment = async (req, res) => {
  if (!mongoose.isValidObjectId(req.params.id)) return res.status(400).json({ message: 'Invalid order ID.' });
  const normalized = normalizeShipmentTracking(req.body);
  if (normalized.error) return res.status(400).json({ message: normalized.error });
  try {
    const order = await Order.findById(req.params.id);
    if (!order) return res.status(404).json({ message: 'Order not found.' });
    if (order.status === 'Cancelled') return res.status(409).json({ message: 'Cancelled orders cannot be assigned tracking details.' });
    order.shippingProvider = normalized.value.shippingProvider;
    order.trackingNumber = normalized.value.trackingNumber;
    order.trackingUrl = normalized.value.trackingUrl;
    order.trackingUpdatedAt = normalized.value.trackingNumber || normalized.value.trackingUrl ? new Date() : null;
    // This is an admin-entered tracking reference, not proof an API booked the parcel.
    order.courierDispatchStatus = order.trackingNumber || order.trackingUrl ? 'manual_tracking' : 'not_configured';
    res.json(await order.save());
  } catch (error) {
    res.status(500).json({ message: 'Shipment tracking details could not be saved.' });
  }
};

module.exports = {
  placeOrder,
  getMyOrders,
  getOrderById,
  getAllOrders,
  getSalesAnalytics,
  recordManualCashSale,
  updateOrderStatus,
  updateOrderShipment,
};
