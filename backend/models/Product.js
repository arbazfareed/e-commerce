const mongoose = require('mongoose');

const productSchema = new mongoose.Schema(
  {
    name:        { type: String, required: [true, 'Product name is required'], trim: true },
    description: { type: String, default: '', trim: true },
    category:    { type: String, required: [true, 'Category is required'], trim: true },
    subcategory: { type: String, default: '', trim: true },
    brand:       { type: String, default: '', trim: true },
    model:       { type: String, default: '', trim: true },
    colors:      { type: [String], default: [] },
    sizes:       { type: [String], default: [] },
    isVisible:   { type: Boolean, default: true },

    // ✅ pricePKR and priceUSD — NOT the old "price" field
    pricePKR:    { type: Number, required: [true, 'PKR price is required'], min: 0, default: 0 },
    priceUSD:    { type: Number, required: [true, 'USD price is required'], min: 0, default: 0 },
    discountPercent: { type: Number, default: 0, min: 0, max: 100 },
    discountStartDate: { type: String, default: '' },
    discountEndDate: { type: String, default: '' },

    images:      { type: [String], default: [] },
    isLocal:     { type: Boolean, default: false },
    stock:       { type: Number, default: 0, min: 0 },
    weightKg:    { type: Number, default: 0, min: 0 },
  },
  { timestamps: true }
);

module.exports = mongoose.model('Product', productSchema);
