const mongoose = require('mongoose');

// router.param handler: reject malformed IDs with 404 before they reach a query
// (otherwise Mongoose throws a CastError and the API answers 500).
const validateObjectIdParam = (label = 'Record') => (req, res, next, value) => {
  if (!mongoose.isValidObjectId(value)) return res.status(404).json({ message: `${label} not found.` });
  return next();
};

module.exports = { validateObjectIdParam };
