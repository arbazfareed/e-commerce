const User = require('../models/User');
const jwt = require('jsonwebtoken');
const crypto = require('crypto');
const emailService = require('../services/emailService');

// Helper: generate JWT token
const generateToken = (id) => {
  return jwt.sign({ id }, process.env.JWT_SECRET, { expiresIn: '30d' });
};

// ─── @POST /api/auth/register ──────────────────────────────────
const registerUser = async (req, res) => {
  // ✅ Now destructures ALL fields sent from RegisterPage
  const { name, username, email, password, phone, country, city } = req.body;

  try {
    if (typeof name !== 'string' || !name.trim() || typeof email !== 'string' || !email.trim() || !password) {
      return res.status(400).json({ message: 'Name, email and password are required.' });
    }
    if (!/^\S+@\S+\.\S+$/.test(email.trim())) {
      return res.status(400).json({ message: 'Please provide a valid email address.' });
    }
    if (String(password).length < 8) {
      return res.status(400).json({ message: 'Password must be at least 8 characters.' });
    }

    // Check if user already exists
    const normalizedEmail = String(email).trim().toLowerCase();
    const normalizedUsername = username ? String(username).trim().toLowerCase() : undefined;
    const exists = await User.findOne({
      $or: [{ email: normalizedEmail }, ...(normalizedUsername ? [{ username: normalizedUsername }] : [])],
    }).collation({ locale: 'en', strength: 2 });
    if (exists) {
      return res.status(400).json({
        message: exists.email === normalizedEmail
          ? 'An account with this email already exists.'
          : 'That username is already in use.',
      });
    }

    // Create user — phone/country/city saved if User model has those fields
    const user = await User.create({
      name:    name.trim(),
      username: normalizedUsername,
      email:   normalizedEmail,
      password,
      phone:   phone   || '',
      country: country || 'Pakistan',
      city:    city    || '',
    });

    res.status(201).json({
      _id:     user._id,
      name:    user.name,
      username: user.username,
      email:   user.email,
      phone:   user.phone,
      country: user.country,
      city:    user.city,
      isAdmin: user.isAdmin,
      token:   generateToken(user._id),
    });
  } catch (error) {
    console.error('Register error:', error);
    // Send the real error message to frontend
    res.status(500).json({ message: error.message });
  }
};

// ─── @POST /api/auth/login ─────────────────────────────────────
const loginUser = async (req, res) => {
  const identifier = req.body.identifier ?? req.body.login ?? req.body.email ?? req.body.username;
  const password = req.body.password;

  try {
    if (typeof identifier !== 'string' || !identifier.trim() || typeof password !== 'string' || !password) {
      return res.status(400).json({ message: 'Username/email and password are required.' });
    }

    const normalizedIdentifier = identifier.trim().toLowerCase();
    const user = await User.findOne({
      $or: [{ email: normalizedIdentifier }, { username: normalizedIdentifier }],
    }).collation({ locale: 'en', strength: 2 });

    if (user && (await user.matchPassword(password))) {
      res.json({
        _id:     user._id,
        name:    user.name,
        username: user.username,
        email:   user.email,
        phone:   user.phone,
        country: user.country,
        city:    user.city,
        isAdmin: user.isAdmin,
        token:   generateToken(user._id),
      });
    } else {
      res.status(401).json({ message: 'Invalid username/email or password.' });
    }
  } catch (error) {
    console.error('Login error:', error);
    res.status(500).json({ message: error.message });
  }
};

const changeOwnPassword = async (req, res) => {
  const { newPassword } = req.body || {};
  if (typeof newPassword !== 'string' || !newPassword) {
    return res.status(400).json({ message: 'New password is required.' });
  }
  if (newPassword.length < 12) {
    return res.status(400).json({ message: 'New password must be at least 12 characters.' });
  }

  try {
    const user = await User.findById(req.user._id);
    if (!user) return res.status(404).json({ message: 'User account was not found.' });
    if (await user.matchPassword(newPassword)) {
      return res.status(400).json({ message: 'New password must be different from your current password.' });
    }

    user.password = newPassword;
    await user.save();
    return res.json({ message: 'Your password was changed successfully.' });
  } catch (error) {
    console.error('Password change error:', error.message);
    return res.status(500).json({ message: 'Password could not be changed.' });
  }
};

const resetCustomerPassword = async (req, res) => {
  const { email } = req.body || {};
  if (typeof email !== 'string' || !/^\S+@\S+\.\S+$/.test(email.trim())) {
    return res.status(400).json({ message: 'A valid customer email is required.' });
  }

  try {
    const customer = await User.findOne({ email: email.trim().toLowerCase() });
    if (!customer) return res.status(404).json({ message: 'No customer account was found for that email.' });
    if (customer.isAdmin) {
      return res.status(403).json({ message: 'Admin passwords must be changed by that administrator.' });
    }

    const token = crypto.randomBytes(32).toString('base64url');
    customer.passwordResetTokenHash = crypto.createHash('sha256').update(token).digest('hex');
    customer.passwordResetExpiresAt = new Date(Date.now() + 20 * 60 * 1000);
    await customer.save();

    const frontendUrl = (process.env.FRONTEND_URL || 'http://localhost:3000').replace(/\/+$/, '');
    const resetUrl = `${frontendUrl}/reset-password/${token}`;
    try {
      await emailService.sendCustomerPasswordResetEmail({
        to: customer.email,
        name: customer.name,
        resetUrl,
      });
    } catch (error) {
      customer.passwordResetTokenHash = undefined;
      customer.passwordResetExpiresAt = undefined;
      await customer.save().catch(() => {});
      console.error('Password reset email delivery failed:', error.code || 'EMAIL_ERROR');
      return res.status(503).json({ message: 'Reset email could not be sent. Check email service settings and try again.' });
    }

    return res.json({ message: 'Password reset email sent to the customer.' });
  } catch (error) {
    console.error('Customer password reset request error:', error.message);
    return res.status(500).json({ message: 'Password reset request could not be completed.' });
  }
};

const completeCustomerPasswordReset = async (req, res) => {
  const { token, newPassword } = req.body || {};
  if (typeof token !== 'string' || token.length < 32 || token.length > 128
    || typeof newPassword !== 'string' || !newPassword) {
    return res.status(400).json({ message: 'A valid reset link and new password are required.' });
  }
  if (newPassword.length < 12) {
    return res.status(400).json({ message: 'New password must be at least 12 characters.' });
  }

  try {
    const tokenHash = crypto.createHash('sha256').update(token).digest('hex');
    const now = new Date();
    const user = await User.findOne({
      passwordResetTokenHash: tokenHash,
      passwordResetExpiresAt: { $gt: now },
    }).select('+passwordResetTokenHash +passwordResetExpiresAt');
    if (!user) return res.status(400).json({ message: 'This password reset link is invalid, expired, or already used.' });
    if (await user.matchPassword(newPassword)) {
      return res.status(400).json({ message: 'Choose a password different from the current password.' });
    }

    const claimed = await User.updateOne({
      _id: user._id,
      passwordResetTokenHash: tokenHash,
      passwordResetExpiresAt: { $gt: now },
    }, {
      $unset: { passwordResetTokenHash: 1, passwordResetExpiresAt: 1 },
    });
    if (claimed.modifiedCount !== 1) {
      return res.status(400).json({ message: 'This password reset link is invalid, expired, or already used.' });
    }

    user.password = newPassword;
    user.passwordResetTokenHash = undefined;
    user.passwordResetExpiresAt = undefined;
    await user.save();
    return res.json({ message: 'Your password was reset successfully.' });
  } catch (error) {
    console.error('Customer password reset completion error:', error.message);
    return res.status(500).json({ message: 'Password could not be reset.' });
  }
};

// ─── @GET /api/auth/profile ────────────────────────────────────
const getUserProfile = async (req, res) => {
  try {
    const user = await User.findById(req.user._id).select('-password');
    if (user) {
      res.json(user);
    } else {
      res.status(404).json({ message: 'User not found.' });
    }
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

const verifySession = (req, res) => res.json({ valid: true, user: req.user });

module.exports = { registerUser, loginUser, changeOwnPassword, resetCustomerPassword, completeCustomerPasswordReset, getUserProfile, verifySession };
