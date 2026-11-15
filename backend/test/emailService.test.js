const test = require('node:test');
const assert = require('node:assert/strict');

const withEnv = (vars, fn) => {
  const keys = ['SMTP_HOST', 'SMTP_USER', 'SMTP_PASS', 'RESEND_API_KEY', 'EMAIL_FROM', 'FRONTEND_URL', 'STORE_EMAIL', 'ADMIN_NOTIFY_EMAIL', 'VERCEL'];
  const saved = Object.fromEntries(keys.map(key => [key, process.env[key]]));
  for (const key of keys) delete process.env[key];
  Object.assign(process.env, vars);
  try { return fn(require('../services/emailService')); }
  finally { for (const key of keys) { if (saved[key] === undefined) delete process.env[key]; else process.env[key] = saved[key]; } }
};

test('email status reports which provider is ready without exposing secrets', () => {
  withEnv({}, ({ getEmailStatus }) => assert.deepEqual(getEmailStatus(), {
    configured: false, provider: 'none', frontendUrlConfigured: false, usingResendTestSender: false,
    sender: '', notifyEmail: 'induscartvalley@gmail.com',
  }));
  withEnv({ SMTP_HOST: 'smtp.gmail.com', SMTP_USER: 'shop@gmail.com', SMTP_PASS: 'abcd efgh ijkl mnop', FRONTEND_URL: 'https://shop.test/' },
    ({ getEmailStatus, getFrontendUrl }) => {
      assert.equal(getEmailStatus().provider, 'smtp');
      assert.equal(getEmailStatus().configured, true);
      assert.equal(getFrontendUrl(), 'https://shop.test');
      assert.equal(JSON.stringify(getEmailStatus()).includes('abcd'), false);
    });
  withEnv({ RESEND_API_KEY: 're_123', EMAIL_FROM: 'IndusCart <onboarding@resend.dev>', FRONTEND_URL: 'https://shop.test' },
    ({ getEmailStatus }) => assert.equal(getEmailStatus().usingResendTestSender, true));
  withEnv({ RESEND_API_KEY: 'replace-with-resend-api-key', EMAIL_FROM: 'a@b.pk', FRONTEND_URL: 'https://shop.test' },
    ({ getEmailStatus }) => assert.equal(getEmailStatus().provider, 'none'));
});

test('sending without configuration fails with a clear code', async () => {
  await withEnv({}, async ({ sendEmail }) => {
    await assert.rejects(sendEmail({ to: 'a@b.pk', subject: 's', text: 't', html: 'h' }), { code: 'EMAIL_NOT_CONFIGURED' });
  });
});

test('on Vercel only the Gmail App Password is needed', () => {
  withEnv({ VERCEL: '1', SMTP_PASS: 'abcd efgh ijkl mnop' }, ({ getEmailStatus, getFrontendUrl }) => {
    const status = getEmailStatus();
    assert.equal(status.configured, true);
    assert.equal(status.provider, 'smtp');
    assert.equal(status.sender, 'induscartvalley@gmail.com');
    assert.equal(status.notifyEmail, 'induscartvalley@gmail.com');
    assert.equal(getFrontendUrl(), 'https://e-commerce-coral-eight-95.vercel.app');
  });
  withEnv({ VERCEL: '1', SMTP_PASS: 'x', ADMIN_NOTIFY_EMAIL: 'owner@example.pk', FRONTEND_URL: 'https://shop.pk/' }, ({ getEmailStatus, getFrontendUrl }) => {
    assert.equal(getEmailStatus().notifyEmail, 'owner@example.pk');
    assert.equal(getFrontendUrl(), 'https://shop.pk');
  });
});
