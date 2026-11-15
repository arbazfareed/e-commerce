import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import { vi } from 'vitest';
import AccountPage from '../pages/AccountPage';
import { useAuth } from '../context/AuthContext';
import API from '../utils/axiosConfig';

vi.mock('../context/AuthContext', () => ({ useAuth:vi.fn() }));
vi.mock('../utils/axiosConfig', () => ({ default:{ put:vi.fn(), patch:vi.fn() } }));

test('customer saves details and changes password with the current one', async () => {
  const updateUser = vi.fn();
  useAuth.mockReturnValue({ user:{ name:'Ali', email:'ali@example.test', phone:'', city:'', country:'Pakistan' }, updateUser });
  API.put.mockResolvedValue({ data:{ name:'Ali Khan', phone:'03001234567', city:'Lahore', country:'Pakistan' } });
  API.patch.mockResolvedValue({ data:{ message:'Changed', token:'new-token' } });
  render(<AccountPage />);

  fireEvent.change(screen.getByLabelText(/full name/i), { target:{ value:'Ali Khan' } });
  fireEvent.change(screen.getByLabelText(/mobile number/i), { target:{ value:'0300 1234567' } });
  fireEvent.click(screen.getByRole('button', { name:/save my details/i }));
  await waitFor(() => expect(updateUser).toHaveBeenCalledWith({ name:'Ali Khan', phone:'03001234567', city:'Lahore', country:'Pakistan' }));

  fireEvent.change(screen.getByLabelText(/current password/i), { target:{ value:'old password 123' } });
  fireEvent.change(screen.getByLabelText(/^new password/i), { target:{ value:'brand new password 1' } });
  fireEvent.change(screen.getByLabelText(/confirm new password/i), { target:{ value:'brand new password 1' } });
  fireEvent.click(screen.getByRole('button', { name:/update password/i }));
  await waitFor(() => expect(API.patch).toHaveBeenCalledWith('/api/auth/password', { currentPassword:'old password 123', newPassword:'brand new password 1' }));
  expect(updateUser).toHaveBeenCalledWith({ token:'new-token' });
});
