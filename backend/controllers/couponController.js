const Coupon = require('../models/Coupon');
const Product = require('../models/Product');
const { getActiveDiscountPercent, getDiscountedUnitPrice } = require('../utils/discountPricing');
const { validateCouponForSubtotal } = require('../utils/couponPricing');

const isDateOnly = value => {
  if (!value) return true;
  if (!/^\d{4}-\d{2}-\d{2}$/.test(value)) return false;
  const parsed = new Date(`${value}T00:00:00Z`);
  return Number.isFinite(parsed.getTime()) && parsed.toISOString().slice(0, 10) === value;
};

const normalizePayload = (body = {}) => {
  const code = typeof body.code === 'string' ? body.code.trim().toUpperCase() : '';
  const discountType = body.discountType;
  const discountValue = Number(body.discountValue);
  const currency = body.currency === 'USD' ? 'USD' : 'PKR';
  const minimumOrderAmount = Number(body.minimumOrderAmount || 0);
  const usageLimit = body.usageLimit === '' || body.usageLimit == null ? null : Number(body.usageLimit);
  const expiresAt = typeof body.expiresAt === 'string' ? body.expiresAt.trim() : '';

  if (!/^[A-Z0-9_-]{3,40}$/.test(code)) return { error: 'Use 3–40 letters, numbers, hyphens, or underscores for the code.' };
  if (!['percentage', 'flat'].includes(discountType)) return { error: 'Choose a percentage or flat discount.' };
  if (!Number.isFinite(discountValue) || discountValue <= 0 || (discountType === 'percentage' && discountValue > 100))
    return { error: 'Enter a valid discount amount (percentage must be at most 100).' };
  if (!Number.isFinite(minimumOrderAmount) || minimumOrderAmount < 0) return { error: 'Minimum order amount cannot be negative.' };
  if (usageLimit !== null && (!Number.isInteger(usageLimit) || usageLimit < 1)) return { error: 'Usage limit must be a positive whole number.' };
  if (!isDateOnly(expiresAt)) return { error: 'Enter a valid coupon expiry date.' };

  return {
    value: {
      code,
      description: typeof body.description === 'string' ? body.description.trim().slice(0, 200) : '',
      discountType,
      discountValue,
      currency,
      minimumOrderAmount,
      expiresAt,
      usageLimit,
      isActive: body.isActive !== false,
    },
  };
};

const listCoupons = async (req, res) => {
  try { res.json(await Coupon.find().sort({ createdAt: -1 }).lean()); }
  catch (error) { res.status(500).json({ message: 'Coupons could not be loaded.' }); }
};

const createCoupon = async (req, res) => {
  const normalized = normalizePayload(req.body);
  if (normalized.error) return res.status(400).json({ message: normalized.error });
  try { res.status(201).json(await Coupon.create(normalized.value)); }
  catch (error) {
    const duplicate = error.code === 11000;
    res.status(duplicate ? 409 : 400).json({ message: duplicate ? 'A coupon with this code already exists.' : error.message });
  }
};

const updateCoupon = async (req, res) => {
  const normalized = normalizePayload(req.body);
  if (normalized.error) return res.status(400).json({ message: normalized.error });
  try {
    const coupon = await Coupon.findByIdAndUpdate(req.params.id, normalized.value, { new: true, runValidators: true });
    if (!coupon) return res.status(404).json({ message: 'Coupon not found.' });
    res.json(coupon);
  } catch (error) {
    const duplicate = error.code === 11000;
    res.status(duplicate ? 409 : 400).json({ message: duplicate ? 'A coupon with this code already exists.' : error.message });
  }
};

const deleteCoupon = async (req, res) => {
  try {
    const coupon = await Coupon.findByIdAndDelete(req.params.id);
    if (!coupon) return res.status(404).json({ message: 'Coupon not found.' });
    res.json({ message: 'Coupon deleted.' });
  } catch (error) { res.status(500).json({ message: 'Coupon could not be deleted.' }); }
};

const validateCoupon = async (req, res) => {
  try {
    const code = typeof req.body?.code === 'string' ? req.body.code.trim().toUpperCase() : '';
    if (!code) return res.status(400).json({ message: 'Enter a coupon code.' });
    if (!Array.isArray(req.body?.products) || !req.body.products.length)
      return res.status(400).json({ message: 'Your cart is empty.' });
    const country = String(req.body?.country || 'Pakistan').trim();
    const currency = country === 'Pakistan' ? 'PKR' : 'USD';
    let subtotal = 0;
    for (const item of req.body.products) {
      const quantity = Number(item.quantity);
      if (!Number.isInteger(quantity) || quantity < 1) return res.status(400).json({ message: 'Cart contains an invalid quantity.' });
      const product = await Product.findById(item.product || item._id);
      if (!product || product.isVisible === false) return res.status(400).json({ message: 'A product in your cart is no longer available.' });
      if (product.isLocal && country !== 'Pakistan') return res.status(400).json({ message: `${product.name} is only available in Pakistan.` });
      if (product.stock < quantity) return res.status(400).json({ message: `Only ${product.stock} unit(s) of ${product.name} are available.` });
      const originalPrice = currency === 'PKR' ? product.pricePKR : product.priceUSD;
      const discount = getActiveDiscountPercent(product);
      subtotal += getDiscountedUnitPrice(originalPrice, discount, currency) * quantity;
    }
    const coupon = await Coupon.findOne({ code, isActive: true }).lean();
    if (!coupon) return res.status(400).json({ message: 'That coupon code is not valid.' });
    const result = validateCouponForSubtotal(coupon, subtotal, currency);
    if (result.error) return res.status(400).json({ message: result.error });
    res.json({ code: coupon.code, discountAmount: result.discountAmount, currency, subtotal, totalAfterDiscount: subtotal - result.discountAmount });
  } catch (error) {
    res.status(400).json({ message: 'Coupon could not be checked. Please review your cart and try again.' });
  }
};

module.exports = { listCoupons, createCoupon, updateCoupon, deleteCoupon, validateCoupon };