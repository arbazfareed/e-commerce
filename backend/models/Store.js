const mongoose = require('mongoose');

// A seller store run by a sub-admin (store owner). Products with no store belong to
// the main IndusCart store managed by the main admin.
const storeSchema = new mongoose.Schema({
  name: { type: String, required: true, trim: true, minlength: 2, maxlength: 80 },
  nameKey: { type: String, required: true, unique: true }, // lower-case name, for uniqueness
  slug: { type: String, required: true, unique: true, lowercase: true, trim: true },
  isActive: { type: Boolean, default: true },
  createdBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
}, { timestamps: true });

module.exports = mongoose.model('Store', storeSchema);
