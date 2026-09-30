const express = require('express');
const rateLimit = require('express-rate-limit');
const router  = express.Router();

const { registerUser, loginUser, loginAdminUser, changeOwnPassword, resetCustomerPassword, requestCustomerPasswordReset, completeCustomerPasswordReset, getUserProfile, verifySession } = require('../controllers/authController');
const { protect, admin } = require('../middleware/authMiddleware');

const authLimiter = rateLimit({
	windowMs: 15 * 60 * 1000,
	limit: 30,
	standardHeaders: 'draft-8',
	legacyHeaders: false,
	message: { message: 'Too many authentication attempts. Please try again later.' },
});
const adminLoginLimiter = rateLimit({
	windowMs: 15 * 60 * 1000,
	limit: 5,
	standardHeaders: 'draft-8',
	legacyHeaders: false,
	skipSuccessfulRequests: true,
	message: { message: 'Too many administrator sign-in attempts. Please try again later.' },
});
const passwordResetRequestLimiter = rateLimit({
	windowMs: 15 * 60 * 1000,
	limit: 5,
	standardHeaders: 'draft-8',
	legacyHeaders: false,
	message: { message: 'Too many password reset requests. Please try again later.' },
});

// POST /api/auth/register  → create new account
router.post('/register', authLimiter, registerUser);

// Public shopper login never issues administrator tokens.
router.post('/login', authLimiter, loginUser);
// Admin login has a separate role check and a stricter per-IP failure limit.
router.post('/admin/login', adminLoginLimiter, loginAdminUser);

// Password changes require an authenticated account and rate limiting.
router.patch('/password', authLimiter, protect, changeOwnPassword);
router.put('/admin/customer-password', authLimiter, protect, admin, resetCustomerPassword);
router.post('/password/reset', authLimiter, completeCustomerPasswordReset);
router.post('/password/reset/request', passwordResetRequestLimiter, requestCustomerPasswordReset);

// GET  /api/auth/profile   → get my profile (must be logged in)
router.get('/profile', protect, getUserProfile);
router.get('/session', protect, verifySession);

module.exports = router;