const test = require('node:test');
const assert = require('node:assert/strict');
const Product = require('../models/Product');

test('product names, descriptions, and categories enforce maximum lengths', () => {
  const product = new Product({
    name: 'n'.repeat(201),
    description: 'd'.repeat(5001),
    category: 'c'.repeat(101),
    pricePKR: 1,
    priceUSD: 1,
  });
  const validation = product.validateSync();

  assert.equal(validation.errors.name.kind, 'maxlength');
  assert.equal(validation.errors.description.kind, 'maxlength');
  assert.equal(validation.errors.category.kind, 'maxlength');
});
