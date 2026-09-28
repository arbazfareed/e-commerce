import { render, screen, waitFor } from '@testing-library/react';
import { vi } from 'vitest';
import App from '../App';
import API from '../utils/axiosConfig';

vi.mock('../utils/axiosConfig', () => ({
  default: { get: vi.fn(), post: vi.fn() },
  API_BASE: 'http://localhost:5000',
}));

describe('IndusCart UI and navigation smoke tests', () => {
  beforeEach(() => {
    window.history.pushState({}, '', '/');
    API.get.mockReset();
    API.post.mockReset();
    API.get.mockResolvedValue({ data: [
      {
        _id: 'p1',
        name: 'Handmade Pottery Set',
        description: 'A premium handcrafted set for daily use.',
        category: 'Crafts',
        subcategory: 'Pottery',
        pricePKR: 3500,
        priceUSD: 22,
        isLocal: true,
        stock: 10,
        createdAt: '2026-09-01T00:00:00Z',
      },
    ] });
  });

  test('renders the storefront and key text on the home route', async () => {
    window.history.pushState({}, '', '/');
    render(<App />);

    await waitFor(() => {
      expect(screen.getByText(/handmade pottery set/i)).toBeInTheDocument();
    });

    expect(screen.getByText(/thoughtful finds/i)).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /shop the collection/i })).toBeInTheDocument();
  });

  test('renders the login form and registration prompt on the login route', async () => {
    window.history.pushState({}, '', '/login');
    render(<App />);

    expect(screen.getByText(/sign in to your account/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/email or username/i)).toBeInTheDocument();
    expect(screen.getByRole('link', { name: /create one free/i })).toHaveAttribute('href', '/register');
  });

  test('keeps protected routes behind login', async () => {
    window.history.pushState({}, '', '/orders');
    render(<App />);

    await waitFor(() => {
      expect(screen.getByText(/sign in to your account/i)).toBeInTheDocument();
    });
  });

  test('shows a not-found page for an unknown route', () => {
    window.history.pushState({}, '', '/this-route-does-not-exist');
    render(<App />);

    expect(screen.getByRole('heading', { name: /we couldn’t find that page/i })).toBeInTheDocument();
    expect(screen.getByRole('link', { name: /back to the shop/i })).toHaveAttribute('href', '/');
  });
});
