import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import { vi } from 'vitest';
import { MemoryRouter, Route, Routes } from 'react-router-dom';
import InvoicePage from '../pages/InvoicePage';
import API from '../utils/axiosConfig';

vi.mock('../utils/axiosConfig', () => ({ default: { get: vi.fn() } }));

describe('order invoice page', () => {
  beforeEach(() => {
    window.history.pushState({}, '', '/orders/order-1234/invoice');
    API.get.mockReset();
    API.get.mockResolvedValue({ data: {
      _id: 'order-1234', createdAt: '2026-09-29T10:00:00Z', currency: 'USD', status: 'Pending',
      user: { name: 'Ayesha' }, address: { street: '12 Main Road', city: 'Lahore', country: 'Pakistan' },
      products: [{ name: 'Handmade Bowl', price: 12, quantity: 1 }], productTotal: 12, shippingFee: 3, codFee: 0,
      couponCode: '', couponDiscount: 0, totalPrice: 15, paymentMethod: 'COD', paymentStatus: 'pending',
    } });
  });

  test('shows readable order information, currency, packing slip mode, and print action', async () => {
    const print = vi.spyOn(window, 'print').mockImplementation(() => {});
    render(<MemoryRouter initialEntries={['/orders/order-1234/invoice']}><Routes><Route path="/orders/:id/invoice" element={<InvoicePage />} /></Routes></MemoryRouter>);
    await waitFor(() => expect(screen.getByRole('heading', { name: /order invoice/i })).toBeInTheDocument());
    expect(screen.getByText('Ayesha')).toBeInTheDocument();
    expect(screen.getAllByText('$12.00').length).toBeGreaterThanOrEqual(3);
    fireEvent.click(screen.getByRole('button', { name: /packing slip/i }));
    expect(screen.getByRole('heading', { name: /packing slip/i })).toBeInTheDocument();
    fireEvent.click(screen.getByRole('button', { name: /print \/ save pdf/i }));
    expect(print).toHaveBeenCalledOnce();
    print.mockRestore();
  });

  test('infers currency for older orders from their saved delivery country', async () => {
    API.get.mockResolvedValueOnce({ data: {
      _id: 'order-legacy', createdAt: '2025-02-01T10:00:00Z', status: 'Delivered',
      user: { name: 'Sam' }, address: { street: '1 Main Street', city: 'London', country: 'United Kingdom' },
      products: [{ name: 'Tea Set', price: 8, quantity: 1 }], productTotal: 8, shippingFee: 2, codFee: 0,
      couponCode: '', couponDiscount: 0, totalPrice: 10, paymentMethod: 'COD', paymentStatus: 'paid',
    } });
    render(<MemoryRouter initialEntries={['/orders/order-legacy/invoice']}><Routes><Route path="/orders/:id/invoice" element={<InvoicePage />} /></Routes></MemoryRouter>);
    await waitFor(() => expect(screen.getByRole('heading', { name: /order invoice/i })).toBeInTheDocument());
    expect(screen.getAllByText('$8.00').length).toBeGreaterThanOrEqual(2);
  });
});