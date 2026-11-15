// End-to-end checks for store owners (sub-admins). Needs MongoDB (runs in CI).
const test = require('node:test');
const assert = require('node:assert/strict');
const http = require('node:http');
const mongoose = require('mongoose');
const jwt = require('jsonwebtoken');

process.env.NODE_ENV = process.env.NODE_ENV || 'test';
process.env.MONGO_URI = process.env.MONGO_URI || 'mongodb://127.0.0.1:27017/induscart';
process.env.JWT_SECRET = process.env.JWT_SECRET || 'multi-store-test-secret-multi-store-test';

const { app } = require('../server');
const User = require('../models/User');
const Store = require('../models/Store');
const Product = require('../models/Product');
const Order = require('../models/Order');

const send = (server, method, path, body, token) => new Promise((resolve, reject) => {
  const payload = body ? JSON.stringify(body) : '';
  const headers = payload ? { 'Content-Type': 'application/json', 'Content-Length': Buffer.byteLength(payload) } : {};
  if (token) headers.Authorization = `Bearer ${token}`;
  const req = http.request({ host: '127.0.0.1', port: server.address().port, path, method, headers }, res => {
    let text = '';
    res.on('data', chunk => { text += chunk; });
    res.on('end', () => {
      let parsed = {};
      try { parsed = text ? JSON.parse(text) : {}; } catch { parsed = text; }
      resolve({ status: res.statusCode, body: parsed });
    });
  });
  req.on('error', reject);
  req.end(payload);
});

test('store owners only reach their own store and get store-only analytics', async (t) => {
  try {
    await mongoose.connect(process.env.MONGO_URI, { serverSelectionTimeoutMS: 1500 });
  } catch {
    await mongoose.disconnect();
    t.skip('MongoDB is not available for multi-store integration tests.');
    return;
  }

  const suffix = `${Date.now()}-${Math.random().toString(16).slice(2, 8)}`;
  const created = { users: [], stores: [], products: [], orders: [] };
  let server;
  try {
    const admin = await User.create({ name: 'Main Admin', email: `ms-admin-${suffix}@example.test`, password: 'Main admin passphrase 123!', isAdmin: true });
    created.users.push(admin._id);
    const adminToken = jwt.sign({ id: admin._id }, process.env.JWT_SECRET, { expiresIn: '5m' });
    server = await new Promise(resolve => { const s = app.listen(0, () => resolve(s)); });

    // 1. Main admin creates a store; username and password are generated.
    const storeName = `Craft House ${suffix}`;
    const createdStore = await send(server, 'POST', '/api/stores', { email: `owner-${suffix}@example.test`, storeName }, adminToken);
    assert.equal(createdStore.status, 201, JSON.stringify(createdStore.body));
    const { username, password } = createdStore.body.credentials;
    assert.match(username, /^craft-house-.+-\d{4}$/);
    assert.ok(password.length >= 12);
    const storeId = createdStore.body.store._id;
    created.stores.push(storeId);
    const owner = await User.findOne({ username });
    created.users.push(owner._id);
    assert.equal(owner.isAdmin, false);
    assert.equal(owner.isSubAdmin, true);
    assert.equal(owner.mustChangePassword, true);
    assert.equal((await send(server, 'POST', '/api/stores', { email: `owner-${suffix}@example.test`, storeName: 'Other' }, adminToken)).status, 409);

    // 2. Store owner signs in through the admin login only.
    assert.equal((await send(server, 'POST', '/api/auth/login', { email: username, password })).status, 401);
    const login = await send(server, 'POST', '/api/auth/admin/login', { email: username, password });
    assert.equal(login.status, 200);
    assert.equal(login.body.isAdmin, false);
    assert.equal(login.body.isSubAdmin, true);
    assert.equal(login.body.storeName, storeName);
    const ownerToken = login.body.token;

    // 3. Products: created in their own store; other stores' products are invisible to them.
    const mainProduct = await Product.create({ name: `Main item ${suffix}`, category: 'Test', pricePKR: 1000, priceUSD: 4, stock: 10 });
    created.products.push(mainProduct._id);
    const ownProduct = await send(server, 'POST', '/api/products', { name: `Owner item ${suffix}`, category: 'Test', pricePKR: 500, priceUSD: 2, stock: 3, store: String(mainProduct._id) }, ownerToken);
    assert.equal(ownProduct.status, 201, JSON.stringify(ownProduct.body));
    created.products.push(ownProduct.body._id);
    assert.equal(String(ownProduct.body.store), storeId, 'a store owner cannot choose another store');

    const managed = await send(server, 'GET', '/api/products/manage', null, ownerToken);
    assert.equal(managed.status, 200);
    assert.deepEqual(managed.body.map(p => p._id), [ownProduct.body._id]);
    assert.equal((await send(server, 'PUT', `/api/products/${mainProduct._id}`, { name: 'Hacked' }, ownerToken)).status, 404);
    assert.equal((await send(server, 'DELETE', `/api/products/${mainProduct._id}`, null, ownerToken)).status, 404);
    assert.equal((await Product.findById(mainProduct._id)).name, `Main item ${suffix}`);
    const edit = await send(server, 'PUT', `/api/products/${ownProduct.body._id}`, { name: `Owner item renamed ${suffix}`, store: '' }, ownerToken);
    assert.equal(edit.status, 200);
    assert.equal(String(edit.body.store), storeId, 'a store owner cannot move a product out of their store');

    // 4. No access to main-admin areas.
    for (const [method, path] of [['GET', '/api/orders'], ['GET', '/api/orders/business'], ['GET', '/api/settings'], ['GET', '/api/stores'], ['GET', '/api/coupons'], ['PUT', `/api/orders/${new mongoose.Types.ObjectId()}/status`]]) {
      const res = await send(server, method, path, method === 'PUT' ? { status: 'Delivered' } : null, ownerToken);
      assert.equal(res.status, 403, `${method} ${path} should be forbidden for a store owner`);
    }

    // 5. Analytics: the owner sees only their order lines; the admin sees every store.
    const order = await Order.create({
      products: [
        { product: ownProduct.body._id, name: 'Owner item', price: 500, quantity: 2 },
        { product: mainProduct._id, name: 'Main item', price: 1000, quantity: 1 },
      ],
      productTotal: 2000, shippingFee: 80, totalPrice: 2080, currency: 'PKR', paymentMethod: 'COD', status: 'Delivered', isPaid: true,
      address: { street: '1 Road', city: 'Lahore', country: 'Pakistan', phone: '03001234567' },
      guestContact: { name: 'Buyer', email: `buyer-${suffix}@example.test` },
    });
    created.orders.push(order._id);
    const ownerReport = await send(server, 'GET', '/api/stores/analytics?days=30', null, ownerToken);
    assert.equal(ownerReport.status, 200);
    assert.equal(ownerReport.body.kpis.netSales.value, 1000);
    assert.equal(ownerReport.body.customers.top.length, 0, 'store owners do not see shopper details');
    assert.equal((await send(server, 'GET', '/api/stores/analytics?store=main', null, ownerToken)).body.kpis.netSales.value, 1000, 'the store query is ignored for owners');

    const overview = await send(server, 'GET', '/api/stores/analytics?days=30', null, adminToken);
    assert.equal(overview.status, 200);
    const row = overview.body.stores.find(s => s.id === storeId);
    assert.equal(row.netSales, 1000);
    const storeReport = await send(server, 'GET', `/api/stores/analytics?store=${storeId}`, null, adminToken);
    assert.equal(storeReport.body.kpis.netSales.value, 1000);

    // 6. Switching the store off signs the owner out and hides its products.
    assert.equal((await send(server, 'PATCH', `/api/stores/${storeId}`, { isActive: false }, adminToken)).status, 200);
    assert.equal((await send(server, 'GET', '/api/products/manage', null, ownerToken)).status, 401);
    assert.equal((await send(server, 'POST', '/api/auth/admin/login', { email: username, password })).status, 403);
    assert.equal((await send(server, 'GET', `/api/products/${ownProduct.body._id}`)).status, 404);

    // 7. Password reset gives new working credentials.
    await send(server, 'PATCH', `/api/stores/${storeId}`, { isActive: true }, adminToken);
    const reset = await send(server, 'POST', `/api/stores/${storeId}/reset-password`, null, adminToken);
    assert.equal(reset.status, 200);
    assert.notEqual(reset.body.credentials.password, password);
    assert.equal((await send(server, 'POST', '/api/auth/admin/login', { email: username, password: reset.body.credentials.password })).status, 200);
  } finally {
    if (server) await new Promise(resolve => server.close(resolve));
    await Order.deleteMany({ _id: { $in: created.orders } });
    await Product.deleteMany({ _id: { $in: created.products } });
    await Store.deleteMany({ _id: { $in: created.stores } });
    await User.deleteMany({ _id: { $in: created.users } });
    await mongoose.disconnect();
  }
});
