const test = require('node:test');
const assert = require('node:assert/strict');
const emailService = require('../services/emailService');
const { sendOrderConfirmationEmail, sendOrderStatusEmail, sendNewOrderAlert, money } = require('../services/orderEmails');

const sent = [];
emailService.isConfigured = () => true;
emailService.getFrontendUrl = () => 'https://shop.test';
emailService.sendEmail = async message => { sent.push(message); };
emailService.notifyStore = async message => { sent.push({ ...message, to: 'store' }); return true; };

const order = {
  _id: '0123456789abcdef01234567', currency: 'PKR', totalPrice: 1580, shippingFee: 80, codFee: 0,
  products: [{ name: 'Soap <b>', price: 750, quantity: 2 }], paymentMethod: 'COD',
  address: { street: '12 Road', city: 'Lahore', country: 'Pakistan' },
  guestContact: { name: 'Ali', email: 'ali@example.test' }, status: 'Pending',
};

test('order confirmation goes to the guest with totals and the tracking link', async () => {
  sent.length = 0;
  assert.equal(await sendOrderConfirmationEmail(order, { trackUrl: 'https://shop.test/track/x?token=y' }), true);
  assert.equal(sent[0].to, 'ali@example.test');
  assert.match(sent[0].subject, /#01234567 is confirmed/i);
  assert.match(sent[0].html, /Rs 1,580/);
  assert.match(sent[0].html, /track\/x\?token=y/);
  assert.equal(sent[0].html.includes('<b>'), false, 'product names are escaped');
});

test('status emails are sent for shipped orders and include tracking details', async () => {
  sent.length = 0;
  await sendOrderStatusEmail({ ...order, status: 'Shipped', shippingProvider: 'TCS', trackingNumber: 'TCS123' });
  assert.match(sent[0].text, /TCS123/);
  sent.length = 0;
  assert.equal(await sendOrderStatusEmail({ ...order, status: 'Pending' }), false);
  assert.equal(sent.length, 0);
});

test('money formats PKR and USD', () => {
  assert.equal(money(23.6, 'USD'), '$23.60');
  assert.equal(money(1500, 'PKR'), 'Rs 1,500');
});

test('the store inbox gets a copy of every new order with phone and address', async () => {
  sent.length = 0;
  await sendNewOrderAlert({ ...order, address: { ...order.address, phone: '03001234567' } });
  assert.equal(sent[0].to, 'store');
  assert.equal(sent[0].replyTo, 'ali@example.test');
  assert.match(sent[0].subject, /New order #01234567/);
  assert.match(sent[0].text, /03001234567/);
});

test('low stock alert lists each product and how many are left', async () => {
  const { sendLowStockAlert } = require('../services/orderEmails');
  sent.length = 0;
  await sendLowStockAlert([{ name: 'Rose soap', stock: 2 }]);
  assert.equal(sent[0].to, 'store');
  assert.match(sent[0].text, /Rose soap: 2 left/);
});

test('delivered email asks for a review of each product', async () => {
  sent.length = 0;
  await sendOrderStatusEmail({ ...order, status: 'Delivered', products: [{ product: 'p1', name: 'Rose soap', price: 500, quantity: 1 }] });
  assert.match(sent[0].html, /Review Rose soap/);
  assert.match(sent[0].text, /shop\.test\/products\/p1/);
});
