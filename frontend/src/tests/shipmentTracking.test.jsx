import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import { vi } from 'vitest';
import API from '../utils/axiosConfig';
import ShipmentTrackingEditor from '../pages/admin/ShipmentTrackingEditor';
import ShipmentTrackingCard from '../components/ShipmentTrackingCard';

vi.mock('../utils/axiosConfig', () => ({ default: { put: vi.fn() } }));

const order = { _id:'order-123', shippingProvider:'', trackingNumber:'', trackingUrl:'' };

test('admin can save manual shipment details without claiming automatic booking', async () => {
  const onSaved = vi.fn();
  const flash = vi.fn();
  API.put.mockResolvedValueOnce({ data:{ ...order, shippingProvider:'TCS', trackingNumber:'DEMO-123', trackingUrl:'https://tcs.example/track/DEMO-123', courierDispatchStatus:'manual_tracking' } });
  render(<ShipmentTrackingEditor order={order} onSaved={onSaved} flash={flash} />);
  fireEvent.click(screen.getByText(/shipment \/ tracking/i));
  fireEvent.change(screen.getByLabelText(/courier name/i), { target:{ value:'TCS' } });
  fireEvent.change(screen.getByLabelText(/tracking number/i), { target:{ value:'DEMO-123' } });
  fireEvent.change(screen.getByLabelText(/https tracking link/i), { target:{ value:'https://tcs.example/track/DEMO-123' } });
  fireEvent.click(screen.getByRole('button', { name:/save tracking details/i }));
  await waitFor(() => expect(API.put).toHaveBeenCalledWith('/api/orders/order-123/shipment', {
    provider:'TCS', trackingNumber:'DEMO-123', trackingUrl:'https://tcs.example/track/DEMO-123',
  }));
  expect(onSaved).toHaveBeenCalledWith(expect.objectContaining({ courierDispatchStatus:'manual_tracking' }));
  expect(flash).toHaveBeenCalledWith(expect.stringMatching(/not booked through a courier API/));
});

test('customer tracking card shows carrier reference and opens only a secure link', () => {
  const { container } = render(<ShipmentTrackingCard order={{ ...order, shippingProvider:'TCS', trackingNumber:'DEMO-123', trackingUrl:'https://tcs.example/track/DEMO-123' }} />);
  expect(screen.getByText(/DEMO-123/)).toBeInTheDocument();
  const link = screen.getByRole('link', { name:/open carrier tracking/i });
  expect(link).toHaveAttribute('href', 'https://tcs.example/track/DEMO-123');
  expect(link).toHaveAttribute('rel', 'noopener noreferrer');
  expect(container).toHaveTextContent(/live carrier updates are not connected yet/i);
});
