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
