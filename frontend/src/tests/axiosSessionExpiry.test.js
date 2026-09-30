import { afterEach, describe, expect, it, vi } from 'vitest';
import API from '../utils/axiosConfig';

describe('API session expiry handling', () => {
  afterEach(() => {
    window.localStorage.clear();
    vi.restoreAllMocks();
  });

  it('clears an expired session and notifies the app without forcing a page reload', async () => {
    window.localStorage.setItem('user', JSON.stringify({ token:'expired-token', isAdmin:true }));
    const sessionExpired = vi.fn();
    window.addEventListener('ic-session-expired', sessionExpired);
    const requestConfig = { url:'/api/orders/my' };
    const unauthorizedAdapter = () => {
      const error = new Error('Unauthorized');
      error.config = requestConfig;
      error.response = { status:401, config:requestConfig };
      return Promise.reject(error);
    };

    try {
      await expect(API.get('/api/orders/my', { adapter:unauthorizedAdapter })).rejects.toThrow('Unauthorized');

      expect(window.localStorage.getItem('user')).toBeNull();
      expect(sessionExpired).toHaveBeenCalledTimes(1);
    } finally {
      window.removeEventListener('ic-session-expired', sessionExpired);
    }
  });
});
