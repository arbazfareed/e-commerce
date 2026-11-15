// Email delivery for IndusCart.
//
// The store sends from its Gmail inbox by default. Only ONE secret is needed in the
// backend environment (Vercel → e-commerce-backend → Settings → Environment Variables):
//   SMTP_PASS = the 16-character Google App Password for induscartvalley@gmail.com
// Everything else has a default and can be overridden:
//   SMTP_USER (default STORE_EMAIL), SMTP_HOST (smtp.gmail.com), SMTP_PORT (465),
//   EMAIL_FROM ("IndusCart <SMTP_USER>"), FRONTEND_URL (the live store on Vercel),
//   ADMIN_NOTIFY_EMAIL (where new-order and support alerts go, default STORE_EMAIL).
// Resend is still supported instead of SMTP: RESEND_API_KEY + EMAIL_FROM on a verified domain.

const STORE_EMAIL = 'induscartvalley@gmail.com';
const DEFAULT_PRODUCTION_URL = 'https://e-commerce-coral-eight-95.vercel.app';

const clean = name => process.env[name]?.trim() || '';
const isPlaceholder = value => /^replace-with-|example\.com|your-verified-domain/i.test(value);

const smtpUser = () => clean('SMTP_USER') || clean('STORE_EMAIL') || STORE_EMAIL;
const smtpHost = () => clean('SMTP_HOST') || 'smtp.gmail.com';
const storeEmail = () => clean('STORE_EMAIL') || STORE_EMAIL;
// Gmail only sends as the signed-in account, so ignore an EMAIL_FROM for another address.
const fromAddress = () => {
  const configured = clean('EMAIL_FROM');
  return configured && configured.toLowerCase().includes(smtpUser().toLowerCase()) ? configured : `IndusCart <${smtpUser()}>`;
};

const getProvider = () => {
  if (clean('SMTP_PASS') && !isPlaceholder(clean('SMTP_PASS'))) return 'smtp';
  if (clean('RESEND_API_KEY') && clean('EMAIL_FROM') && !isPlaceholder(clean('RESEND_API_KEY')) && !isPlaceholder(clean('EMAIL_FROM'))) return 'resend';
  return null;
};

const getFrontendUrl = () => {
  const url = clean('FRONTEND_URL');
  if (url && !isPlaceholder(url)) return url.replace(/\/+$/, '');
  // On Vercel production, links point at the live store unless FRONTEND_URL says otherwise.
  return process.env.VERCEL ? DEFAULT_PRODUCTION_URL : '';
};

const getNotifyEmail = () => clean('ADMIN_NOTIFY_EMAIL') || storeEmail();

const isConfigured = () => Boolean(getProvider() && getFrontendUrl());

// Safe summary for the admin panel; never includes secrets.
const getEmailStatus = () => ({
  configured: isConfigured(),
  provider: getProvider() || 'none',
  frontendUrlConfigured: Boolean(getFrontendUrl()),
  usingResendTestSender: getProvider() === 'resend' && /@resend\.dev>?$/i.test(clean('EMAIL_FROM')),
  sender: getProvider() === 'smtp' ? smtpUser() : (getProvider() === 'resend' ? clean('EMAIL_FROM') : ''),
  notifyEmail: getNotifyEmail(),
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
      host: smtpHost(),
      port,
      secure: port === 465,
      auth: { user: smtpUser(), pass: clean('SMTP_PASS').replace(/\s+/g, '') },
      connectionTimeout: 10000,
      greetingTimeout: 10000,
      socketTimeout: 15000,
    });
  }
  return smtpTransport;
};

const sendEmail = async ({ to, subject, text, html, replyTo }) => {
  const provider = getProvider();
  if (!provider || !getFrontendUrl()) {
    const error = new Error('Email delivery is not configured. Set FRONTEND_URL and either SMTP_* or RESEND_API_KEY + EMAIL_FROM.');
    error.code = 'EMAIL_NOT_CONFIGURED';
    throw error;
  }

  if (provider === 'smtp') {
    try {
      await getSmtpTransport().sendMail({ from: fromAddress(), to, subject, text, html, replyTo: replyTo || storeEmail() });
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
      body: JSON.stringify({ from: clean('EMAIL_FROM'), to: [to], subject, text, html, reply_to: replyTo || storeEmail() }),
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

// Alert the store inbox (new orders, support messages). Never throws.
const notifyStore = async ({ subject, text, html, replyTo }) => {
  if (!isConfigured()) return false;
  try {
    await sendEmail({ to: getNotifyEmail(), subject, text, html, replyTo });
    return true;
  } catch (error) {
    console.error('Store notification email failed:', error.code || 'EMAIL_ERROR', '-', error.message);
    return false;
  }
};

module.exports = {
  STORE_EMAIL,
  notifyStore,
  getNotifyEmail,
  sendEmail,
  sendCustomerPasswordResetEmail,
  isConfigured,
  getEmailStatus,
  getFrontendUrl,
  escapeHtml,
  layout,
};
