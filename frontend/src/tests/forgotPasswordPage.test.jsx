import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import { vi } from 'vitest';
import ForgotPasswordPage from '../pages/ForgotPasswordPage';
import API from '../utils/axiosConfig';

vi.mock('../utils/axiosConfig', () => ({ default:{ post:vi.fn() } }));

test('public recovery request shows the non-enumerating confirmation', async () => {
  API.post.mockResolvedValue({ data:{ message:'If an eligible account exists for that email, a password reset link will be sent shortly.' } });
  render(<MemoryRouter><ForgotPasswordPage /></MemoryRouter>);

  fireEvent.change(screen.getByLabelText(/email address/i), { target:{ value:'buyer@example.test' } });
  fireEvent.click(screen.getByRole('button', { name:/send reset link/i }));

  expect(await screen.findByRole('status')).toHaveTextContent(/if an eligible account exists/i);
  await waitFor(() => expect(API.post).toHaveBeenCalledWith('/api/auth/password/reset/request', { email:'buyer@example.test' }));
});
