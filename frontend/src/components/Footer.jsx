import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import useStoreSettings from '../hooks/useStoreSettings';

const rs = n => `Rs ${Number(n).toLocaleString('en-PK')}`;
const P = { margin: '0 0 12px', color: '#cbd5e1', fontSize: '14px', lineHeight: 1.6 };
const H = { margin: '0 0 12px', fontSize: '20px', fontWeight: 800, color: '#f8fafc' };
const H4 = { margin: '16px 0 6px', fontSize: '13px', fontWeight: 800, color: '#f2c98a', letterSpacing: '.06em', textTransform: 'uppercase' };

const SOCIALS = [
  ['socialInstagram', 'Instagram', <><rect x="3.5" y="3.5" width="17" height="17" rx="5" /><circle cx="12" cy="12" r="4" /><circle cx="17.3" cy="6.7" r=".9" fill="currentColor" /></>],
  ['socialFacebook', 'Facebook', <path d="M14 8h3V4.5h-3a4 4 0 0 0-4 4V11H7.5v3.5H10V21h3.5v-6.5H16l.7-3.5h-3.2V8.6c0-.4.2-.6.5-.6Z" />],
  ['socialTikTok', 'TikTok', <path d="M14 3.5v11.2a3.3 3.3 0 1 1-3.3-3.3M14 3.5c.4 2.6 2.2 4.4 5 4.6" />],
];

// Only links the admin has saved are shown; values are validated as https links on the server.
function SocialLinks({ store }) {
  const links = SOCIALS.filter(([key]) => typeof store[key] === 'string' && store[key].startsWith('https://'));
  if (!links.length) return null;
  return (
    <div className="lux-footer-social">
      {links.map(([key, label, icon]) => (
        <a key={key} href={store[key]} target="_blank" rel="noopener noreferrer" aria-label={`IndusCart on ${label}`}>
          <svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">{icon}</svg>
        </a>
      ))}
    </div>
  );
}

export default function Footer() {
  const navigate = useNavigate();
  const store = useStoreSettings();
  const [activeModal, setActiveModal] = useState(null); // 'rituals' | 'sustainability' | 'shipping' | 'terms' | 'privacy' | null

  const handleEditorialClick = (e) => {
    e.preventDefault();
    const shopEl = document.getElementById('shop-collection');
    if (shopEl) {
      shopEl.scrollIntoView({ behavior: 'smooth' });
    } else {
      navigate('/#shop-collection');
    }
  };

  const closeModal = () => setActiveModal(null);

  return (
    <>
      <footer className="global-site-footer lux-footer">
        <div className="lux-footer-inner">
          <div className="lux-footer-brand">
            <Link to="/" className="lux-footer-logo" aria-label="IndusCart Valley home">
              <span>IndusCart</span>
              <span className="lux-footer-logo-accent">Valley</span>
            </Link>
            <p className="lux-footer-tagline">Skincare, home rituals and handmade finds from makers across Pakistan.</p>
            <a className="lux-footer-mail" href="mailto:induscartvalley@gmail.com">induscartvalley@gmail.com</a>
            <SocialLinks store={store} />
          </div>

          <nav className="lux-footer-col" aria-label="Shop">
            <h2>Shop</h2>
            <button type="button" onClick={handleEditorialClick}>Editorial Rituals</button>
            <Link to="/wishlist">Wishlist</Link>
            <Link to="/cart">Your bag</Link>
          </nav>

          <nav className="lux-footer-col" aria-label="Help">
            <h2>Help</h2>
            <button type="button" onClick={() => setActiveModal('shipping')}>Shipping & Returns</button>
            <Link to="/orders">Track an order</Link>
            <Link to="/support">Contact Concierge</Link>
          </nav>

          <nav className="lux-footer-col" aria-label="About">
            <h2>About</h2>
            <button type="button" onClick={() => setActiveModal('sustainability')}>Sustainability & Sourcing</button>
            <button type="button" onClick={() => setActiveModal('terms')}>Terms of Service</button>
            <button type="button" onClick={() => setActiveModal('privacy')}>Privacy Policy</button>
          </nav>
        </div>

        <div className="lux-footer-bottom">
          <span>© 2026 IndusCart Valley. Mindfully crafted rituals. All rights reserved.</span>
          <span className="lux-footer-pay">Cash on delivery · Secure checkout</span>
        </div>
      </footer>

      {/* Info Modal */}
      {activeModal && (
        <div
          role="dialog"
          aria-modal="true"
          style={{
            position: 'fixed',
            inset: 0,
            backgroundColor: 'rgba(5, 17, 14, 0.78)',
            backdropFilter: 'blur(8px)',
            WebkitBackdropFilter: 'blur(8px)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            zIndex: 9999,
            padding: '20px',
          }}
          onClick={closeModal}
        >
          <div
            style={{
              backgroundColor: '#0c221b',
              color: '#ffffff',
              border: '1px solid rgba(110, 231, 183, 0.25)',
              borderRadius: '24px',
              maxWidth: '560px',
              width: '100%',
              padding: '30px',
              boxShadow: '0 24px 60px rgba(0, 0, 0, 0.55)',
              position: 'relative',
              animation: 'fadeIn 0.2s ease-out',
            }}
            onClick={(e) => e.stopPropagation()}
          >
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '18px' }}>
              <span style={{
                color: '#6ee7b7',
                fontSize: '11px',
                fontWeight: 800,
                letterSpacing: '1.2px',
                textTransform: 'uppercase',
              }}>
                IndusCart Valley • 2026
              </span>
              <button
                type="button"
                onClick={closeModal}
                style={{
                  background: 'rgba(255, 255, 255, 0.1)',
                  border: 'none',
                  color: '#ffffff',
                  width: '32px',
                  height: '32px',
                  borderRadius: '50%',
                  cursor: 'pointer',
                  fontSize: '16px',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                }}
              >
                ✕
              </button>
            </div>

            {activeModal === 'sustainability' && (
              <div>
                <h3 style={H}>Sustainability & Ethical Sourcing</h3>
                <p style={P}>
                  IndusCart Valley works with independent sellers, small producers and craftspeople across Pakistan.
                  Buying from them keeps more of each sale with the people who make the products.
                </p>
                <p style={{ ...P, margin: 0, color: '#94a3b8', fontSize: '13px' }}>
                  Ingredients, materials and care details are listed on each product page. If something is unclear, ask us before you buy.
                </p>
              </div>
            )}

            {activeModal === 'shipping' && (
              <div>
                <h3 style={H}>Shipping & Returns</h3>
                <h4 style={H4}>Delivery</h4>
                <p style={P}>
                  Orders in Pakistan usually arrive in <strong>{store.deliveryTimeLocal}</strong>
                  {store.internationalEnabled !== false && <> and international orders in <strong>{store.deliveryTimeIntl}</strong></>}.
                  {' '}You can follow every order from your account or the tracking link we send.
                </p>
                <p style={P}>
                  {Number(store.freeShippingThreshold) > 0
                    ? <>Delivery in Pakistan is <strong>free on orders of {rs(store.freeShippingThreshold)} or more</strong>. Below that, the delivery fee is shown at checkout before you order.</>
                    : <>The delivery fee for your address is shown at checkout before you place your order.</>}
                  {store.codEnabled !== false && <> Cash on delivery is available.</>}
                </p>
                <h4 style={H4}>Returns</h4>
                {Number(store.returnWindowDays) > 0 ? (
                  <p style={P}>
                    You can return unused items in their original packaging within <strong>{store.returnWindowDays} days</strong> of delivery.
                    {' '}{store.returnShippingPaidBy === 'store'
                      ? 'We cover the return shipping.'
                      : 'Return shipping is paid by the customer, unless the item arrived damaged or wrong.'}
                    {' '}Refunds are made once we receive and check the item.
                  </p>
                ) : (
                  <p style={P}>We do not accept returns of change-of-mind purchases. If an item arrives damaged or wrong, contact us and we will make it right.</p>
                )}
                {store.nonReturnableNote && <p style={{ ...P, color: '#94a3b8', fontSize: '13px' }}>{store.nonReturnableNote}</p>}
                <p style={{ ...P, color: '#94a3b8', fontSize: '13px' }}>Damaged or wrong item? Contact us with a photo of it and we will sort it out with you.</p>
                <Link to="/support" onClick={closeModal} style={{ display: 'inline-block', padding: '9px 16px', borderRadius: '10px', background: 'linear-gradient(135deg,#f6d9a4,#d9a95b)', color: '#1d1608', fontWeight: 800, fontSize: '13px', textDecoration: 'none' }}>
                  Start a return or ask a question →
                </Link>
              </div>
            )}

            {activeModal === 'terms' && (
              <div>
                <h3 style={H}>Terms of Service</h3>
                <p style={P}>By placing an order you agree to these terms. Prices are shown in PKR (or USD for international orders) and are confirmed at checkout, including any delivery or cash-on-delivery fees.</p>
                <p style={P}>Some products are sold by independent stores on IndusCart Valley; the seller is shown on each product page. We may cancel an order if a product is out of stock, the price was shown wrongly, or we cannot confirm the order with you. If you already paid, you get a full refund.</p>
                <p style={{ ...P, margin: 0, color: '#94a3b8', fontSize: '13px' }}>Returns follow our Shipping & Returns policy. Questions about these terms: induscartvalley@gmail.com.</p>
              </div>
            )}

            {activeModal === 'privacy' && (
              <div>
                <h3 style={H}>Privacy Policy</h3>
                <p style={P}>We collect what we need to run your orders: your name, email, phone number and delivery address, plus your order history. We use them to deliver orders, send order updates and answer support requests.</p>
                <p style={P}>We share your delivery details only with the seller of your products and the courier that delivers them. We never sell your information. Your password is stored encrypted and we never see it.</p>
                <p style={{ ...P, margin: 0, color: '#94a3b8', fontSize: '13px' }}>We use privacy-friendly visit statistics without advertising trackers. To see, correct or delete your data, email induscartvalley@gmail.com.</p>
              </div>
            )}
          </div>
        </div>
      )}
    </>
  );
}
