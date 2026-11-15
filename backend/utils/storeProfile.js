// Validates the store policy and social-link fields an admin can edit in Settings.
const SOCIAL_HOSTS = { socialInstagram: 'instagram.com', socialFacebook: 'facebook.com', socialTikTok: 'tiktok.com' };

const validateStoreProfile = (body = {}) => {
  const update = {};
  for (const [field, max] of [['deliveryTimeLocal', 60], ['deliveryTimeIntl', 60], ['nonReturnableNote', 300]]) {
    if (body[field] === undefined) continue;
    if (typeof body[field] !== 'string' || body[field].trim().length > max)
      return { error: `${field} must be text of at most ${max} characters.` };
    update[field] = body[field].trim();
  }
  if (body.returnWindowDays !== undefined) {
    const days = Number(body.returnWindowDays);
    if (!Number.isInteger(days) || days < 0 || days > 90)
      return { error: 'Return window must be a whole number of days from 0 to 90.' };
    update.returnWindowDays = days;
  }
  if (body.returnShippingPaidBy !== undefined) {
    if (!['customer', 'store'].includes(body.returnShippingPaidBy))
      return { error: 'Return shipping must be paid by customer or store.' };
    update.returnShippingPaidBy = body.returnShippingPaidBy;
  }
  for (const [field, host] of Object.entries(SOCIAL_HOSTS)) {
    if (body[field] === undefined) continue;
    const value = typeof body[field] === 'string' ? body[field].trim() : null;
    if (value === null || value.length > 200) return { error: `${field} must be a link of at most 200 characters.` };
    if (value) {
      let url;
      try { url = new URL(value); } catch { url = null; }
      const hostname = url?.hostname.replace(/^www\./, '').replace(/^m\./, '');
      if (!url || url.protocol !== 'https:' || (hostname !== host && !hostname.endsWith(`.${host}`)))
        return { error: `Use a full https://${host}/... link.` };
    }
    update[field] = value;
  }

  return { update };
};

module.exports = { validateStoreProfile, SOCIAL_HOSTS };
