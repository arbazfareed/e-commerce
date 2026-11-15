const test = require('node:test');
const assert = require('node:assert/strict');
const { buildBusinessAnalytics } = require('../utils/businessAnalytics');

const now = new Date('2026-11-15T12:00:00Z');
const daysAgo = n => new Date(now.getTime() - n * 86400000);
const order = (over = {}) => ({
  status: 'Delivered', currency: 'PKR', paymentMethod: 'COD', isPaid: true, productTotal: 1000, shippingFee: 80,
  codFee: 0, couponDiscount: 0, totalPrice: 1080, address: { city: 'Lahore', country: 'Pakistan' },
  products: [{ product: 'p1', name: 'Rose soap', price: 500, quantity: 2 }], createdAt: daysAgo(5), ...over,
});

const products = [
  { _id: 'p1', name: 'Rose soap', stock: 3, isVisible: true, pricePKR: 500, createdAt: daysAgo(200) },
  { _id: 'p2', name: 'Clay vase', stock: 20, isVisible: true, pricePKR: 2000, createdAt: daysAgo(200) },
  { _id: 'p3', name: 'Old candle', stock: 0, isVisible: true, pricePKR: 300, createdAt: daysAgo(200) },
];

test('net sales leave out cancelled and returned orders and convert USD to PKR', () => {
  const result = buildBusinessAnalytics({
    now, products, usdRate: 280,
    orders: [
      order({ user: { _id: 'u1', name: 'Ali', email: 'ali@x.pk' } }),
      order({ status: 'Cancelled', guestContact: { email: 'b@x.pk' } }),
      order({ status: 'Returned', guestContact: { email: 'c@x.pk' } }),
      order({ currency: 'USD', totalPrice: 10, productTotal: 9, shippingFee: 1, address: { city: 'Dubai', country: 'United Arab Emirates' }, guestContact: { email: 'd@x.pk' }, products: [{ product: 'p2', name: 'Clay vase', price: 9, quantity: 1 }] }),
    ],
  });
  assert.equal(result.current.netOrders, 2);
  assert.equal(result.current.netSales, 1080 + 2800);
  assert.equal(result.current.cancelRate, 25);
  assert.equal(result.current.returnRate, 25);
  assert.equal(result.current.internationalShare, 50);
  assert.equal(result.currency, 'PKR');
});

test('growth compares with the previous period of the same length', () => {
  const result = buildBusinessAnalytics({ now, products, orders: [order(), order({ createdAt: daysAgo(40), totalPrice: 2160 })] });
  assert.equal(result.kpis.netSales.value, 1080);
  assert.equal(result.kpis.netSales.previous, 2160);
  assert.equal(result.kpis.netSales.change, -50);
  assert.ok(result.suggestions.some(s => /Sales are down 50%/.test(s.title)));
});

test('stock advice: restock fast sellers, flag out-of-stock and products that do not sell', () => {
  const orders = Array.from({ length: 6 }, (_, i) => order({ createdAt: daysAgo(i + 1), guestContact: { email: `g${i}@x.pk` } }));
  const result = buildBusinessAnalytics({ now, products, orders });
  assert.equal(result.inventory.restockSoon[0].name, 'Rose soap');
  assert.ok(result.inventory.restockSoon[0].daysOfStockLeft < 14);
  assert.deepEqual(result.inventory.outOfStock.map(p => p.name), ['Old candle']);
  assert.deepEqual(result.inventory.notSelling.map(p => p.name), ['Clay vase']);
  const titles = result.suggestions.map(s => s.title);
  assert.ok(titles.includes('Restock Rose soap'));
  assert.ok(titles.some(t => /did not sell/.test(t)));
});

test('cities with many failed COD orders get a high-priority suggestion', () => {
  const orders = [
    ...Array.from({ length: 3 }, (_, i) => order({ status: 'Returned', address: { city: 'karachi', country: 'Pakistan' }, guestContact: { email: `r${i}@x.pk` } })),
    ...Array.from({ length: 3 }, (_, i) => order({ address: { city: 'karachi', country: 'Pakistan' }, guestContact: { email: `k${i}@x.pk` } })),
  ];
  const result = buildBusinessAnalytics({ now, products, orders });
  const city = result.cities.find(c => c.city === 'Karachi');
  assert.equal(city.failedRate, 50);
  const advice = result.suggestions.find(s => s.title.startsWith('Karachi'));
  assert.equal(advice.priority, 'high');
});

test('customers: new vs returning, repeat rate and COD still to collect', () => {
  const orders = [
    order({ user: { _id: 'u1', name: 'Ali' }, createdAt: daysAgo(100) }),
    order({ user: { _id: 'u1', name: 'Ali' } }),
    order({ guestContact: { name: 'Sara', email: 'sara@x.pk' }, isPaid: false, status: 'Shipped' }),
  ];
  const result = buildBusinessAnalytics({ now, products, orders });
  assert.equal(result.customers.activeInPeriod, 2);
  assert.equal(result.customers.newInPeriod, 1);
  assert.equal(result.customers.returningInPeriod, 1);
  assert.equal(result.customers.repeatRate, 50);
  assert.equal(result.kpis.codToCollect.value, 1080);
  assert.equal(result.customers.top[0].name, 'Ali');
});

test('an empty store gets a clear first step instead of empty charts', () => {
  const result = buildBusinessAnalytics({ now, products: [], orders: [] });
  assert.equal(result.suggestions[0].title, 'No orders in this period');
  assert.equal(result.trend.length, 30);
});
