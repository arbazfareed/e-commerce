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

module.exports = { calcZoneShipping };
