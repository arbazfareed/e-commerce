import API from '../../utils/axiosConfig';

const multipartConfig = { headers: { 'Content-Type': 'multipart/form-data' } };

export function getAdminData() {
  const requests = [
    ['products', API.get('/api/products?includeHidden=true')],
    ['orders', API.get('/api/orders')],
    ['categories', API.get('/api/products/categories?includeHidden=true')],
  ];
  return Promise.allSettled(requests.map(([, request]) => request)).then(results => ({
    products: results[0].status === 'fulfilled' ? results[0].value : { data: [] },
    orders: results[1].status === 'fulfilled' ? results[1].value : { data: [] },
    categories: results[2].status === 'fulfilled' ? results[2].value : { data: [] },
    failures: results.flatMap((result, index) => result.status === 'rejected'
      ? [{ resource: requests[index][0], error: result.reason }]
      : []),
  }));
}

export function getSalesAnalytics() {
  return API.get('/api/orders/analytics');
}

export function recordManualCashSale(payload) {
  return API.post('/api/orders/manual-cash', payload);
}

export function getStoreSettings() {
  return API.get('/api/settings/');
}

export function saveStoreSettings(settings) {
  return API.put('/api/settings/', settings);
}

export function getSupportTickets() {
  return API.get('/api/support/tickets');
}

export function changeOwnPassword(payload) {
  return API.patch('/api/auth/password', payload);
}

export function resetCustomerPassword(payload) {
  return API.put('/api/auth/admin/customer-password', payload);
}

export function updateSupportTicketStatus(ticketId, status) {
  return API.put(`/api/support/tickets/${ticketId}/status`, { status });
}

export function replyToSupportTicket(ticketId, text) {
  return API.put(`/api/support/tickets/${ticketId}/reply`, { text });
}

export function createProduct(form, files) {
  const data = new FormData();
  ['name', 'pricePKR', 'priceUSD', 'discountPercent', 'discountStartDate', 'discountEndDate', 'category', 'subcategory', 'brand', 'model', 'colors', 'sizes', 'isVisible', 'description', 'isLocal', 'stock', 'weightKg']
    .forEach(key => data.append(key, form[key] ?? ''));
  files.forEach(file => data.append('images', file));
  return API.post('/api/products', data, multipartConfig);
}

export function updateProduct(productId, form, keptImages, newFiles) {
  const data = new FormData();
  ['name', 'pricePKR', 'priceUSD', 'discountPercent', 'discountStartDate', 'discountEndDate', 'category', 'subcategory', 'brand', 'model', 'colors', 'sizes', 'isVisible', 'description', 'isLocal', 'stock', 'weightKg']
    .forEach(key => data.append(key, form[key] ?? ''));
  data.append('replaceImages', 'true');
  keptImages.forEach(image => data.append('keptImages', image));
  newFiles.forEach(file => data.append('images', file));
  return API.put(`/api/products/${productId}`, data, multipartConfig);
}

export function deleteProduct(productId) {
  return API.delete(`/api/products/${productId}`);
}

export function updateOrderStatus(orderId, status) {
  return API.put(`/api/orders/${orderId}/status`, { status });
}

export function getApiErrorMessage(error, fallback) {
  const serverMessage = error?.response?.data?.message;
  if (serverMessage) return serverMessage;
  const statusMessages = {
    400: 'Please review the submitted values and try again.',
    401: 'Your session has expired. Please sign in again.',
    403: 'You do not have permission to perform this action.',
    404: 'The requested record could not be found.',
    409: 'This change conflicts with the current record state. Refresh and try again.',
    413: 'The selected upload is too large.',
  };
  const status = error?.response?.status;
  if (statusMessages[status]) return statusMessages[status];
  if (error?.code === 'ERR_NETWORK' || error?.message === 'Network Error') {
    return 'Could not connect to the server. Check your connection and try again.';
  }
  if (error?.message && !/^request failed with status code \d+$/i.test(error.message)) {
    return error.message;
  }
  return fallback;
}
