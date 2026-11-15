const test = require('node:test');
const assert = require('node:assert/strict');
const { validateObjectIdParam } = require('../middleware/validateObjectId');

test('malformed IDs get 404 instead of a server error', () => {
  const handler = validateObjectIdParam('Product');
  const res = { status(code) { this.code = code; return this; }, json(body) { this.body = body; return this; } };
  let passed = false;
  handler({}, res, () => { passed = true; }, 'not-an-id');
  assert.equal(res.code, 404);
  assert.equal(res.body.message, 'Product not found.');
  handler({}, res, () => { passed = true; }, '0123456789abcdef01234567');
  assert.equal(passed, true);
});
