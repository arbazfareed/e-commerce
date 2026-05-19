const mongoose = require('mongoose');

// Each product inside an order
const orderItemSchema = new mongoose.Schema({
  product: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Product',
    required: true,
  },
  name:     { type: String,  required: true },
  price:    { type: Number,  required: true },
  quantity: { type: Number,  required: true, default: 1 },
  image:    { type: String },
  weightKg: { type: Number,  default: 0 },  // 0 = no per-kg charge (glasses, accessories, etc.)
});

const orderSchema = new mongoose.Schema(
  {
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    products: [orderItemSchema],

    // ─── Pricing (from SRS Section 3.5 & Section 7) ───────────
    productTotal: { type: Number, required: true },   // sum(price × qty)
    shippingFee:  { type: Number, required: true },   // zone-based shipping fee
    totalWeight:  { type: Number, default: 0 },       // total cart weight in kg
    shippingZone: { type: String, default: 'domestic_pak' }, // detected zone
    totalPrice:   { type: Number, required: true },   // productTotal + shippingFee

    // ─── Delivery ─────────────────────────────────────────────
    address: {
      street:  { type: String },
      city:    { type: String },
      country: { type: String, default: 'Pakistan' },
    },

    // ─── Payment ──────────────────────────────────────────────
    paymentMethod: {
      type: String,
      enum: ['JazzCash', 'EasyPaisa', 'COD', 'Stripe', 'PayPal'],
      required: true,
    },
    isPaid: { type: Boolean, default: false },
    paidAt: { type: Date },

    // ─── Order Status ─────────────────────────────────────────
    status: {
      type: String,
      enum: ['Pending', 'Processing', 'Shipped', 'Delivered', 'Cancelled'],
      default: 'Pending',
    },
  },
  { timestamps: true }
);

module.exports = mongoose.model('Order', orderSchema);
