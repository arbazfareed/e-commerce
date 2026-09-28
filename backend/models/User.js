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
    isAdmin:  { type: Boolean, default: false },
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
