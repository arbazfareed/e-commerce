const test = require('node:test');
const assert = require('node:assert/strict');
const { validateStoreProfile } = require('../utils/storeProfile');
const { checkoutSettings } = require('../controllers/settingsController');

test('store policies have honest defaults for existing stores', () => {
  const s = checkoutSettings({});
  assert.equal(s.returnWindowDays, 7);
  assert.equal(s.returnShippingPaidBy, 'customer');
  assert.equal(s.deliveryTimeLocal, '3–5 working days');
  assert.equal(s.socialInstagram, '');
  assert.equal(checkoutSettings({ returnWindowDays: 0 }).returnWindowDays, 0);
});

test('policy fields are validated', () => {
  assert.deepEqual(validateStoreProfile({ returnWindowDays: 14, returnShippingPaidBy: 'store', deliveryTimeLocal: ' 2–4 days ' }).update,
    { returnWindowDays: 14, returnShippingPaidBy: 'store', deliveryTimeLocal: '2–4 days' });
  assert.ok(validateStoreProfile({ returnWindowDays: 91 }).error);
  assert.ok(validateStoreProfile({ returnWindowDays: 2.5 }).error);
  assert.ok(validateStoreProfile({ returnShippingPaidBy: 'nobody' }).error);
  assert.ok(validateStoreProfile({ nonReturnableNote: 'x'.repeat(301) }).error);
});

test('social links must be https links to the right site', () => {
  assert.equal(validateStoreProfile({ socialInstagram: 'https://www.instagram.com/induscart' }).update.socialInstagram, 'https://www.instagram.com/induscart');
  assert.equal(validateStoreProfile({ socialFacebook: 'https://m.facebook.com/induscart' }).error, undefined);
  assert.equal(validateStoreProfile({ socialTikTok: '' }).update.socialTikTok, '');
  assert.ok(validateStoreProfile({ socialInstagram: 'http://instagram.com/x' }).error);
  assert.ok(validateStoreProfile({ socialInstagram: 'https://evil.com/instagram.com' }).error);
  assert.ok(validateStoreProfile({ socialInstagram: 'https://instagram.com.evil.com/x' }).error);
  assert.ok(validateStoreProfile({ socialTikTok: 'javascript:alert(1)' }).error);
});
