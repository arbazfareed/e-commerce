const test = require('node:test');
const assert = require('node:assert/strict');
const { calcOrderCharges } = require('../utils/orderCharges');

test('USD orders convert PKR shipping and COD fees instead of adding rupees to dollars', () => {
  // $20 item to Dubai: shipping Rs 1025 at Rs 278 per USD = $3.69
  const result = calcOrderCharges({ subtotal: 20, currency: 'USD', shippingFeePKR: 1025, paymentMethod: 'COD', settings: { codFee: 278, codFeeMode: 'flat' } });
  assert.deepEqual(result, { shippingFee: 3.69, codFee: 1, totalPrice: 24.69, usdRate: 278 });
});

test('PKR orders keep fees in rupees', () => {
  const result = calcOrderCharges({ subtotal: 1500, currency: 'PKR', shippingFeePKR: 80, paymentMethod: 'COD', settings: { codFee: 50, codFeeMode: 'flat', usdRate: 300 } });
  assert.deepEqual(result, { shippingFee: 80, codFee: 50, totalPrice: 1630, usdRate: 300 });
});

test('COD threshold is compared in PKR and percentage fees use the order currency', () => {
  const waived = calcOrderCharges({ subtotal: 50, currency: 'USD', shippingFeePKR: 0, paymentMethod: 'COD', settings: { codFee: 100, codThreshold: 10000, usdRate: 278 } });
  assert.equal(waived.codFee, 0);
  const pct = calcOrderCharges({ subtotal: 20, currency: 'USD', shippingFeePKR: 0, paymentMethod: 'COD', settings: { codFee: 5, codFeeMode: 'percentage' } });
  assert.equal(pct.codFee, 1);
});
