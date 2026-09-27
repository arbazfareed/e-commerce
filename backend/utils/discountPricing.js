const getActiveDiscountPercent = (product = {}, now = new Date()) => {
  const discount = Math.min(100, Math.max(0, Number(product.discountPercent) || 0));
  if (!discount) return 0;

  const today = now instanceof Date ? now.toISOString().slice(0, 10) : String(now).slice(0, 10);
  const startsOn = product.discountStartDate || '';
  const endsOn = product.discountEndDate || '';

  if (startsOn && today < startsOn) return 0;
  if (endsOn && today > endsOn) return 0;
  return discount;
};

const getDiscountedUnitPrice = (price, discountPercent = 0, currency = 'PKR') => {
  const basePrice = Math.max(0, Number(price) || 0);
  const discount = Math.min(100, Math.max(0, Number(discountPercent) || 0));
  const discounted = basePrice * (1 - discount / 100);
  return currency === 'USD' ? Number(discounted.toFixed(2)) : Math.round(discounted);
};

module.exports = { getActiveDiscountPercent, getDiscountedUnitPrice };
