const jwt  = require('jsonwebtoken');
const User = require('../models/User');

// Must be logged in
const protect = async (req, res, next) => {
  let token;
  if (req.headers.authorization?.startsWith('Bearer')) {
    try {
      token = req.headers.authorization.split(' ')[1];
      const decoded = jwt.verify(token, process.env.JWT_SECRET);
      req.user = await User.findById(decoded.id).select('-password');
      if (!req.user) return res.status(401).json({ message: 'Not authorized, user not found' });
      return next();
    } catch {
      return res.status(401).json({ message: 'Not authorized, token failed' });
    }
  }
  if (!token) return res.status(401).json({ message: 'Not authorized, no token' });
};

// Must be admin
const admin = (req, res, next) => {
  if (req.user?.isAdmin) return next();
  res.status(403).json({ message: 'Not authorized as admin' });
};

// Attach a valid user when a bearer token is present, but keep public routes public.
// This lets catalog routes expose hidden records only to authenticated admins.
const optionalProtect = async (req, res, next) => {
  const header = req.headers.authorization;
  if (!header?.startsWith('Bearer ')) return next();
  try {
    const decoded = jwt.verify(header.split(' ')[1], process.env.JWT_SECRET);
    req.user = await User.findById(decoded.id).select('-password');
  } catch {
    // Invalid optional credentials do not turn a public catalog request into a 401.
  }
  return next();
};

module.exports = { protect, admin, optionalProtect };
