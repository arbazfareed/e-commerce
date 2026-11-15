const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const { requireValidId } = require('../middleware/validateObjectId');

const run = (middleware, params) => {
  const res = { status(code) { this.code = code; return this; }, json(body) { this.body = body; return this; } };
  let passed = false;
  middleware({ params }, res, () => { passed = true; });
  return { res, passed };
};

test('malformed IDs get 404 instead of a server error', () => {
  const bad = run(requireValidId('Product'), { id: 'not-an-id' });
  assert.equal(bad.res.code, 404);
  assert.equal(bad.res.body.message, 'Product not found.');
  assert.equal(run(requireValidId('Product'), { id: '0123456789abcdef01234567' }).passed, true);
  assert.equal(run(requireValidId('Review', 'reviewId'), { reviewId: 'x' }).res.code, 404);
});

test('ID checks run after sign-in checks so signed-out callers get 401 first', () => {
  for (const file of fs.readdirSync(path.join(__dirname, '..', 'routes'))) {
    const source = fs.readFileSync(path.join(__dirname, '..', 'routes', file), 'utf8');
    for (const line of source.split('\n').filter(l => l.includes('requireValidId(') && l.includes('protect'))) {
      assert.ok(line.indexOf('protect') < line.indexOf('requireValidId('), `${file}: ${line}`);
    }
  }
});
