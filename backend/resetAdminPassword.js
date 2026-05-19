/**
 * resetAdminPassword.js
 * ─────────────────────
 * Run ONCE from backend folder to create/fix the admin account.
 *
 *   cd ~/Desktop/induscart/backend
 *   node resetAdminPassword.js
 */

require('dotenv').config();
const mongoose = require('mongoose');
const bcrypt   = require('bcryptjs');

const EMAIL    = 'admin@induscart.com';
const PASSWORD = 'admin123';
const NAME     = 'Admin';

(async () => {
  await mongoose.connect(process.env.MONGO_URI);
  console.log('✅ Connected\n');

  const salt   = await bcrypt.genSalt(10);
  const hashed = await bcrypt.hash(PASSWORD, salt);

  const result = await mongoose.connection.collection('users').updateOne(
    { email: EMAIL },
    { $set: { password: hashed, isAdmin: true, name: NAME } }
  );

  if (result.matchedCount === 0) {
    await mongoose.connection.collection('users').insertOne({
      name: NAME, email: EMAIL, password: hashed,
      isAdmin: true, phone: '', country: 'Pakistan', city: '',
      createdAt: new Date(), updatedAt: new Date(),
    });
    console.log('✅ Admin account CREATED');
  } else {
    console.log('✅ Admin password RESET');
  }

  console.log('');
  console.log('══════════════════════════════════');
  console.log('  Email    : ' + EMAIL);
  console.log('  Password : ' + PASSWORD);
  console.log('  Login    : http://localhost:3000/login');
  console.log('  Admin    : http://localhost:3000/admin');
  console.log('══════════════════════════════════\n');

  process.exit(0);
})().catch(err => { console.error('❌', err.message); process.exit(1); });
