// Zone-based shipping rates mirror the storefront defaults for order totals.
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
// Keep in sync with frontend/src/utils/shippingUtils.js (checked by test/zoneShipping.test.js).
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
const detectZone = (toCountry = 'Pakistan', toCity = '') => {
  const tc    = (toCountry || '').trim().toLowerCase();
  const tCity = (toCity    || '').trim().toLowerCase();
  // Same order as the storefront so the cart and the saved order agree.
  if (tc === 'pakistan') return 'domestic_pak';
  if (ZONE_MAP[tc])    return ZONE_MAP[tc];
  if (ZONE_MAP[tCity]) return ZONE_MAP[tCity];
  if (PAK_CITIES.has(tCity)) return 'domestic_pak';
  return 'rest_of_world';
};
const RATE_FIELDS = ['baseRate', 'perKg', 'minFee'];

// Merge saved admin overrides over the defaults; ignore unknown zones and bad numbers.
const resolveZoneRates = (overrides) => {
  const merged = {};
  for (const [zone, defaults] of Object.entries(DEFAULT_ZONE_RATES)) {
    const saved = overrides && typeof overrides === 'object' ? overrides[zone] : null;
    merged[zone] = { ...defaults };
    if (saved && typeof saved === 'object') {
      for (const field of RATE_FIELDS) {
        const value = Number(saved[field]);
        if (saved[field] !== undefined && saved[field] !== '' && Number.isFinite(value) && value >= 0) merged[zone][field] = value;
      }
    }
  }
  return merged;
};

// Returns an error message, or the cleaned rates object to store.
const validateZoneRates = (input) => {
  if (!input || typeof input !== 'object' || Array.isArray(input)) return { error: 'Zone rates must be an object.' };
  const clean = {};
  for (const [zone, rate] of Object.entries(input)) {
    if (!DEFAULT_ZONE_RATES[zone]) return { error: `Unknown shipping zone: ${zone}.` };
    if (!rate || typeof rate !== 'object') return { error: `Rates for ${zone} must be an object.` };
    clean[zone] = {};
    for (const field of RATE_FIELDS) {
      const value = Number(rate[field]);
      if (!Number.isFinite(value) || value < 0 || value > 10000000) return { error: `${zone} ${field} must be a non-negative number.` };
      clean[zone][field] = value;
    }
  }
  return { value: clean };
};

const calcZoneShipping = (items, toCountry, toCity, rateOverrides = null) => {
  const zone      = detectZone(toCountry, toCity);
  const rates     = resolveZoneRates(rateOverrides);
  const zoneRate  = rates[zone] || rates.rest_of_world;

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

module.exports = { calcZoneShipping, resolveZoneRates, validateZoneRates, detectZone, ZONE_MAP, PAK_CITIES, DEFAULT_ZONE_RATES };
