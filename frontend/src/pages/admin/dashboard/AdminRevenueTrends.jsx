export default function AdminRevenueTrends({
  S,
  formatCompactNumber,
  formatPKR,
  salesChartSections,
  themeMode
}) {
  return (
    <div style={{
      ...S.card,
      marginBottom:20,
      background: themeMode === 'dark' ? 'linear-gradient(180deg, rgba(15,23,42,0.98), rgba(8,17,23,0.96))' : 'linear-gradient(135deg, rgba(255,255,255,0.88), rgba(255,255,255,0.74))',
      borderColor: themeMode === 'dark' ? 'rgba(148,163,184,0.18)' : 'rgba(148,163,184,0.18)',
      boxShadow: themeMode === 'dark' ? '0 18px 40px rgba(2,6,23,0.32)' : '0 16px 38px rgba(15,23,42,.08)',
    }}>
      <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center', marginBottom:16, flexWrap:'wrap', gap:12 }}>
        <div>
          <h3 style={{ ...S.cardH, color: themeMode === 'dark' ? '#e2e8f0' : '#1e293b' }}>📈 Sales charts by day / week / month</h3>
          <p style={{ margin:'4px 0 0', fontSize:12, color: themeMode === 'dark' ? '#cbd5e1' : '#94a3b8' }}>Trend view for revenue concentration across each comparison window</p>
        </div>
      </div>
      <div style={{ display:'grid', gridTemplateColumns:'repeat(auto-fit, minmax(220px, 1fr))', gap:16 }}>
        {salesChartSections.map((chart) => {
          const maxValue = Math.max(...chart.data.map((entry) => entry.value || 0), 1);
          return (
            <div key={chart.title} style={{ background: themeMode === 'dark' ? '#0f172a' : '#f8fafc', border:'1px solid rgba(148,163,184,.22)', borderRadius:14, padding:16, transition:'all .25s ease' }}>
              <p style={{ margin:'0 0 14px', fontSize:10, fontWeight:800, color: themeMode === 'dark' ? '#cbd5e1' : '#475569', textTransform:'uppercase', letterSpacing:'1px' }}>{chart.title}</p>
              <div style={{ display:'flex', alignItems:'flex-end', gap:8, minHeight:120, height:120 }}>
                {chart.data.length === 0 ? (
                  <p style={{ margin:0, color: themeMode === 'dark' ? '#94a3b8' : '#64748b', fontSize:12 }}>No data yet.</p>
                ) : (
                  chart.data.map((entry) => (
                    <div key={`${chart.title}-${entry.label}`} title={`${entry.label}: ${formatPKR(entry.value)}`} style={{ flex:1, display:'flex', flexDirection:'column', alignItems:'center', gap:6, transition:'transform .25s ease' }}>
                      <strong style={{ fontSize:10, color: themeMode === 'dark' ? '#cbd5e1' : '#64748b', fontFamily:"'JetBrains Mono',monospace" }}>{formatCompactNumber(entry.value)}</strong>
                      <div style={{ width:'100%', minHeight:16, height:Math.max((entry.value / maxValue) * 70, 12), background:'linear-gradient(180deg,#d8b06a,#b67d30)', borderRadius:'10px 10px 6px 6px', boxShadow:'0 8px 20px rgba(182,125,48,.22)', transition:'height .55s ease, transform .25s ease, filter .25s ease', transform:'translateY(0)', filter:'saturate(1)', opacity:0.96 }} />
                      <span style={{ fontSize:9, color: themeMode === 'dark' ? '#94a3b8' : '#64748b', textAlign:'center', whiteSpace:'nowrap' }}>{entry.label}</span>
                    </div>
                  ))
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
