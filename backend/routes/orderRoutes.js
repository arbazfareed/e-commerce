const express = require('express');
const router  = express.Router();

const {
  placeOrder,
  getMyOrders,
  getOrderById,
  getAllOrders,
  getSalesAnalytics,
  recordManualCashSale,
  updateOrderStatus,
} = require('../controllers/orderController');

const { protect, admin } = require('../middleware/authMiddleware');

// POST /api/orders            → place new order (logged in)
router.post('/',              protect, placeOrder);

// GET  /api/orders/my         → my order history (logged in)
router.get('/my',             protect, getMyOrders);

// GET  /api/orders/analytics  → admin: sales history and channel breakdown
router.get('/analytics',      protect, admin, getSalesAnalytics);

// POST /api/orders/manual-cash → admin: record manual cash collected at delivery
router.post('/manual-cash',   protect, admin, recordManualCashSale);

// GET  /api/orders            → admin: all orders
router.get('/',               protect, admin, getAllOrders);

// GET  /api/orders/:id        → single order (owner or admin)
router.get('/:id',            protect, getOrderById);

// PUT  /api/orders/:id/status → admin: update order status
router.put('/:id/status',     protect, admin, updateOrderStatus);

module.exports = router;