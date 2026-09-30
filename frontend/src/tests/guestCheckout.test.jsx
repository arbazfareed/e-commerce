import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import { vi } from 'vitest';
import CartPage from '../pages/CartPage';
import { useCart } from '../context/CartContext';
import { useAuth } from '../context/AuthContext';
import API from '../utils/axiosConfig';

vi.mock('../context/CartContext', () => ({ useCart:vi.fn() }));
vi.mock('../context/AuthContext', () => ({ useAuth:vi.fn() }));
vi.mock('../utils/axiosConfig', () => ({ default:{ get:vi.fn(), post:vi.fn() }, assetUrl:path => path }));

test('guest can submit a COD order with required contact details', async () => {
  const clearCart = vi.fn();
  useAuth.mockReturnValue({ user:null });
  useCart.mockReturnValue({
    items:[{ _id:'guest-product', name:'Guest Product', category:'Home', pricePKR:1000, priceUSD:4, quantity:1, stock:3, images:[] }],
    removeFromCart:vi.fn(), updateQty:vi.fn(), clearCart,
  });
  API.get.mockResolvedValue({ data:{ codEnabled:true, codFeeMode:'flat', codFee:0, codThreshold:0, supportedPaymentMethods:['COD'] } });
  API.post.mockResolvedValue({ data:{ _id:'guest-order-12345678', paymentStatus:'pending' } });

  render(<MemoryRouter><CartPage /></MemoryRouter>);
  fireEvent.click(screen.getByRole('button', { name:/proceed to checkout/i }));
  fireEvent.change(screen.getByLabelText(/full name/i), { target:{ value:'Guest Buyer' } });
  fireEvent.change(screen.getByLabelText(/email/i), { target:{ value:'buyer@example.test' } });
  fireEvent.change(screen.getByLabelText(/street \/ area/i), { target:{ value:'12 Market Road' } });
  fireEvent.change(screen.getByLabelText(/city/i), { target:{ value:'Lahore' } });
  fireEvent.click(screen.getByRole('button', { name:/confirm & place order/i }));

  expect(await screen.findByRole('heading', { name:/order confirmed/i })).toBeInTheDocument();
  const orderRequest = API.post.mock.calls.find(([url]) => url === '/api/orders');
  expect(orderRequest[1].guestContact).toEqual({ name:'Guest Buyer', email:'buyer@example.test', phone:'' });
  expect(clearCart).toHaveBeenCalledOnce();
  expect(screen.queryByRole('button', { name:/view my orders/i })).not.toBeInTheDocument();
  await waitFor(() => expect(API.post).toHaveBeenCalled());
});
