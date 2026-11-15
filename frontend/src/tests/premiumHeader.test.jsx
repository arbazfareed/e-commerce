import { fireEvent, render, screen } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import { vi } from 'vitest';
import Navbar from '../components/Navbar';
import { useAuth } from '../context/AuthContext';
import { useCart } from '../context/CartContext';
import API from '../utils/axiosConfig';

vi.mock('../context/AuthContext', () => ({ useAuth:vi.fn() }));
vi.mock('../context/CartContext', () => ({ useCart:vi.fn() }));
vi.mock('../utils/axiosConfig', () => ({ default:{ get:vi.fn() }, assetUrl:path => path }));

test('header shows the promo strip from settings and an account menu with logout', async () => {
  const logout = vi.fn();
  useAuth.mockReturnValue({ user:{ _id:'u1', name:'Ayesha Khan', email:'ayesha@example.pk', isAdmin:false }, logout });
  useCart.mockReturnValue({ totalItems:3 });
  API.get.mockImplementation(url => Promise.resolve({ data: url === '/api/settings/public' ? { freeShippingThreshold:3000, codEnabled:true } : { items:[] } }));
  render(<MemoryRouter><Navbar /></MemoryRouter>);

  expect(await screen.findByText(/free delivery across pakistan on orders over rs 3,000/i)).toBeInTheDocument();
  expect(screen.getByRole('link', { name:'Cart, 3 items' })).toHaveAttribute('href', '/cart');

  fireEvent.click(screen.getByRole('button', { name:/ayesha/i }));
  expect(screen.getByRole('menuitem', { name:/my account/i })).toHaveAttribute('href', '/account');
  fireEvent.keyDown(document, { key:'Escape' });
  expect(screen.queryByRole('menu')).not.toBeInTheDocument();

  fireEvent.click(screen.getByRole('button', { name:/ayesha/i }));
  fireEvent.click(screen.getByRole('menuitem', { name:/logout/i }));
  expect(logout).toHaveBeenCalled();
});

test('no promo strip when the server reply is not settings', async () => {
  useAuth.mockReturnValue({ user:null });
  useCart.mockReturnValue({ totalItems:0 });
  API.get.mockResolvedValue({ data:[] });
  render(<MemoryRouter><Navbar /></MemoryRouter>);
  expect(await screen.findByRole('link', { name:'Register' })).toBeInTheDocument();
  expect(screen.queryByRole('note')).not.toBeInTheDocument();
});
