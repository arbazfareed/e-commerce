const mongoose = require('mongoose');
const bcrypt   = require('bcryptjs');

const userSchema = new mongoose.Schema(
  {
    name:     { type: String, required: [true, 'Name is required'], trim: true },
    username: { type: String, trim: true, lowercase: true, unique: true, sparse: true },
    email:    { type: String, required: [true, 'Email is required'], unique: true, lowercase: true, trim: true },
    password: { type: String, required: [true, 'Password is required'], minlength: 8 },
    phone:    { type: String, default: '', trim: true },
    country:  { type: String, default: 'Pakistan', trim: true },
    city:     { type: String, default: '', trim: true },
    wishlist: [{ type: mongoose.Schema.Types.ObjectId, ref: 'Product' }],
    cart: [{
      product: { type: mongoose.Schema.Types.ObjectId, ref: 'Product', required: true },
      quantity: { type: Number, min: 1, required: true },
      selectedColor: { type: String, default: '' },
      selectedSize: { type: String, default: '' },
    }],
    isAdmin:  { type: Boolean, default: false },
    // Store owner (sub-admin): manages only the products of `store`. Never has isAdmin.
    isSubAdmin: { type: Boolean, default: false },
    store: { type: mongoose.Schema.Types.ObjectId, ref: 'Store', default: null },
    // Set when the main admin creates or resets the account; cleared on first password change.
    mustChangePassword: { type: Boolean, default: false },
    // Bumped on every password change or reset; older sign-in tokens stop working.
    tokenVersion: { type: Number, default: 0, min: 0 },
    passwordResetTokenHash: { type: String, select: false },
    passwordResetExpiresAt: { type: Date, select: false },
  },
  { timestamps: true }
);

userSchema.pre('save', async function () {
  if (!this.isModified('password')) return;
  const salt = await bcrypt.genSalt(10);
  this.password = await bcrypt.hash(this.password, salt);
});

userSchema.methods.matchPassword = async function (entered) {
  if (!entered || !this.password) return false;
  return bcrypt.compare(String(entered), this.password);
};

module.exports = mongoose.model('User', userSchema);
