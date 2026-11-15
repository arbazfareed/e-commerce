import { useEffect, useState } from 'react';
import API from '../utils/axiosConfig';

// Public store settings (policies, social links, delivery promises), fetched once per page load.
export const STORE_DEFAULTS = {
  freeShippingThreshold: 0,
  codEnabled: true,
  deliveryTimeLocal: '3–5 working days',
  deliveryTimeIntl: '7–14 working days',
  returnWindowDays: 7,
  returnShippingPaidBy: 'customer',
  nonReturnableNote: '',
  socialInstagram: '',
  socialFacebook: '',
  socialTikTok: '',
  internationalEnabled: true,
};

let cached = null;
let pending = null;

export const loadStoreSettings = () => {
  if (cached) return Promise.resolve(cached);
  if (!pending) {
    pending = Promise.resolve(API.get('/api/settings/public'))
      .then(response => {
        const data = response?.data && typeof response.data === 'object' && !Array.isArray(response.data) ? response.data : {};
        cached = { ...STORE_DEFAULTS, ...data };
        return cached;
      })
      .catch(() => { pending = null; return STORE_DEFAULTS; });
  }
  return pending;
};

export const resetStoreSettingsCache = () => { cached = null; pending = null; };

export default function useStoreSettings() {
  const [settings, setSettings] = useState(cached || STORE_DEFAULTS);
  useEffect(() => {
    let active = true;
    loadStoreSettings().then(data => { if (active) setSettings(data); });
    return () => { active = false; };
  }, []);
  return settings;
}
