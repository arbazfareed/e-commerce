const Product = require('../models/Product');
const path    = require('path');
const fs      = require('fs');

// ─── @GET /api/products ────────────────────────────────────────
const getProducts = async (req, res) => {
  try {
    const { category, isLocal } = req.query;
    let filter = {};
    if (category) filter.category = category;
    if (isLocal === 'true') filter.isLocal = true;
    const products = await Product.find(filter).sort({ createdAt: -1 });
    res.json(products);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// ─── @GET /api/products/categories ────────────────────────────
// ✅ FIX: This route was missing — AdminPage fetches this on load
const getCategories = async (req, res) => {
  try {
    const categories = await Product.distinct('category');
    res.json(categories.filter(Boolean).sort());
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// ─── @GET /api/products/:id ────────────────────────────────────
const getProductById = async (req, res) => {
  try {
    const product = await Product.findById(req.params.id);
    if (product) {
      res.json(product);
    } else {
      res.status(404).json({ message: 'Product not found' });
    }
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// ─── @POST /api/products ───────────────────────────────────────
// ✅ FIX 1: uses pricePKR + priceUSD (matches Product model)
// ✅ FIX 2: uses req.files (plural) for multiple image uploads
const createProduct = async (req, res) => {
  try {
    const { name, pricePKR, priceUSD, category, description, isLocal, stock, weightKg } = req.body;

    // Validate required fields
    if (!name || !category) {
      return res.status(400).json({ message: 'Name and category are required.' });
    }
    if (!pricePKR || !priceUSD) {
      return res.status(400).json({ message: 'Both PKR and USD prices are required.' });
    }

    // ✅ FIX: req.files gives array from multer .array('images')
    const images = req.files ? req.files.map(f => f.filename) : [];

    const product = await Product.create({
      name:        name.trim(),
      pricePKR:    Number(pricePKR),
      priceUSD:    Number(priceUSD),
      category:    category.trim(),
      description: description ? description.trim() : '',
      isLocal:     isLocal === 'true' || isLocal === true,
      stock:       Number(stock)    || 0,
      // ✅ weightKg = 0 when blank/empty — means flat base rate only (no per-kg charge)
      weightKg:    weightKg !== undefined && weightKg !== '' ? Number(weightKg) : 0,
      images,
    });

    res.status(201).json(product);
  } catch (error) {
    console.error('createProduct error:', error);
    res.status(500).json({ message: error.message });
  }
};

// ─── @PUT /api/products/:id ────────────────────────────────────
// ✅ FIX: pricePKR/priceUSD + multiple images + keep existing images
const updateProduct = async (req, res) => {
  try {
    const product = await Product.findById(req.params.id);
    if (!product) {
      return res.status(404).json({ message: 'Product not found' });
    }

    product.name        = req.body.name        ?? product.name;
    product.pricePKR    = req.body.pricePKR    !== undefined ? Number(req.body.pricePKR)   : product.pricePKR;
    product.priceUSD    = req.body.priceUSD    !== undefined ? Number(req.body.priceUSD)   : product.priceUSD;
    product.category    = req.body.category    ?? product.category;
    product.description = req.body.description ?? product.description;
    product.isLocal     = req.body.isLocal !== undefined ? (req.body.isLocal === 'true' || req.body.isLocal === true) : product.isLocal;
    product.stock       = req.body.stock     !== undefined ? Number(req.body.stock)     : product.stock;
    product.weightKg    = req.body.weightKg  !== undefined && req.body.weightKg !== ''
      ? Number(req.body.weightKg)
      : product.weightKg;

    // Handle images: keep existing + add new uploads
    if (req.body.replaceImages === 'true') {
      const keptImages  = req.body.keptImages
        ? (Array.isArray(req.body.keptImages) ? req.body.keptImages : [req.body.keptImages])
        : [];
      const newImages   = req.files ? req.files.map(f => f.filename) : [];
      product.images    = [...keptImages, ...newImages];
    } else if (req.files && req.files.length > 0) {
      product.images = [...(product.images || []), ...req.files.map(f => f.filename)];
    }

    const updated = await product.save();
    res.json(updated);
  } catch (error) {
    console.error('updateProduct error:', error);
    res.status(500).json({ message: error.message });
  }
};

// ─── @DELETE /api/products/:id ─────────────────────────────────
const deleteProduct = async (req, res) => {
  try {
    const product = await Product.findByIdAndDelete(req.params.id);
    if (product) {
      // Also delete image files from disk
      (product.images || []).forEach(img => {
        const filePath = path.join(__dirname, '..', 'uploads', img);
        if (fs.existsSync(filePath)) fs.unlinkSync(filePath);
      });
      res.json({ message: 'Product deleted successfully' });
    } else {
      res.status(404).json({ message: 'Product not found' });
    }
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

module.exports = {
  getProducts,
  getCategories,
  getProductById,
  createProduct,
  updateProduct,
  deleteProduct,
};
