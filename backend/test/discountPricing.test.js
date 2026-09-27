const test = require('node:test');
const assert = require('node:assert/strict');
const { getActiveDiscountPercent, getDiscountedUnitPrice } = require('../utils/discountPricing');

test('a promotion is inactive before its start date', () => {
  assert.equal(getActiveDiscountPercent({ discountPercent: 20, discountStartDate: '2026-10-01' }, '2026-09-30'), 0);
});

test('promotion start and end dates are inclusive', () => {
  const product = { discountPercent: 20, discountStartDate: '2026-10-01', discountEndDate: '2026-10-31' };
  assert.equal(getActiveDiscountPercent(product, '2026-10-01'), 20);
  assert.equal(getActiveDiscountPercent(product, '2026-10-31'), 20);
});

test('a promotion is inactive after its end date', () => {
  assert.equal(getActiveDiscountPercent({ discountPercent: 20, discountEndDate: '2026-10-31' }, '2026-11-01'), 0);
});

test('discounted prices round to whole PKR and cents for USD', () => {
  assert.equal(getDiscountedUnitPrice(1000, 15, 'PKR'), 850);
  assert.equal(getDiscountedUnitPrice(17.99, 15, 'USD'), 15.29);
});
