const mongoose = require('mongoose');
const Product = require('../models/Product');
const User = require('../models/User');

const getWishlist = async (req, res) => {
  try {
    const user = await User.findById(req.user._id).populate({ path: 'wishlist', match: { isVisible: { $ne: false } } }).select('wishlist');
    res.json(user?.wishlist || []);
  } catch (error) { res.status(500).json({ message: 'Wishlist could not be loaded.' }); }
};

const addToWishlist = async (req, res) => {
  const productId = req.params.productId;
  if (!mongoose.isValidObjectId(productId)) return res.status(400).json({ message: 'Choose a valid product.' });
  try {
    const product = await Product.findOne({ _id: productId, isVisible: { $ne: false } });
    if (!product) return res.status(404).json({ message: 'Product not found.' });
    await User.findByIdAndUpdate(req.user._id, { $addToSet: { wishlist: product._id } });
    res.json({ message: 'Product saved to your wishlist.', product });
  } catch (error) { res.status(500).json({ message: 'Product could not be saved.' }); }
};

const removeFromWishlist = async (req, res) => {
  if (!mongoose.isValidObjectId(req.params.productId)) return res.status(400).json({ message: 'Choose a valid product.' });
  try {
    await User.findByIdAndUpdate(req.user._id, { $pull: { wishlist: req.params.productId } });
    res.json({ message: 'Product removed from your wishlist.' });
  } catch (error) { res.status(500).json({ message: 'Product could not be removed.' }); }
};

module.exports = { getWishlist, addToWishlist, removeFromWishlist };