import { render, screen } from '@testing-library/react';
import { vi } from 'vitest';
import ErrorBoundary from '../components/ErrorBoundary';

function BrokenView() {
  throw new Error('test render error');
}

test('shows a recovery message when a child render throws', () => {
  const consoleError = vi.spyOn(console, 'error').mockImplementation(() => {});
  try {
    render(<ErrorBoundary><BrokenView /></ErrorBoundary>);
    expect(screen.getByRole('alert')).toHaveTextContent(/something went wrong/i);
    expect(screen.getByRole('button', { name: /reload page/i })).toBeInTheDocument();
  } finally {
    consoleError.mockRestore();
  }
});
