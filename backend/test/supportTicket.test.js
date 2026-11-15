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
