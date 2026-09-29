const mongoose = require('mongoose');
const Product = require('../models/Product');
const User = require('../models/User');

const normalizeCart = async items => {
  if (!Array.isArray(items) || items.length > 100) return { error: 'Cart must contain at most 100 items.' };
  const output = [];
  for (const item of items) {
    const productId = item?.product || item?._id;
    const quantity = Number(item?.quantity);
    if (!mongoose.isValidObjectId(productId) || !Number.isInteger(quantity) || quantity < 1)
      return { error: 'Cart contains an invalid item or quantity.' };
    const product = await Product.findOne({ _id: productId, isVisible: { $ne: false } });
    if (!product || product.stock < 1) continue;
    const selectedColor = typeof item.selectedColor === 'string' ? item.selectedColor : '';
    const selectedSize = typeof item.selectedSize === 'string' ? item.selectedSize : '';
    if ((selectedColor && !product.colors.includes(selectedColor)) || (selectedSize && !product.sizes.includes(selectedSize)))
      return { error: `A selected option for ${product.name} is no longer available.` };
    const safeQuantity = Math.min(quantity, product.stock);
    const existing = output.find(entry => String(entry.product) === String(product._id) && entry.selectedColor === selectedColor && entry.selectedSize === selectedSize);
    if (existing) existing.quantity = Math.min(product.stock, existing.quantity + safeQuantity);
    else output.push({ product: product._id, quantity: safeQuantity, selectedColor, selectedSize });
  }
  return { items: output };
};

const getCart = async (req, res) => {
  try {
    const user = await User.findById(req.user._id).populate('cart.product').select('cart');
    const cart = (user?.cart || []).filter(item => item.product && item.product.isVisible !== false && item.product.stock > 0)
      .map(item => ({ ...item.product.toObject(), quantity: Math.min(item.quantity, item.product.stock), selectedColor: item.selectedColor || '', selectedSize: item.selectedSize || '' }));
    res.json(cart);
  } catch (error) { res.status(500).json({ message: 'Cart could not be loaded.' }); }
};

const saveCart = async (req, res) => {
  const normalized = await normalizeCart(req.body?.items);
  if (normalized.error) return res.status(400).json({ message: normalized.error });
  try {
    const user = await User.findByIdAndUpdate(req.user._id, { $set: { cart: normalized.items } }, { new: true })
      .populate('cart.product').select('cart');
    const cart = (user?.cart || []).filter(item => item.product && item.product.isVisible !== false)
      .map(item => ({ ...item.product.toObject(), quantity: Math.min(item.quantity, item.product.stock), selectedColor: item.selectedColor || '', selectedSize: item.selectedSize || '' }));
    res.json(cart);
  } catch (error) { res.status(500).json({ message: 'Cart could not be saved.' }); }
};

module.exports = { getCart, saveCart };