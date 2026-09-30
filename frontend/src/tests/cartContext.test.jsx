import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import { vi } from 'vitest';
import { CartProvider, useCart } from '../context/CartContext';
import { useAuth } from '../context/AuthContext';
import API from '../utils/axiosConfig';

vi.mock('../context/AuthContext', () => ({ useAuth:vi.fn() }));
vi.mock('../utils/axiosConfig', () => ({ default:{ get:vi.fn(), put:vi.fn() } }));

const product = { _id: 'stock-limited', name: 'Limited stock item', stock: 2 };

function CartHarness() {
  const { items, addToCart, updateQty } = useCart();
  const quantity = items[0]?.quantity || 0;
  return (
    <div>
      <button onClick={() => addToCart(product, 10)}>Add ten</button>
      <button onClick={() => addToCart(product, 0)}>Add zero</button>
      <button onClick={() => updateQty(items[0], 10)}>Set ten</button>
      <output aria-label="Cart quantity">{quantity}</output>
    </div>
  );
}

test('cart quantity cannot exceed available product stock', () => {
  useAuth.mockReturnValue({ user:null });
  render(<CartProvider><CartHarness /></CartProvider>);

  fireEvent.click(screen.getByRole('button', { name: /add zero/i }));
  expect(screen.getByLabelText(/cart quantity/i)).toHaveTextContent('0');

  fireEvent.click(screen.getByRole('button', { name: /add ten/i }));
  expect(screen.getByLabelText(/cart quantity/i)).toHaveTextContent('2');

  fireEvent.click(screen.getByRole('button', { name: /set ten/i }));
  expect(screen.getByLabelText(/cart quantity/i)).toHaveTextContent('2');
});

test('signed-in cart hydrates from server and syncs changes for cross-device persistence', async () => {
  const serverItem = { _id:'cloud-item', name:'Cloud saved item', quantity:2, stock:5, selectedColor:'', selectedSize:'' };
  useAuth.mockReturnValue({ user:{ _id:'account-1' } });
  API.get.mockImplementation(path => Promise.resolve({ data:path === '/api/cart' ? [serverItem] : [] }));
  API.put.mockResolvedValue({ data:[serverItem] });

  function SignedInCartHarness() {
    const { items } = useCart();
    return <output aria-label="Synced cart items">{items.map(item => `${item.name} ×${item.quantity}`).join(', ')}</output>;
  }

  render(<CartProvider><SignedInCartHarness /></CartProvider>);

  expect(await screen.findByLabelText(/synced cart items/i)).toHaveTextContent('Cloud saved item ×2');
  await waitFor(() => expect(API.put).toHaveBeenCalledWith('/api/cart', {
    items:[{ product:'cloud-item', quantity:2, selectedColor:'', selectedSize:'' }],
  }));
});
