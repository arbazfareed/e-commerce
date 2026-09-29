const Product = require('../models/Product');
const Review = require('../models/Review');
const Order = require('../models/Order');
const path    = require('path');
const fs      = require('fs');
const { filterRetainedImages, resolveUploadedImagePath } = require('../utils/productImageSafety');

const parseList = (value) => {
  if (Array.isArray(value)) return value.map(v => String(v).trim()).filter(Boolean);
  if (typeof value !== 'string') return [];
  return value.split(',').map(v => v.trim()).filter(Boolean);
};

const isValidDateOnly = (value) => {
  if (!value) return true;
  if (!/^\d{4}-\d{2}-\d{2}$/.test(value)) return false;
  const [year, month, day] = value.split('-').map(Number);
  return new Date(Date.UTC(year, month - 1, day)).toISOString().slice(0, 10) === value;
};

// ─── @GET /api/products ────────────────────────────────────────
const getProducts = async (req, res) => {
  try {
    const { category, subcategory, isLocal, includeHidden } = req.query;
    let filter = {};
    if (category) filter.category = category;
    if (subcategory) filter.subcategory = subcategory;
    if (isLocal === 'true' || isLocal === 'false') filter.isLocal = isLocal === 'true';
    const canIncludeHidden = includeHidden === 'true' && req.user?.isAdmin;
    if (!canIncludeHidden) filter.isVisible = { $ne: false };
    const search = typeof req.query.search === 'string' ? req.query.search.trim().slice(0, 100) : '';
    if (search) {
      const escaped = search.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
      filter.$or = [
        { $text: { $search: search } },
        { brand: { $regex: escaped, $options: 'i' } },
        { model: { $regex: escaped, $options: 'i' } },
      ];
    }

    const paginated = ['search', 'subcategory', 'minPrice', 'maxPrice', 'sort', 'page', 'limit'].some(key => req.query[key] !== undefined);
    let products;
    let total = 0;
    let page = 1;
    let pageSize = 24;
    if (paginated) {
      page = Math.max(1, Math.floor(Number(req.query.page) || 1));
      pageSize = Math.min(48, Math.max(1, Math.floor(Number(req.query.limit) || 24)));
      const currency = req.query.currency === 'USD' ? 'USD' : 'PKR';
      const priceField = currency === 'USD' ? '$priceUSD' : '$pricePKR';
      const today = new Date().toISOString().slice(0, 10);
      const effectivePrice = { $let: {
        vars: { active: { $and: [
          { $gt: [{ $ifNull: ['$discountPercent', 0] }, 0] },
          { $or: [{ $eq: [{ $ifNull: ['$discountStartDate', ''] }, ''] }, { $lte: ['$discountStartDate', today] }] },
          { $or: [{ $eq: [{ $ifNull: ['$discountEndDate', ''] }, ''] }, { $gte: ['$discountEndDate', today] }] },
        ] } },
        in: { $cond: ['$$active', { $multiply: [priceField, { $subtract: [1, { $divide: [{ $ifNull: ['$discountPercent', 0] }, 100] }] }] }, priceField] },
      } };
      const pipeline = [{ $match: filter }, { $addFields: { _effectivePrice: effectivePrice } }];
      const minPrice = req.query.minPrice === undefined || req.query.minPrice === '' ? null : Number(req.query.minPrice);
      const maxPrice = req.query.maxPrice === undefined || req.query.maxPrice === '' ? null : Number(req.query.maxPrice);
      if ((minPrice !== null && (!Number.isFinite(minPrice) || minPrice < 0)) || (maxPrice !== null && (!Number.isFinite(maxPrice) || maxPrice < 0)))
        return res.status(400).json({ message: 'Enter valid non-negative price limits.' });
      if (minPrice !== null && maxPrice !== null && minPrice > maxPrice)
        return res.status(400).json({ message: 'Minimum price cannot exceed maximum price.' });
      if (minPrice !== null || maxPrice !== null) {
        const range = {};
        if (minPrice !== null) range.$gte = minPrice;
        if (maxPrice !== null) range.$lte = maxPrice;
        pipeline.push({ $match: { _effectivePrice: range } });
      }
      if (req.query.sort === 'popular') {
        const popularProducts = await Order.aggregate([
          { $match: { status: { $ne: 'Cancelled' } } }, { $unwind: '$products' },
          { $match: { 'products.product': { $ne: null } } },
          { $group: { _id: '$products.product', units: { $sum: '$products.quantity' } } },
          { $sort: { units: -1 } },
        ]);
        pipeline.push({ $addFields: { _popularity: { $indexOfArray: [popularProducts.map(item => item._id), '$_id'] } } });
        pipeline.push({ $sort: { _popularity: 1, createdAt: -1 } });
      } else if (req.query.sort === 'price-asc') pipeline.push({ $sort: { _effectivePrice: 1, createdAt: -1 } });
      else if (req.query.sort === 'price-desc') pipeline.push({ $sort: { _effectivePrice: -1, createdAt: -1 } });
      else if (req.query.sort === 'name') pipeline.push({ $sort: { name: 1 } });
      else pipeline.push({ $sort: { createdAt: -1 } });
      pipeline.push({ $facet: { metadata: [{ $count: 'total' }], items: [{ $skip: (page - 1) * pageSize }, { $limit: pageSize }] } });
      const [result] = await Product.aggregate(pipeline);
      products = result?.items || [];
      total = result?.metadata?.[0]?.total || 0;
    } else {
      products = await Product.find(filter).sort({ createdAt: -1 });
      total = products.length;
    }

    const ids = products.map(product => product._id);
    const ratings = ids.length ? await Review.aggregate([
      { $match: { product: { $in: ids }, status: 'approved' } },
      { $group: { _id: '$product', averageRating: { $avg: '$rating' }, reviewCount: { $sum: 1 } } },
    ]) : [];
    const ratingByProduct = new Map(ratings.map(rating => [String(rating._id), rating]));
    const enriched = products.map(product => {
      const rating = ratingByProduct.get(String(product._id));
      const raw = typeof product.toObject === 'function' ? product.toObject() : product;
      return { ...raw, averageRating: rating ? Number(rating.averageRating.toFixed(1)) : 0, reviewCount: rating?.reviewCount || 0 };
    });
    res.json(paginated ? { items: enriched, pagination: { page, pageSize, total, pages: Math.ceil(total / pageSize) } } : enriched);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

const getSubcategories = async (req, res) => {
  try {
    const filter = { isVisible: { $ne: false } };
    if (typeof req.query.category === 'string' && req.query.category) filter.category = req.query.category;
    const values = await Product.distinct('subcategory', filter);
    res.json(values.filter(Boolean).sort((a, b) => a.localeCompare(b)));
  } catch (error) { res.status(500).json({ message: 'Subcategories could not be loaded.' }); }
};

// ─── @GET /api/products/categories ────────────────────────────
// ✅ FIX: This route was missing — AdminPage fetches this on load
const getCategories = async (req, res) => {
  try {
    const canIncludeHidden = req.query.includeHidden === 'true' && req.user?.isAdmin;
    const categories = await Product.distinct('category', canIncludeHidden ? {} : { isVisible: { $ne: false } });
    res.json(categories.filter(Boolean).sort());
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// ─── @GET /api/products/:id ────────────────────────────────────
const getProductById = async (req, res) => {
  try {
    const product = await Product.findById(req.params.id);
    if (product && product.isVisible !== false) {
      const [rating] = await Review.aggregate([
        { $match: { product: product._id, status: 'approved' } },
        { $group: { _id: '$product', averageRating: { $avg: '$rating' }, reviewCount: { $sum: 1 } } },
      ]);
      res.json({ ...product.toObject(), averageRating: rating ? Number(rating.averageRating.toFixed(1)) : 0, reviewCount: rating?.reviewCount || 0 });
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
    const { name, pricePKR, priceUSD, discountPercent = 0, discountStartDate = '', discountEndDate = '', category, subcategory, brand, model, colors, sizes, isVisible, description, isLocal, stock, weightKg } = req.body;

    if ((req.files || []).length > 5) {
      await Promise.all(req.files.map(file => fs.promises.unlink(file.path).catch(() => {})));
      return res.status(400).json({ message: 'A product can have at most 5 images.' });
    }

    // Validate required fields
    if (!name || !category) {
      return res.status(400).json({ message: 'Name and category are required.' });
    }
    if (!pricePKR || !priceUSD) {
      return res.status(400).json({ message: 'Both PKR and USD prices are required.' });
    }
    const discount = Number(discountPercent);
    if (!Number.isFinite(discount) || discount < 0 || discount > 100) {
      return res.status(400).json({ message: 'Discount must be between 0 and 100 percent.' });
    }
    if (!isValidDateOnly(discountStartDate) || !isValidDateOnly(discountEndDate) || (discountStartDate && discountEndDate && discountStartDate > discountEndDate)) {
      return res.status(400).json({ message: 'Enter valid discount dates and ensure the end date is not before the start date.' });
    }

    // ✅ FIX: req.files gives array from multer .array('images')
    const images = req.files ? req.files.map(f => f.filename) : [];

    const product = await Product.create({
      name:        name.trim(),
      pricePKR:    Number(pricePKR),
      priceUSD:    Number(priceUSD),
      discountPercent: discount,
      discountStartDate,
      discountEndDate,
      category:    category.trim(),
      subcategory: subcategory ? subcategory.trim() : '',
      brand:       brand ? brand.trim() : '',
      model:       model ? model.trim() : '',
      colors:      parseList(colors),
      sizes:       parseList(sizes),
      isVisible:   isVisible !== 'false' && isVisible !== false,
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
    res.status(error.name === 'ValidationError' ? 400 : 500).json({ message: error.message });
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
    if (req.body.discountPercent !== undefined) {
      const discount = Number(req.body.discountPercent);
      if (!Number.isFinite(discount) || discount < 0 || discount > 100) {
        return res.status(400).json({ message: 'Discount must be between 0 and 100 percent.' });
      }
      product.discountPercent = discount;
    }
    const discountStartDate = req.body.discountStartDate !== undefined ? String(req.body.discountStartDate).trim() : (product.discountStartDate || '');
    const discountEndDate = req.body.discountEndDate !== undefined ? String(req.body.discountEndDate).trim() : (product.discountEndDate || '');
    if (!isValidDateOnly(discountStartDate) || !isValidDateOnly(discountEndDate) || (discountStartDate && discountEndDate && discountStartDate > discountEndDate)) {
      return res.status(400).json({ message: 'Enter valid discount dates and ensure the end date is not before the start date.' });
    }
    product.discountStartDate = discountStartDate;
    product.discountEndDate = discountEndDate;
    product.category    = req.body.category    ?? product.category;
    product.subcategory = req.body.subcategory ?? product.subcategory;
    product.brand       = req.body.brand ?? product.brand;
    product.model       = req.body.model ?? product.model;
    product.colors      = req.body.colors !== undefined ? parseList(req.body.colors) : product.colors;
    product.sizes       = req.body.sizes !== undefined ? parseList(req.body.sizes) : product.sizes;
    product.isVisible   = req.body.isVisible !== undefined ? req.body.isVisible !== 'false' && req.body.isVisible !== false : product.isVisible;
    product.description = req.body.description ?? product.description;
    product.isLocal     = req.body.isLocal !== undefined ? (req.body.isLocal === 'true' || req.body.isLocal === true) : product.isLocal;
    product.stock       = req.body.stock     !== undefined ? Number(req.body.stock)     : product.stock;
    product.weightKg    = req.body.weightKg  !== undefined && req.body.weightKg !== ''
      ? Number(req.body.weightKg)
      : product.weightKg;

    // Handle images: keep existing + add new uploads
    if (req.body.replaceImages === 'true') {
      const keptImages = filterRetainedImages(req.body.keptImages || [], product.images);
      const newImages = req.files ? req.files.map(f => f.filename) : [];
      product.images = [...keptImages, ...newImages];
    } else if (req.files && req.files.length > 0) {
      product.images = [...(product.images || []), ...req.files.map(f => f.filename)];
    }

    if (product.images.length > 5) {
      await Promise.all((req.files || []).map(file => fs.promises.unlink(file.path).catch(() => {})));
      return res.status(400).json({ message: 'A product can have at most 5 images.' });
    }

    const updated = await product.save();
    res.json(updated);
  } catch (error) {
    console.error('updateProduct error:', error);
    res.status(error.name === 'ValidationError' ? 400 : 500).json({ message: error.message });
  }
};

// ─── @DELETE /api/products/:id ─────────────────────────────────
const deleteProduct = async (req, res) => {
  try {
    const product = await Product.findByIdAndDelete(req.params.id);
    if (product) {
      // Also delete image files from disk
      (product.images || []).forEach(img => {
        const filePath = resolveUploadedImagePath(path.join(__dirname, '..', 'uploads'), img);
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
  getSubcategories,
  getProductById,
  createProduct,
  updateProduct,
  deleteProduct,
};
