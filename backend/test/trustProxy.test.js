const test = require('node:test');
const assert = require('node:assert/strict');

test('the API trusts one proxy hop on Vercel so rate limits are per shopper', () => {
  process.env.VERCEL = '1';
  process.env.MONGO_URI = process.env.MONGO_URI || 'mongodb://127.0.0.1:1/x';
  process.env.JWT_SECRET = process.env.JWT_SECRET || 'trust-proxy-test-secret-trust-proxy-test';
  delete process.env.TRUST_PROXY;
  const { app } = require('../server');
  assert.equal(app.get('trust proxy'), 1);
});
