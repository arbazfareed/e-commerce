const express = require('express');
const rateLimit = require('express-rate-limit');
const { protect, admin, staff } = require('../middleware/authMiddleware');
const { requireValidId } = require('../middleware/validateObjectId');
const ctrl = require('../controllers/storeController');

const router = express.Router();

// Creating accounts and resetting passwords returns secrets: keep it slow to abuse.
const credentialLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  limit: 30,
  standardHeaders: 'draft-8',
  legacyHeaders: false,
  message: { message: 'Too many store account changes. Please wait a few minutes.' },
});

// Store owners and the main admin
router.get('/analytics', protect, staff, ctrl.getStoreAnalytics);
router.get('/me', protect, staff, ctrl.getMyStore);

// Main admin only
router.get('/', protect, admin, ctrl.listStores);
router.post('/', credentialLimiter, protect, admin, ctrl.createStore);
router.patch('/:id', protect, admin, requireValidId('Store'), ctrl.updateStore);
router.post('/:id/reset-password', credentialLimiter, protect, admin, requireValidId('Store'), ctrl.resetStorePassword);

module.exports = router;
