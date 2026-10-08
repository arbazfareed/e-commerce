export default function CartSummary({
  S,
  appliedCoupon,
  applyCoupon,
  assetUrl,
  codFee,
  codWaived,
  couponChecking,
  couponDiscount,
  couponError,
  couponInput,
  fmt,
  getItemPrice,
  grandTotal,
  handlePlaceOrder,
  payment,
  placing,
  safeItems,
  setAppliedCoupon,
  setCouponError,
  setCouponInput,
  setStep,
  shipBreak,
  shipCalc,
  shipFee,
  step,
  subTotal,
  totalQty
}) {
  return (
    <div className="cart-summary" style={S.summary}>
      <h3 style={S.secTitle}>Order Summary</h3>
    
      {/* Mini item list */}
      <div style={{ marginBottom:'16px' }}>
        {safeItems.map(item => (
          <div key={item._id} style={{ display:'flex', alignItems:'center', gap:'10px', marginBottom:'10px' }}>
            <div style={{ width:'38px', height:'38px', borderRadius:'8px', overflow:'hidden', flexShrink:0, border:'1px solid #e2e8f0', background:'#f8fafc' }}>
              {item.images?.[0]
                        ? <img src={assetUrl(item.images[0])} alt={item.name}
                    style={{ width:'100%', height:'100%', objectFit:'cover' }} />
                : <div style={{ width:'100%', height:'100%', display:'flex', alignItems:'center', justifyContent:'center', fontSize:'14px', fontWeight:'700', color:'#10b981' }}>
                    {item.name[0]}
                  </div>}
            </div>
            <div style={{ flex:1, minWidth:0 }}>
              <p style={{ margin:0, fontSize:'12px', fontWeight:'600', color:'#334155', overflow:'hidden', textOverflow:'ellipsis', whiteSpace:'nowrap' }}>{item.name}</p>
              <p style={{ margin:0, fontSize:'12px', color:'#94a3b8' }}>×{item.quantity}</p>
            </div>
            <span style={{ fontSize:'13px', fontWeight:'700', color:'#10b981', flexShrink:0 }}>
              {fmt(getItemPrice(item) * item.quantity)}
            </span>
          </div>
        ))}
      </div>
    
      <div className="cart-coupon-box" style={{ padding:'12px', borderRadius:12, border:'1px solid #dbe7df', background:'#f8fcf9', marginBottom:14 }}>
        <label htmlFor="coupon-code" style={{ ...S.lbl, marginBottom:7 }}>Promo code</label>
        <div style={{ display:'flex', gap:7 }}>
          <input className="cart-coupon-input" id="coupon-code" value={couponInput} onChange={event => setCouponInput(event.target.value.toUpperCase())} placeholder="e.g. WELCOME10" autoComplete="off" style={{ ...S.inp, minWidth:0, flex:1, textTransform:'uppercase' }} aria-describedby="coupon-feedback" />
          {appliedCoupon ? <button type="button" onClick={() => { setAppliedCoupon(null); setCouponError(''); setCouponInput(''); }} style={{ ...S.ghostBtn, padding:'8px 10px', fontSize:12 }}>Remove</button> : <button type="button" onClick={applyCoupon} disabled={couponChecking} style={{ ...S.greenBtn, padding:'8px 11px', fontSize:12, whiteSpace:'nowrap' }}>{couponChecking ? 'Checking…' : 'Apply'}</button>}
        </div>
        <p id="coupon-feedback" className={`cart-coupon-feedback${couponError ? ' is-error' : appliedCoupon ? ' is-success' : ''}`} aria-live="polite" style={{ margin:'8px 0 0', fontSize:13, fontWeight:600, lineHeight:1.5, color: couponError ? '#b91c1c' : '#047857' }}>
          {couponError || (appliedCoupon ? `${appliedCoupon.code} applied — you save ${fmt(couponDiscount)}.` : 'Enter a valid promo code to check eligibility.')}
        </p>
      </div>
    
      <div style={S.divider} />
    
      <div style={S.sumRow}>
        <span style={S.sumLbl}>Subtotal ({totalQty} items)</span>
        <span style={S.sumVal}>{fmt(subTotal)}</span>
      </div>
      {couponDiscount > 0 && <div style={S.sumRow}>
        <span style={S.sumLbl}>Promo discount</span>
        <span style={{ ...S.sumVal, color:'#047857' }}>−{fmt(couponDiscount)}</span>
      </div>}
      {payment === 'COD' && (
        <div style={S.sumRow}>
          <span style={S.sumLbl}>
            COD fee
            {codWaived && <small style={{ display:'block', color:'#059669' }}>Free on this order</small>}
          </span>
          <span style={S.sumVal}>{codFee ? fmt(codFee) : 'Free'}</span>
        </div>
      )}
      <div style={S.sumRow}>
        <span style={S.sumLbl}>
          Shipping
          <small style={{ display:'block', color:'#94a3b8', fontWeight:'500', fontSize:12 }}>
            {shipCalc.zoneLabel}
          </small>
          <small style={{ display:'block', color:'#94a3b8', fontWeight:'500', fontSize:12, lineHeight:1.45, marginTop:2 }}>
            {shipBreak}
          </small>
        </span>
        <span style={S.sumVal}>{fmt(shipFee)}</span>
      </div>
    
      <div style={S.divider} />
    
      <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center', marginBottom:'22px' }}>
        <span style={{ fontWeight:'800', fontSize:'16px', color:'#0f172a' }}>Total</span>
        <span style={{ fontWeight:'900', fontSize:'24px', color:'#10b981' }}>{fmt(grandTotal)}</span>
      </div>
    
      {step === 'cart' && (
        <button style={{ ...S.greenBtn, width:'100%' }}
            onClick={() => setStep('checkout')}>
          Proceed to Checkout →
        </button>
      )}
    
      {step === 'checkout' && (
        <>
          <button
            style={{ ...S.greenBtn, width:'100%', marginBottom:'10px', opacity: placing ? 0.7 : 1 }}
            onClick={handlePlaceOrder}
            disabled={placing}
          >
            {placing ? '⏳ Placing Order…' : '✅ Confirm & Place Order'}
          </button>
          <button style={{ ...S.ghostBtn, width:'100%' }} onClick={() => setStep('cart')}>
            ← Back to Cart
          </button>
        </>
      )}
    
      <p style={{ textAlign:'center', fontSize:'12px', color:'#94a3b8', marginTop:'14px', lineHeight:'1.5' }}>
        🔒 Secure checkout · IndusCart 🇵🇰
      </p>
    </div>
  );
}
