const normalizeShipmentTracking = (payload = {}) => {
  const provider = typeof payload.provider === 'string' ? payload.provider.trim() : '';
  const trackingNumber = typeof payload.trackingNumber === 'string' ? payload.trackingNumber.trim() : '';
  const rawTrackingUrl = typeof payload.trackingUrl === 'string' ? payload.trackingUrl.trim() : '';

  if (provider.length > 80) return { error: 'Courier name must be 80 characters or fewer.' };
  if (trackingNumber.length > 120) return { error: 'Tracking number must be 120 characters or fewer.' };
  if (rawTrackingUrl.length > 2048) return { error: 'Tracking link is too long.' };

  let trackingUrl = '';
  if (rawTrackingUrl) {
    try {
      const parsedUrl = new URL(rawTrackingUrl);
      if (parsedUrl.protocol !== 'https:' || parsedUrl.username || parsedUrl.password)
        return { error: 'Tracking link must be a secure HTTPS URL without embedded credentials.' };
      trackingUrl = parsedUrl.toString();
    } catch {
      return { error: 'Enter a valid tracking link.' };
    }
  }

  return { value: { shippingProvider: provider, trackingNumber, trackingUrl } };
};

module.exports = { normalizeShipmentTracking };