const test = require('node:test');
const assert = require('node:assert/strict');
const { normalizeShipmentTracking } = require('../utils/shipmentTracking');

test('manual shipment details are trimmed and safe HTTPS links are normalized', () => {
  assert.deepEqual(normalizeShipmentTracking({
    provider: '  TCS  ', trackingNumber: '  DEMO-123  ', trackingUrl: 'https://carrier.example/track/DEMO-123',
  }), { value: { shippingProvider: 'TCS', trackingNumber: 'DEMO-123', trackingUrl: 'https://carrier.example/track/DEMO-123' } });
});

test('manual tracking rejects unsafe links and oversized courier values', () => {
  assert.match(normalizeShipmentTracking({ trackingUrl: 'javascript:alert(1)' }).error, /valid tracking link|HTTPS/);
  assert.match(normalizeShipmentTracking({ trackingUrl: 'http://carrier.example/track/1' }).error, /HTTPS/);
  assert.match(normalizeShipmentTracking({ provider: 'x'.repeat(81) }).error, /80 characters/);
  assert.match(normalizeShipmentTracking({ trackingNumber: 'x'.repeat(121) }).error, /120 characters/);
});