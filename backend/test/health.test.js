const test = require('node:test');
const assert = require('node:assert/strict');
const http = require('node:http');

process.env.MONGO_URI = 'mongodb://127.0.0.1:27017/induscart';
process.env.JWT_SECRET = 'health-test-secret';
process.env.NODE_ENV = 'test';

const { app } = require('../server');

const request = (server, path) => new Promise((resolve, reject) => {
  const address = server.address();
  const req = http.get({ host: '127.0.0.1', port: address.port, path }, response => {
    let body = '';
    response.on('data', chunk => { body += chunk; });
    response.on('end', () => {
      req.destroy();
      resolve({ status: response.statusCode, body: JSON.parse(body) });
    });
  });
  req.on('error', reject);
});

test('live health endpoint reports the API process', async () => {
  const server = await new Promise(resolve => {
    const instance = app.listen(0, () => resolve(instance));
  });

  try {
    const response = await request(server, '/health/live');
    assert.equal(response.status, 200);
    assert.equal(response.body.status, 'ok');
  } finally {
    await new Promise(resolve => server.close(resolve));
  }
});

test('readiness endpoint is unavailable before MongoDB connects', async () => {
  const server = await new Promise(resolve => {
    const instance = app.listen(0, () => resolve(instance));
  });

  try {
    const response = await request(server, '/health/ready');
    assert.equal(response.status, 503);
    assert.equal(response.body.database, 'disconnected');
  } finally {
    await new Promise(resolve => server.close(resolve));
  }
});
