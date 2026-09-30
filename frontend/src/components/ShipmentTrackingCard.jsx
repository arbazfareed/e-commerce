export default function ShipmentTrackingCard({ order, isDark = false }) {
  if (!order?.trackingNumber && !order?.trackingUrl) return null;
  const panel = isDark ? 'rgba(19,33,29,0.9)' : '#f0fdf4';
  const border = isDark ? '1px solid rgba(130,175,157,0.25)' : '1px solid #bbf7d0';
  const ink = isDark ? '#e7f7ed' : '#14532d';
  const muted = isDark ? '#b9d1c4' : '#475569';
  const secureTrackingUrl = typeof order.trackingUrl === 'string' && order.trackingUrl.startsWith('https://') ? order.trackingUrl : '';

  return <section aria-label="Shipment tracking details" style={{ marginTop:12, padding:'14px 16px', borderRadius:12, background:panel, border }}>
    <h4 style={{ margin:'0 0 9px', color:ink, fontSize:12, fontWeight:900, textTransform:'uppercase', letterSpacing:'.5px' }}>🚚 Shipment tracking</h4>
    {order.shippingProvider && <p style={{ margin:'4px 0', color:muted, fontSize:12 }}>Courier: <strong style={{ color:ink }}>{order.shippingProvider}</strong></p>}
    {order.trackingNumber && <p style={{ margin:'4px 0', color:muted, fontSize:12 }}>Tracking number: <strong style={{ color:ink, fontFamily:'monospace', overflowWrap:'anywhere' }}>{order.trackingNumber}</strong></p>}
    {secureTrackingUrl && <a href={secureTrackingUrl} target="_blank" rel="noopener noreferrer" style={{ display:'inline-flex', marginTop:7, color:isDark ? '#9ce6b5' : '#047857', fontSize:12, fontWeight:800 }}>Open carrier tracking ↗</a>}
    <p style={{ margin:'8px 0 0', color:muted, fontSize:10, lineHeight:1.5 }}>Tracking details were entered by the store. Live carrier updates are not connected yet.</p>
  </section>;
}
