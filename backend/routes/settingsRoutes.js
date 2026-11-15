const express = require('express');
const router = express.Router();
const { getPublicSettings, getSettings, updateSettings, sendTestEmail } = require('../controllers/settingsController');
const { protect, admin } = require('../middleware/authMiddleware');

router.get('/public', getPublicSettings);
router.get('/', protect, admin, getSettings);
router.put('/', protect, admin, updateSettings);
router.post('/test-email', protect, admin, sendTestEmail);

module.exports = router;
