import API from '../../utils/axiosConfig';

const multipartConfig = { headers: { 'Content-Type': 'multipart/form-data' } };

export function getAdminData() {
  return Promise.all([
    API.get('/api/products?includeHidden=true'),
    API.get('/api/orders'),
    API.get('/api/products/categories?includeHidden=true'),
  ]);
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

export function createProduct(form, files) {
  const data = new FormData();
  Object.entries(form).forEach(([key, value]) => data.append(key, value));
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
  return error?.response?.data?.message || error?.message || fallback;
}
