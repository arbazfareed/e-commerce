require('dotenv').config();

const mongoose = require('mongoose');
const User = require('../models/User');

const required = ['ADMIN_NAME', 'ADMIN_EMAIL', 'ADMIN_PASSWORD'];
const missing = required.filter(name => !process.env[name]?.trim());

if (missing.length) {
  console.error(`Missing admin environment variables: ${missing.join(', ')}`);
  process.exit(1);
}

if (process.env.ADMIN_PASSWORD.length < 12) {
  console.error('ADMIN_PASSWORD must be at least 12 characters.');
  process.exit(1);
}

const run = async () => {
  try {
    await mongoose.connect(process.env.MONGO_URI);
    const email = process.env.ADMIN_EMAIL.trim().toLowerCase();
    const existing = await User.findOne({ email }).select('_id');

    if (existing) {
      throw new Error(`An account already exists for ${email}. No changes were made.`);
    }

    await User.create({
      name: process.env.ADMIN_NAME.trim(),
      email,
      password: process.env.ADMIN_PASSWORD,
      isAdmin: true,
    });

    console.log(`Admin account created for ${email}.`);
  } finally {
    await mongoose.disconnect();
  }
};

run().catch(error => {
  console.error(`Admin bootstrap failed: ${error.message}`);
  process.exitCode = 1;
});
