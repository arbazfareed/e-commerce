// Email delivery for IndusCart.
//
// Two providers are supported; set the variables for ONE of them in the backend environment:
//   1. Resend (best for production, needs your own verified domain):
//        RESEND_API_KEY, EMAIL_FROM="IndusCart <no-reply@yourdomain.com>"
//   2. Any SMTP server, e.g. Gmail with an App Password (works without a domain, low volume):
//        SMTP_HOST=smtp.gmail.com, SMTP_PORT=465, SMTP_USER=you@gmail.com, SMTP_PASS=<16-char app password>
//        EMAIL_FROM="IndusCart <you@gmail.com>" (optional, defaults to SMTP_USER)
// FRONTEND_URL must be the public store URL so links in emails open the right site.

const clean = name => process.env[name]?.trim() || '';
const isPlaceholder = value => /^replace-with-|example\.com|your-verified-domain/i.test(value);

const getProvider = () => {
  if (clean('SMTP_HOST') && clean('SMTP_USER') && clean('SMTP_PASS') && !isPlaceholder(clean('SMTP_PASS'))) return 'smtp';
  if (clean('RESEND_API_KEY') && clean('EMAIL_FROM') && !isPlaceholder(clean('RESEND_API_KEY')) && !isPlaceholder(clean('EMAIL_FROM'))) return 'resend';
  return null;
};

const getFrontendUrl = () => {
  const url = clean('FRONTEND_URL');
  return url && !isPlaceholder(url) ? url.replace(/\/+$/, '') : '';
};

const isConfigured = () => Boolean(getProvider() && getFrontendUrl());

// Safe summary for the admin panel; never includes secrets.
const getEmailStatus = () => ({
  configured: isConfigured(),
  provider: getProvider() || 'none',
  frontendUrlConfigured: Boolean(getFrontendUrl()),
  usingResendTestSender: getProvider() === 'resend' && /@resend\.dev>?$/i.test(clean('EMAIL_FROM')),
});

const escapeHtml = value => String(value ?? '').replace(/[&<>"']/g, character => ({
  '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;',
}[character]));

let smtpTransport = null;
const getSmtpTransport = () => {
  if (!smtpTransport) {
    const nodemailer = require('nodemailer');
    const port = Number(clean('SMTP_PORT')) || 465;
    smtpTransport = nodemailer.createTransport({
      host: clean('SMTP_HOST'),
      port,
      secure: port === 465,
      auth: { user: clean('SMTP_USER'), pass: clean('SMTP_PASS').replace(/\s+/g, '') },
      connectionTimeout: 10000,
      greetingTimeout: 10000,
      socketTimeout: 15000,
    });
  }
  return smtpTransport;
};

const sendEmail = async ({ to, subject, text, html }) => {
  const provider = getProvider();
  if (!provider || !getFrontendUrl()) {
    const error = new Error('Email delivery is not configured. Set FRONTEND_URL and either SMTP_* or RESEND_API_KEY + EMAIL_FROM.');
    error.code = 'EMAIL_NOT_CONFIGURED';
    throw error;
  }

  if (provider === 'smtp') {
    try {
      await getSmtpTransport().sendMail({ from: clean('EMAIL_FROM') || clean('SMTP_USER'), to, subject, text, html });
    } catch (cause) {
      const error = new Error(`SMTP server rejected the message (${cause.responseCode || cause.code || 'error'}).`);
      error.code = 'EMAIL_DELIVERY_FAILED';
      throw error;
    }
    return;
  }

  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), 10000);
  try {
    const response = await fetch('https://api.resend.com/emails', {
      method: 'POST',
      headers: { Authorization: `Bearer ${clean('RESEND_API_KEY')}`, 'Content-Type': 'application/json' },
      body: JSON.stringify({ from: clean('EMAIL_FROM'), to: [to], subject, text, html }),
      signal: controller.signal,
    });
    if (!response.ok) {
      // 403 usually means the sender domain is not verified, or the onboarding@resend.dev
      // test sender is being used for someone other than the Resend account owner.
      const error = new Error(`Email provider rejected the message (${response.status}).`);
      error.code = 'EMAIL_DELIVERY_FAILED';
      throw error;
    }
  } catch (cause) {
    if (cause.code === 'EMAIL_DELIVERY_FAILED') throw cause;
    const error = new Error('Email provider could not be reached.');
    error.code = 'EMAIL_DELIVERY_FAILED';
    throw error;
  } finally {
    clearTimeout(timer);
  }
};

const layout = (bodyHtml) => `<div style="font-family:Segoe UI,Arial,sans-serif;max-width:560px;margin:0 auto;color:#183329">
<h2 style="color:#087f5b;margin:0 0 16px">IndusCart</h2>${bodyHtml}
<p style="margin-top:28px;color:#64748b;font-size:12px">This email was sent by IndusCart.</p></div>`;

const sendCustomerPasswordResetEmail = async ({ to, name, resetUrl, requestedBy = 'customer' }) => {
  const intro = requestedBy === 'admin'
    ? 'A store administrator sent you a link to reset your IndusCart password.'
    : 'We received a request to reset your IndusCart password.';
  await sendEmail({
    to,
    subject: 'Reset your IndusCart password',
    text: `Hello ${name || 'there'},\n\n${intro} This one-time link expires in 20 minutes:\n\n${resetUrl}\n\nIf you did not ask for this, you can ignore this email. Your password will not change.`,
    html: layout(`<p>Hello ${escapeHtml(name || 'there')},</p><p>${escapeHtml(intro)}</p>
<p><a href="${escapeHtml(resetUrl)}" style="display:inline-block;padding:12px 18px;background:#087f5b;color:#fff;border-radius:8px;text-decoration:none;font-weight:700">Choose a new password</a></p>
<p>This one-time link expires in 20 minutes. If you did not ask for this, you can ignore this email.</p>`),
  });
};

module.exports = {
  sendEmail,
  sendCustomerPasswordResetEmail,
  isConfigured,
  getEmailStatus,
  getFrontendUrl,
  escapeHtml,
  layout,
};
