const express = require('express');
const rateLimit = require('express-rate-limit');
const router  = express.Router();

const { registerUser, loginUser, getUserProfile, verifySession } = require('../controllers/authController');
const { protect } = require('../middleware/authMiddleware');

const authLimiter = rateLimit({
	windowMs: 15 * 60 * 1000,
	limit: 30,
	standardHeaders: 'draft-8',
	legacyHeaders: false,
	message: { message: 'Too many authentication attempts. Please try again later.' },
});

router.use(authLimiter);

// POST /api/auth/register  → create new account
router.post('/register', registerUser);

// POST /api/auth/login     → login & get token
router.post('/login', loginUser);

// GET  /api/auth/profile   → get my profile (must be logged in)
router.get('/profile', protect, getUserProfile);
router.get('/session', protect, verifySession);

module.exports = router;