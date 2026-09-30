const test = require('node:test');
const assert = require('node:assert/strict');
const http = require('node:http');
const mongoose = require('mongoose');

process.env.MONGO_URI = 'mongodb://127.0.0.1:27017/induscart';
process.env.JWT_SECRET = 'integration-test-secret-should-be-long-enough';
process.env.NODE_ENV = 'test';

const { app } = require('../server');
const Product = require('../models/Product');
const Order = require('../models/Order');
const SystemSettings = require('../models/SystemSettings');

const request = (server, path, method = 'GET', payload) => new Promise((resolve, reject) => {
  const address = server.address();
  const body = payload ? JSON.stringify(payload) : '';
  const req = http.request({
    host: '127.0.0.1', port: address.port, path, method,
    headers: body ? { 'Content-Type': 'application/json', 'Content-Length': Buffer.byteLength(body) } : {},
  }, (response) => {
    let body = '';
    response.on('data', chunk => { body += chunk; });
    response.on('end', () => {
      let parsed = {};
      try { parsed = body ? JSON.parse(body) : {}; }
      catch { parsed = body; }
      resolve({ status: response.statusCode, body: parsed });
    });
  });
  req.on('error', reject);
  req.end(body);
});

test('root and live health routes respond with expected service information', async () => {
  const server = await new Promise(resolve => {
    const instance = app.listen(0, () => resolve(instance));
  });

  try {
    const root = await request(server, '/');
    assert.equal(root.status, 200);
    assert.match(String(root.body || ''), /IndusCart API is running/i);

    const live = await request(server, '/health/live');
    assert.equal(live.status, 200);
    assert.equal(live.body.status, 'ok');
    assert.equal(live.body.service, 'induscart-api');
  } finally {
    await new Promise(resolve => server.close(resolve));
  }
});

test('readiness endpoint reports the database status while MongoDB is disconnected', async () => {
  const server = await new Promise(resolve => {
    const instance = app.listen(0, () => resolve(instance));
  });

  try {
    const response = await request(server, '/health/ready');
    assert.equal(response.status, 503);
    assert.equal(response.body.status, 'unavailable');
    assert.equal(response.body.database, 'disconnected');
  } finally {
    await new Promise(resolve => server.close(resolve));
  }
});

test('repeated session checks do not consume the credential-attempt limit', async () => {
  const server = await new Promise(resolve => {
    const instance = app.listen(0, () => resolve(instance));
  });

  try {
    for (let attempt = 0; attempt < 35; attempt += 1) {
      const response = await request(server, '/api/auth/session');
      assert.equal(response.status, 401, `session check ${attempt + 1} should require authentication`);
      assert.notEqual(response.body.message, 'Too many authentication attempts. Please try again later.');
    }
  } finally {
    await new Promise(resolve => server.close(resolve));
  }
});

test('coupon administration requires authentication while coupon validation is public and rate-limited', async () => {
  const server = await new Promise(resolve => {
    const instance = app.listen(0, () => resolve(instance));
  });

  try {
    const adminList = await request(server, '/api/coupons');
    assert.equal(adminList.status, 401);
    const validation = await request(server, '/api/coupons/validate', 'POST', { code: 'WELCOME10', products: [] });
    assert.equal(validation.status, 400);
    assert.equal(validation.body.message, 'Your cart is empty.');
    assert.equal((await request(server, '/api/cart')).status, 401);
    assert.equal((await request(server, '/api/wishlist')).status, 401);
    assert.equal((await request(server, '/api/reviews/admin')).status, 401);
    assert.equal((await request(server, '/api/reviews', 'POST', { productId: '1', rating: 5, comment: 'Great product' })).status, 401);
    assert.equal((await request(server, '/api/settings/')).status, 401);
    assert.equal((await request(server, '/api/settings/', 'PUT', { easypaisaEnabled: true })).status, 401);
    assert.equal((await request(server, '/api/orders/order-1/shipment', 'PUT', { provider:'TCS', trackingNumber:'DEMO-123' })).status, 401);
  } finally {
    await new Promise(resolve => server.close(resolve));
  }
});

test('guest checkout validates contact details without exposing order history', async () => {
  const server = await new Promise(resolve => {
    const instance = app.listen(0, () => resolve(instance));
  });

  try {
    const noContact = await request(server, '/api/orders', 'POST', { products:[] });
    assert.equal(noContact.status, 400);
    assert.match(noContact.body.message, /guest checkout requires/i);

    const validGuestContact = await request(server, '/api/orders', 'POST', {
      guestContact: { name:'Guest Buyer', email:'guest@example.test' },
      products:[],
    });
    assert.equal(validGuestContact.status, 400);
    assert.equal(validGuestContact.body.message, 'No products in order.');

    assert.equal((await request(server, '/api/orders/my')).status, 401);
  } finally {
    await new Promise(resolve => server.close(resolve));
  }
});

test('guest COD checkout persists contact details and keeps order retrieval private', async (t) => {
  try {
    await mongoose.connect(process.env.MONGO_URI, { serverSelectionTimeoutMS:1500 });
  } catch {
    await mongoose.disconnect();
    t.skip('MongoDB is not available for guest-order integration tests.');
    return;
  }

  const suffix = `${Date.now()}-${Math.random().toString(16).slice(2)}`;
  const previousSettings = await SystemSettings.findOne({ key:'global' }).select('codEnabled codFeeMode codFee codThreshold').lean();
  let product;
  let orderId;
  let server;
  try {
    await SystemSettings.findOneAndUpdate({ key:'global' }, {
      $set:{ codEnabled:true, codFeeMode:'flat', codFee:0, codThreshold:0 },
    }, { upsert:true, new:true, setDefaultsOnInsert:true });
    product = await Product.create({
      name:`Guest checkout product ${suffix}`, category:'Test', pricePKR:1500, priceUSD:5,
      stock:3, isVisible:true, isLocal:false, weightKg:0,
    });
    server = await new Promise(resolve => {
      const instance = app.listen(0, () => resolve(instance));
    });

    const created = await request(server, '/api/orders', 'POST', {
      guestContact:{ name:'Integration Guest', email:`guest-${suffix}@example.test`, phone:'555-0100' },
      products:[{ product:product._id, quantity:1 }],
      address:{ street:'12 Test Street', city:'Multan', country:'Pakistan' },
      paymentMethod:'COD',
    });

    assert.equal(created.status, 201);
    orderId = created.body._id;
    assert.equal(created.body.user, null);
    assert.equal(created.body.guestContact.email, `guest-${suffix}@example.test`);
    const savedOrder = await Order.findById(orderId).lean();
    assert.equal(savedOrder.user, null);
    assert.equal(savedOrder.guestContact.name, 'Integration Guest');
    assert.equal((await Product.findById(product._id)).stock, 2);
    assert.equal((await request(server, `/api/orders/${orderId}`)).status, 401);
    assert.equal((await request(server, '/api/orders/my')).status, 401);
  } finally {
    if (server) await new Promise(resolve => server.close(resolve));
    if (orderId) await Order.deleteOne({ _id:orderId });
    if (product) await Product.deleteOne({ _id:product._id });
    if (previousSettings) await SystemSettings.updateOne({ _id:previousSettings._id }, { $set:{
      codEnabled:previousSettings.codEnabled, codFeeMode:previousSettings.codFeeMode,
      codFee:previousSettings.codFee, codThreshold:previousSettings.codThreshold,
    } });
    else await SystemSettings.deleteOne({ key:'global' });
    await mongoose.disconnect();
  }
});

test('disabled international shopping blocks the global catalog and foreign checkout', async (t) => {
  try {
    await mongoose.connect(process.env.MONGO_URI, { serverSelectionTimeoutMS:1500 });
  } catch {
    await mongoose.disconnect();
    t.skip('MongoDB is not available for international-market integration tests.');
    return;
  }

  const previousSettings = await SystemSettings.findOne({ key:'global' }).select('internationalEnabled').lean();
  let server;
  try {
    await SystemSettings.findOneAndUpdate({ key:'global' }, {
      $set:{ internationalEnabled:false },
    }, { upsert:true, new:true, setDefaultsOnInsert:true });
    server = await new Promise(resolve => {
      const instance = app.listen(0, () => resolve(instance));
    });

    const catalog = await request(server, '/api/products?isLocal=false');
    assert.equal(catalog.status, 403);
    assert.match(catalog.body.message, /international shopping.*unavailable/i);

    const checkout = await request(server, '/api/orders', 'POST', {
      guestContact:{ name:'International Guest', email:'international@example.test' },
      products:[{ product:'000000000000000000000000', quantity:1 }],
      address:{ street:'1 Test Street', city:'London', country:'United Kingdom' },
      paymentMethod:'COD',
    });
    assert.equal(checkout.status, 400);
    assert.match(checkout.body.message, /international orders.*unavailable/i);
  } finally {
    if (server) await new Promise(resolve => server.close(resolve));
    if (previousSettings) {
      const restore = previousSettings.internationalEnabled === undefined
        ? { $unset:{ internationalEnabled:1 } }
        : { $set:{ internationalEnabled:previousSettings.internationalEnabled } };
      await SystemSettings.updateOne({ _id:previousSettings._id }, restore);
    } else {
      await SystemSettings.deleteOne({ key:'global' });
    }
    await mongoose.disconnect();
  }
});
