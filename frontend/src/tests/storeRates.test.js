import { describe, expect, it, beforeEach } from 'vitest';
import { applyStoreRates, calcZoneShipping, getUSDRate } from '../utils/priceUtils';

describe('store rates from the server', () => {
  beforeEach(() => localStorage.clear());

  it('uses the server USD rate and zone rates in the cart', () => {
    applyStoreRates({ usdRate: 300, zoneRates: { domestic_pak: { baseRate: 200, perKg: 50, minFee: 200 } } });
    expect(getUSDRate()).toBe(300);
    expect(calcZoneShipping([{ weightKg: 1, quantity: 1 }], 'Pakistan', 'Lahore').fee).toBe(250);
  });

  it('ignores missing or invalid settings', () => {
    applyStoreRates(null);
    applyStoreRates({ usdRate: 0 });
    expect(getUSDRate()).toBe(278);
  });
});
