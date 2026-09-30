import { getPromotionCountdown } from '../components/ProductCard';

test('promotion countdown reports remaining days, hours, and minutes', () => {
  expect(getPromotionCountdown('2026-10-05', new Date('2026-10-01T00:00:00.000Z'))).toBe('ENDS IN 4D');
  expect(getPromotionCountdown('2026-10-01', new Date('2026-10-01T11:00:00.000Z'))).toBe('ENDS IN 12H');
  expect(getPromotionCountdown('2026-10-01', new Date('2026-10-01T23:50:00.000Z'))).toBe('ENDS IN 10M');
});

test('promotion countdown is hidden for expired or invalid dates', () => {
  expect(getPromotionCountdown('2026-09-30', new Date('2026-10-01T00:00:00.000Z'))).toBe('');
  expect(getPromotionCountdown('not-a-date', new Date('2026-10-01T00:00:00.000Z'))).toBe('');
});
