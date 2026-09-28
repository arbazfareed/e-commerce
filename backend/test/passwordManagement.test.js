const test = require('node:test');
const assert = require('node:assert/strict');
const http = require('node:http');
const mongoose = require('mongoose');
const jwt = require('jsonwebtoken');
const User = require('../models/User');
const emailService = require('../services/emailService');

const sentResetEmails = [];
emailService.sendCustomerPasswordResetEmail = async (message) => {
  sentResetEmails.push(message);
};

process.env.NODE_ENV = process.env.NODE_ENV || 'test';
process.env.MONGO_URI = process.env.MONGO_URI || 'mongodb://127.0.0.1:27017/induscart';
process.env.JWT_SECRET = process.env.JWT_SECRET || 'password-management-test-secret';

const { app } = require('../server');

const send = (server, method, path, body, token) => new Promise((resolve, reject) => {
  const payload = JSON.stringify(body || {});
  const headers = { 'Content-Type': 'application/json', 'Content-Length': Buffer.byteLength(payload) };
  if (token) headers.Authorization = `Bearer ${token}`;
  const request = http.request({ host:'127.0.0.1', port:server.address().port, path, method, headers }, (response) => {
    let text = '';
    response.on('data', chunk => { text += chunk; });
    response.on('end', () => {
      let responseBody = {};
      try { responseBody = text ? JSON.parse(text) : {}; } catch { responseBody = text; }
      resolve({ status:response.statusCode, body:responseBody });
    });
  });
  request.on('error', reject);
  request.end(payload);
});

test('admin emails a hashed, expiring, single-use customer reset link', async (t) => {
  try {
    await mongoose.connect(process.env.MONGO_URI, { serverSelectionTimeoutMS:1500 });
  } catch {
    await mongoose.disconnect();
    t.skip('MongoDB is not available for password-management integration tests.');
    return;
  }

  const suffix = `${Date.now()}-${Math.random().toString(16).slice(2)}`;
  const adminEmail = `password-test-admin-${suffix}@example.test`;
  const customerEmail = `password-test-customer-${suffix}@example.test`;
  const updatedAdminPassword = 'Updated admin passphrase 456!';
  const updatedCustomerPassword = 'Updated customer passphrase 456!';
  let admin;
  let customer;
  let server;

  try {
    sentResetEmails.length = 0;
    admin = await User.create({ name:'Password Test Admin', email:adminEmail, password:'Initial admin passphrase 123!', isAdmin:true });
    customer = await User.create({ name:'Password Test Customer', email:customerEmail, password:'Initial customer passphrase 123!' });
    const token = jwt.sign({ id:admin._id }, process.env.JWT_SECRET, { expiresIn:'5m' });
    server = await new Promise(resolve => {
      const instance = app.listen(0, () => resolve(instance));
    });

    const unauthenticatedChange = await send(server, 'PATCH', '/api/auth/password', { newPassword:updatedAdminPassword });
    assert.equal(unauthenticatedChange.status, 401);
    const unauthenticatedEmail = await send(server, 'PUT', '/api/auth/admin/customer-password', { email:customerEmail });
    assert.equal(unauthenticatedEmail.status, 401);

    const ownPasswordChange = await send(server, 'PATCH', '/api/auth/password', { newPassword:updatedAdminPassword }, token);
    assert.equal(ownPasswordChange.status, 200);
    admin = await User.findById(admin._id);
    assert.equal(await admin.matchPassword(updatedAdminPassword), true);

    const customerReset = await send(server, 'PUT', '/api/auth/admin/customer-password', { email:customerEmail }, token);
    assert.equal(customerReset.status, 200);
    assert.equal(sentResetEmails.length, 1);
    assert.equal(sentResetEmails[0].to, customerEmail);
    const resetUrl = new URL(sentResetEmails[0].resetUrl);
    const resetToken = resetUrl.pathname.split('/').pop();
    assert.ok(resetToken.length >= 32);
    customer = await User.findById(customer._id).select('+passwordResetTokenHash +passwordResetExpiresAt');
    assert.notEqual(customer.passwordResetTokenHash, resetToken);
    assert.ok(customer.passwordResetExpiresAt > new Date());

    const resetResponse = await send(server, 'POST', '/api/auth/password/reset', { token:resetToken, newPassword:updatedCustomerPassword });
    assert.equal(resetResponse.status, 200);
    customer = await User.findById(customer._id);
    assert.equal(await customer.matchPassword(updatedCustomerPassword), true);

    const replayedReset = await send(server, 'POST', '/api/auth/password/reset', { token:resetToken, newPassword:'Another customer passphrase 123!' });
    assert.equal(replayedReset.status, 400);

    const otherAdminReset = await send(server, 'PUT', '/api/auth/admin/customer-password', { email:adminEmail }, token);
    assert.equal(otherAdminReset.status, 403);
    assert.equal(sentResetEmails.length, 1);
  } finally {
    if (server) await new Promise(resolve => server.close(resolve));
    if (admin) await User.deleteOne({ _id:admin._id });
    if (customer) await User.deleteOne({ _id:customer._id });
    await mongoose.disconnect();
  }
});
