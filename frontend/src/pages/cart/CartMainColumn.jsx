export default function CartMainColumn({
  S,
  addr,
  assetUrl,
  availablePaymentOptions,
  error,
  fmt,
  getActiveDiscountPercent,
  getItemPrice,
  guestContact,
  isPak,
  payment,
  removeFromCart,
  safeItems,
  setAddr,
  setGuestContact,
  setPayment,
  step,
  updateQty,
  user
}) {
  return (
    <div className="cart-main-column" style={{ flex:1, minWidth:'280px' }}>
    
      {/* CART STEP */}
      {step === 'cart' && (
        <div className="cart-items-card" style={S.card}>
          {safeItems.map(item => {
            const price = getItemPrice(item);
            const originalPrice = isPak ? (item.pricePKR || 0) : (item.priceUSD || 0);
            const discount = getActiveDiscountPercent(item);
            const img   = item.images?.[0];
            return (
              <div key={item._id} className="item-row">
                {/* Product image */}
                <div className="cart-item-image" style={S.itemImgBox}>
                  {img
                    ? <img
                        src={assetUrl(img)}
                        alt={item.name}
                        style={{ width:'100%', height:'100%', objectFit:'cover' }}
                        onError={e => { e.target.style.display = 'none'; e.target.nextSibling.style.display = 'flex'; }}
                      />
                    : null}
                  <div style={{ ...S.itemImgPh, display: img ? 'none' : 'flex' }}>{item.name[0]}</div>
                </div>
    
                {/* Info */}
                <div className="cart-item-details" style={{ flex:1, minWidth:0 }}>
                  <p style={{ margin:'0 0 2px', fontWeight:'700', fontSize:'15px', color:'#1e293b' }}>{item.name}</p>
                  <p style={{ margin:'0 0 6px', fontSize:'12px', color:'#94a3b8', textTransform:'uppercase', letterSpacing:'0.5px', fontWeight:'600' }}>
                    {item.category}
                  </p>
                  {(item.selectedColor || item.selectedSize) && (
                    <p style={{ margin:'0 0 6px', fontSize:'12px', color:'#047857', fontWeight:'700' }}>
                      {[item.selectedColor && `Colour: ${item.selectedColor}`, item.selectedSize && `Size: ${item.selectedSize}`].filter(Boolean).join(' · ')}
                    </p>
                  )}
                  <p style={{ margin:0, fontSize:'13px', color:'#64748b' }}>
                    {fmt(price)} each {discount > 0 && <del className="cart-original-price">{fmt(originalPrice)}</del>}
                  </p>
                  {discount > 0 && <span className="cart-discount-note">You save {discount}%</span>}
                </div>
    
                <div className="cart-item-actions">
                  {/* Quantity controls */}
                  <div className="cart-quantity-control" style={S.qtyBox}>
                    <button type="button" className="cart-quantity-button" style={S.qtyBtn} onClick={() => updateQty(item, item.quantity - 1)} aria-label={`Decrease ${item.name} quantity`}>−</button>
                    <span className="cart-quantity-value" style={S.qtyNum}>{item.quantity}</span>
                    <button type="button" className="cart-quantity-button" style={S.qtyBtn} onClick={() => updateQty(item, item.quantity + 1)} disabled={Number.isFinite(Number(item.stock)) && item.quantity >= Number(item.stock)} aria-label={`Increase ${item.name} quantity`}>+</button>
                  </div>
    
                  {/* Subtotal */}
                  <div className="cart-item-subtotal">
                    <p className="cart-item-price" style={{ margin:'0 0 6px', fontWeight:'800', fontSize:'16px', color:'#10b981' }}>
                      {fmt(price * item.quantity)}
                    </p>
                    <button
                      type="button"
                      className="cart-remove-button"
                      onClick={() => removeFromCart(item)}
                    >
                      Remove
                    </button>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}
    
      {/* CHECKOUT STEP */}
      {step === 'checkout' && (
        <div style={S.card}>
          {!user && <>
            <h3 style={S.secTitle}>Contact Details</h3>
            <p style={{ margin:'-10px 0 14px', fontSize:13, color:'#64748b', lineHeight:1.5 }}>No account needed. We’ll use these details for your COD order.</p>
            <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:'14px', marginBottom:22 }}>
              <div>
                <label htmlFor="guest-name" style={S.lbl}>Full name *</label>
                <input id="guest-name" style={S.inp} autoComplete="name" maxLength={120} value={guestContact.name} onChange={event => setGuestContact(contact => ({ ...contact, name:event.target.value }))} required />
              </div>
              <div>
                <label htmlFor="guest-email" style={S.lbl}>Email *</label>
                <input id="guest-email" style={S.inp} type="email" autoComplete="email" maxLength={254} value={guestContact.email} onChange={event => setGuestContact(contact => ({ ...contact, email:event.target.value }))} required />
              </div>
              <div>
                <label htmlFor="guest-phone" style={S.lbl}>Phone (optional)</label>
                <input id="guest-phone" style={S.inp} type="tel" autoComplete="tel" maxLength={40} value={guestContact.phone} onChange={event => setGuestContact(contact => ({ ...contact, phone:event.target.value }))} />
              </div>
            </div>
          </>}
          <h3 style={S.secTitle}>📍 Delivery Address</h3>
          {error && <div style={S.errBox}>⚠️ {error}</div>}
    
          <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:'14px' }}>
            <div style={{ gridColumn:'1/-1' }}>
              <label htmlFor="delivery-street" style={S.lbl}>Street / Area *</label>
              <input id="delivery-street" style={S.inp}
                placeholder="e.g. House 12, Block B, DHA Phase 5"
                autoComplete="street-address"
                value={addr.street}
                onChange={e => setAddr(a => ({ ...a, street: e.target.value }))}
              />
            </div>
            <div>
              <label htmlFor="delivery-city" style={S.lbl}>City *</label>
              <input id="delivery-city" style={S.inp}
                placeholder="Lahore"
                value={addr.city}
                autoComplete="off"
                onChange={e => setAddr(a => ({ ...a, city: e.target.value }))}
              />
            </div>
            <div>
              <label htmlFor="delivery-country" style={S.lbl}>Country</label>
              <input id="delivery-country" style={{ ...S.inp, background:'#f1f5f9', color:'#64748b' }}
                value={addr.country} readOnly />
            </div>
          </div>
    
          <h3 style={{ ...S.secTitle, marginTop:'24px' }}>💳 Payment Method</h3>
          <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:'10px' }}>
            {availablePaymentOptions.map(pm => (
              <label key={pm.id} style={{ ...S.payOpt, ...(payment === pm.id ? S.payOn : {}) }}>
                <input type="radio" name="pm" style={{ display:'none' }}
                  checked={payment === pm.id} onChange={() => setPayment(pm.id)} />
                <span style={{ fontSize:'20px' }}>{pm.icon}</span>
                <div>
                  <p style={{ margin:0, fontWeight:'700', fontSize:'13px', color:'#1e293b' }}>{pm.label}</p>
                  <p style={{ margin:0, fontSize:'12px', color:'#64748b', lineHeight:1.45 }}>{pm.desc}</p>
                </div>
              </label>
            ))}
          </div>
          {availablePaymentOptions.length === 0 && <p role="status" style={{ margin:'10px 0 0', color:'#b91c1c', fontSize:12, lineHeight:1.5 }}>No payment method is currently available. Online payment providers must be integrated and verified before they can be enabled.</p>}
        </div>
      )}
    </div>
  );
}
