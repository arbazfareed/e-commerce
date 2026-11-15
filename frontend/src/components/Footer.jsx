import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';

export default function Footer() {
  const navigate = useNavigate();
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
                <h3 style={{ margin: '0 0 12px', fontSize: '20px', fontWeight: 800, color: '#f8fafc' }}>
                  Sustainability & Ethical Sourcing
                </h3>
                <p style={{ margin: '0 0 12px', color: '#cbd5e1', fontSize: '14px', lineHeight: 1.6 }}>
                  IndusCart Valley partners directly with independent harvesters, botanists, and craftspeople across Pakistan.
                  Every formula is cruelty-free, biodegradable, and packaged with recyclable or reusable materials.
                </p>
                <p style={{ margin: 0, color: '#94a3b8', fontSize: '13px', lineHeight: 1.6 }}>
                  Our fair-trade purchasing ensures sustainable livelihoods while safeguarding regional wild harvest ecosystems.
                </p>
              </div>
            )}

            {activeModal === 'shipping' && (
              <div>
                <h3 style={{ margin: '0 0 12px', fontSize: '20px', fontWeight: 800, color: '#f8fafc' }}>
                  Shipping & Returns
                </h3>
                <p style={{ margin: '0 0 12px', color: '#cbd5e1', fontSize: '14px', lineHeight: 1.6 }}>
                  Enjoy <strong>Free Expedited Shipping</strong> across Pakistan on all orders over <strong>PKR 10,000</strong>.
                  Standard dispatch takes 24–48 hours, fully tracked with SMS and email confirmations.
                </p>
                <p style={{ margin: '0 0 14px', color: '#cbd5e1', fontSize: '14px', lineHeight: 1.6 }}>
                  We offer a 7-day hassle-free return and exchange policy for unused items in original presentation packaging.
                </p>
                <Link
                  to="/support"
                  onClick={closeModal}
                  style={{
                    display: 'inline-block',
                    padding: '8px 16px',
                    borderRadius: '10px',
                    background: '#10b981',
                    color: '#062017',
                    fontWeight: 700,
                    fontSize: '13px',
                    textDecoration: 'none',
                  }}
                >
                  Contact Concierge for Support →
                </Link>
              </div>
            )}

            {activeModal === 'terms' && (
              <div>
                <h3 style={{ margin: '0 0 12px', fontSize: '20px', fontWeight: 800, color: '#f8fafc' }}>
                  Terms of Service
                </h3>
                <p style={{ margin: '0 0 12px', color: '#cbd5e1', fontSize: '14px', lineHeight: 1.6 }}>
                  By accessing IndusCart Valley, you agree to our terms of mindful, authenticated commerce. All product formulations and branded ritual assets are protected intellectual property.
                </p>
                <p style={{ margin: 0, color: '#94a3b8', fontSize: '13px', lineHeight: 1.6 }}>
                  Orders are processed securely in accordance with local e-commerce regulations and encrypted payment gateways.
                </p>
              </div>
            )}

            {activeModal === 'privacy' && (
              <div>
                <h3 style={{ margin: '0 0 12px', fontSize: '20px', fontWeight: 800, color: '#f8fafc' }}>
                  Privacy Policy
                </h3>
                <p style={{ margin: '0 0 12px', color: '#cbd5e1', fontSize: '14px', lineHeight: 1.6 }}>
                  Your privacy and data dignity are fundamental to us. We never sell or exchange your personal information with third-party data brokers.
                </p>
                <p style={{ margin: 0, color: '#94a3b8', fontSize: '13px', lineHeight: 1.6 }}>
                  All payment and checkout transactions are encrypted with enterprise-grade SSL, retaining only what is needed to fulfill your deliveries seamlessly.
                </p>
              </div>
            )}
          </div>
        </div>
      )}
    </>
  );
}
