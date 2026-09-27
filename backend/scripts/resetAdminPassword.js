require('dotenv').config();

const mongoose = require('mongoose');
const User = require('../models/User');

const email = process.env.ADMIN_EMAIL?.trim().toLowerCase();
const password = process.env.ADMIN_PASSWORD;

if (!email || !password) {
  console.error('Set ADMIN_EMAIL and ADMIN_PASSWORD before running this command.');
  process.exit(1);
}

if (password.length < 12) {
  console.error('ADMIN_PASSWORD must be at least 12 characters.');
  process.exit(1);
}

const run = async () => {
  try {
    await mongoose.connect(process.env.MONGO_URI);
    const user = await User.findOne({ email });
    if (!user) throw new Error(`No account found for ${email}.`);
    user.password = password;
    user.isAdmin = true;
    await user.save();
    console.log(`Admin password updated for ${email}.`);
  } finally {
    await mongoose.disconnect();
  }
};

run().catch(error => {
  console.error(`Admin password reset failed: ${error.message}`);
  process.exitCode = 1;
});
