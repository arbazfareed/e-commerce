const User = require('../models/User');
const jwt = require('jsonwebtoken');

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

module.exports = { registerUser, loginUser, getUserProfile, verifySession };
