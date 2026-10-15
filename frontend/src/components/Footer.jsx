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
      <footer className="global-site-footer" style={{
        backgroundColor: '#061612',
        borderTop: '1px solid rgba(255, 255, 255, 0.08)',
        color: '#ffffff',
        padding: '38px 24px 34px',
        position: 'relative',
        zIndex: 10,
        fontFamily: 'var(--font-sans, system-ui, -apple-system, sans-serif)',
      }}>
        <div style={{
          maxWidth: '1280px',
          margin: '0 auto',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          flexWrap: 'wrap',
          gap: '24px 36px',
        }}>
          {/* Left: Brand + Separator + Copyright */}
          <div style={{
            display: 'flex',
            alignItems: 'center',
            flexWrap: 'wrap',
            gap: '12px 14px',
          }}>
            <Link to="/" style={{
              display: 'flex',
              flexDirection: 'column',
              lineHeight: 1.05,
              textDecoration: 'none',
              color: '#ffffff',
              userSelect: 'none',
            }}>
              <span style={{
                fontSize: '20px',
                fontWeight: 800,
                letterSpacing: '-0.5px',
                color: '#ffffff',
              }}>
                IndusCart
              </span>
              <span style={{
                fontSize: '20px',
                fontWeight: 800,
                letterSpacing: '-0.5px',
                color: '#ffffff',
              }}>
                Valley
              </span>
            </Link>

            <span style={{
              color: 'rgba(255, 255, 255, 0.35)',
              fontSize: '14px',
              userSelect: 'none',
            }} aria-hidden="true">•</span>

            <span style={{
              color: 'rgba(255, 255, 255, 0.70)',
              fontSize: '13px',
              lineHeight: 1.5,
              fontWeight: 400,
              maxWidth: '380px',
            }}>
              © 2026 IndusCart Valley. Mindfully crafted rituals. All rights reserved.
            </span>
          </div>

          {/* Right: Navigation Links in 2 structured rows */}
          <div style={{
            display: 'flex',
            flexDirection: 'column',
            gap: '10px',
          }}>
            {/* Top row */}
            <div style={{
              display: 'flex',
              alignItems: 'center',
              flexWrap: 'wrap',
              gap: '18px 26px',
            }}>
              <button
                type="button"
                onClick={handleEditorialClick}
                style={linkBtnStyle}
                onMouseEnter={(e) => e.currentTarget.style.color = '#ffffff'}
                onMouseLeave={(e) => e.currentTarget.style.color = 'rgba(255, 255, 255, 0.82)'}
              >
                Editorial Rituals
              </button>

              <button
                type="button"
                onClick={() => setActiveModal('sustainability')}
                style={linkBtnStyle}
                onMouseEnter={(e) => e.currentTarget.style.color = '#ffffff'}
                onMouseLeave={(e) => e.currentTarget.style.color = 'rgba(255, 255, 255, 0.82)'}
              >
                Sustainability & Sourcing
              </button>

              <button
                type="button"
                onClick={() => setActiveModal('shipping')}
                style={linkBtnStyle}
                onMouseEnter={(e) => e.currentTarget.style.color = '#ffffff'}
                onMouseLeave={(e) => e.currentTarget.style.color = 'rgba(255, 255, 255, 0.82)'}
              >
                Shipping & Returns
              </button>

              <Link
                to="/support"
                style={{
                  ...linkBtnStyle,
                  textDecoration: 'none',
                }}
                onMouseEnter={(e) => e.currentTarget.style.color = '#ffffff'}
                onMouseLeave={(e) => e.currentTarget.style.color = 'rgba(255, 255, 255, 0.82)'}
              >
                Contact Concierge
              </Link>
            </div>

            {/* Bottom row */}
            <div style={{
              display: 'flex',
              alignItems: 'center',
              flexWrap: 'wrap',
              gap: '18px 26px',
            }}>
              <button
                type="button"
                onClick={() => setActiveModal('terms')}
                style={linkBtnStyle}
                onMouseEnter={(e) => e.currentTarget.style.color = '#ffffff'}
                onMouseLeave={(e) => e.currentTarget.style.color = 'rgba(255, 255, 255, 0.82)'}
              >
                Terms of Service
              </button>

              <button
                type="button"
                onClick={() => setActiveModal('privacy')}
                style={linkBtnStyle}
                onMouseEnter={(e) => e.currentTarget.style.color = '#ffffff'}
                onMouseLeave={(e) => e.currentTarget.style.color = 'rgba(255, 255, 255, 0.82)'}
              >
                Privacy Policy
              </button>
            </div>
          </div>
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

const linkBtnStyle = {
  background: 'none',
  border: 'none',
  padding: 0,
  margin: 0,
  color: 'rgba(255, 255, 255, 0.82)',
  fontSize: '13px',
  fontWeight: 600,
  letterSpacing: '0.2px',
  cursor: 'pointer',
  transition: 'color 0.2s ease',
  fontFamily: 'inherit',
};
