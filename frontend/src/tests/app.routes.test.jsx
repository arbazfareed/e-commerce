import { act, fireEvent, render, screen, waitFor, within } from '@testing-library/react';
import { vi } from 'vitest';
import App from '../App';
import API from '../utils/axiosConfig';

vi.mock('../utils/axiosConfig', () => ({
  default: { get: vi.fn(), post: vi.fn(), put: vi.fn(), delete: vi.fn() },
  API_BASE: 'http://localhost:5000',
}));

describe('IndusCart UI and navigation smoke tests', () => {
  beforeEach(() => {
    window.history.pushState({}, '', '/');
    window.localStorage.removeItem('user');
    API.get.mockReset();
    API.post.mockReset();
    API.put.mockReset();
    API.delete.mockReset();
    API.put.mockResolvedValue({ data:[] });
    API.delete.mockResolvedValue({ data:{} });
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
    const collectionControls = screen.getByRole('group', { name:/sort and refine products/i });
    expect(collectionControls).toContainElement(screen.getByRole('combobox', { name:/sort products/i }));
    expect(collectionControls).toContainElement(screen.getByLabelText(/minimum price/i));
    expect(collectionControls).toContainElement(screen.getByLabelText(/maximum price/i));
  });

  test('requires a 10 second hold before the admin access modal opens', async () => {
    vi.useFakeTimers();
    try {
      render(<App />);

      const adminTrigger = screen.getByRole('button', { name: /store tools/i });
      fireEvent.pointerDown(adminTrigger);

      expect(screen.queryByText(/enter admin access code/i)).not.toBeInTheDocument();

      act(() => vi.advanceTimersByTime(9999));
      expect(screen.queryByText(/enter admin access code/i)).not.toBeInTheDocument();

      act(() => vi.advanceTimersByTime(1));
      expect(screen.getByText(/enter admin access code/i)).toBeInTheDocument();

      fireEvent.change(screen.getByLabelText(/admin access code/i), { target:{ value:'not-the-code' } });
      fireEvent.click(screen.getByRole('button', { name:/continue/i }));
      expect(screen.getByText(/invalid code/i)).toBeInTheDocument();
    } finally {
      vi.useRealTimers();
    }
  });

  test('cancelling the admin hold before 10 seconds keeps the code modal hidden', async () => {
    vi.useFakeTimers();
    try {
      render(<App />);
      const adminTrigger = screen.getByRole('button', { name:/store tools/i });

      fireEvent.pointerDown(adminTrigger);
      act(() => vi.advanceTimersByTime(5000));
      fireEvent.pointerUp(adminTrigger);
      act(() => vi.advanceTimersByTime(5000));

      expect(screen.queryByText(/enter admin access code/i)).not.toBeInTheDocument();
    } finally {
      vi.useRealTimers();
    }
  });

  test('closes and resets the access prompt after three invalid codes', () => {
    vi.useFakeTimers();
    try {
      render(<App />);
      fireEvent.pointerDown(screen.getByRole('button', { name:/store tools/i }));
      act(() => vi.advanceTimersByTime(10000));

      const codeInput = screen.getByLabelText(/admin access code/i);
      const continueButton = screen.getByRole('button', { name:/continue/i });
      for (let attempt = 0; attempt < 3; attempt += 1) {
        fireEvent.change(codeInput, { target:{ value:'incorrect' } });
        fireEvent.click(continueButton);
      }

      expect(screen.getByText(/access reset after 3 failed attempts/i)).toBeInTheDocument();
      act(() => vi.advanceTimersByTime(1300));
      expect(screen.queryByRole('dialog')).not.toBeInTheDocument();
    } finally {
      vi.useRealTimers();
    }
  });

  test('opens the separate administrator sign-in from the storefront shield icon', async () => {
    render(<App />);

    const adminEntry = await screen.findByRole('button', { name:/store tools/i });
    expect(adminEntry).toHaveAttribute('title', 'Store tools');
  });

  test('admin portal mode redirects its root to admin sign-in and excludes shopper routes', async () => {
    vi.stubEnv('VITE_APP_MODE', 'admin');
    window.history.pushState({}, '', '/');
    try {
      render(<App />);

      expect(await screen.findByText(/induscart valley admin sign in/i)).toBeInTheDocument();
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

    const adminEntry = await screen.findByRole('button', { name:/store tools/i });
    expect(adminEntry).toHaveAttribute('title', 'Store tools');
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
    expect(screen.getByRole('button', { name:/store tools/i })).toHaveAttribute('title', 'Store tools');
  });

  test('renders a distinct administrator sign-in route', async () => {
    window.history.pushState({}, '', '/admin/login');
    render(<App />);

    expect(await screen.findByText(/induscart valley admin sign in/i)).toBeInTheDocument();
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

  test('keeps a successfully authenticated administrator in the admin dashboard', async () => {
    vi.stubEnv('VITE_APP_MODE', 'admin');
    window.localStorage.removeItem('user');
    const uiError = vi.spyOn(console, 'error').mockImplementation(() => {});
    API.post.mockResolvedValue({ data:{ _id:'admin-1', name:'Store Admin', email:'admin@example.test', token:'admin-token', isAdmin:true } });
    API.get.mockImplementation(path => {
      if (path === '/api/cart' || path === '/api/wishlist' || path === '/api/orders' || path.includes('/categories')) {
        return Promise.resolve({ data:[] });
      }
      if (path === '/api/products?includeHidden=true') {
        return Promise.resolve({ data:[{
          _id:'product-1',
          name:'Dashboard regression product',
          images:[],
          pricePKR:1200,
          priceUSD:4.3,
          category:'Home',
          isLocal:true,
          stock:3,
        }] });
      }
      if (path === '/api/orders/analytics') return Promise.resolve({ data:{ summary:{}, topProducts:[], regionBreakdown:[], dailySeries:[], weeklySeries:[], monthlySeries:[] } });
      if (path === '/api/settings/') return Promise.resolve({ data:{} });
      return Promise.resolve({ data:[] });
    });
    window.history.pushState({}, '', '/admin/login');

    try {
      render(<App />);
      fireEvent.change(await screen.findByLabelText(/email or username/i), { target:{ value:'admin@example.test' } });
      fireEvent.change(screen.getByLabelText(/^password$/i), { target:{ value:'administrator-password' } });
      fireEvent.click(screen.getByRole('button', { name:/sign in to admin/i }));

      await waitFor(() => expect(screen.queryByRole('heading', { name:/dashboard/i }) || screen.queryByText(/something went wrong/i)).toBeTruthy());
      const renderError = uiError.mock.calls.find(([message]) => message === 'Unhandled UI error:')?.[1];
      if (screen.queryByText(/something went wrong/i)) throw new Error(`Admin dashboard render error: ${renderError?.stack || renderError || 'unknown error'}`);
      expect(screen.getByRole('heading', { name:/dashboard/i })).toBeInTheDocument();
      expect(screen.getAllByText('Dashboard regression product').length).toBeGreaterThan(0);
      expect(window.location.pathname).toBe('/admin');
      expect(JSON.parse(window.localStorage.getItem('user'))).toMatchObject({ isAdmin:true, token:'admin-token' });
      expect(API.post).toHaveBeenCalledWith('/api/auth/admin/login', { email:'admin@example.test', password:'administrator-password' });

      const adminSidebar = within(document.querySelector('.admin-sidebar'));
      fireEvent.click(adminSidebar.getByRole('button', { name:/Products/ }));
      await waitFor(() => expect(window.location.pathname).toBe('/admin/products'));
      fireEvent.click(adminSidebar.getByRole('button', { name:/Dashboard/ }));
      await waitFor(() => expect(window.location.pathname).toBe('/admin'));
      expect(screen.getByRole('heading', { name:/dashboard/i })).toBeInTheDocument();
    } finally {
      uiError.mockRestore();
      vi.unstubAllEnvs();
    }
  });

  test('restores a verified administrator to the dashboard after refresh', async () => {
    vi.stubEnv('VITE_APP_MODE', 'admin');
    const storedAdmin = { _id:'admin-1', name:'Store Admin', email:'admin@example.test', token:'admin-token', isAdmin:true };
    window.localStorage.setItem('user', JSON.stringify(storedAdmin));
    API.get.mockImplementation(path => {
      if (path === '/api/auth/session') return Promise.resolve({ data:{ valid:true, user:storedAdmin } });
      if (path === '/api/cart' || path === '/api/wishlist' || path === '/api/orders' || path.includes('/categories')) {
        return Promise.resolve({ data:[] });
      }
      if (path === '/api/orders/analytics') return Promise.resolve({ data:{ summary:{}, topProducts:[], regionBreakdown:[], dailySeries:[], weeklySeries:[], monthlySeries:[] } });
      if (path === '/api/settings/') return Promise.resolve({ data:{} });
      return Promise.resolve({ data:[] });
    });
    window.history.pushState({}, '', '/admin/login');

    try {
      render(<App />);

      expect(await screen.findByRole('heading', { name:/dashboard/i })).toBeInTheDocument();
      expect(API.get).toHaveBeenCalledWith('/api/auth/session');
      expect(window.location.pathname).toBe('/admin');
      expect(JSON.parse(window.localStorage.getItem('user'))).toMatchObject({ isAdmin:true, token:'admin-token' });
    } finally {
      vi.unstubAllEnvs();
    }
  });

  test('redirects an expired admin session in-app without a document reload', async () => {
    vi.stubEnv('VITE_APP_MODE', 'admin');
    const storedAdmin = { _id:'admin-1', name:'Store Admin', email:'admin@example.test', token:'admin-token', isAdmin:true };
    window.localStorage.setItem('user', JSON.stringify(storedAdmin));
    API.get.mockImplementation(path => {
      if (path === '/api/auth/session') return Promise.resolve({ data:{ valid:true, user:storedAdmin } });
      if (path === '/api/cart' || path === '/api/wishlist' || path === '/api/orders' || path.includes('/categories')) {
        return Promise.resolve({ data:[] });
      }
      if (path === '/api/orders/analytics') return Promise.resolve({ data:{ summary:{}, topProducts:[], regionBreakdown:[], dailySeries:[], weeklySeries:[], monthlySeries:[] } });
      if (path === '/api/settings/') return Promise.resolve({ data:{} });
      return Promise.resolve({ data:[] });
    });
    window.history.pushState({}, '', '/admin');

    try {
      render(<App />);
      expect(await screen.findByRole('heading', { name:/dashboard/i })).toBeInTheDocument();

      act(() => window.dispatchEvent(new Event('ic-session-expired')));

      expect(await screen.findByText(/induscart valley admin sign in/i)).toBeInTheDocument();
      expect(window.location.pathname).toBe('/admin/login');
      expect(window.localStorage.getItem('user')).toBeNull();
    } finally {
      vi.unstubAllEnvs();
    }
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

    expect(await screen.findByText(/induscart valley admin sign in/i)).toBeInTheDocument();
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
