import { useEffect, useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import API from '../utils/axiosConfig';

const money = (amount, currency) => new Intl.NumberFormat(currency === 'USD' ? 'en-US' : 'en-PK', {
  style: 'currency', currency, maximumFractionDigits: currency === 'USD' ? 2 : 0,
}).format(Number(amount || 0));

export default function InvoicePage() {
  const { id } = useParams();
  const [order, setOrder] = useState(null);
  const [error, setError] = useState('');
  const [mode, setMode] = useState('invoice');

  useEffect(() => {
    let active = true;
    API.get(`/api/orders/${id}`)
      .then(({ data }) => { if (active) setOrder(data); })
      .catch(err => { if (active) setError(err.response?.data?.message || 'This order receipt could not be loaded.'); });
    return () => { active = false; };
  }, [id]);

  if (error) return <main className="responsive-page" style={{ maxWidth:760, margin:'40px auto', padding:24 }}><h1>Receipt unavailable</h1><p>{error}</p><Link to="/orders">Back to my orders</Link></main>;
  if (!order) return <main className="responsive-page" style={{ maxWidth:760, margin:'40px auto', padding:24 }}><p>Loading order receipt…</p></main>;

  const currency = order.currency === 'USD' || (!order.currency && order.address?.country && order.address.country !== 'Pakistan') ? 'USD' : 'PKR';
  const orderNumber = order._id.slice(-8).toUpperCase();
  const address = [order.address?.street, order.address?.city, order.address?.country].filter(Boolean).join(', ');

  return <main className={`responsive-page invoice-page invoice-${mode}`}>
    <div className="invoice-toolbar invoice-no-print">
      <Link to="/orders" className="invoice-back">← My orders</Link>
      <div className="invoice-actions" role="group" aria-label="Print format">
        <button type="button" aria-pressed={mode === 'invoice'} onClick={() => setMode('invoice')}>Invoice</button>
        <button type="button" aria-pressed={mode === 'packing'} onClick={() => setMode('packing')}>Packing slip</button>
        <button type="button" className="invoice-print-button" onClick={() => window.print()}>Print / Save PDF</button>
      </div>
    </div>
    <article className="invoice-sheet">
      <header className="invoice-header">
        <div><p className="invoice-kicker">INDUSCART RITUAL</p><h1>{mode === 'invoice' ? 'Order invoice' : 'Packing slip'}</h1><p>Thank you for shopping with us.</p></div>
        <div className="invoice-order-meta"><strong>Order #{orderNumber}</strong><span>{new Date(order.createdAt).toLocaleDateString('en-PK', { day:'numeric', month:'long', year:'numeric' })}</span><span>Status: {order.status}</span></div>
      </header>
      <div className="invoice-addresses">
        <section><h2>Deliver to</h2><strong>{order.user?.name || order.guestContact?.name || 'Customer'}</strong><p>{address || 'Address not available'}</p>{(order.user?.email || order.guestContact?.email) && <p>{order.user?.email || order.guestContact.email}</p>}{order.guestContact?.phone && <p>{order.guestContact.phone}</p>}</section>
        <section><h2>Order details</h2><p>Payment: {order.paymentMethod}</p><p>Payment status: {order.paymentStatus || (order.isPaid ? 'paid' : 'pending')}</p>{order.shippingZone && <p>Shipping zone: {order.shippingZone.replaceAll('_', ' ')}</p>}</section>
      </div>
      <table className="invoice-items">
        <thead><tr><th>Item</th><th>Options</th><th>Qty</th>{mode === 'invoice' && <><th>Unit price</th><th>Line total</th></>}</tr></thead>
        <tbody>{(order.products || []).map((item, index) => <tr key={`${item.product || item.name}-${index}`}><td><strong>{item.name}</strong></td><td>{[item.selectedColor, item.selectedSize].filter(Boolean).join(' · ') || '—'}</td><td>{item.quantity}</td>{mode === 'invoice' && <><td>{money(item.price, currency)}</td><td>{money(item.price * item.quantity, currency)}</td></>}</tr>)}</tbody>
      </table>
      {mode === 'invoice' && <section className="invoice-totals" aria-label="Order total breakdown">
        <div><span>Items subtotal</span><strong>{money(order.productTotal, currency)}</strong></div>
        {order.couponDiscount > 0 && <div><span>Promo code {order.couponCode ? `(${order.couponCode})` : ''}</span><strong>−{money(order.couponDiscount, currency)}</strong></div>}
        <div><span>Shipping</span><strong>{money(order.shippingFee, currency)}</strong></div>
        {order.codFee > 0 && <div><span>Cash-on-delivery fee</span><strong>{money(order.codFee, currency)}</strong></div>}
        <div className="invoice-grand-total"><span>Total</span><strong>{money(order.totalPrice, currency)}</strong></div>
      </section>}
      {mode === 'packing' && <p className="invoice-packing-note">Please verify all listed items and selected options before sealing the package.</p>}
      <footer className="invoice-footer">IndusCart Ritual · Order #{orderNumber}</footer>
    </article>
  </main>;
}
