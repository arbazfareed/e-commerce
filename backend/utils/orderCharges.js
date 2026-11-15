// Shipping rates and the flat COD fee are set in PKR. For USD orders they are
// converted with the store's USD rate so totals stay in one currency.
const DEFAULT_USD_RATE = 278;

const toOrderCurrency = (amountPKR, currency, usdRate) => {
  const amount = Number(amountPKR) || 0;
  if (currency !== 'USD') return Math.round(amount);
  const rate = Number(usdRate) > 0 ? Number(usdRate) : DEFAULT_USD_RATE;
  return Number((amount / rate).toFixed(2));
};

// Free delivery inside Pakistan once the order (after coupons) reaches the threshold.
const qualifiesForFreeShipping = ({ subtotal, currency, country, settings = {} }) => {
  const threshold = Number(settings.freeShippingThreshold) || 0;
  if (threshold <= 0 || String(country || 'Pakistan').trim().toLowerCase() !== 'pakistan') return false;
  const usdRate = Number(settings.usdRate) > 0 ? Number(settings.usdRate) : DEFAULT_USD_RATE;
  return (currency === 'USD' ? subtotal * usdRate : subtotal) >= threshold;
};

const calcOrderCharges = ({ subtotal, currency, shippingFeePKR, paymentMethod, country, settings = {} }) => {
  const usdRate = Number(settings.usdRate) > 0 ? Number(settings.usdRate) : DEFAULT_USD_RATE;
  const freeShipping = qualifiesForFreeShipping({ subtotal, currency, country, settings });
  const shippingFee = freeShipping ? 0 : toOrderCurrency(shippingFeePKR, currency, usdRate);
  let codFee = 0;
  if (paymentMethod === 'COD') {
    const thresholdPKR = Number(settings.codThreshold) || 0;
    const subtotalPKR = currency === 'USD' ? subtotal * usdRate : subtotal;
    const waived = thresholdPKR > 0 && subtotalPKR >= thresholdPKR;
    if (!waived) {
      codFee = settings.codFeeMode === 'percentage'
        ? (currency === 'USD'
          ? Number((subtotal * (Number(settings.codFee) || 0) / 100).toFixed(2))
          : Math.round(subtotal * (Number(settings.codFee) || 0) / 100))
        : toOrderCurrency(settings.codFee, currency, usdRate);
    }
  }
  const totalPrice = currency === 'USD'
    ? Number((subtotal + shippingFee + codFee).toFixed(2))
    : subtotal + shippingFee + codFee;
  return { shippingFee, codFee, totalPrice, usdRate, freeShipping };
};

module.exports = { calcOrderCharges, qualifiesForFreeShipping, toOrderCurrency, DEFAULT_USD_RATE };
