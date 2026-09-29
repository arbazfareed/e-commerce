const crypto = require('crypto');

const VERSION = 'enc:v1';
const getEncryptionKey = () => {
  const secret = process.env.SETTINGS_ENCRYPTION_KEY;
  if (typeof secret !== 'string' || secret.trim().length < 32) return null;
  return crypto.scryptSync(secret, 'induscart-settings-v1', 32);
};

const isEncryptedSecret = value => typeof value === 'string' && value.startsWith(`${VERSION}:`);

const encryptSecret = value => {
  const key = getEncryptionKey();
  if (!key) throw new Error('SETTINGS_ENCRYPTION_KEY must be set to at least 32 characters before saving provider secrets.');
  const iv = crypto.randomBytes(12);
  const cipher = crypto.createCipheriv('aes-256-gcm', key, iv);
  const encrypted = Buffer.concat([cipher.update(String(value), 'utf8'), cipher.final()]);
  const tag = cipher.getAuthTag();
  return `${VERSION}:${iv.toString('base64')}:${tag.toString('base64')}:${encrypted.toString('base64')}`;
};

const decryptSecret = value => {
  if (!isEncryptedSecret(value)) return value || '';
  const key = getEncryptionKey();
  if (!key) throw new Error('SETTINGS_ENCRYPTION_KEY is required to use saved provider secrets.');
  const [, version, ivText, tagText, encryptedText] = value.split(':');
  if (version !== 'v1' || !ivText || !tagText || !encryptedText) throw new Error('Saved provider secret has an unsupported format.');
  const decipher = crypto.createDecipheriv('aes-256-gcm', key, Buffer.from(ivText, 'base64'));
  decipher.setAuthTag(Buffer.from(tagText, 'base64'));
  return Buffer.concat([decipher.update(Buffer.from(encryptedText, 'base64')), decipher.final()]).toString('utf8');
};

module.exports = { encryptSecret, decryptSecret, isEncryptedSecret, hasEncryptionKey: () => Boolean(getEncryptionKey()) };