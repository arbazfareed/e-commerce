/**
 * makeAdmin.js  —  Run this ONCE from your backend folder
 *
 * What it does:
 *   1. Connects to your MongoDB
 *   2. Checks if admin@induscart.com already exists
 *      → If YES:  sets isAdmin = true  (promotes existing user)
 *      → If NO:   creates a brand new admin user
 *
 * HOW TO RUN:
 *   cd ~/Desktop/induscart/backend
 *   node makeAdmin.js
 */

require('dotenv').config();
const mongoose = require('mongoose');
const bcrypt   = require('bcryptjs');

// ── Change these if you want different credentials ────────────
const ADMIN_EMAIL    = 'admin@induscart.com';
const ADMIN_PASSWORD = 'admin123';
const ADMIN_NAME     = 'Admin';
// ─────────────────────────────────────────────────────────────

const userSchema = new mongoose.Schema({
  name:     String,
  email:    { type: String, unique: true, lowercase: true },
  password: String,
  isAdmin:  { type: Boolean, default: false },
}, { timestamps: true });

const User = mongoose.model('User', userSchema);

(async () => {
  try {
    console.log('\n⏳ Connecting to MongoDB...');
    await mongoose.connect(process.env.MONGO_URI);
    console.log('✅ Connected!\n');

    const existing = await User.findOne({ email: ADMIN_EMAIL });

    if (existing) {
      // ── User exists → just promote to admin ─────────────
      if (existing.isAdmin) {
        console.log('✅ This user is already an admin!');
        console.log(`   Email: ${ADMIN_EMAIL}`);
        console.log('   Just login at http://localhost:3000/login\n');
      } else {
        await User.findOneAndUpdate(
          { email: ADMIN_EMAIL },
          { $set: { isAdmin: true } }
        );
        console.log('🎉 SUCCESS! User promoted to admin.');
        console.log('────────────────────────────────────');
        console.log(`   Email    : ${ADMIN_EMAIL}`);
        console.log(`   Password : (your existing password)`);
        console.log('   Go to    : http://localhost:3000/login');
        console.log('   Then     : http://localhost:3000/admin\n');
      }
    } else {
      // ── User does not exist → create fresh admin ─────────
      const salt   = await bcrypt.genSalt(10);
      const hashed = await bcrypt.hash(ADMIN_PASSWORD, salt);

      await User.create({
        name:     ADMIN_NAME,
        email:    ADMIN_EMAIL,
        password: hashed,
        isAdmin:  true,
      });

      console.log('🎉 SUCCESS! Admin user created.');
      console.log('────────────────────────────────────');
      console.log(`   Email    : ${ADMIN_EMAIL}`);
      console.log(`   Password : ${ADMIN_PASSWORD}`);
      console.log('   Go to    : http://localhost:3000/login');
      console.log('   Then     : http://localhost:3000/admin\n');
    }

    // ── Show ALL admins in database ───────────────────────
    const allAdmins = await User.find({ isAdmin: true }).select('name email isAdmin');
    console.log(`📋 All admin accounts in your database (${allAdmins.length}):`);
    allAdmins.forEach(a => console.log(`   → ${a.email}  (${a.name})`));
    console.log('');

    process.exit(0);
  } catch (err) {
    console.error('\n❌ ERROR:', err.message);
    console.error('\nMake sure:');
    console.error('  1. Your .env file exists in the backend folder');
    console.error('  2. MONGO_URI is set correctly in .env');
    console.error('  3. MongoDB Atlas is accessible (check network/IP whitelist)\n');
    process.exit(1);
  }
})();
