export { formatPKR, formatUSD, getDiscountedPrice, getActiveDiscountPercent, getUSDRate, saveUSDRate, pkrToUSD } from './currencyUtils';
export { getShippingRates, saveShippingRates, calcShippingFee, getZoneRates, saveZoneRates, detectZone, ZONE_LABELS, calcZoneShipping, calcWeightShipping, getWeightRates, saveWeightRates } from './shippingUtils';
export { getSupportTickets, saveSupportTicket, updateTicketStatus } from './supportUtils';

import { saveUSDRate as storeUSDRate } from './currencyUtils';
import { saveZoneRates as storeZoneRates } from './shippingUtils';

// Cache the store's saved shipping and currency settings (from /api/settings/public)
// so the cart shows the same rates the server charges.
export const applyStoreRates = (settings) => {
  if (!settings || typeof settings !== 'object') return;
  if (Number(settings.usdRate) > 0) storeUSDRate(settings.usdRate);
  if (settings.zoneRates && typeof settings.zoneRates === 'object') storeZoneRates(settings.zoneRates);
};
