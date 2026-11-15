// Couriers and COD need a phone number they can call. Pakistan numbers must be
// mobile numbers (03XX-XXXXXXX, +92 3XX XXXXXXX); other countries need 7–15 digits.
const normalizePhone = value => String(value || '').trim().replace(/[\s\-().]/g, '');

const isValidPhone = (value, country = 'Pakistan') => {
  const phone = normalizePhone(value);
  if (!phone) return false;
  if (String(country || '').trim().toLowerCase() === 'pakistan')
    return /^(?:\+92|0092|92|0)3\d{9}$/.test(phone);
  return /^\+?\d{7,15}$/.test(phone);
};

module.exports = { isValidPhone, normalizePhone };
