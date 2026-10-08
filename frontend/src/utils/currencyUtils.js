export const formatPKR = (n) =>
  'Rs ' + Number(n || 0).toLocaleString('en-PK', { maximumFractionDigits: 0 });

export const formatUSD = (n) =>
  '$' + Number(n || 0).toFixed(2);

export const getDiscountedPrice = (price, discountPercent = 0, currency = 'PKR') => {
  const basePrice = Math.max(0, Number(price) || 0);
  const discount = Math.min(100, Math.max(0, Number(discountPercent) || 0));
  const discounted = basePrice * (1 - discount / 100);
  return currency === 'USD' ? Number(discounted.toFixed(2)) : Math.round(discounted);
};

export const getActiveDiscountPercent = (product, now = new Date()) => {
  const discount = Math.min(100, Math.max(0, Number(product?.discountPercent) || 0));
  if (!discount) return 0;
  const today = now instanceof Date ? now.toISOString().slice(0, 10) : String(now).slice(0, 10);
  if (product?.discountStartDate && today < product.discountStartDate) return 0;
  if (product?.discountEndDate && today > product.discountEndDate) return 0;
  return discount;
};

const DEFAULT_USD_RATE = 278;

export const getUSDRate = () => {
  try {
    const saved = localStorage.getItem('ic_usd_rate');
    if (saved) return parseFloat(saved) || DEFAULT_USD_RATE;
  } catch {}
  return DEFAULT_USD_RATE;
};

export const saveUSDRate = (rate) => {
  try {
    localStorage.setItem('ic_usd_rate', String(parseFloat(rate) || DEFAULT_USD_RATE));
  } catch {}
};

export const pkrToUSD = (pkr) =>
  parseFloat((Number(pkr || 0) / getUSDRate()).toFixed(2));
