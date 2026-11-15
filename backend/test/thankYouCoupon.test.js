const test = require('node:test');
const assert = require('node:assert/strict');
const { describeThankYouCoupon } = require('../utils/thankYouCoupon');

test('thank-you coupon is described for the customer and hidden when it cannot be used', () => {
  const coupon = { code: 'THANKS10', discountType: 'percentage', discountValue: 10, minimumOrderAmount: 2000, currency: 'PKR', isActive: true, expiresAt: '2026-12-31' };
  assert.deepEqual(describeThankYouCoupon(coupon, '2026-11-15'), { code: 'THANKS10', text: '10% off your next order on orders above Rs 2,000', expiresAt: '2026-12-31' });
  assert.equal(describeThankYouCoupon({ ...coupon, isActive: false }, '2026-11-15'), null);
  assert.equal(describeThankYouCoupon({ ...coupon, expiresAt: '2026-11-01' }, '2026-11-15'), null);
  assert.equal(describeThankYouCoupon({ ...coupon, usageLimit: 5, usageCount: 5 }, '2026-11-15'), null);
  assert.equal(describeThankYouCoupon(null), null);
});
