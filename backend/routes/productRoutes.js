const express = require('express');
const router  = express.Router();
const multer  = require('multer');
const path    = require('path');

const {
  getProducts,
  getCategories,
  getProductById,
  createProduct,
  updateProduct,
  deleteProduct,
} = require('../controllers/productController');

const { protect, admin } = require('../middleware/authMiddleware');

// ─── Multer: save to uploads/, accept multiple images ─────────
const storage = multer.diskStorage({
  destination: (req, file, cb) => cb(null, 'uploads/'),
  filename:    (req, file, cb) => cb(null, Date.now() + '-' + Math.round(Math.random()*1e6) + path.extname(file.originalname)),
});

const upload = multer({
  storage,
  limits: { fileSize: 5 * 1024 * 1024 }, // 5MB per file
  fileFilter: (req, file, cb) => {
    const allowed = /jpeg|jpg|png|webp/;
    const ok = allowed.test(path.extname(file.originalname).toLowerCase()) &&
               allowed.test(file.mimetype);
    ok ? cb(null, true) : cb(new Error('Only JPG, PNG, WEBP images allowed'));
  },
});

// ✅ FIX: /categories MUST come before /:id — otherwise Express
//    treats "categories" as an :id param and it never matches
// GET /api/products/categories → list all distinct categories
router.get('/categories', getCategories);

// GET  /api/products          → all products (public)
router.get('/',    getProducts);

// GET  /api/products/:id      → single product (public)
router.get('/:id', getProductById);

// ✅ FIX: upload.array('images', 10) instead of upload.single('image')
// POST /api/products          → admin: create product
router.post('/',   protect, admin, upload.array('images', 10), createProduct);

// PUT  /api/products/:id      → admin: update product
router.put('/:id', protect, admin, upload.array('images', 10), updateProduct);

// DELETE /api/products/:id    → admin: delete product
router.delete('/:id', protect, admin, deleteProduct);

module.exports = router;
