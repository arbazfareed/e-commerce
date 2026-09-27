const test = require('node:test');
const assert = require('node:assert/strict');

const { buildSalesAnalytics } = require('../utils/salesAnalytics');

const now = new Date('2026-09-26T10:00:00Z');

const orders = [
  {
    _id: 'o1',
    createdAt: new Date('2026-09-15T09:30:00Z'),
    paymentMethod: 'COD',
    totalPrice: 1200,
    products: [
      { name: 'A', quantity: 2, price: 400 },
      { name: 'B', quantity: 1, price: 400 },
    ],
  },
  {
    _id: 'o2',
    createdAt: new Date('2026-08-14T16:45:00Z'),
    paymentMethod: 'JazzCash',
    totalPrice: 1800,
    products: [
      { name: 'A', quantity: 1, price: 500 },
      { name: 'C', quantity: 3, price: 200 },
    ],
  },
  {
    _id: 'o3',
    createdAt: new Date('2026-06-11T08:15:00Z'),
    paymentMethod: 'Cash',
    totalPrice: 900,
    products: [
      { name: 'B', quantity: 2, price: 300 },
    ],
  },
];

test('buildSalesAnalytics groups cash and online revenue and identifies top products', () => {
  const analytics = buildSalesAnalytics(orders, now, [3, 6, 9, 12]);

  assert.equal(analytics.summary.totalRevenue, 3900);
  assert.equal(analytics.summary.cashRevenue, 2100);
  assert.equal(analytics.summary.onlineRevenue, 1800);
  assert.equal(analytics.topProducts[0].name, 'A');
  assert.equal(analytics.topProducts[0].soldUnits, 3);
  assert.equal(analytics.rangeBreakdown[3].totalRevenue, 3000);
  assert.equal(analytics.rangeBreakdown[6].totalRevenue, 3900);
  assert.ok(Array.isArray(analytics.dailySeries));
  assert.ok(analytics.dailySeries.some(i => i.date === '2026-09-15'));
  assert.ok(analytics.regionBreakdown.length >= 1);
  assert.ok(analytics.insights && analytics.insights.recommendedActions);
});
