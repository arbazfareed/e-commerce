export default function EmptyCart({
  Link,
  S
}) {
  return (
    <div className="responsive-page cart-page" style={S.page}>
      <div style={S.emptyCard}>
        <p style={{ fontSize:'64px', margin:0 }}>🛒</p>
        <h2 style={{ margin:'16px 0 8px', color:'#1e293b', fontSize:'22px' }}>Your cart is empty</h2>
        <p style={{ color:'#94a3b8', margin:'0 0 24px', fontSize:'14px' }}>Browse our products and add items to your cart.</p>
        <Link to="/" style={{ ...S.greenBtn, textDecoration:'none' }}>Browse Products →</Link>
      </div>
    </div>
  );
}
