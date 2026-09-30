const express = require('express');
const rateLimit = require('express-rate-limit');
const router  = express.Router();

const {
  placeOrder,
  getMyOrders,
  getOrderById,
  getAllOrders,
  getSalesAnalytics,
  recordManualCashSale,
  updateOrderStatus,
  updateOrderShipment,
} = require('../controllers/orderController');

const { protect, admin, optionalProtect } = require('../middleware/authMiddleware');

const guestOrderLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  limit: 8,
  standardHeaders: 'draft-8',
  legacyHeaders: false,
  skip: req => Boolean(req.user),
  message: { message: 'Too many guest checkout attempts. Please try again later.' },
});

// POST /api/orders            → place new order (signed in or rate-limited guest)
router.post('/',              optionalProtect, guestOrderLimiter, placeOrder);

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

// PUT /api/orders/:id/shipment → admin: save manual courier tracking details
router.put('/:id/shipment',   protect, admin, updateOrderShipment);

// PUT  /api/orders/:id/status → admin: update order status
router.put('/:id/status',     protect, admin, updateOrderStatus);

module.exports = router;