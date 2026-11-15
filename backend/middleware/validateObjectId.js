const mongoose = require('mongoose');

// Route middleware: reject malformed IDs with 404 before they reach a query
// (otherwise Mongoose throws a CastError and the API answers 500).
// Place it AFTER protect/admin so signed-out callers still get 401 first.
const requireValidId = (label = 'Record', param = 'id') => (req, res, next) => {
  if (!mongoose.isValidObjectId(req.params[param])) return res.status(404).json({ message: `${label} not found.` });
  return next();
};

module.exports = { requireValidId };
