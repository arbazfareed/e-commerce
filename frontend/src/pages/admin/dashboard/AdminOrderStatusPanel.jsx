export default function AdminOrderStatusPanel({
  Badge,
  S,
  STATUS_CFG,
  STATUS_LIST,
  formatPKR,
  openSection,
  orders,
  themeMode
}) {
  return (
    <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:20, marginBottom:20 }}>
      <div style={{
        ...S.card,
        background: themeMode === 'dark' ? 'linear-gradient(180deg, rgba(14,22,26,0.96), rgba(11,19,23,0.96))' : 'linear-gradient(135deg, rgba(255,255,255,0.88), rgba(255,255,255,0.74))',
        borderColor: themeMode === 'dark' ? 'rgba(148,163,184,0.18)' : 'rgba(148,163,184,0.18)',
        boxShadow: themeMode === 'dark' ? '0 16px 36px rgba(2,6,23,0.32)' : '0 16px 38px rgba(15,23,42,.08)',
      }}>
        <h3 style={{ ...S.cardH, color: themeMode === 'dark' ? '#e2e8f0' : '#1e293b' }}>Order Status Breakdown</h3>
        <div style={{ marginTop:16 }}>
          {STATUS_LIST.map(s => {
            const cnt = orders.filter(o => o.status === s).length;
            const pct = orders.length ? Math.round(cnt/orders.length*100) : 0;
            const c   = STATUS_CFG[s];
            return (
              <div key={s} style={{ marginBottom:14 }}>
                <div style={{ display:'flex', justifyContent:'space-between', marginBottom:5, alignItems:'center' }}>
                  <span style={{ fontSize:12, fontWeight:700, color:'#334155', display:'flex', alignItems:'center', gap:5 }}><span>{c.icon}</span>{s}</span>
                  <span style={{ fontSize:13, fontWeight:900, color:c.color, fontFamily:"'Sora',sans-serif" }}>{cnt}</span>
                </div>
                <div style={{ height:5, background:'#f1f5f9', borderRadius:99, overflow:'hidden' }}>
                  <div style={{ height:'100%', width:`${pct}%`, background:c.dot, borderRadius:99, transition:'width 1.2s ease', minWidth:cnt>0?'12px':'0' }} />
                </div>
              </div>
            );
          })}
        </div>
      </div>
      <div style={{
        ...S.card,
        background: themeMode === 'dark' ? 'linear-gradient(180deg, rgba(14,22,26,0.96), rgba(11,19,23,0.96))' : 'linear-gradient(135deg, rgba(255,255,255,0.88), rgba(255,255,255,0.74))',
        borderColor: themeMode === 'dark' ? 'rgba(148,163,184,0.18)' : 'rgba(148,163,184,0.18)',
        boxShadow: themeMode === 'dark' ? '0 16px 36px rgba(2,6,23,0.32)' : '0 16px 38px rgba(15,23,42,.08)',
      }}>
        <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center', marginBottom:16 }}>
          <h3 style={{ ...S.cardH, color: themeMode === 'dark' ? '#e2e8f0' : '#1e293b' }}>Latest Orders</h3>
          <button style={{ ...S.linkBtn, color: themeMode === 'dark' ? '#93c5fd' : 'var(--brand-dark, #0d5c42)' }} onClick={() => openSection('orders')}>View all →</button>
        </div>
        {orders.length === 0
          ? <div style={S.emptyState}><p style={{ fontSize:42 }}>📭</p><p style={{ margin:0, fontSize:13 }}>No orders yet</p></div>
          : orders.slice(0,6).map(o => (
            <div key={o._id} style={{ display:'flex', alignItems:'center', gap:12, padding:'10px 0', borderBottom:'1px solid #f8fafc' }}>
              <div style={{ width:38, height:38, borderRadius:10, background:STATUS_CFG[o.status]?.bg||'#f1f5f9', display:'flex', alignItems:'center', justifyContent:'center', flexShrink:0, fontSize:16 }}>
                {STATUS_CFG[o.status]?.icon || '◎'}
              </div>
              <div style={{ flex:1, minWidth:0 }}>
                <p style={{ margin:0, fontSize:13, fontWeight:700, color:'#1e293b', overflow:'hidden', textOverflow:'ellipsis', whiteSpace:'nowrap', fontFamily:"'Sora',sans-serif" }}>{o.user?.name||'Guest'}</p>
                <p style={{ margin:0, fontSize:11, color:'#94a3b8' }}>{o.paymentMethod} · {formatPKR(o.totalPrice)}</p>
              </div>
              <Badge status={o.status} config={STATUS_CFG} />
            </div>
          ))}
      </div>
    </div>
  );
}
