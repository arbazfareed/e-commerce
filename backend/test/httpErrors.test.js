const test = require('node:test');
const assert = require('node:assert/strict');
const { sendServerError } = require('../utils/httpErrors');

test('server errors are logged but not sent to the shopper', () => {
  const originalError = console.error;
  const logged = [];
  console.error = (...args) => logged.push(args.join(' '));
  try {
    const res = { req: { method: 'GET', originalUrl: '/api/x' }, status(code) { this.code = code; return this; }, json(body) { this.body = body; return this; } };
    sendServerError(res, new Error('MongoServerError: connection to cluster0.abc.mongodb.net refused'));
    assert.equal(res.code, 500);
    assert.equal(res.body.message.includes('mongodb'), false);
    assert.ok(logged.some(line => line.includes('cluster0')));
  } finally {
    console.error = originalError;
  }
});

test('metrics are hidden on Vercel unless a METRICS_TOKEN is sent', async () => {
  process.env.VERCEL = '1';
  process.env.MONGO_URI = process.env.MONGO_URI || 'mongodb://127.0.0.1:1/x';
  process.env.JWT_SECRET = process.env.JWT_SECRET || 'metrics-hidden-test-secret-metrics-hidden';
  const { app } = require('../server');
  const server = await new Promise(resolve => { const s = app.listen(0, () => resolve(s)); });
  try {
    const url = `http://127.0.0.1:${server.address().port}/metrics`;
    assert.equal((await fetch(url)).status, 404);
    process.env.METRICS_TOKEN = 'secret-metrics-token';
    assert.equal((await fetch(url)).status, 404);
    assert.equal((await fetch(url, { headers: { Authorization: 'Bearer secret-metrics-token' } })).status, 200);
  } finally {
    delete process.env.METRICS_TOKEN;
    await new Promise(resolve => server.close(resolve));
  }
});
