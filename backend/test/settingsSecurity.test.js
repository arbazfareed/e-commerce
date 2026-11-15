const test = require('node:test');
const assert = require('node:assert/strict');
const { publicSettings, checkoutSettings } = require('../controllers/settingsController');

test('admin settings response exposes provider readiness but never stored secrets', () => {
  const response = publicSettings({
    codEnabled: true,
    codFeeMode: 'flat',
    codFee: 0,
    codThreshold: 0,
    courierProvider: 'PostEx',
    courierEnabled: true,
    courierMode: 'sandbox',
    courierApiKey: 'enc:v1:encrypted-courier-token',
    easypaisaEnabled: true,
    easypaisaMode: 'sandbox',
    easypaisaMerchantId: 'DEMO-MERCHANT-ID',
    easypaisaApiKey: 'enc:v1:encrypted-easypaisa-token',
  });

  assert.equal(response.courierApiKeyConfigured, true);
  assert.equal(response.easypaisaApiKeyConfigured, true);
  assert.equal(response.courierApiKey, undefined);
  assert.equal(response.easypaisaApiKey, undefined);
  assert.equal(JSON.stringify(response).includes('encrypted-courier-token'), false);
  assert.equal(JSON.stringify(response).includes('encrypted-easypaisa-token'), false);
});

test('provider configuration never enables online checkout without a payment adapter', () => {
  const settings = checkoutSettings({ codEnabled: true, codFeeMode: 'flat', codFee: 0, codThreshold: 0, easypaisaEnabled: true });
  assert.deepEqual(settings.supportedPaymentMethods, ['COD']);
});

test('international shopping defaults on for existing stores and follows the saved setting', () => {
  assert.equal(publicSettings({}).internationalEnabled, true);
  assert.equal(checkoutSettings({}).internationalEnabled, true);
  assert.equal(publicSettings({ internationalEnabled: false }).internationalEnabled, false);
  assert.equal(checkoutSettings({ internationalEnabled: false }).internationalEnabled, false);
});
test('checkout settings share the stored USD rate and zone rates with the storefront', () => {
  const settings = checkoutSettings({ codEnabled: true, usdRate: 290, zoneRates: { europe: { baseRate: 2000, perKg: 400, minFee: 2000 } } });
  assert.equal(settings.usdRate, 290);
  assert.equal(settings.zoneRates.europe.baseRate, 2000);
  assert.equal(settings.zoneRates.domestic_pak.baseRate, 80);
  assert.equal(checkoutSettings({}).usdRate, 278);
});
