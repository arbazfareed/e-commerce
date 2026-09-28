const ORDER_STATUSES = Object.freeze(['Pending', 'Processing', 'Shipped', 'Delivered', 'Cancelled']);

const isOrderStatus = (status) => ORDER_STATUSES.includes(status);

const shouldRestoreStockAfterCancellation = (current) =>
  ['Pending', 'Processing'].includes(current);

module.exports = {
  ORDER_STATUSES,
  isOrderStatus,
  shouldRestoreStockAfterCancellation,
};
