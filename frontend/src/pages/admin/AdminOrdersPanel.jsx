export default function AdminOrdersPanel({
  Badge,
  S,
  STATUS_CFG,
  STATUS_LIST,
  ShipmentTrackingEditor,
  changeStatus,
  delivered,
  exportOrdersCsv,
  fStatus,
  filteredOrders,
  flash,
  formatPKR,
  navigate,
  orders,
  pending,
  setFStatus,
  setOrders,
  themeMode
}) {
  return (
    <div style={{ animation:'fadeUp .35s ease' }}>
      <div style={S.pgTop}>
        <div>
          <h1 style={S.pgTitle}>Orders</h1>
          <p style={S.pgSub}>{orders.length} total · {pending} pending · {delivered} delivered</p>
        </div>
        <button type="button" className="admin-filter-pill" style={{ ...S.ghostBtn, padding:'10px 14px', fontSize:12 }} onClick={exportOrdersCsv}>⬇ Export orders CSV</button>
      </div>

      <div style={{ display:'flex', gap:8, marginBottom:18, flexWrap:'wrap' }}>
        {['All', ...STATUS_LIST].map(s => {
          const cnt = s === 'All' ? orders.length : orders.filter(o => o.status === s).length;
          const c   = STATUS_CFG[s] || { bg:'#f1f5f9', color:'#475569', dot:'#94a3b8' };
          const on  = fStatus === s;
          return (
            <button key={s} className={`admin-filter-pill status-filter-pill${on ? ' is-active' : ''}`} data-status={s.toLowerCase()} aria-pressed={on} onClick={() => setFStatus(s)} style={{
              padding:'7px 16px', borderRadius:999, fontSize:12, fontWeight:700,
              border: on ? `1.5px solid ${c.dot}` : '1.5px solid #e2e8f0',
              background: on ? c.bg : '#fff', color: on ? c.color : '#64748b',
              cursor:'pointer', transition:'all .15s', fontFamily:"'Sora',sans-serif",
            }}>
              {s} <span className="admin-filter-count" style={{ opacity:.7 }}>({cnt})</span>
            </button>
          );
        })}
      </div>

      <div style={{
        ...S.card,
        background: themeMode === 'dark' ? 'linear-gradient(180deg, rgba(15,23,42,0.98), rgba(9,17,21,0.96))' : 'linear-gradient(135deg, rgba(255,255,255,0.88), rgba(255,255,255,0.74))',
        borderColor: themeMode === 'dark' ? 'rgba(148,163,184,0.18)' : 'rgba(148,163,184,0.18)',
        boxShadow: themeMode === 'dark' ? '0 18px 40px rgba(2,6,23,0.32)' : '0 16px 38px rgba(15,23,42,.08)',
      }}>
        {orders.length === 0 ? (
          <div style={S.emptyState}><p style={{ fontSize:52 }}>📭</p><p style={{ margin:0, fontWeight:700, fontSize:16, color: themeMode === 'dark' ? '#cbd5e1' : '#475569' }}>No orders yet</p></div>
        ) : (
          <div style={{ overflowX:'auto' }}>
            <table style={{
              ...S.tbl,
              color: themeMode === 'dark' ? '#e2e8f0' : '#334155',
            }}>
              <thead>
                <tr>{['Order ID','Customer','Items','Total','Payment','Status','Update'].map(h => <th key={h} style={{ ...S.th, color: themeMode === 'dark' ? '#a5b4c8' : '#94a3b8' }}>{h}</th>)}</tr>
              </thead>
              <tbody>
                {filteredOrders.length === 0 && (
                  <tr><td colSpan={7} style={{ textAlign:'center', padding:'3rem', color: themeMode === 'dark' ? '#94a3b8' : '#94a3b8' }}>No orders with this status.</td></tr>
                )}
                {filteredOrders.map(o => (
                  <tr key={o._id} className="row-hover">
                    <td style={{ ...S.td, fontFamily:"'JetBrains Mono',monospace", fontWeight:700, color: themeMode === 'dark' ? '#9ae6b4' : '#0d6a49', fontSize:13 }}>#{o._id.slice(-6).toUpperCase()}</td>
                    <td style={S.td}>
                      <p style={{ margin:'0 0 2px', fontWeight:700, color: themeMode === 'dark' ? '#f8fafc' : '#1e293b', fontSize:13, fontFamily:"'Sora',sans-serif" }}>{o.user?.name || o.guestContact?.name || '—'}</p>
                      <p style={{ margin:0, fontSize:11, color: themeMode === 'dark' ? '#aebbb3' : '#64748b' }}>{o.guestContact?.email || o.user?.email || o.address?.city || '—'}</p>
                    </td>
                    <td style={{ ...S.td, maxWidth:160 }}>
                      <p style={{ margin:0, fontSize:12, color: themeMode === 'dark' ? '#dbeafe' : '#475569', lineHeight:1.7 }}>
                        {(o.products||[]).slice(0,2).map(p=>`${p.name}×${p.quantity}`).join(', ')}
                        {(o.products||[]).length > 2 && ` +${o.products.length-2} more`}
                      </p>
                    </td>
                    <td style={{ ...S.td, fontWeight:900, color: themeMode === 'dark' ? '#a7f3d0' : '#10b981', whiteSpace:'nowrap', fontFamily:"'JetBrains Mono',monospace" }}>{formatPKR(o.totalPrice)}</td>
                    <td style={S.td}>
                      <span style={{ background: themeMode === 'dark' ? 'rgba(124,58,237,0.14)' : '#faf5ff', color: themeMode === 'dark' ? '#d8b4fe' : '#7c3aed', padding:'4px 10px', borderRadius:7, fontSize:11, fontWeight:700 }}>{o.paymentMethod}</span>
                      <p style={{ margin:'5px 0 0', fontSize:10, color: themeMode === 'dark' ? '#a7b8b0' : '#64748b' }}>
                        Payment: {o.paymentStatus || (o.isPaid ? 'paid' : 'pending')} · Courier: {(o.courierDispatchStatus || 'not_configured').replaceAll('_', ' ')}
                      </p>
                    </td>
                    <td style={S.td}><Badge status={o.status} config={STATUS_CFG} /></td>
                    <td style={S.td}>
                      <select value={o.status} onChange={e => changeStatus(o._id, e.target.value)}
                        style={{ border: themeMode === 'dark' ? '1.5px solid rgba(148,163,184,.28)' : '1.5px solid #e2e8f0', borderRadius:9, padding:'7px 10px', fontSize:12, cursor:'pointer', background: themeMode === 'dark' ? '#0f172a' : '#fff', color: themeMode === 'dark' ? '#e2e8f0' : '#334155', outline:'none', fontFamily:"'Sora',sans-serif", fontWeight:600 }}>
                        {STATUS_LIST.map(s => <option key={s}>{s}</option>)}
                      </select>
                      <button type="button" aria-label={`Print invoice for order ${o._id.slice(-8).toUpperCase()}`} onClick={() => navigate(`/orders/${o._id}/invoice`)} style={{ display:'block', marginTop:6, border:'1px solid #cbd5e1', borderRadius:8, padding:'6px 9px', background:themeMode === 'dark' ? '#1f2b25' : '#f8fafc', color:themeMode === 'dark' ? '#e2e8f0' : '#334155', cursor:'pointer', fontSize:11, fontWeight:700 }}>🖨 Print</button>
                      <ShipmentTrackingEditor order={o} darkMode={themeMode === 'dark'} flash={flash} onSaved={updated => setOrders(current => current.map(order => order._id === updated._id ? updated : order))} />
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
