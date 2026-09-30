const test = require('node:test');
const assert = require('node:assert/strict');
const http = require('node:http');

process.env.MONGO_URI = 'mongodb://127.0.0.1:27017/induscart';
process.env.JWT_SECRET = 'metrics-test-secret';
process.env.NODE_ENV = 'test';

const { app } = require('../server');
const { ordersCounter } = require('../middleware/metrics');

const request = (server, path) => new Promise((resolve, reject) => {
  const address = server.address();
  const req = http.get({ host: '127.0.0.1', port: address.port, path }, response => {
    let body = '';
    response.setEncoding('utf8');
    response.on('data', chunk => { body += chunk; });
    response.on('end', () => resolve({
      status: response.statusCode,
      contentType: response.headers['content-type'],
      body,
    }));
  });
  req.on('error', reject);
});

test('Prometheus endpoint exposes bounded HTTP metrics and order counters', async () => {
  const server = await new Promise(resolve => {
    const instance = app.listen(0, () => resolve(instance));
  });

  try {
    await request(server, '/health/live');
    ordersCounter.labels('COD').inc();

    const response = await request(server, '/metrics');
    assert.equal(response.status, 200);
    assert.match(response.contentType, /text\/plain/);
    assert.match(response.body, /induscart_http_request_duration_seconds_count\{method="GET",route="\/health\/live",status_code="200"\} 1/);
    assert.match(response.body, /induscart_orders_total\{payment_method="COD"\} 1/);
    assert.match(response.body, /induscart_process_cpu_user_seconds_total/);
  } finally {
    await new Promise(resolve => server.close(resolve));
  }
});