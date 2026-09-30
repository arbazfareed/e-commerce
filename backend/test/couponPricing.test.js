const test = require('node:test');
const assert = require('node:assert/strict');
const { validateCouponForSubtotal } = require('../utils/couponPricing');

const coupon = overrides => ({
  isActive: true,
  discountType: 'percentage',
  discountValue: 10,
  currency: 'PKR',
  minimumOrderAmount: 0,
  usageLimit: null,
  usageCount: 0,
  expiresAt: '',
  ...overrides,
});

test('percentage coupons calculate a currency-rounded discount', () => {
  assert.deepEqual(validateCouponForSubtotal(coupon(), 1000, 'PKR'), { discountAmount: 100, currency: 'PKR' });
  assert.deepEqual(validateCouponForSubtotal(coupon(), 17.99, 'USD'), { discountAmount: 1.8, currency: 'USD' });
});

test('flat coupons apply only in their configured currency and cannot exceed subtotal', () => {
  assert.deepEqual(validateCouponForSubtotal(coupon({ discountType: 'flat', discountValue: 500 }), 300, 'PKR'), { discountAmount: 300, currency: 'PKR' });
  assert.match(validateCouponForSubtotal(coupon({ discountType: 'flat', discountValue: 500 }), 300, 'USD').error, /PKR orders only/);
});

test('coupon expiry is inclusive on the expiry date', () => {
  const c = coupon({ expiresAt: '2026-09-29' });
  assert.equal(validateCouponForSubtotal(c, 100, 'PKR', '2026-09-29').discountAmount, 10);
  assert.match(validateCouponForSubtotal(c, 100, 'PKR', '2026-09-30').error, /expired/);
});

test('minimum total, usage limits, inactive coupons, and invalid discounts are rejected', () => {
  assert.match(validateCouponForSubtotal(coupon({ minimumOrderAmount: 2000 }), 1000, 'PKR').error, /Add items worth/);
  assert.match(validateCouponForSubtotal(coupon({ usageLimit: 3, usageCount: 3 }), 1000, 'PKR').error, /usage limit/);
  assert.match(validateCouponForSubtotal(coupon({ isActive: false }), 1000, 'PKR').error, /not available/);
  assert.match(validateCouponForSubtotal(coupon({ discountValue: 120 }), 1000, 'PKR').error, /invalid discount/);
});