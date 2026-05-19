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

module.exports = { protect, admin };
