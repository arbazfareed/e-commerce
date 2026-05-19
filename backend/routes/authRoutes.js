const express = require('express');
const router  = express.Router();

const { registerUser, loginUser, getUserProfile } = require('../controllers/authController');
const { protect } = require('../middleware/authMiddleware');

// POST /api/auth/register  → create new account
router.post('/register', registerUser);

// POST /api/auth/login     → login & get token
router.post('/login', loginUser);

// GET  /api/auth/profile   → get my profile (must be logged in)
router.get('/profile', protect, getUserProfile);

module.exports = router;