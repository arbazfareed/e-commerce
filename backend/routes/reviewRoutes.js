const express = require('express');
const router = express.Router();
const { protect, admin, optionalProtect } = require('../middleware/authMiddleware');
const { getProductReviews, createReview, listReviewsForModeration, moderateReview } = require('../controllers/reviewController');

router.get('/product/:productId', optionalProtect, getProductReviews);
router.post('/', protect, createReview);
router.get('/admin', protect, admin, listReviewsForModeration);
router.patch('/:reviewId/status', protect, admin, moderateReview);

module.exports = router;