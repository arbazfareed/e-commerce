export default function AdminProductRecommendations({
  S,
  productRecommendations,
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
          <h3 style={{ ...S.cardH, color: themeMode === 'dark' ? '#e2e8f0' : '#1e293b' }}>🧩 Product recommendation engine</h3>
          <p style={{ margin:'4px 0 0', fontSize:12, color: themeMode === 'dark' ? '#cbd5e1' : '#94a3b8' }}>Recommended bundles built around your top-selling products and best-performing categories</p>
        </div>
      </div>
      <div style={{ display:'grid', gridTemplateColumns:'repeat(auto-fit, minmax(220px, 1fr))', gap:12 }}>
        {(productRecommendations || []).map((recommendation) => (
          <div key={recommendation.name} style={{ background: themeMode === 'dark' ? 'linear-gradient(135deg,#111827,#1e293b)' : 'linear-gradient(135deg,#eef2ff,#f8fafc)', border:'1px solid #c7d2fe', borderRadius:14, padding:16 }}>
            <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center', gap:6, marginBottom:10 }}>
              <strong style={{ fontSize:15, color: themeMode === 'dark' ? '#f8fafc' : '#111827' }}>{recommendation.name}</strong>
              <span style={{ fontSize:10, fontWeight:800, color: themeMode === 'dark' ? '#dbeafe' : '#4338ca', background: themeMode === 'dark' ? '#172554' : '#e0e7ff', padding:'4px 8px', borderRadius:999 }}>{recommendation.offer}</span>
            </div>
            <p style={{ margin:'0 0 10px', fontSize:11, color: themeMode === 'dark' ? '#cbd5e1' : '#6b7280', fontWeight:700 }}>{recommendation.category}</p>
            <p style={{ margin:'0 0 10px', fontSize:11, lineHeight:1.6, color: themeMode === 'dark' ? '#dbeafe' : '#374151' }}>{recommendation.rationale}</p>
            <ul style={{ margin:0, paddingLeft:18, color: themeMode === 'dark' ? '#e2e8f0' : '#374151', fontSize:12, lineHeight:1.8 }}>
              {(recommendation.bundle || []).slice(0, 3).map((item) => (
                <li key={`${recommendation.name}-${item}`}>{item}</li>
              ))}
            </ul>
          </div>
        ))}
      </div>
    </div>
  );
}
