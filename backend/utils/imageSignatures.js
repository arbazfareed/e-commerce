const IMAGE_SIGNATURES = Object.freeze({
  'image/jpeg': (header) => header[0] === 0xff && header[1] === 0xd8 && header[2] === 0xff,
  'image/png': (header) => header.subarray(0, 8).equals(Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a])),
  'image/webp': (header) => header.toString('ascii', 0, 4) === 'RIFF' && header.toString('ascii', 8, 12) === 'WEBP',
});

const hasValidImageSignature = (header, mimeType) =>
  Buffer.isBuffer(header) && Boolean(IMAGE_SIGNATURES[mimeType]?.(header));

module.exports = { hasValidImageSignature };
