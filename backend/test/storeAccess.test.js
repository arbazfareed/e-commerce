const test = require('node:test');
const assert = require('node:assert/strict');
const Store = require('../models/Store');
const Product = require('../models/Product');
const { staff, admin } = require('../middleware/authMiddleware');
const { updateProduct, deleteProduct, createProduct } = require('../controllers/productController');

const run = (handler, req) => new Promise(resolve => {
  const res = { status(code) { this.code = code; return this; }, json(body) { resolve({ code: this.code || 200, body, req }); return this; }, set() { return this; } };
  Promise.resolve(handler(req, res, () => resolve({ code: 'next', req }))).catch(error => resolve({ code: 'threw', error }));
});

test('staff middleware: main admin sees all, active store owner is scoped, others are refused', async () => {
  Store.findById = id => ({ select: () => ({ lean: async () => (id === 'off' ? { _id: 'off', isActive: false } : { _id: id, name: 'Store A', isActive: true }) }) });
  assert.equal((await run(staff, { user: { isAdmin: true } })).req.storeScope, null);
  const owner = await run(staff, { user: { isSubAdmin: true, store: 'storeA' } });
  assert.equal(owner.code, 'next');
  assert.equal(owner.req.storeScope, 'storeA');
  assert.equal((await run(staff, { user: { isSubAdmin: true, store: 'off' } })).code, 403);
  assert.equal((await run(staff, { user: { isSubAdmin: false } })).code, 403);
  assert.equal((await run(admin, { user: { isSubAdmin: true, store: 'storeA' } })).code, 403, 'store owners never pass the admin check');
});

test("a store owner cannot edit or delete another store's product", async () => {
  Product.findById = () => {
    const doc = { _id: 'p1', store: 'storeB', images: [] };
    const query = Promise.resolve(doc);
    query.select = async () => doc;
    return query;
  };
  let deleted = false;
  Product.findByIdAndDelete = async () => { deleted = true; return {}; };
  const scope = { params: { id: 'p1' }, body: { name: 'x' }, storeScope: 'storeA' };
  assert.equal((await run(updateProduct, scope)).code, 404);
  assert.equal((await run(deleteProduct, scope)).code, 404);
  assert.equal(deleted, false);
});

test('a store owner always creates products in their own store', async () => {
  let saved;
  Product.create = async doc => { saved = doc; return doc; };
  const res = await run(createProduct, { storeScope: 'storeA', files: [], body: { name: 'Soap', category: 'Bath', pricePKR: '500', priceUSD: '2', store: 'storeB' } });
  assert.equal(res.code, 201);
  assert.equal(saved.store, 'storeA');
});
