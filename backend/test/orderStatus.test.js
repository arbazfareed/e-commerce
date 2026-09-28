const test = require('node:test');
const assert = require('node:assert/strict');
const { isOrderStatus, shouldRestoreStockAfterCancellation } = require('../utils/orderStatus');

test('only the existing order status values are accepted', () => {
  for (const status of ['Pending', 'Processing', 'Shipped', 'Delivered', 'Cancelled']) {
    assert.equal(isOrderStatus(status), true);
  }
  assert.equal(isOrderStatus('Unknown'), false);
});

test('stock is restored only when an order is cancelled before shipment', () => {
  assert.equal(shouldRestoreStockAfterCancellation('Pending'), true);
  assert.equal(shouldRestoreStockAfterCancellation('Processing'), true);
  assert.equal(shouldRestoreStockAfterCancellation('Shipped'), false);
});
