const test = require('node:test');
const assert = require('node:assert/strict');
const { isValidPhone } = require('../utils/phone');

test('Pakistan orders need a mobile number the courier can call', () => {
  for (const phone of ['03001234567', '0300-1234567', '+92 300 1234567', '923001234567'])
    assert.equal(isValidPhone(phone, 'Pakistan'), true, phone);
  for (const phone of ['', '555-0100', '0421234567', '0300123'])
    assert.equal(isValidPhone(phone, 'Pakistan'), false, phone);
});

test('international orders accept 7 to 15 digits with an optional plus', () => {
  assert.equal(isValidPhone('+971 50 123 4567', 'United Arab Emirates'), true);
  assert.equal(isValidPhone('12345', 'United Kingdom'), false);
});
