import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import { vi } from 'vitest';
import { MemoryRouter } from 'react-router-dom';
import CartPage from '../pages/CartPage';
import { useCart } from '../context/CartContext';
import { useAuth } from '../context/AuthContext';
import API from '../utils/axiosConfig';

vi.mock('../context/CartContext', () => ({ useCart: vi.fn() }));
vi.mock('../context/AuthContext', () => ({ useAuth: vi.fn() }));
vi.mock('../utils/axiosConfig', () => ({ default: { get: vi.fn(), post: vi.fn() }, assetUrl: value => value || '' }));

describe('checkout provider availability', () => {
  beforeEach(() => {
    API.get.mockReset();
    API.post.mockReset();
    API.get.mockResolvedValue({ data: { codEnabled: true, supportedPaymentMethods: ['COD'] } });
    useAuth.mockReturnValue({ user: { _id: 'customer-1', country: 'Pakistan', city: 'Lahore' } });
    useCart.mockReturnValue({
      items: [{ _id: 'product-1', name: 'Test item', stock: 4, quantity: 1, pricePKR: 1000, priceUSD: 10, images: [] }],
      removeFromCart: vi.fn(), updateQty: vi.fn(), clearCart: vi.fn(),
    });
  });

  test('does not show unimplemented gateways even when their admin config is stored', async () => {
    API.get.mockResolvedValue({ data: { codEnabled: true, supportedPaymentMethods: ['COD'], easypaisaEnabled: true } });
    render(<MemoryRouter><CartPage /></MemoryRouter>);
    expect(screen.getByText('2. Checkout')).toHaveClass('cart-step-pill', 'is-upcoming');
    fireEvent.click(screen.getByRole('button', { name: /proceed to checkout/i }));
    await waitFor(() => expect(screen.getByText(/payment method/i)).toBeInTheDocument());
    expect(screen.getByText('1. Cart')).toHaveClass('cart-step-pill', 'is-complete');
    expect(screen.getByText('2. Checkout')).toHaveClass('cart-step-pill', 'is-active');
    expect(screen.getByText(/cash on delivery/i)).toBeInTheDocument();
    expect(screen.queryByText(/easypaisa/i)).not.toBeInTheDocument();
    expect(screen.queryByText(/stripe|paypal|jazzcash/i)).not.toBeInTheDocument();
  });
});