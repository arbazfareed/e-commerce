import { render, screen, fireEvent } from '@testing-library/react';
import { BrowserRouter } from 'react-router-dom';
import { describe, it, expect, vi, beforeEach } from 'vitest';

const get = vi.fn();
vi.mock('../utils/axiosConfig', () => ({ default: { get: (...args) => get(...args) }, assetUrl: x => x }));

import Footer from '../components/Footer';
import { resetStoreSettingsCache } from '../hooks/useStoreSettings';

const open = () => {
  render(<BrowserRouter><Footer /></BrowserRouter>);
  fireEvent.click(screen.getByRole('button', { name: /Shipping & Returns/i }));
};

describe('Footer policies use the saved store settings', () => {
  beforeEach(() => { resetStoreSettingsCache(); get.mockReset(); });

  it('shows the real free-delivery amount, delivery time and return window', async () => {
    get.mockResolvedValue({ data: { freeShippingThreshold: 3000, deliveryTimeLocal: '2–4 working days', returnWindowDays: 14, returnShippingPaidBy: 'store', codEnabled: true } });
    open();
    expect(await screen.findByText(/free on orders of Rs 3,000 or more/i)).toBeInTheDocument();
    expect(screen.getByText('2–4 working days')).toBeInTheDocument();
    expect(screen.getByText('14 days')).toBeInTheDocument();
    expect(screen.getByText(/We cover the return shipping/i)).toBeInTheDocument();
  });

  it('never promises free delivery when it is switched off, and handles no returns', async () => {
    get.mockResolvedValue({ data: { freeShippingThreshold: 0, returnWindowDays: 0 } });
    open();
    expect(await screen.findByText(/We do not accept returns of change-of-mind purchases/i)).toBeInTheDocument();
    expect(screen.queryByText(/free on orders/i)).not.toBeInTheDocument();
  });

  it('shows social links only when they are set', async () => {
    get.mockResolvedValue({ data: { socialInstagram: 'https://instagram.com/induscart' } });
    render(<BrowserRouter><Footer /></BrowserRouter>);
    expect(await screen.findByRole('link', { name: /Instagram/i })).toHaveAttribute('href', 'https://instagram.com/induscart');
    expect(screen.queryByRole('link', { name: /TikTok/i })).not.toBeInTheDocument();
  });
});
