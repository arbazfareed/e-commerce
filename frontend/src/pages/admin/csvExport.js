const csvCell = value => {
  let text = value == null ? '' : String(value);
  if (/^[\u0000-\u0020]*[=+\-@]/.test(text)) text = `'${text}`;
  return `"${text.replace(/"/g, '""')}"`;
};

export const rowsToCsv = rows => `\uFEFF${rows.map(row => row.map(csvCell).join(',')).join('\r\n')}`;

export const productsToCsvRows = products => [
  ['Product ID', 'Name', 'Category', 'Subcategory', 'Brand', 'Model', 'Price PKR', 'Price USD', 'Discount %', 'Discount starts', 'Discount ends', 'Stock', 'Weight kg', 'Local only', 'Visible', 'Colors', 'Sizes', 'Images', 'Description', 'Created at'],
  ...(products || []).map(product => [
    product._id, product.name, product.category, product.subcategory, product.brand, product.model,
    product.pricePKR, product.priceUSD, product.discountPercent, product.discountStartDate, product.discountEndDate,
    product.stock, product.weightKg, Boolean(product.isLocal), product.isVisible !== false,
    (product.colors || []).join('; '), (product.sizes || []).join('; '), (product.images || []).join('; '),
    product.description, product.createdAt,
  ]),
];

export const ordersToCsvRows = orders => [
  ['Order ID', 'Created at', 'Customer', 'Email', 'Phone', 'Account ID', 'Status', 'Payment method', 'Payment status', 'Currency', 'Items', 'Product total', 'Coupon', 'Coupon discount', 'Shipping fee', 'COD fee', 'Total', 'Shipping zone', 'Country', 'City', 'Courier', 'Tracking number', 'Tracking URL'],
  ...(orders || []).map(order => [
    order._id, order.createdAt, order.guestContact?.name || order.user?.name, order.guestContact?.email || order.user?.email,
    order.guestContact?.phone, order.user?._id, order.status, order.paymentMethod, order.paymentStatus || (order.isPaid ? 'paid' : 'pending'),
    order.currency || (order.address?.country === 'Pakistan' ? 'PKR' : 'USD'),
    (order.products || []).map(item => `${item.name} × ${item.quantity}`).join('; '), order.productTotal,
    order.couponCode, order.couponDiscount, order.shippingFee, order.codFee, order.totalPrice, order.shippingZone,
    order.address?.country, order.address?.city, order.shippingProvider, order.trackingNumber, order.trackingUrl,
  ]),
];

export const downloadCsv = (filename, rows) => {
  const blob = new Blob([rowsToCsv(rows)], { type:'text/csv;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = filename;
  link.click();
  setTimeout(() => URL.revokeObjectURL(url), 0);
};
