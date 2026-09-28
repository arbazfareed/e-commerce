const test = require('node:test');
const assert = require('node:assert/strict');
const path = require('node:path');
const { filterRetainedImages, resolveUploadedImagePath } = require('../utils/productImageSafety');

test('retained images must belong to the product and are deduplicated', () => {
  assert.deepEqual(
    filterRetainedImages(['one.jpg', '../secret.txt', 'one.jpg', 'unknown.jpg'], ['one.jpg', 'two.jpg']),
    ['one.jpg']
  );
});

test('image deletion paths discard traversal components', () => {
  const uploads = path.resolve('test-uploads');
  assert.equal(resolveUploadedImagePath(uploads, '../../outside.txt'), path.join(uploads, 'outside.txt'));
});
