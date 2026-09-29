const mongoose = require('mongoose');

const couponSchema = new mongoose.Schema({
  code: { type: String, required: true, unique: true, trim: true, uppercase: true, minlength: 3, maxlength: 40 },
  description: { type: String, trim: true, default: '', maxlength: 200 },
  discountType: { type: String, enum: ['percentage', 'flat'], required: true },
  discountValue: { type: Number, required: true, min: 0 },
  currency: { type: String, enum: ['PKR', 'USD'], default: 'PKR' },
  minimumOrderAmount: { type: Number, min: 0, default: 0 },
  expiresAt: { type: String, default: '' },
  usageLimit: { type: Number, min: 1, default: null },
  usageCount: { type: Number, min: 0, default: 0 },
  isActive: { type: Boolean, default: true },
}, { timestamps: true });

module.exports = mongoose.model('Coupon', couponSchema);