export default function AdminRegionalCampaigns({
  S,
  formatPKR,
  regionalCampaigns,
  themeMode
}) {
  return (
    <div style={{
      ...S.card,
      marginBottom:20,
      background: themeMode === 'dark' ? 'linear-gradient(180deg, rgba(15,23,42,0.98), rgba(8,17,23,0.96))' : '#fff',
      borderColor: themeMode === 'dark' ? '#1e293b' : '#dfece4',
      boxShadow: themeMode === 'dark' ? '0 12px 32px rgba(2,6,23,.38)' : '0 12px 32px rgba(11,58,42,.055)',
    }}>
      <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center', marginBottom:16, flexWrap:'wrap', gap:12 }}>
        <div>
          <h3 style={{ ...S.cardH, color: themeMode === 'dark' ? '#e2e8f0' : '#1e293b' }}>🎯 Regional marketing campaign cards</h3>
          <p style={{ margin:'4px 0 0', fontSize:12, color: themeMode === 'dark' ? '#cbd5e1' : '#94a3b8' }}>Localized offers that match each region’s strongest sales pattern</p>
        </div>
      </div>
      <div style={{ display:'grid', gridTemplateColumns:'repeat(auto-fit, minmax(220px, 1fr))', gap:12 }}>
        {(regionalCampaigns || []).map((campaign) => (
          <div key={campaign.region} style={{ background: themeMode === 'dark' ? 'linear-gradient(135deg,#052e2b,#111827)' : 'linear-gradient(135deg,#f0f8f3,#e9f5ed)', border:'1px solid #cce3d4', borderRadius:14, padding:16 }}>
            <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center', gap:8, marginBottom:10 }}>
              <strong style={{ fontSize:15, color: themeMode === 'dark' ? '#f8fafc' : '#0f172a' }}>{campaign.region}</strong>
              <span style={{ fontSize:10, fontWeight:800, color: themeMode === 'dark' ? '#d1fae5' : '#065f46', background: themeMode === 'dark' ? '#022c22' : '#d1fae5', padding:'4px 8px', borderRadius:999 }}>{campaign.offer}</span>
            </div>
            <p style={{ margin:'0 0 10px', fontSize:12, color: themeMode === 'dark' ? '#cbd5e1' : '#475569', lineHeight:1.7 }}>{campaign.message}</p>
            <div style={{ marginBottom:10, padding:'8px 10px', borderRadius:10, background: themeMode === 'dark' ? 'rgba(15,118,110,0.12)' : 'rgba(15,118,110,0.06)', border:'1px solid rgba(16,185,129,0.12)' }}>
              <p style={{ margin:0, fontSize:9, fontWeight:800, color: themeMode === 'dark' ? '#a7f3d0' : '#0f766e', textTransform:'uppercase', letterSpacing:'0.8px' }}>Best angle</p>
              <p style={{ margin:'4px 0 0', fontSize:11, fontWeight:700, color: themeMode === 'dark' ? '#ecfeff' : '#0f172a' }}>{campaign.angle}</p>
            </div>
            <div style={{ display:'flex', justifyContent:'space-between', fontSize:11, color: themeMode === 'dark' ? '#f8fafc' : '#334155', fontWeight:700 }}>
              <span>{campaign.orders} orders</span>
              <span>{formatPKR(campaign.revenue)}</span>
            </div>
            <p style={{ margin:'10px 0 0', fontSize:10, fontWeight:800, color: themeMode === 'dark' ? '#a7f3d0' : '#0f766e', textTransform:'uppercase', letterSpacing:'0.8px' }}>{campaign.target}</p>
          </div>
        ))}
      </div>
    </div>
  );
}
