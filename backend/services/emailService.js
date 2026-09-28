const isConfigured = () => {
  const apiKey = process.env.RESEND_API_KEY?.trim();
  const sender = process.env.EMAIL_FROM?.trim();
  const frontendUrl = process.env.FRONTEND_URL?.trim();
  return Boolean(apiKey && sender && frontendUrl)
    && !/^replace-with-/i.test(apiKey)
    && !/example\.com|your-verified-domain/i.test(sender)
    && !/example\.com/i.test(frontendUrl);
};

const sendCustomerPasswordResetEmail = async ({ to, name, resetUrl }) => {
  if (!isConfigured()) {
    const error = new Error('Email delivery is not configured. Set RESEND_API_KEY, EMAIL_FROM, and FRONTEND_URL.');
    error.code = 'EMAIL_NOT_CONFIGURED';
    throw error;
  }

  const safeName = String(name || 'there').replace(/[&<>"']/g, (character) => ({
    '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;',
  }[character]));

  const response = await fetch('https://api.resend.com/emails', {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${process.env.RESEND_API_KEY.trim()}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      from: process.env.EMAIL_FROM.trim(),
      to: [to],
      subject: 'Reset your IndusCart password',
      text: `Hello ${name || 'there'},\n\nAn administrator requested a password reset for your IndusCart account. This one-time link expires in 20 minutes:\n\n${resetUrl}\n\nIf you did not expect this message, you can ignore it.`,
      html: `<p>Hello ${safeName},</p><p>An administrator requested a password reset for your IndusCart account.</p><p><a href="${resetUrl}">Choose a new password</a></p><p>This one-time link expires in 20 minutes. If you did not expect this message, you can ignore it.</p>`,
    }),
  });
  if (!response.ok) {
    const error = new Error(`Email provider rejected the message (${response.status}).`);
    error.code = 'EMAIL_DELIVERY_FAILED';
    throw error;
  }
};

module.exports = { sendCustomerPasswordResetEmail };
