// Same rules as backend/utils/phone.js.
export const normalizePhone = value => String(value || '').trim().replace(/[\s\-().]/g, '');

export const isValidPhone = (value, country = 'Pakistan') => {
  const phone = normalizePhone(value);
  if (!phone) return false;
  if (String(country || '').trim().toLowerCase() === 'pakistan')
    return /^(?:\+92|0092|92|0)3\d{9}$/.test(phone);
  return /^\+?\d{7,15}$/.test(phone);
};
