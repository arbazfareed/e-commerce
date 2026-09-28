const test = require('node:test');
const assert = require('node:assert/strict');
const http = require('node:http');

process.env.MONGO_URI = 'mongodb://127.0.0.1:27017/induscart';
process.env.JWT_SECRET = 'integration-test-secret-should-be-long-enough';
process.env.NODE_ENV = 'test';

const { app } = require('../server');

const request = (server, path) => new Promise((resolve, reject) => {
  const address = server.address();
  const req = http.get({ host: '127.0.0.1', port: address.port, path }, (response) => {
    let body = '';
    response.on('data', chunk => { body += chunk; });
    response.on('end', () => {
      let parsed = {};
      try { parsed = body ? JSON.parse(body) : {}; }
      catch { parsed = body; }
      req.destroy();
      resolve({ status: response.statusCode, body: parsed });
    });
  });
  req.on('error', reject);
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
