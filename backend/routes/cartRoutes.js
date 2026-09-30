const express = require('express');
const router = express.Router();
const { protect } = require('../middleware/authMiddleware');
const { getCart, saveCart } = require('../controllers/cartController');

router.get('/', protect, getCart);
router.put('/', protect, saveCart);

module.exports = router;