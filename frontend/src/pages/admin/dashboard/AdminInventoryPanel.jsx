export default function AdminInventoryPanel({
  MarketBadge,
  S,
  StockCell,
  ThumbCell,
  formatPKR,
  formatUSD,
  openSection,
  products,
  themeMode
}) {
  return (
    <div style={{
      ...S.card,
      background: themeMode === 'dark' ? 'linear-gradient(180deg, rgba(14,22,26,0.96), rgba(11,19,23,0.96))' : 'linear-gradient(135deg, rgba(255,255,255,0.88), rgba(255,255,255,0.74))',
      borderColor: themeMode === 'dark' ? 'rgba(148,163,184,0.18)' : 'rgba(148,163,184,0.18)',
      boxShadow: themeMode === 'dark' ? '0 16px 36px rgba(2,6,23,0.32)' : '0 16px 38px rgba(15,23,42,.08)',
    }}>
      <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center', marginBottom:16 }}>
        <h3 style={{ ...S.cardH, color: themeMode === 'dark' ? '#e2e8f0' : '#1e293b' }}>Inventory Snapshot</h3>
        <button style={{ ...S.linkBtn, color: themeMode === 'dark' ? '#93c5fd' : 'var(--brand-dark, #0d5c42)' }} onClick={() => openSection('products')}>Manage all →</button>
      </div>
      <div style={{ overflowX:'auto' }}>
        <table style={S.tbl}>
          <thead>
            <tr>{['','Name','Category','Weight','PKR','USD','Discount','Stock','Market','Visibility'].map(h => <th key={h} style={S.th}>{h}</th>)}</tr>
          </thead>
          <tbody>
            {products.slice(0,8).map(p => (
              <tr key={p._id} className="row-hover">
                <td style={S.td}><ThumbCell p={p} /></td>
                <td style={{ ...S.td, fontWeight:700, color:'#1e293b', fontFamily:"'Sora',sans-serif" }}>{p.name}</td>
                <td style={S.td}><span className="admin-cat-tag" style={S.catTag}>{p.category}</span></td>
                <td style={S.td}><span style={{ fontSize:11, fontWeight:700, color:'#64748b' }}>{p.weightKg > 0 ? p.weightKg + 'kg' : '—'}</span></td>
                <td style={{ ...S.td, fontWeight:800, color:'#10b981', fontFamily:"'JetBrains Mono',monospace" }}>{formatPKR(p.pricePKR)}</td>
                <td style={{ ...S.td, fontWeight:800, color:'#6366f1', fontFamily:"'JetBrains Mono',monospace" }}>{formatUSD(p.priceUSD)}</td>
                <td style={S.td}>{Number(p.discountPercent) > 0 ? <span className="admin-discount-chip">-{p.discountPercent}%</span> : '—'}</td>
                <td style={S.td}><StockCell n={p.stock} /></td>
                <td style={S.td}><MarketBadge isLocal={p.isLocal} /></td>
                <td style={S.td}><span className={`admin-visibility-tag ${p.isVisible === false ? 'is-hidden' : 'is-visible'}`} style={{ ...S.catTag, background:p.isVisible === false ? '#fff1f2' : '#ecfdf5', color:p.isVisible === false ? '#be123c' : '#047857' }}>{p.isVisible === false ? 'Hidden' : 'Visible'}</span></td>
              </tr>
            ))}
            {products.length === 0 && (
              <tr><td colSpan={10} style={{ textAlign:'center', padding:'3rem', color:'#94a3b8', fontSize:14 }}>No products yet.</td></tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
