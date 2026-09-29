const test = require('node:test');
const assert = require('node:assert/strict');
const http = require('node:http');

process.env.MONGO_URI = 'mongodb://127.0.0.1:27017/induscart';
process.env.JWT_SECRET = 'integration-test-secret-should-be-long-enough';
process.env.NODE_ENV = 'test';

const { app } = require('../server');

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

test('coupon administration and customer coupon validation require authentication', async () => {
  const server = await new Promise(resolve => {
    const instance = app.listen(0, () => resolve(instance));
  });

  try {
    const adminList = await request(server, '/api/coupons');
    assert.equal(adminList.status, 401);
    const validation = await request(server, '/api/coupons/validate', 'POST', { code: 'WELCOME10', products: [] });
    assert.equal(validation.status, 401);
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
