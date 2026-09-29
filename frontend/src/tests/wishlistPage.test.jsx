import { fireEvent, render, screen } from '@testing-library/react';
import { vi } from 'vitest';
import { MemoryRouter } from 'react-router-dom';
import WishlistPage from '../pages/WishlistPage';
import { useCart } from '../context/CartContext';
import { useAuth } from '../context/AuthContext';

vi.mock('../context/CartContext', () => ({ useCart: vi.fn() }));
vi.mock('../context/AuthContext', () => ({ useAuth: vi.fn() }));

test('shows saved product details and exposes remove and move-to-cart actions', () => {
  const removeFromWishlist = vi.fn();
  const addToCart = vi.fn();
  useAuth.mockReturnValue({ user: { country: 'Pakistan' } });
  useCart.mockReturnValue({ wishlist: [{ _id: 'prod-1', name: 'Handmade Bowl', pricePKR: 1800, priceUSD: 6.5, stock: 4 }], removeFromWishlist, addToCart });
  render(<MemoryRouter><WishlistPage /></MemoryRouter>);
  expect(screen.getByRole('heading', { name: /your wishlist/i })).toBeInTheDocument();
  fireEvent.click(screen.getByRole('button', { name: /move to cart/i }));
  expect(addToCart).toHaveBeenCalledWith(expect.objectContaining({ _id: 'prod-1' }));
  expect(removeFromWishlist).toHaveBeenCalledWith('prod-1');
  fireEvent.click(screen.getByRole('button', { name: /remove handmade bowl from wishlist/i }));
  expect(removeFromWishlist).toHaveBeenCalledTimes(2);
});