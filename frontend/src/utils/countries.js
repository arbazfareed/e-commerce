// Delivery countries offered at checkout. Names match the shipping zone list
// (shippingUtils.js / backend utils/zoneShipping.js) in lower case.
export const DELIVERY_COUNTRIES = [
  'Pakistan',
  'Australia', 'Bahrain', 'Bangladesh', 'Belgium', 'Canada', 'China', 'Denmark', 'Egypt',
  'Finland', 'France', 'Germany', 'Greece', 'Hong Kong', 'India', 'Indonesia', 'Iraq',
  'Ireland', 'Italy', 'Japan', 'Jordan', 'Kenya', 'Kuwait', 'Malaysia', 'Maldives', 'Mexico',
  'Nepal', 'Netherlands', 'New Zealand', 'Nigeria', 'Norway', 'Oman', 'Philippines', 'Poland',
  'Portugal', 'Qatar', 'Saudi Arabia', 'Singapore', 'South Africa', 'South Korea', 'Spain',
  'Sri Lanka', 'Sweden', 'Switzerland', 'Thailand', 'Turkey', 'United Arab Emirates',
  'United Kingdom', 'United States', 'Vietnam',
];

export const getDeliveryCountries = ({ internationalEnabled = true, current = '' } = {}) => {
  if (!internationalEnabled) return ['Pakistan'];
  const list = [...DELIVERY_COUNTRIES];
  if (current && !list.some(name => name.toLowerCase() === current.toLowerCase())) list.push(current);
  return list;
};
