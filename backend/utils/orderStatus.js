const ORDER_STATUSES = Object.freeze(['Pending', 'Processing', 'Shipped', 'Delivered', 'Cancelled', 'Returned']);

// Allowed moves. Delivered and Cancelled are final, and a shipped parcel cannot go back
// to Pending/Processing (stock would be counted twice). Keep in sync with the admin
// orders panel (frontend/src/pages/admin/AdminOrdersPanel.jsx).
const ORDER_STATUS_TRANSITIONS = Object.freeze({
  Pending: ['Processing', 'Shipped', 'Delivered', 'Cancelled'],
  Processing: ['Pending', 'Shipped', 'Delivered', 'Cancelled'],
  // Returned = the customer refused the parcel or sent it back; the stock comes back.
  Shipped: ['Delivered', 'Cancelled', 'Returned'],
  Delivered: ['Returned'],
  Cancelled: [],
  Returned: [],
});

const isOrderStatus = (status) => ORDER_STATUSES.includes(status);

const canChangeOrderStatus = (current, next) =>
  current === next || (ORDER_STATUS_TRANSITIONS[current] || []).includes(next);

const shouldRestoreStockAfterCancellation = (current) =>
  ['Pending', 'Processing'].includes(current);

// Stock goes back on cancel before shipping, and on every return.
const shouldRestoreStock = (current, next) =>
  next === 'Returned' || (next === 'Cancelled' && shouldRestoreStockAfterCancellation(current));

module.exports = {
  ORDER_STATUSES,
  ORDER_STATUS_TRANSITIONS,
  isOrderStatus,
  canChangeOrderStatus,
  shouldRestoreStockAfterCancellation,
  shouldRestoreStock,
};
