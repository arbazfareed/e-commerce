export default function OrderConfirmation({
  S,
  navigate,
  orderId,
  payment,
  paymentStatus,
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
        {!user && <p style={{ margin:'0 0 20px', fontSize:13, color:'#64748b', lineHeight:1.5 }}>Save your order number for reference. Guest orders are not shown in account order history.</p>}
        <div style={{ display:'flex', gap:'12px', justifyContent:'center', flexWrap:'wrap' }}>
          {user && <button style={S.greenBtn} onClick={() => navigate('/orders')}>📦 View My Orders</button>}
          <button style={S.ghostBtn} onClick={() => navigate('/')}>Continue Shopping</button>
        </div>
      </div>
    </div>
  );
}
