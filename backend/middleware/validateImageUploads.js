const fs = require('fs/promises');
const { hasValidImageSignature } = require('../utils/imageSignatures');

const removeUploadedFiles = async () => {
  // No-op because images are kept in memory and saved directly to the database.
};

const validateImageUploads = async (req, res, next) => {
  const files = req.files || [];
  try {
    for (const file of files) {
      const header = file.buffer ? file.buffer.subarray(0, 12) : null;
      if (!header || !hasValidImageSignature(header, file.mimetype)) {
        return res.status(400).json({ message: 'Uploaded file content does not match a supported image type.' });
      }
    }
    return next();
  } catch (error) {
    return next(error);
  }
};

module.exports = { validateImageUploads, removeUploadedFiles };
