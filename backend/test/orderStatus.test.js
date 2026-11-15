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

test('delivered and cancelled orders are final and shipped orders cannot go back', () => {
  const { canChangeOrderStatus } = require('../utils/orderStatus');
  assert.equal(canChangeOrderStatus('Pending', 'Processing'), true);
  assert.equal(canChangeOrderStatus('Shipped', 'Delivered'), true);
  assert.equal(canChangeOrderStatus('Shipped', 'Pending'), false);
  assert.equal(canChangeOrderStatus('Cancelled', 'Pending'), false);
  assert.equal(canChangeOrderStatus('Delivered', 'Cancelled'), false);
  assert.equal(canChangeOrderStatus('Delivered', 'Delivered'), true);
});

test('returned parcels are final and always give the stock back', () => {
  const { canChangeOrderStatus, shouldRestoreStock, isOrderStatus } = require('../utils/orderStatus');
  assert.equal(isOrderStatus('Returned'), true);
  assert.equal(canChangeOrderStatus('Shipped', 'Returned'), true);
  assert.equal(canChangeOrderStatus('Delivered', 'Returned'), true);
  assert.equal(canChangeOrderStatus('Returned', 'Delivered'), false);
  assert.equal(canChangeOrderStatus('Pending', 'Returned'), false);
  assert.equal(shouldRestoreStock('Shipped', 'Returned'), true);
  assert.equal(shouldRestoreStock('Shipped', 'Cancelled'), false);
  assert.equal(shouldRestoreStock('Pending', 'Cancelled'), true);
});
