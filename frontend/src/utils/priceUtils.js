// ─── Price formatters ────────────────────────────────────────────────────────
export const formatPKR = (n) =>
  'Rs ' + Number(n || 0).toLocaleString('en-PK', { maximumFractionDigits: 0 });

export const formatUSD = (n) =>
  '$' + Number(n || 0).toFixed(2);

// ─── PKR ↔ USD exchange rate ──────────────────────────────────────────────────
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

// ─── Legacy flat shipping (kept for backwards compat, no longer used in cart) ─
const DEFAULT_RATES = { pakistan: 150, international: 2500 };

export const getShippingRates = () => {
  try {
    const saved = localStorage.getItem('ic_shipping_rates');
    if (saved) return { ...DEFAULT_RATES, ...JSON.parse(saved) };
  } catch {}
  return { ...DEFAULT_RATES };
};

export const saveShippingRates = (rates) => {
  try { localStorage.setItem('ic_shipping_rates', JSON.stringify(rates)); } catch {}
};

export const calcShippingFee = (country = 'Pakistan') => {
  const rates = getShippingRates();
  return country.trim().toLowerCase() === 'pakistan' ? rates.pakistan : rates.international;
};

// ─── Zone-based shipping ──────────────────────────────────────────────────────
//
// HOW IT WORKS
// ────────────
// 1. Detect the shipping ZONE from (fromCity, fromCountry) → (toCity, toCountry).
//    Supported zones:
//      domestic_pak   – within Pakistan (any city to any city, e.g. Multan → Karachi)
//      south_asia     – Pakistan → India, Bangladesh, Sri Lanka, Nepal
//      middle_east    – Pakistan → UAE, Saudi Arabia, Qatar, Kuwait, Bahrain, Oman
//      east_asia      – Pakistan ↔ China, Japan, South Korea, Hong Kong, Taiwan
//      europe         – Pakistan → any European country
//      north_america  – Pakistan → USA, Canada
//      australia      – Pakistan → Australia, New Zealand
//      rest_of_world  – everything else
//
// 2. Each zone has:
//    - baseRate (PKR)  : charged for EVERY order regardless of weight
//    - perKg    (PKR)  : charged per kilogram of total cart weight
//    - minFee   (PKR)  : floor; the fee is never less than this
//
// 3. Weight is OPTIONAL per product.  If a product has weightKg = 0, '' or undefined
//    it does NOT contribute weight to the cart total.  The per-kg charge only applies
//    to items that actually have a weight.  Items with no weight still incur the
//    base rate (proportionally split across the order).
//
// 4. This means:
//    - Glasses, digital goods, lightweight accessories → no per-kg charge.
//    - Fruit, electronics with weight → per-kg charge added.
//    - The total shipping fee = baseRate + (totalWeight × perKg)  [min: minFee]

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

export const getZoneRates = () => {
  try {
    const saved = localStorage.getItem('ic_zone_rates');
    if (saved) {
      const parsed = JSON.parse(saved);
      // Merge with defaults so new zones always exist
      const merged = {};
      for (const zone of Object.keys(DEFAULT_ZONE_RATES)) {
        merged[zone] = { ...DEFAULT_ZONE_RATES[zone], ...(parsed[zone] || {}) };
      }
      return merged;
    }
  } catch {}
  return { ...DEFAULT_ZONE_RATES };
};

export const saveZoneRates = (rates) => {
  try { localStorage.setItem('ic_zone_rates', JSON.stringify(rates)); } catch {}
};

// Country-to-zone mapping (lowercase)
const ZONE_MAP = {
  // South Asia
  india: 'south_asia', bangladesh: 'south_asia', 'sri lanka': 'south_asia',
  nepal: 'south_asia', bhutan: 'south_asia', maldives: 'south_asia',

  // Middle East
  uae: 'middle_east', 'united arab emirates': 'middle_east',
  'saudi arabia': 'middle_east', qatar: 'middle_east',
  kuwait: 'middle_east', bahrain: 'middle_east', oman: 'middle_east',
  jordan: 'middle_east', lebanon: 'middle_east', iraq: 'middle_east',
  iran: 'middle_east', yemen: 'middle_east', syria: 'middle_east',
  dubai: 'middle_east', // sometimes entered as city-name only

  // East Asia
  china: 'east_asia', japan: 'east_asia', 'south korea': 'east_asia',
  korea: 'east_asia', 'hong kong': 'east_asia', taiwan: 'east_asia',
  'macao': 'east_asia', mongolia: 'east_asia',

  // Southeast Asia (lumped with east_asia)
  singapore: 'east_asia', malaysia: 'east_asia', indonesia: 'east_asia',
  thailand: 'east_asia', vietnam: 'east_asia', philippines: 'east_asia',
  myanmar: 'east_asia', cambodia: 'east_asia', laos: 'east_asia',
  brunei: 'east_asia',

  // Europe
  uk: 'europe', 'united kingdom': 'europe', germany: 'europe',
  france: 'europe', italy: 'europe', spain: 'europe', netherlands: 'europe',
  belgium: 'europe', sweden: 'europe', norway: 'europe', denmark: 'europe',
  finland: 'europe', poland: 'europe', austria: 'europe', switzerland: 'europe',
  portugal: 'europe', greece: 'europe', turkey: 'europe', russia: 'europe',
  ukraine: 'europe', czechia: 'europe', 'czech republic': 'europe',
  hungary: 'europe', romania: 'europe', croatia: 'europe', ireland: 'europe',
  scotland: 'europe', wales: 'europe', england: 'europe',

  // North America
  usa: 'north_america', 'united states': 'north_america',
  'united states of america': 'north_america', us: 'north_america',
  canada: 'north_america', mexico: 'north_america',

  // Australia / Oceania
  australia: 'australia', 'new zealand': 'australia', fiji: 'australia',
  'papua new guinea': 'australia',

  // Africa
  egypt: 'rest_of_world', nigeria: 'rest_of_world', 'south africa': 'rest_of_world',
  kenya: 'rest_of_world', ethiopia: 'rest_of_world', ghana: 'rest_of_world',
  tanzania: 'rest_of_world', morocco: 'rest_of_world', algeria: 'rest_of_world',
  tunisia: 'rest_of_world', libya: 'rest_of_world', sudan: 'rest_of_world',
};

// Pakistan cities (for domestic detection — not exhaustive but covers major ones)
const PAK_CITIES = new Set([
  'karachi','lahore','islamabad','rawalpindi','faisalabad','multan','peshawar',
  'quetta','sialkot','gujranwala','hyderabad','bahawalpur','sargodha','abbottabad',
  'sukkur','larkana','sheikhupura','jhang','dera ghazi khan','gujrat','sahiwal',
  'wah','mardan','mingora','kasur','rahim yar khan','sadiqabad','okara','chiniot',
  'kamoke','hafizabad','mirpur khas','nawabshah','khanewal','muzaffarabad',
  'kot addu','attock','jhelum','chakwal','mianwali','bahawalnagar','vehari',
  'narowal','khushab','toba tek singh','lodhran','pakpattan','mandi bahauddin',
  'layyah','muzaffargarh','dera ismail khan','kohat','mansehra','haripur',
  'nowshera','swat','charsadda','swabi','bannu','lakki marwat',
  'turbat','khuzdar','hub','chaman','zhob','gwadar',
]);

/**
 * Detect shipping zone from origin → destination.
 *
 * @param {string} fromCountry  - Origin country (default 'Pakistan')
 * @param {string} fromCity     - Origin city
 * @param {string} toCountry    - Destination country
 * @param {string} toCity       - Destination city
 * @returns {string}  zone key
 */
export const detectZone = (
  fromCountry = 'Pakistan',
  fromCity    = '',
  toCountry   = 'Pakistan',
  toCity      = '',
) => {
  const fc = (fromCountry || '').trim().toLowerCase();
  const tc = (toCountry   || '').trim().toLowerCase();
  const fCity = (fromCity  || '').trim().toLowerCase();
  const tCity = (toCity    || '').trim().toLowerCase();

  // Both Pakistan → domestic
  if (fc === 'pakistan' && tc === 'pakistan') return 'domestic_pak';

  // Pakistan origin → somewhere else (most common use case)
  if (fc === 'pakistan') {
    // Check if destination country is in our map
    if (ZONE_MAP[tc]) return ZONE_MAP[tc];

    // Destination could be typed as a city name (e.g. "Dubai")
    if (ZONE_MAP[tCity]) return ZONE_MAP[tCity];

    // Check destination city against Pakistan cities → domestic
    if (PAK_CITIES.has(tCity)) return 'domestic_pak';

    return 'rest_of_world';
  }

  // Non-Pakistan origin → Pakistan
  if (tc === 'pakistan') {
    if (ZONE_MAP[fc]) return ZONE_MAP[fc];
    if (ZONE_MAP[fCity]) return ZONE_MAP[fCity];
    return 'rest_of_world';
  }

  // Both non-Pakistan (edge case)
  if (ZONE_MAP[tc]) return ZONE_MAP[tc];
  return 'rest_of_world';
};

export const ZONE_LABELS = {
  domestic_pak:  '🇵🇰 Pakistan (Local Delivery)',
  south_asia:    '🌏 South Asia',
  middle_east:   '🌙 Middle East',
  east_asia:     '🌏 East / South-East Asia',
  europe:        '🌍 Europe',
  north_america: '🌎 North America',
  australia:     '🌏 Australia / Oceania',
  rest_of_world: '🌐 Rest of World',
};

/**
 * Calculate zone-based shipping fee.
 *
 * @param {Array}  items       - Cart items: [{ weightKg, quantity, ... }]
 * @param {string} toCountry   - Destination country
 * @param {string} toCity      - Destination city (optional, for domestic routing)
 * @param {string} fromCountry - Origin country (default 'Pakistan')
 * @param {string} fromCity    - Origin city (optional)
 * @returns {{ fee, totalWeight, baseRate, perKg, zone, zoneLabel, breakdown }}
 */
export const calcZoneShipping = (
  items       = [],
  toCountry   = 'Pakistan',
  toCity      = '',
  fromCountry = 'Pakistan',
  fromCity    = '',
) => {
  const zone      = detectZone(fromCountry, fromCity, toCountry, toCity);
  const rates     = getZoneRates();
  const zoneRate  = rates[zone] || DEFAULT_ZONE_RATES.rest_of_world;

  // Total weight — only count items that have a real weight entered
  const totalWeight = (Array.isArray(items) ? items : []).reduce((sum, item) => {
    const w = parseFloat(item.weightKg);
    // If weight is 0, blank, or NaN → item contributes no weight (e.g. glasses, fruit)
    if (!w || w <= 0) return sum;
    return sum + w * Number(item.quantity || 1);
  }, 0);

  const roundedWeight = parseFloat(totalWeight.toFixed(2));
  const weightCharge  = Math.round(roundedWeight * zoneRate.perKg);
  const rawFee        = zoneRate.baseRate + weightCharge;
  const fee           = Math.max(rawFee, zoneRate.minFee);

  // Human-readable breakdown
  let breakdown = `Rs ${zoneRate.baseRate} base`;
  if (roundedWeight > 0) {
    breakdown += ` + ${roundedWeight}kg × Rs ${zoneRate.perKg}/kg`;
  } else {
    breakdown += ` (no weight — flat rate)`;
  }

  return {
    fee,
    totalWeight: roundedWeight,
    baseRate:    zoneRate.baseRate,
    perKg:       zoneRate.perKg,
    zone,
    zoneLabel:   ZONE_LABELS[zone] || zone,
    breakdown,
  };
};

// ─── Back-compat alias (CartPage uses calcWeightShipping) ────────────────────
// Redirect old calls to the new zone-based function transparently.
export const calcWeightShipping = (items = [], country = 'Pakistan', city = '') =>
  calcZoneShipping(items, country, city);

// ─── Legacy weight rates (kept for admin settings page back-compat) ──────────
const DEFAULT_WEIGHT_RATES = {
  pak_baseRate: 80, pak_perKg: 40,
  intl_baseRate: 500, intl_perKg: 300,
};

export const getWeightRates = () => {
  try {
    const saved = localStorage.getItem('ic_weight_rates');
    if (saved) return { ...DEFAULT_WEIGHT_RATES, ...JSON.parse(saved) };
  } catch {}
  return { ...DEFAULT_WEIGHT_RATES };
};

export const saveWeightRates = (rates) => {
  try { localStorage.setItem('ic_weight_rates', JSON.stringify(rates)); } catch {}
};

// ─── Support tickets ─────────────────────────────────────────────────────────
export const getSupportTickets = () => {
  try {
    const saved = localStorage.getItem('ic_support_tickets');
    return saved ? JSON.parse(saved) : [];
  } catch { return []; }
};

export const saveSupportTicket = (ticket) => {
  try {
    const tickets = getSupportTickets();
    const newTicket = {
      id: Date.now().toString(),
      createdAt: new Date().toISOString(),
      status: 'Open',
      ...ticket,
    };
    tickets.unshift(newTicket);
    localStorage.setItem('ic_support_tickets', JSON.stringify(tickets));
    return newTicket;
  } catch { return null; }
};

export const updateTicketStatus = (id, status) => {
  try {
    const tickets = getSupportTickets().map(t =>
      t.id === id ? { ...t, status, resolvedAt: new Date().toISOString() } : t
    );
    localStorage.setItem('ic_support_tickets', JSON.stringify(tickets));
  } catch {}
};
