const ORDER_STATUSES = Object.freeze(['Pending', 'Processing', 'Shipped', 'Delivered', 'Cancelled']);

// Allowed moves. Delivered and Cancelled are final, and a shipped parcel cannot go back
// to Pending/Processing (stock would be counted twice). Keep in sync with the admin
// orders panel (frontend/src/pages/admin/AdminOrdersPanel.jsx).
const ORDER_STATUS_TRANSITIONS = Object.freeze({
  Pending: ['Processing', 'Shipped', 'Delivered', 'Cancelled'],
  Processing: ['Pending', 'Shipped', 'Delivered', 'Cancelled'],
  Shipped: ['Delivered', 'Cancelled'],
  Delivered: [],
  Cancelled: [],
});

const isOrderStatus = (status) => ORDER_STATUSES.includes(status);

const canChangeOrderStatus = (current, next) =>
  current === next || (ORDER_STATUS_TRANSITIONS[current] || []).includes(next);

const shouldRestoreStockAfterCancellation = (current) =>
  ['Pending', 'Processing'].includes(current);

module.exports = {
  ORDER_STATUSES,
  ORDER_STATUS_TRANSITIONS,
  isOrderStatus,
  canChangeOrderStatus,
  shouldRestoreStockAfterCancellation,
};
