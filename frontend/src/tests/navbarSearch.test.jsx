import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import { vi } from 'vitest';
import Navbar from '../components/Navbar';
import { useAuth } from '../context/AuthContext';
import { useCart } from '../context/CartContext';
import API from '../utils/axiosConfig';

vi.mock('../context/AuthContext', () => ({ useAuth:vi.fn() }));
vi.mock('../context/CartContext', () => ({ useCart:vi.fn() }));
vi.mock('../utils/axiosConfig', () => ({ default:{ get:vi.fn() }, assetUrl:path => path }));

test('navbar shows debounced live product results and supports Escape dismissal', async () => {
  useAuth.mockReturnValue({ user:null });
  useCart.mockReturnValue({ totalItems:0 });
  API.get.mockResolvedValue({ data:{ items:[{ _id:'apple-1', name:'Apple', category:'Fruit', images:[] }] } });
  render(<MemoryRouter><Navbar /></MemoryRouter>);

  const search = screen.getByRole('searchbox', { name:/search products/i });
  fireEvent.change(search, { target:{ value:'app' } });
  expect(await screen.findByRole('link', { name:/apple fruit/i })).toHaveAttribute('href', '/products/apple-1');
  expect(API.get).toHaveBeenCalledWith('/api/products', { params:{ search:'app', page:1, limit:6 } });

  fireEvent.keyDown(search, { key:'Escape' });
  await waitFor(() => expect(screen.queryByRole('link', { name:/apple fruit/i })).not.toBeInTheDocument());
});
