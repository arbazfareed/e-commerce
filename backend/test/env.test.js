const test = require('node:test');
const assert = require('node:assert/strict');

const { assertEnvironment } = require('../config/env');

test('accepts a configured development environment', () => {
  const previous = { ...process.env };
  process.env.MONGO_URI = 'mongodb://127.0.0.1:27017/induscart';
  process.env.JWT_SECRET = 'development-secret';
  process.env.NODE_ENV = 'development';

  assert.doesNotThrow(() => assertEnvironment());

  process.env = previous;
});

test('rejects a short staging JWT secret', () => {
  const previous = { ...process.env };
  process.env.MONGO_URI = 'mongodb://127.0.0.1:27017/induscart';
  process.env.JWT_SECRET = 'short';
  process.env.NODE_ENV = 'staging';

  assert.throws(() => assertEnvironment(), /at least 32 characters/);

  process.env = previous;
});
