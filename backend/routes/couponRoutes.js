const express = require('express');
const router = express.Router();
const { protect, admin } = require('../middleware/authMiddleware');
const { listCoupons, createCoupon, updateCoupon, deleteCoupon, validateCoupon } = require('../controllers/couponController');

router.post('/validate', protect, validateCoupon);
router.get('/', protect, admin, listCoupons);
router.post('/', protect, admin, createCoupon);
router.put('/:id', protect, admin, updateCoupon);
router.delete('/:id', protect, admin, deleteCoupon);

module.exports = router;