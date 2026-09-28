import { fireEvent, render, screen } from '@testing-library/react';
import { CartProvider, useCart } from '../context/CartContext';

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
  render(<CartProvider><CartHarness /></CartProvider>);

  fireEvent.click(screen.getByRole('button', { name: /add zero/i }));
  expect(screen.getByLabelText(/cart quantity/i)).toHaveTextContent('0');

  fireEvent.click(screen.getByRole('button', { name: /add ten/i }));
  expect(screen.getByLabelText(/cart quantity/i)).toHaveTextContent('2');

  fireEvent.click(screen.getByRole('button', { name: /set ten/i }));
  expect(screen.getByLabelText(/cart quantity/i)).toHaveTextContent('2');
});
