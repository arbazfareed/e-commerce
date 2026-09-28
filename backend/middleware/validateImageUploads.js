const fs = require('fs/promises');
const { hasValidImageSignature } = require('../utils/imageSignatures');

const removeUploadedFiles = async (files = []) => {
  await Promise.all(files.map(file => fs.unlink(file.path).catch(() => {})));
};

const validateImageUploads = async (req, res, next) => {
  const files = req.files || [];
  try {
    for (const file of files) {
      const handle = await fs.open(file.path, 'r');
      let header;
      try {
        header = Buffer.alloc(12);
        await handle.read(header, 0, header.length, 0);
      } finally {
        await handle.close();
      }
      if (!hasValidImageSignature(header, file.mimetype)) {
        await removeUploadedFiles(files);
        return res.status(400).json({ message: 'Uploaded file content does not match a supported image type.' });
      }
    }
    return next();
  } catch (error) {
    await removeUploadedFiles(files);
    return next(error);
  }
};

module.exports = { validateImageUploads, removeUploadedFiles };
