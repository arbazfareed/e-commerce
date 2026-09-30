const test = require('node:test');
const assert = require('node:assert/strict');
const { encryptSecret, decryptSecret, isEncryptedSecret } = require('../config/credentialVault');

test('provider secrets are encrypted at rest and can be decrypted by the server', () => {
  const previousKey = process.env.SETTINGS_ENCRYPTION_KEY;
  process.env.SETTINGS_ENCRYPTION_KEY = 'test-only-settings-encryption-key-at-least-32-characters';
  try {
    const secret = 'sandbox-token-do-not-return';
    const encrypted = encryptSecret(secret);
    assert.equal(isEncryptedSecret(encrypted), true);
    assert.equal(encrypted.includes(secret), false);
    assert.equal(decryptSecret(encrypted), secret);
  } finally {
    if (previousKey === undefined) delete process.env.SETTINGS_ENCRYPTION_KEY;
    else process.env.SETTINGS_ENCRYPTION_KEY = previousKey;
  }
});

test('provider secret writes require a configured master key', () => {
  const previousKey = process.env.SETTINGS_ENCRYPTION_KEY;
  delete process.env.SETTINGS_ENCRYPTION_KEY;
  try {
    assert.throws(() => encryptSecret('sandbox-token'), /SETTINGS_ENCRYPTION_KEY/);
  } finally {
    if (previousKey !== undefined) process.env.SETTINGS_ENCRYPTION_KEY = previousKey;
  }
});