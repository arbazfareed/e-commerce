const test = require('node:test');
const assert = require('node:assert/strict');
const { readTicket } = require('../controllers/supportController');

test('support tickets are validated and trimmed', () => {
  assert.ok(readTicket({}).error);
  assert.ok(readTicket({ name: ['x'], email: 'a@b.pk', message: 'hello there' }).error, 'non-text name');
  assert.ok(readTicket({ name: 'Ali', email: 'not-an-email', message: 'hello there' }).error);
  assert.deepEqual(readTicket({ name: ' Ali ', email: 'ALI@B.PK', message: ' Where is my order? ', orderId: 'ABC123' }).value, {
    name: 'Ali', email: 'ali@b.pk', message: 'Where is my order?', subject: 'General', orderId: 'ABC123',
  });
});

test('admin replies are emailed to the customer with HTML escaped', async () => {
  const emailService = require('../services/emailService');
  const { sendReplyEmail } = require('../controllers/supportController');
  const sent = [];
  emailService.isConfigured = () => true;
  emailService.getFrontendUrl = () => 'https://shop.test';
  emailService.sendEmail = async message => { sent.push(message); };
  assert.equal(await sendReplyEmail({ email: 'ali@b.pk', name: 'Ali', subject: 'Delivery', message: 'Where?', adminReply: 'It ships <today>', user: 'u1' }), true);
  assert.equal(sent[0].to, 'ali@b.pk');
  assert.match(sent[0].subject, /Re: Delivery/);
  assert.match(sent[0].html, /&lt;today&gt;/);
  assert.match(sent[0].text, /shop\.test\/support/);
});
