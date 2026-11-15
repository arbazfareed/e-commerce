// The admin's "thank-you" coupon, offered after an order to bring the customer back.
// Returns null when it is off, switched off, expired or used up.
const describeThankYouCoupon = (coupon, today = new Date().toISOString().slice(0, 10)) => {
  if (!coupon || coupon.isActive === false) return null;
  if (coupon.expiresAt && coupon.expiresAt < today) return null;
  if (coupon.usageLimit && coupon.usageCount >= coupon.usageLimit) return null;
  const amount = coupon.discountType === 'percentage'
    ? `${coupon.discountValue}% off`
    : `${coupon.currency === 'USD' ? '$' : 'Rs '}${Number(coupon.discountValue).toLocaleString('en-PK')} off`;
  const minimum = coupon.minimumOrderAmount > 0
    ? ` on orders above ${coupon.currency === 'USD' ? '$' : 'Rs '}${Number(coupon.minimumOrderAmount).toLocaleString('en-PK')}`
    : '';
  return { code: coupon.code, text: `${amount} your next order${minimum}`, expiresAt: coupon.expiresAt || '' };
};

module.exports = { describeThankYouCoupon };
