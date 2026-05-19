/**
 * createAdmin.js  —  run once to create your admin account
 *
 * Usage (from backend folder):
 *   node createAdmin.js
 *
 * It reads MONGO_URI from your .env file.
 */

require('dotenv').config();
const mongoose = require('mongoose');
const bcrypt   = require('bcryptjs');

// ── Inline User schema (avoids circular import issues) ────────
const userSchema = new mongoose.Schema({
  name:     String,
  email:    { type: String, unique: true, lowercase: true },
  password: String,
  isAdmin:  { type: Boolean, default: false },
}, { timestamps: true });

const User = mongoose.model('User', userSchema);

// ── Admin credentials — change these before running! ──────────
const ADMIN = {
  name:     'Admin',
  email:    'admin@induscart.com',   // ← your login email
  password: 'admin123',              // ← your login password (min 6 chars)
  isAdmin:  true,
};

(async () => {
  try {
    await mongoose.connect(process.env.MONGO_URI);
    console.log('✅ MongoDB connected');

    // Check if admin already exists
    const exists = await User.findOne({ email: ADMIN.email });
    if (exists) {
      console.log(`⚠️  Admin already exists: ${ADMIN.email}`);
      process.exit(0);
    }

    // Hash password manually (no pre-save hook in this script)
    const salt     = await bcrypt.genSalt(10);
    const hashed   = await bcrypt.hash(ADMIN.password, salt);

    await User.create({ ...ADMIN, password: hashed });

    console.log('');
    console.log('🎉 Admin user created successfully!');
    console.log('─────────────────────────────────────');
    console.log(`   Email    : ${ADMIN.email}`);
    console.log(`   Password : ${ADMIN.password}`);
    console.log(`   URL      : http://localhost:3000/login`);
    console.log('─────────────────────────────────────');
    console.log('Login, then go to /admin');
    console.log('');

    process.exit(0);
  } catch (err) {
    console.error('❌ Error:', err.message);
    process.exit(1);
  }
})();
