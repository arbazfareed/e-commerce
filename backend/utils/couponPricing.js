const roundCurrency = (amount, currency) => currency === 'USD'
  ? Number(Number(amount).toFixed(2))
  : Math.round(Number(amount));

const validateCouponForSubtotal = (coupon, subtotal, currency, now = new Date()) => {
  if (!coupon || coupon.isActive === false) return { error: 'This coupon is not available.' };
  const today = now instanceof Date ? now.toISOString().slice(0, 10) : String(now).slice(0, 10);
  if (coupon.expiresAt && today > coupon.expiresAt) return { error: 'This coupon has expired.' };
  if (coupon.usageLimit && Number(coupon.usageCount || 0) >= Number(coupon.usageLimit))
    return { error: 'This coupon has reached its usage limit.' };
  if (Number(coupon.minimumOrderAmount || 0) > 0 && coupon.currency !== currency)
    return { error: `This coupon's minimum order is set in ${coupon.currency}.` };
  if (Number(subtotal) < Number(coupon.minimumOrderAmount || 0))
    return { error: `Add items worth ${coupon.currency === 'USD' ? '$' : 'Rs '}${coupon.minimumOrderAmount} to use this coupon.` };
  if (coupon.discountType === 'flat' && coupon.currency !== currency)
    return { error: `This coupon is available for ${coupon.currency} orders only.` };

  const value = Number(coupon.discountValue);
  if (!Number.isFinite(value) || value <= 0 || (coupon.discountType === 'percentage' && value > 100))
    return { error: 'This coupon has an invalid discount.' };

  const discountAmount = Math.min(Number(subtotal), roundCurrency(
    coupon.discountType === 'percentage' ? Number(subtotal) * value / 100 : value,
    currency,
  ));
  if (discountAmount <= 0) return { error: 'This coupon does not apply to this order.' };
  return { discountAmount, currency };
};

module.exports = { roundCurrency, validateCouponForSubtotal };