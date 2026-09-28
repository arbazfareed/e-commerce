const express = require('express');
const router  = express.Router();
const multer  = require('multer');
const path    = require('path');
const fs      = require('fs');

const {
  getProducts,
  getCategories,
  getProductById,
  createProduct,
  updateProduct,
  deleteProduct,
} = require('../controllers/productController');

const { protect, admin, optionalProtect } = require('../middleware/authMiddleware');
const { removeUploadedFiles, validateImageUploads } = require('../middleware/validateImageUploads');

// Always resolve storage from this file, not the process working directory.
// This keeps uploads and the static directory aligned when started from any folder.
const uploadsDir = path.join(__dirname, '..', 'uploads');
fs.mkdirSync(uploadsDir, { recursive: true });

// ─── Multer: save to uploads/, accept multiple images ─────────
const storage = multer.diskStorage({
  destination: (req, file, cb) => cb(null, uploadsDir),
  filename:    (req, file, cb) => cb(null, Date.now() + '-' + Math.round(Math.random()*1e6) + path.extname(file.originalname)),
});

const upload = multer({
  storage,
  limits: { fileSize: 5 * 1024 * 1024 }, // 5MB per file
  fileFilter: (req, file, cb) => {
    const allowedTypes = {
      '.jpg': 'image/jpeg',
      '.jpeg': 'image/jpeg',
      '.png': 'image/png',
      '.webp': 'image/webp',
    };
    const extension = path.extname(file.originalname).toLowerCase();
    const ok = allowedTypes[extension] === file.mimetype;
    ok ? cb(null, true) : cb(new Error('Only JPG, PNG, WEBP images allowed'));
  },
});
const uploadProductImages = upload.array('images', 5);
const handleProductImageUpload = (req, res, next) => {
  uploadProductImages(req, res, error => {
    if (error) {
      return removeUploadedFiles(req.files).then(() => res.status(400).json({ message: error.message }));
    }
    return next();
  });
};

// ✅ FIX: /categories MUST come before /:id — otherwise Express
//    treats "categories" as an :id param and it never matches
// GET /api/products/categories → list all distinct categories
router.get('/categories', optionalProtect, getCategories);

// GET  /api/products          → all products (public)
router.get('/',    optionalProtect, getProducts);

// GET  /api/products/:id      → single product (public)
router.get('/:id', getProductById);

// POST /api/products          → admin: create product (up to five images)
router.post('/',   protect, admin, handleProductImageUpload, validateImageUploads, createProduct);

// PUT  /api/products/:id      → admin: update product
router.put('/:id', protect, admin, handleProductImageUpload, validateImageUploads, updateProduct);

// DELETE /api/products/:id    → admin: delete product
router.delete('/:id', protect, admin, deleteProduct);

module.exports = router;
