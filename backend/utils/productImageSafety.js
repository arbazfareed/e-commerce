const path = require('path');

const filterRetainedImages = (requestedImages, existingImages) => {
  const existing = new Set(Array.isArray(existingImages) ? existingImages : []);
  const requested = Array.isArray(requestedImages) ? requestedImages : [requestedImages];
  return [...new Set(requested.filter(image => typeof image === 'string' && existing.has(image)))];
};

const resolveUploadedImagePath = (uploadsDirectory, imageName) =>
  path.join(uploadsDirectory, path.basename(String(imageName || '')));

module.exports = { filterRetainedImages, resolveUploadedImagePath };
