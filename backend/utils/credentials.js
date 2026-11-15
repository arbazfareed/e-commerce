const crypto = require('crypto');

// Letters and digits that are hard to confuse when read aloud or copied (no 0/O, 1/l/I).
const LOWER = 'abcdefghijkmnpqrstuvwxyz';
const UPPER = 'ABCDEFGHJKLMNPQRSTUVWXYZ';
const DIGITS = '23456789';
const SYMBOLS = '!@#$%*?';

const pick = chars => chars[crypto.randomInt(chars.length)];

// 14 characters with at least one of each kind; meets the 12-character password rule.
const generatePassword = (length = 14) => {
  const all = LOWER + UPPER + DIGITS + SYMBOLS;
  const chars = [pick(LOWER), pick(UPPER), pick(DIGITS), pick(SYMBOLS)];
  while (chars.length < length) chars.push(pick(all));
  for (let i = chars.length - 1; i > 0; i -= 1) {
    const j = crypto.randomInt(i + 1);
    [chars[i], chars[j]] = [chars[j], chars[i]];
  }
  return chars.join('');
};

const slugify = value => String(value || '')
  .normalize('NFKD').replace(/[̀-ͯ]/g, '')
  .toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-+|-+$/g, '').slice(0, 24) || 'store';

// e.g. "Lahore Crafts" → "lahore-crafts-4821". `isTaken` is an async check.
const generateUsername = async (storeName, isTaken) => {
  const base = slugify(storeName);
  for (let attempt = 0; attempt < 20; attempt += 1) {
    const candidate = `${base}-${crypto.randomInt(1000, 10000)}`;
    if (!(await isTaken(candidate))) return candidate;
  }
  throw new Error('Could not create a unique username.');
};

module.exports = { generatePassword, generateUsername, slugify };
