import { render, screen, waitFor } from '@testing-library/react';
import { vi } from 'vitest';
import CouponsPanel from '../pages/admin/CouponsPanel';
import API from '../utils/axiosConfig';

vi.mock('../utils/axiosConfig', () => ({
  default: { get: vi.fn(), post: vi.fn(), put: vi.fn(), delete: vi.fn() },
}));

describe('admin coupon panel', () => {
  beforeEach(() => {
    API.get.mockReset();
    API.get.mockResolvedValue({ data: [] });
  });

  test('shows readable coupon controls and an empty state', async () => {
    render(<CouponsPanel />);

    expect(screen.getByRole('heading', { name: /promo codes/i })).toBeInTheDocument();
    expect(screen.getByLabelText(/coupon code/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/discount type/i)).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /create coupon/i })).toBeInTheDocument();
    await waitFor(() => expect(screen.getByText(/no coupons yet/i)).toBeInTheDocument());
  });
});