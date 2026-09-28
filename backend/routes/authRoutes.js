const express = require('express');
const rateLimit = require('express-rate-limit');
const router  = express.Router();

const { registerUser, loginUser, changeOwnPassword, resetCustomerPassword, completeCustomerPasswordReset, getUserProfile, verifySession } = require('../controllers/authController');
const { protect, admin } = require('../middleware/authMiddleware');

const authLimiter = rateLimit({
	windowMs: 15 * 60 * 1000,
	limit: 30,
	standardHeaders: 'draft-8',
	legacyHeaders: false,
	message: { message: 'Too many authentication attempts. Please try again later.' },
});

// POST /api/auth/register  → create new account
router.post('/register', authLimiter, registerUser);

// POST /api/auth/login     → login & get token
router.post('/login', authLimiter, loginUser);

// Password changes require an authenticated account and rate limiting.
router.patch('/password', authLimiter, protect, changeOwnPassword);
router.put('/admin/customer-password', authLimiter, protect, admin, resetCustomerPassword);
router.post('/password/reset', authLimiter, completeCustomerPasswordReset);

// GET  /api/auth/profile   → get my profile (must be logged in)
router.get('/profile', protect, getUserProfile);
router.get('/session', protect, verifySession);

module.exports = router;