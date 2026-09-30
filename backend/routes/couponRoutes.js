const express = require('express');
const rateLimit = require('express-rate-limit');
const router = express.Router();
const { protect, admin, optionalProtect } = require('../middleware/authMiddleware');
const { listCoupons, createCoupon, updateCoupon, deleteCoupon, validateCoupon } = require('../controllers/couponController');

const couponValidationLimiter = rateLimit({
	windowMs: 15 * 60 * 1000,
	limit: 30,
	standardHeaders: 'draft-8',
	legacyHeaders: false,
	message: { message: 'Too many coupon checks. Please try again later.' },
});

router.post('/validate', optionalProtect, couponValidationLimiter, validateCoupon);
router.get('/', protect, admin, listCoupons);
router.post('/', protect, admin, createCoupon);
router.put('/:id', protect, admin, updateCoupon);
router.delete('/:id', protect, admin, deleteCoupon);

module.exports = router;