const test = require('node:test');
const assert = require('node:assert/strict');
const { hasValidImageSignature } = require('../utils/imageSignatures');

test('accepts supported JPEG, PNG, and WEBP file signatures', () => {
  assert.equal(hasValidImageSignature(Buffer.from([0xff, 0xd8, 0xff, 0x00]), 'image/jpeg'), true);
  assert.equal(hasValidImageSignature(Buffer.from('89504e470d0a1a0a', 'hex'), 'image/png'), true);
  assert.equal(hasValidImageSignature(Buffer.from('RIFF0000WEBP', 'ascii'), 'image/webp'), true);
});

test('rejects mismatched and unsupported image content', () => {
  assert.equal(hasValidImageSignature(Buffer.from('not an image'), 'image/jpeg'), false);
  assert.equal(hasValidImageSignature(Buffer.from('89504e470d0a1a0a', 'hex'), 'image/jpeg'), false);
  assert.equal(hasValidImageSignature(Buffer.from('GIF89a', 'ascii'), 'image/gif'), false);
});
