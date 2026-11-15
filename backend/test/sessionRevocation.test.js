const test = require('node:test');
const assert = require('node:assert/strict');
const jwt = require('jsonwebtoken');
const User = require('../models/User');
const { protect, optionalProtect } = require('../middleware/authMiddleware');

process.env.JWT_SECRET = process.env.JWT_SECRET || 'session-revocation-test-secret-session-1';

const fakeUser = { _id: 'u1', tokenVersion: 2 };
User.findById = () => ({ select: async () => fakeUser });

const run = (middleware, token) => new Promise(resolve => {
  const req = { headers: { authorization: `Bearer ${token}` } };
  const res = { status(code) { this.code = code; return this; }, json(body) { resolve({ code: this.code, body, req }); } };
  middleware(req, res, () => resolve({ code: 'next', req }));
});

test('tokens issued before a password change are rejected', async () => {
  const oldToken = jwt.sign({ id: 'u1', v: 1 }, process.env.JWT_SECRET);
  const legacyToken = jwt.sign({ id: 'u1' }, process.env.JWT_SECRET);
  const currentToken = jwt.sign({ id: 'u1', v: 2 }, process.env.JWT_SECRET);
  assert.equal((await run(protect, oldToken)).code, 401);
  assert.equal((await run(protect, legacyToken)).code, 401);
  assert.equal((await run(protect, currentToken)).code, 'next');
  const optional = await run(optionalProtect, oldToken);
  assert.equal(optional.code, 'next');
  assert.equal(optional.req.user, undefined);
});
