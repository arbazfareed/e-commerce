export default function OrderConfirmation({
  S,
  navigate,
  orderId,
  payment,
  paymentStatus,
  trackPath = '',
  nextOrderCoupon = null,
  user
}) {
  return (
    <div className="responsive-page cart-page" style={S.page}>
      <div style={S.successCard}>
        <div style={{ fontSize:'72px', lineHeight:1, marginBottom:'4px' }}>🎉</div>
        <h2 style={{ margin:'16px 0 10px', fontSize:'26px', fontWeight:'900', color:'#0f172a' }}>Order Confirmed!</h2>
        <p style={{ margin:'0 0 6px', fontSize:'15px', color:'#475569' }}>
          Order ID: <strong style={{ color:'#10b981', fontFamily:'monospace', fontSize:'16px' }}>
            #{orderId?.slice(-8).toUpperCase()}
          </strong>
        </p>
        <p style={{ margin:'0 0 30px', fontSize:'13px', color:'#64748b', lineHeight:'1.6' }}>
          {payment === 'COD'
            ? paymentStatus === 'paid'
              ? '💵 Payment received.'
              : '💵 Cash is due when your order arrives. No payment has been collected yet.'
            : paymentStatus === 'paid'
              ? `Payment via ${payment} is confirmed.`
              : `Payment via ${payment} is pending. This order flow has not captured your payment.`}
        </p>
        {!user && <p style={{ margin:'0 0 20px', fontSize:13, color:'#64748b', lineHeight:1.5 }}>
          {trackPath
            ? 'We emailed you a confirmation with your tracking link. You can also bookmark the Track order button below.'
            : 'Save your order number for reference. Guest orders are not shown in account order history.'}
        </p>}
        {nextOrderCoupon && (
          <div className="thank-you-coupon" style={{ margin:'0 auto 22px', maxWidth:420, padding:'14px 16px', border:'2px dashed #10b981', borderRadius:14, background:'#f0fdf4', textAlign:'center' }}>
            <p style={{ margin:'0 0 6px', fontSize:13, fontWeight:700, color:'#166534' }}>🎁 A thank-you gift: {nextOrderCoupon.text}</p>
            <p style={{ margin:0, fontSize:13, color:'#166534' }}>Use code <strong style={{ fontSize:18, letterSpacing:1, color:'#065f46' }}>{nextOrderCoupon.code}</strong>{nextOrderCoupon.expiresAt ? ` before ${nextOrderCoupon.expiresAt}` : ''}</p>
          </div>
        )}
        <div style={{ display:'flex', gap:'12px', justifyContent:'center', flexWrap:'wrap' }}>
          {user && <button style={S.greenBtn} onClick={() => navigate('/orders')}>📦 View My Orders</button>}
          {!user && trackPath && <button style={S.greenBtn} onClick={() => navigate(trackPath)}>📦 Track order</button>}
          <button style={S.ghostBtn} onClick={() => navigate('/')}>Continue Shopping</button>
        </div>
      </div>
    </div>
  );
}
