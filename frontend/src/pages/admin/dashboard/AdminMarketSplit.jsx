export default function AdminMarketSplit({
  S,
  globalCnt,
  localCnt,
  openSection,
  products,
  themeMode
}) {
  return (
    <div style={{
      ...S.card,
      marginBottom:20,
      background: themeMode === 'dark' ? 'linear-gradient(180deg, rgba(14,22,26,0.96), rgba(11,19,23,0.96))' : 'linear-gradient(135deg, rgba(255,255,255,0.88), rgba(255,255,255,0.74))',
      borderColor: themeMode === 'dark' ? 'rgba(148,163,184,0.18)' : 'rgba(148,163,184,0.18)',
      boxShadow: themeMode === 'dark' ? '0 16px 36px rgba(2,6,23,0.32)' : '0 16px 38px rgba(15,23,42,.08)',
    }}>
      <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center', marginBottom:18 }}>
        <div>
          <h3 style={{ ...S.cardH, color: themeMode === 'dark' ? '#e2e8f0' : '#1e293b' }}>📊 Market Split Overview</h3>
          <p style={{ margin:'4px 0 0', fontSize:12, color: themeMode === 'dark' ? '#aebbb4' : '#64748b' }}>How your catalog is distributed across customer markets</p>
        </div>
        <button style={S.linkBtn} onClick={() => openSection('products')}>Manage products →</button>
      </div>
      <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:16 }}>
        {/* Local card */}
        <div style={{ background: themeMode === 'dark' ? 'linear-gradient(135deg,#062f2a,#0f172a)' : 'linear-gradient(135deg,#f0fdf4,#dcfce7)', border: themeMode === 'dark' ? '1.5px solid rgba(34,197,94,.28)' : '1.5px solid #bbf7d0', borderRadius:14, padding:'20px 22px' }}>
          <div style={{ display:'flex', justifyContent:'space-between', alignItems:'flex-start', marginBottom:14 }}>
            <div>
              <p className="admin-market-summary-local-label" style={{ margin:'0 0 4px', fontSize:10, fontWeight:700, color:'#166534', textTransform:'uppercase', letterSpacing:'1px' }}>🇵🇰 Pakistan / Local</p>
              <p className="admin-market-summary-local-count" style={{ margin:0, fontSize:34, fontWeight:900, color:'#15803d', lineHeight:1, fontFamily:"'Sora',sans-serif" }}>{localCnt}</p>
            </div>
            <span style={{ fontSize:36, lineHeight:1 }}>🇵🇰</span>
          </div>
          <p className="admin-market-summary-local-description" style={{ margin:'0 0 12px', fontSize:12, color:'#4ade80', fontWeight:500 }}>
            Only visible to customers shopping in <strong>Pakistan mode (PKR)</strong>
          </p>
          <div style={{ height:6, background:'rgba(0,0,0,.06)', borderRadius:99, overflow:'hidden' }}>
            <div style={{ height:'100%', width: products.length ? `${(localCnt/products.length)*100}%` : '0%', background:'#16a34a', borderRadius:99, transition:'width 1.2s ease' }} />
          </div>
          <p className="admin-market-summary-local-share" style={{ margin:'6px 0 0', fontSize:11, color:'#16a34a', fontWeight:600 }}>
            {products.length ? Math.round((localCnt/products.length)*100) : 0}% of total catalog
          </p>
        </div>
        {/* Global card */}
        <div style={{ background: themeMode === 'dark' ? 'linear-gradient(135deg,#0f172a,#111827)' : 'linear-gradient(135deg,#eff6ff,#dbeafe)', border: themeMode === 'dark' ? '1.5px solid rgba(96,165,250,.28)' : '1.5px solid #bfdbfe', borderRadius:14, padding:'20px 22px' }}>
          <div style={{ display:'flex', justifyContent:'space-between', alignItems:'flex-start', marginBottom:14 }}>
            <div>
              <p className="admin-market-summary-global-label" style={{ margin:'0 0 4px', fontSize:10, fontWeight:700, color:'#1d4ed8', textTransform:'uppercase', letterSpacing:'1px' }}>🌍 International / Global</p>
              <p className="admin-market-summary-global-count" style={{ margin:0, fontSize:34, fontWeight:900, color:'#2563eb', lineHeight:1, fontFamily:"'Sora',sans-serif" }}>{globalCnt}</p>
            </div>
            <span style={{ fontSize:36, lineHeight:1 }}>🌍</span>
          </div>
          <p className="admin-market-summary-global-description" style={{ margin:'0 0 12px', fontSize:12, color:'#60a5fa', fontWeight:500 }}>
            Visible to <strong>ALL customers</strong> — Pakistan + international buyers
          </p>
          <div style={{ height:6, background:'rgba(0,0,0,.06)', borderRadius:99, overflow:'hidden' }}>
            <div style={{ height:'100%', width: products.length ? `${(globalCnt/products.length)*100}%` : '0%', background:'#3b82f6', borderRadius:99, transition:'width 1.2s ease' }} />
          </div>
          <p className="admin-market-summary-global-share" style={{ margin:'6px 0 0', fontSize:11, color:'#2563eb', fontWeight:600 }}>
            {products.length ? Math.round((globalCnt/products.length)*100) : 0}% of total catalog
          </p>
        </div>
      </div>
    </div>
  );
}
