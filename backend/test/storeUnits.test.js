const test = require('node:test');
const assert = require('node:assert/strict');
const { generatePassword, generateUsername } = require('../utils/credentials');
const { buildStoreReport, buildStoresOverview, scopeOrdersToStore } = require('../utils/storeAnalytics');

test('generated passwords are long, mixed and unambiguous', () => {
  for (let i = 0; i < 50; i += 1) {
    const password = generatePassword();
    assert.equal(password.length, 14);
    assert.match(password, /[a-z]/);
    assert.match(password, /[A-Z]/);
    assert.match(password, /[2-9]/);
    assert.match(password, /[!@#$%*?]/);
    assert.doesNotMatch(password, /[0O1lI]/);
  }
});

test('usernames come from the store name and skip names already taken', async () => {
  const taken = new Set();
  const first = await generateUsername('Lahore Crafts & Co.', async name => taken.has(name));
  assert.match(first, /^lahore-crafts-co-\d{4}$/);
  let calls = 0;
  const second = await generateUsername('Lahore Crafts', async () => (calls += 1) < 3);
  assert.equal(calls, 3);
  assert.match(second, /^lahore-crafts-\d{4}$/);
  assert.match(await generateUsername('!!!', async () => false), /^store-\d{4}$/);
});

const now = new Date('2026-11-15T12:00:00Z');
const products = [
  { _id: 'a1', name: 'Store A soap', store: 'storeA', stock: 2, pricePKR: 500 },
  { _id: 'b1', name: 'Main vase', store: null, stock: 10, pricePKR: 2000 },
];
const orders = [{
  status: 'Delivered', currency: 'PKR', paymentMethod: 'COD', isPaid: true, createdAt: new Date('2026-11-10T10:00:00Z'),
  totalPrice: 3080, shippingFee: 80, couponCode: 'SAVE', couponDiscount: 100,
  address: { city: 'Lahore', country: 'Pakistan' }, guestContact: { name: 'Sara', email: 'sara@x.pk' },
  products: [{ product: 'a1', name: 'Store A soap', price: 500, quantity: 2 }, { product: 'b1', name: 'Main vase', price: 2000, quantity: 1 }],
}];

test('a store only counts its own order lines, without shipping or coupons', () => {
  const productStore = new Map(products.map(p => [p._id, p.store ? p.store : 'main']));
  const [scoped] = scopeOrdersToStore(orders, productStore, 'storeA');
  assert.equal(scoped.products.length, 1);
  assert.equal(scoped.totalPrice, 1000);
  assert.equal(scoped.shippingFee, 0);
  assert.equal(scoped.couponCode, '');
  assert.equal(scopeOrdersToStore(orders, productStore, 'storeB').length, 0);
});

test('store owners get their own numbers without shopper details', () => {
  const report = buildStoreReport({ orders, products, storeKey: 'storeA', now, forStoreOwner: true });
  assert.equal(report.kpis.netSales.value, 1000);
  assert.equal(report.productCount, 1);
  assert.deepEqual(report.customers.top, []);
  assert.deepEqual(report.coupons, []);
  assert.ok(report.suggestions.every(s => !['Coupons', 'Customers', 'Orders', 'Cash'].includes(s.area)));
  assert.equal(report.inventory.lowStock[0].name, 'Store A soap');
  const adminView = buildStoreReport({ orders, products, storeKey: 'storeA', now });
  assert.equal(adminView.customers.top[0].name, 'Sara');
});

test('the main admin sees every store side by side', () => {
  const rows = buildStoresOverview({ orders, products, now, stores: [{ _id: 'storeA', name: 'Store A', isActive: true, owner: { username: 'store-a-1234', email: 'a@x.pk' } }] });
  assert.deepEqual(rows.map(r => [r.name, r.netSales, r.products]), [['IndusCart (main store)', 2000, 1], ['Store A', 1000, 1]]);
  assert.equal(rows[1].owner.username, 'store-a-1234');
});
