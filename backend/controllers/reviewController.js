const mongoose = require('mongoose');
const Product = require('../models/Product');
const Review = require('../models/Review');
const Order = require('../models/Order');

const getProductReviews = async (req, res) => {
  try {
    const { productId } = req.params;
    if (!mongoose.isValidObjectId(productId)) return res.status(404).json({ message: 'Product not found.' });
    const product = await Product.findOne({ _id: productId, isVisible: { $ne: false } }).select('_id');
    if (!product) return res.status(404).json({ message: 'Product not found.' });
    const reviews = await Review.find({ product: productId, status: 'approved' }).populate('user', 'name').sort({ createdAt: -1 }).lean();
    const averageRating = reviews.length ? reviews.reduce((sum, review) => sum + review.rating, 0) / reviews.length : 0;
    let canReview = false;
    let hasReviewed = false;
    if (req.user && !req.user.isAdmin) {
      [hasReviewed, canReview] = await Promise.all([
        Review.exists({ product: productId, user: req.user._id }),
        Order.exists({ user: req.user._id, status: 'Delivered', 'products.product': productId }),
      ]);
      canReview = Boolean(canReview && !hasReviewed);
      hasReviewed = Boolean(hasReviewed);
    }
    res.json({ reviews, averageRating: Number(averageRating.toFixed(1)), reviewCount: reviews.length, canReview, hasReviewed });
  } catch (error) { res.status(500).json({ message: 'Reviews could not be loaded.' }); }
};

const createReview = async (req, res) => {
  const productId = req.body?.productId;
  const rating = Number(req.body?.rating);
  const comment = typeof req.body?.comment === 'string' ? req.body.comment.trim() : '';
  if (!mongoose.isValidObjectId(productId)) return res.status(400).json({ message: 'Choose a valid product.' });
  if (!Number.isInteger(rating) || rating < 1 || rating > 5) return res.status(400).json({ message: 'Choose a rating from 1 to 5 stars.' });
  if (comment.length < 3 || comment.length > 1000) return res.status(400).json({ message: 'Review comments must be between 3 and 1000 characters.' });
  try {
    const product = await Product.findOne({ _id: productId, isVisible: { $ne: false } });
    if (!product) return res.status(404).json({ message: 'Product not found.' });
    const purchased = await Order.exists({ user: req.user._id, status: 'Delivered', 'products.product': productId });
    if (!purchased) return res.status(403).json({ message: 'Only customers with a delivered order for this product can review it.' });
    const existing = await Review.exists({ user: req.user._id, product: productId });
    if (existing) return res.status(409).json({ message: 'You have already submitted a review for this product.' });
    const review = await Review.create({ product: productId, user: req.user._id, rating, comment });
    res.status(201).json({ message: 'Review submitted and is awaiting moderation.', review });
  } catch (error) {
    if (error.code === 11000) return res.status(409).json({ message: 'You have already submitted a review for this product.' });
    res.status(500).json({ message: 'Review could not be submitted.' });
  }
};

const listReviewsForModeration = async (req, res) => {
  try {
    const reviews = await Review.find().populate('user', 'name email').populate('product', 'name').sort({ createdAt: -1 }).lean();
    res.json(reviews);
  } catch (error) { res.status(500).json({ message: 'Reviews could not be loaded.' }); }
};

const moderateReview = async (req, res) => {
  const { status } = req.body || {};
  if (!['approved', 'rejected', 'pending'].includes(status)) return res.status(400).json({ message: 'Choose a valid review status.' });
  try {
    const review = await Review.findByIdAndUpdate(req.params.reviewId, { status }, { new: true, runValidators: true })
      .populate('user', 'name email').populate('product', 'name');
    if (!review) return res.status(404).json({ message: 'Review not found.' });
    res.json(review);
  } catch (error) { res.status(500).json({ message: 'Review moderation failed.' }); }
};

module.exports = { getProductReviews, createReview, listReviewsForModeration, moderateReview };