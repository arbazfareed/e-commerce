// Customer emails for order events. Failures are logged and never block the order.
const emailService = require('./emailService');

const money = (amount, currency) => currency === 'USD'
  ? `$${Number(amount || 0).toFixed(2)}`
  : `Rs ${Math.round(Number(amount || 0)).toLocaleString('en-PK')}`;

const shortId = order => `#${String(order._id).slice(-8).toUpperCase()}`;

const recipientFor = order => {
  const email = order.guestContact?.email || order.user?.email;
  const name = order.guestContact?.name || order.user?.name || 'there';
  return email ? { email, name } : null;
};

const itemsTable = (order) => {
  const { escapeHtml } = emailService;
  const rows = (order.products || []).map(item => `<tr><td style="padding:6px 0">${escapeHtml(item.name)} × ${item.quantity}</td>
<td style="padding:6px 0;text-align:right">${money(item.price * item.quantity, order.currency)}</td></tr>`).join('');
  const line = (label, value) => `<tr><td style="padding:4px 0;color:#64748b">${label}</td><td style="padding:4px 0;text-align:right">${value}</td></tr>`;
  return `<table style="width:100%;border-collapse:collapse;font-size:14px">${rows}
${order.couponDiscount ? line(`Coupon ${escapeHtml(order.couponCode)}`, `-${money(order.couponDiscount, order.currency)}`) : ''}
${line('Shipping', money(order.shippingFee, order.currency))}
${order.codFee ? line('COD fee', money(order.codFee, order.currency)) : ''}
<tr><td style="padding:8px 0;font-weight:700">Total</td><td style="padding:8px 0;text-align:right;font-weight:700">${money(order.totalPrice, order.currency)}</td></tr></table>`;
};

const safeSend = async (message, label) => {
  if (!emailService.isConfigured()) return false;
  try {
    await emailService.sendEmail(message);
    return true;
  } catch (error) {
    console.error(`${label} email failed:`, error.code || 'EMAIL_ERROR', '-', error.message);
    return false;
  }
};

const sendOrderConfirmationEmail = async (order, { trackUrl } = {}) => {
  const to = recipientFor(order);
  if (!to) return false;
  const { escapeHtml, layout } = emailService;
  const payment = order.paymentMethod === 'COD'
    ? `Please keep ${money(order.totalPrice, order.currency)} ready in cash when the parcel arrives.`
    : `Payment method: ${order.paymentMethod}.`;
  const address = [order.address?.street, order.address?.city, order.address?.province, order.address?.country].filter(Boolean).join(', ');
  return safeSend({
    to: to.email,
    subject: `Your IndusCart order ${shortId(order)} is confirmed`,
    text: `Hello ${to.name},\n\nThank you for your order ${shortId(order)}. Total: ${money(order.totalPrice, order.currency)}.\n${payment}\nDelivery to: ${address}\n${trackUrl ? `\nTrack your order: ${trackUrl}\n` : ''}`,
    html: layout(`<p>Hello ${escapeHtml(to.name)},</p><p>Thank you! Your order <strong>${shortId(order)}</strong> is confirmed.</p>
${itemsTable(order)}<p>${escapeHtml(payment)}</p><p style="color:#64748b">Delivery to: ${escapeHtml(address)}</p>
${trackUrl ? `<p><a href="${escapeHtml(trackUrl)}" style="display:inline-block;padding:12px 18px;background:#087f5b;color:#fff;border-radius:8px;text-decoration:none;font-weight:700">Track your order</a></p>` : ''}`),
  }, 'Order confirmation');
};

// Copy of every new order for the store inbox.
const sendNewOrderAlert = async (order) => {
  const { escapeHtml, layout, getFrontendUrl, notifyStore } = emailService;
  const customer = recipientFor(order);
  const address = [order.address?.street, order.address?.city, order.address?.province, order.address?.postalCode, order.address?.country].filter(Boolean).join(', ');
  const adminLink = getFrontendUrl() ? `${getFrontendUrl()}/admin/orders` : '';
  return notifyStore({
    subject: `New order ${shortId(order)} · ${money(order.totalPrice, order.currency)} · ${order.paymentMethod}`,
    replyTo: customer?.email,
    text: `New order ${shortId(order)}\nCustomer: ${customer?.name || '-'} <${customer?.email || '-'}>\nPhone: ${order.address?.phone || '-'}\nAddress: ${address}\nTotal: ${money(order.totalPrice, order.currency)} (${order.paymentMethod})\n${(order.products || []).map(i => `- ${i.name} x ${i.quantity}`).join('\n')}\n${adminLink ? `\nOpen admin: ${adminLink}` : ''}`,
    html: layout(`<p><strong>New order ${shortId(order)}</strong> (${escapeHtml(order.paymentMethod)})</p>
<p>${escapeHtml(customer?.name || '-')} · ${escapeHtml(customer?.email || '-')} · ${escapeHtml(order.address?.phone || '-')}<br>${escapeHtml(address)}</p>
${itemsTable(order)}${adminLink ? `<p><a href="${escapeHtml(adminLink)}">Open orders in admin</a></p>` : ''}`),
  });
};

const STATUS_TEXT = {
  Processing: 'We are preparing your order.',
  Shipped: 'Your order is on its way.',
  Delivered: 'Your order has been delivered. Thank you for shopping with IndusCart!',
  Cancelled: 'Your order has been cancelled. If you did not ask for this, please contact support.',
};

const sendOrderStatusEmail = async (order) => {
  const message = STATUS_TEXT[order.status];
  const to = recipientFor(order);
  if (!message || !to) return false;
  const { escapeHtml, layout, getFrontendUrl } = emailService;
  const link = order.user && getFrontendUrl() ? `${getFrontendUrl()}/orders/${order._id}` : '';
  const tracking = order.status === 'Shipped' && order.trackingNumber
    ? `Courier: ${order.shippingProvider || 'courier'} · Tracking number: ${order.trackingNumber}` : '';
  return safeSend({
    to: to.email,
    subject: `Order ${shortId(order)}: ${order.status}`,
    text: `Hello ${to.name},\n\n${message}\n${tracking ? `${tracking}\n` : ''}${order.trackingUrl ? `Track the parcel: ${order.trackingUrl}\n` : ''}${link ? `View your order: ${link}\n` : ''}`,
    html: layout(`<p>Hello ${escapeHtml(to.name)},</p><p><strong>Order ${shortId(order)}</strong>: ${escapeHtml(message)}</p>
${tracking ? `<p>${escapeHtml(tracking)}</p>` : ''}${order.trackingUrl ? `<p><a href="${escapeHtml(order.trackingUrl)}">Track the parcel</a></p>` : ''}
${link ? `<p><a href="${escapeHtml(link)}">View your order</a></p>` : ''}`),
  }, 'Order status');
};

module.exports = { sendOrderConfirmationEmail, sendOrderStatusEmail, sendNewOrderAlert, money };
