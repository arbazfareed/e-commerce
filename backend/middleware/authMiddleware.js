const jwt  = require('jsonwebtoken');
const User = require('../models/User');
const Store = require('../models/Store');

// Must be logged in
const protect = async (req, res, next) => {
  let token;
  if (req.headers.authorization?.startsWith('Bearer')) {
    try {
      token = req.headers.authorization.split(' ')[1];
      const decoded = jwt.verify(token, process.env.JWT_SECRET);
      req.user = await User.findById(decoded.id).select('-password');
      if (!req.user) return res.status(401).json({ message: 'Not authorized, user not found' });
      if ((decoded.v || 0) !== (req.user.tokenVersion || 0))
        return res.status(401).json({ message: 'Your session has ended. Please sign in again.' });
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

// Main admin OR an active store owner (sub-admin). Sets req.storeScope:
//   null       → main admin, may work on every store
//   ObjectId   → sub-admin, limited to this one store
const staff = async (req, res, next) => {
  if (req.user?.isAdmin) { req.storeScope = null; return next(); }
  if (req.user?.isSubAdmin && req.user.store) {
    try {
      const store = await Store.findById(req.user.store).select('name isActive').lean();
      if (!store || !store.isActive) return res.status(403).json({ message: 'Your store is switched off. Contact the IndusCart admin.' });
      req.store = store;
      req.storeScope = store._id;
      return next();
    } catch {
      return res.status(500).json({ message: 'Store access could not be checked. Please try again.' });
    }
  }
  return res.status(403).json({ message: 'Not authorized for store management' });
};

// Attach a valid user when a bearer token is present, but keep public routes public.
// This lets catalog routes expose hidden records only to authenticated admins.
const optionalProtect = async (req, res, next) => {
  const header = req.headers.authorization;
  if (!header?.startsWith('Bearer ')) return next();
  try {
    const decoded = jwt.verify(header.split(' ')[1], process.env.JWT_SECRET);
    const user = await User.findById(decoded.id).select('-password');
    if (user && (decoded.v || 0) === (user.tokenVersion || 0)) req.user = user;
  } catch {
    // Invalid optional credentials do not turn a public catalog request into a 401.
  }
  return next();
};

module.exports = { protect, admin, staff, optionalProtect };
