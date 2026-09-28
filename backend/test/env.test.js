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

test('User model requires passwords to be at least eight characters', () => {
  const User = require('../models/User');
  const shortPassword = new User({ name: 'Test User', email: 'test@example.com', password: '1234567' });
  const validPassword = new User({ name: 'Test User', email: 'test@example.com', password: '12345678' });

  assert.equal(shortPassword.validateSync().errors.password.kind, 'minlength');
  assert.equal(validPassword.validateSync(), undefined);
});
