const test = require('node:test');
const assert = require('node:assert/strict');
const { validateManualCashSale } = require('../utils/manualCashSale');

test('manual cash sale normalizes valid items and calculates total', () => {
  assert.deepEqual(validateManualCashSale({
    products: [{ name: ' Basket ', price: '250.50', quantity: '2' }],
  }), {
    items: [{ name: 'Basket', price: 250.5, quantity: 2 }],
    totalAmount: 501,
  });
});

test('manual cash sale rejects empty names, negative prices, and invalid quantities', () => {
  assert.match(validateManualCashSale({ products: [{ name: ' ', price: 1 }] }).error, /must have a name/i);
  assert.match(validateManualCashSale({ products: [{ name: 'Item', price: -1 }] }).error, /non-negative/i);
  assert.match(validateManualCashSale({ products: [{ name: 'Item', price: '' }] }).error, /non-negative/i);
  assert.match(validateManualCashSale({ products: [{ name: 'Item', price: 1, quantity: 0 }] }).error, /positive whole number/i);
  assert.match(validateManualCashSale({ amount: -1 }).error, /non-negative/i);
});

test('an explicitly entered zero cash amount stays zero', () => {
  assert.equal(validateManualCashSale({ amount: 0 }).totalAmount, 0);
});
