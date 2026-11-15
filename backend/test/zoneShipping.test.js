const test = require('node:test');
const assert = require('node:assert/strict');
const { calcZoneShipping } = require('../utils/zoneShipping');

test('zone shipping uses the configured destination rates and item weight', () => {
  assert.deepEqual(calcZoneShipping([], 'Pakistan', 'Karachi'), {
    fee: 80,
    totalWeight: 0,
    zone: 'domestic_pak',
  });

  assert.deepEqual(calcZoneShipping([{ weightKg: 1, quantity: 2 }], 'Pakistan', 'Lahore'), {
    fee: 140,
    totalWeight: 2,
    zone: 'domestic_pak',
  });

  assert.deepEqual(calcZoneShipping([], 'UAE'), {
    fee: 900,
    totalWeight: 0,
    zone: 'middle_east',
  });
});

test('server shipping zones match the storefront country list', () => {
  const fs = require('node:fs');
  const path = require('node:path');
  const { detectZone, ZONE_MAP, PAK_CITIES } = require('../utils/zoneShipping');
  const frontendFile = path.join(__dirname, '..', '..', 'frontend', 'src', 'utils', 'shippingUtils.js');
  if (fs.existsSync(frontendFile)) {
    const source = fs.readFileSync(frontendFile, 'utf8');
    const block = source.match(/const ZONE_MAP = \{([\s\S]*?)\n\};/)[1];
    const pairs = [...block.matchAll(/'?([a-z][a-z ]*?)'?\s*:\s*'([a-z_]+)'/g)];
    assert.ok(pairs.length > 50);
    for (const [, country, zone] of pairs) assert.equal(ZONE_MAP[country], zone, country);
    const cities = source.match(/const PAK_CITIES = new Set\(\[([\s\S]*?)\]\);/)[1].match(/'([^']+)'/g).map(c => c.slice(1, -1));
    for (const city of cities) assert.ok(PAK_CITIES.has(city), city);
  }
  assert.equal(detectZone('Belgium', 'Brussels'), 'europe');
  assert.equal(detectZone('Mexico', ''), 'north_america');
  assert.equal(detectZone('India', 'Hyderabad'), 'south_asia');
  assert.equal(detectZone('Pakistan', 'Hyderabad'), 'domestic_pak');
});

test('admin zone rate overrides are applied and validated', () => {
  const { validateZoneRates, resolveZoneRates } = require('../utils/zoneShipping');
  const overrides = { domestic_pak: { baseRate: 200, perKg: 50, minFee: 200 } };
  assert.deepEqual(calcZoneShipping([{ weightKg: 1, quantity: 1 }], 'Pakistan', 'Multan', overrides), {
    fee: 250, totalWeight: 1, zone: 'domestic_pak',
  });
  assert.equal(resolveZoneRates({ europe: { baseRate: 'abc' } }).europe.baseRate, 1800);
  assert.ok(validateZoneRates({ mars: { baseRate: 1, perKg: 1, minFee: 1 } }).error);
  assert.ok(validateZoneRates({ europe: { baseRate: -1, perKg: 1, minFee: 1 } }).error);
  assert.deepEqual(validateZoneRates(overrides).value, overrides);
});
