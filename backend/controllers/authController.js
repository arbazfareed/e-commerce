const User = require('../models/User');
const jwt = require('jsonwebtoken');

// Helper: generate JWT token
const generateToken = (id) => {
  return jwt.sign({ id }, process.env.JWT_SECRET, { expiresIn: '30d' });
};

// ─── @POST /api/auth/register ──────────────────────────────────
const registerUser = async (req, res) => {
  // ✅ Now destructures ALL fields sent from RegisterPage
  const { name, email, password, phone, country, city } = req.body;

  try {
    if (!name || !email || !password) {
      return res.status(400).json({ message: 'Name, email and password are required.' });
    }

    // Check if user already exists
    const exists = await User.findOne({ email: email.toLowerCase() });
    if (exists) {
      return res.status(400).json({ message: 'An account with this email already exists.' });
    }

    // Create user — phone/country/city saved if User model has those fields
    const user = await User.create({
      name:    name.trim(),
      email:   email.trim().toLowerCase(),
      password,
      phone:   phone   || '',
      country: country || 'Pakistan',
      city:    city    || '',
    });

    res.status(201).json({
      _id:     user._id,
      name:    user.name,
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
  const { email, password } = req.body;

  try {
    if (!email || !password) {
      return res.status(400).json({ message: 'Email and password are required.' });
    }

    const user = await User.findOne({ email: email.toLowerCase() });

    if (user && (await user.matchPassword(password))) {
      res.json({
        _id:     user._id,
        name:    user.name,
        email:   user.email,
        phone:   user.phone,
        country: user.country,
        city:    user.city,
        isAdmin: user.isAdmin,
        token:   generateToken(user._id),
      });
    } else {
      res.status(401).json({ message: 'Invalid email or password.' });
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

module.exports = { registerUser, loginUser, getUserProfile };
