import { render, screen, waitFor } from '@testing-library/react';
import { vi } from 'vitest';
import ReviewsPanel from '../pages/admin/ReviewsPanel';
import API from '../utils/axiosConfig';

vi.mock('../utils/axiosConfig', () => ({ default: { get: vi.fn(), patch: vi.fn() } }));

test('explains review verification and moderation in readable empty state', async () => {
  API.get.mockResolvedValueOnce({ data: [] });
  render(<ReviewsPanel />);
  expect(screen.getByRole('heading', { name: /product reviews/i })).toBeInTheDocument();
  expect(screen.getByText(/delivered order/i)).toBeInTheDocument();
  await waitFor(() => expect(screen.getByText(/no reviews have been submitted yet/i)).toBeInTheDocument());
});