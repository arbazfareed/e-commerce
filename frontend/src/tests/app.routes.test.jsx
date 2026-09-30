import { fireEvent, render, screen, waitFor } from '@testing-library/react';
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

  test('opens the separate administrator sign-in from the storefront shield icon', async () => {
    render(<App />);

    const adminEntry = await screen.findByRole('link', { name:/administrator portal/i });
    expect(adminEntry).toHaveAttribute('href', 'http://localhost:3001/admin/login');
    expect(adminEntry).toHaveAttribute('title', 'Administrator portal');
  });

  test('admin portal mode redirects its root to admin sign-in and excludes shopper routes', async () => {
    vi.stubEnv('VITE_APP_MODE', 'admin');
    window.history.pushState({}, '', '/');
    try {
      render(<App />);

      expect(await screen.findByText(/administrator sign in/i)).toBeInTheDocument();
      expect(window.location.pathname).toBe('/admin/login');
      expect(screen.queryByRole('link', { name:/create one free/i })).not.toBeInTheDocument();
      expect(screen.queryByRole('link', { name:/register/i })).not.toBeInTheDocument();
      expect(screen.getByRole('link', { name:/shopper storefront/i })).toHaveAttribute('href', 'http://localhost:3000/');
      expect(API.get).not.toHaveBeenCalledWith('/api/products/categories');
    } finally {
      vi.unstubAllEnvs();
    }
  });

  test('opens the separate admin portal from the storefront administrator icon', async () => {
    render(<App />);

    const adminEntry = await screen.findByRole('link', { name:/administrator portal/i });
    expect(adminEntry).toHaveAttribute('href', 'http://localhost:3001/admin/login');
    expect(adminEntry).toHaveAttribute('title', 'Administrator portal');
  });

  test('hides international shopping and returns a saved global selection to Pakistan mode when disabled', async () => {
    window.localStorage.setItem('ic_market_mode', 'global');
    API.get.mockImplementation(path => {
      if (path === '/api/settings/public') return Promise.resolve({ data:{ internationalEnabled:false } });
      if (path.includes('/categories') || path.includes('/subcategories')) return Promise.resolve({ data:[] });
      return Promise.resolve({ data:{ items:[], pagination:{ page:1, pageSize:24, total:0, pages:0 } } });
    });

    render(<App />);

    await waitFor(() => {
      expect(screen.getByRole('button', { name:/Pakistan \(PKR\)/i })).toBeInTheDocument();
      expect(window.localStorage.getItem('ic_market_mode')).toBe('local');
    });
    expect(screen.queryByRole('button', { name:/International \(USD\)/i })).not.toBeInTheDocument();
    expect(API.get).toHaveBeenCalledWith(expect.stringContaining('currency=PKR'));
  });

  test('renders the login form and registration prompt on the login route', async () => {
    window.history.pushState({}, '', '/login');
    render(<App />);

    expect(screen.getByText(/sign in to your account/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/email or username/i)).toBeInTheDocument();
    expect(screen.getByRole('link', { name: /create one free/i })).toHaveAttribute('href', '/register');
    expect(screen.getByRole('link', { name:/forgot password/i })).toHaveAttribute('href', '/forgot-password');
    expect(screen.queryByText(/administrator sign in/i)).not.toBeInTheDocument();
    expect(screen.queryByRole('link', { name:/admin sign-in/i })).not.toBeInTheDocument();
    expect(screen.queryByRole('link', { name:/administrator portal/i })).not.toBeInTheDocument();
  });

  test('renders a distinct administrator sign-in route', async () => {
    window.history.pushState({}, '', '/admin/login');
    render(<App />);

    expect(await screen.findByText(/administrator sign in/i)).toBeInTheDocument();
    expect(screen.getByRole('button', { name:/sign in to admin/i })).toBeInTheDocument();
    expect(screen.queryByRole('link', { name:/shopper sign-in/i })).not.toBeInTheDocument();
    expect(screen.queryByRole('link', { name:/forgot password/i })).not.toBeInTheDocument();
    expect(screen.queryByRole('link', { name:/administrator sign-in/i })).not.toBeInTheDocument();
  });

  test('rejects a shopper account at the admin login and clears its session', async () => {
    API.post.mockResolvedValue({ data:{ _id:'customer-1', name:'Shopper', email:'shopper@example.test', token:'customer-token', isAdmin:false } });
    window.history.pushState({}, '', '/admin/login');
    render(<App />);

    fireEvent.change(screen.getByLabelText(/email or username/i), { target:{ value:'shopper@example.test' } });
    fireEvent.change(screen.getByLabelText(/^password$/i), { target:{ value:'customer-password' } });
    fireEvent.click(screen.getByRole('button', { name:/sign in to admin/i }));

    expect(API.post).toHaveBeenCalledWith('/api/auth/admin/login', { email:'shopper@example.test', password:'customer-password' });
    expect(await screen.findByText(/does not have administrator access/i)).toBeInTheDocument();
    expect(screen.queryByText(/shopper sign-in/i)).not.toBeInTheDocument();
    expect(window.localStorage.getItem('user')).toBeNull();
  });

  test('keeps protected routes behind login', async () => {
    window.history.pushState({}, '', '/orders');
    render(<App />);

    await waitFor(() => {
      expect(screen.getByText(/sign in to your account/i)).toBeInTheDocument();
    });
  });

  test('sends unauthenticated admin routes to the admin-specific sign-in', async () => {
    window.history.pushState({}, '', '/admin');
    render(<App />);

    expect(await screen.findByText(/administrator sign in/i)).toBeInTheDocument();
  });

  test('allows guests to open their cart for guest checkout', async () => {
    window.history.pushState({}, '', '/cart');
    render(<App />);

    expect(await screen.findByRole('heading', { name:/your cart is empty/i })).toBeInTheDocument();
    expect(screen.queryByText(/sign in to your account/i)).not.toBeInTheDocument();
  });

  test('shows a not-found page for an unknown route', () => {
    window.history.pushState({}, '', '/this-route-does-not-exist');
    render(<App />);

    expect(screen.getByRole('heading', { name: /we couldn’t find that page/i })).toBeInTheDocument();
    expect(screen.getByRole('link', { name: /back to the shop/i })).toHaveAttribute('href', '/');
  });
});
