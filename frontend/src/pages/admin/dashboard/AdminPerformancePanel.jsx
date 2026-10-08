export default function AdminPerformancePanel({
  S,
  aiPulse,
  aiStrategy,
  analytics,
  analyticsTab,
  channelBreakdown,
  exportCsvReport,
  formatPKR,
  generatePdfReport,
  openSection,
  performanceTabs,
  productBreakdown,
  regionBreakdown,
  setAnalyticsTab,
  strongestRegion,
  themeMode
}) {
  return (
    <div style={{ ...S.card, marginBottom:20, background: themeMode === 'dark' ? '#0f172a' : 'linear-gradient(180deg,#ffffff,#f7fbf8)', borderColor: themeMode === 'dark' ? '#1e293b' : '#dfece4', boxShadow: themeMode === 'dark' ? '0 12px 32px rgba(2,6,23,.38)' : '0 12px 30px rgba(11,58,42,.07)' }}>
      <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center', marginBottom:18, gap:12, flexWrap:'wrap' }}>
        <div>
          <h3 style={{ ...S.cardH, color: themeMode === 'dark' ? '#e2e8f0' : '#1e293b' }}>📊 Sales History & Payment Mix</h3>
          <p style={{ margin:'4px 0 0', fontSize:12, color: themeMode === 'dark' ? '#aebbb4' : '#64748b' }}>Date, day, week, month, and 3/6/9/12 month revenue trends with cash vs online totals</p>
        </div>
        <div style={{ display:'flex', gap:8, flexWrap:'wrap' }}>
          <button style={{ ...S.linkBtn, color: themeMode === 'dark' ? '#93c5fd' : 'var(--brand-dark, #0d5c42)' }} onClick={() => openSection('orders')}>View orders →</button>
          <button className="admin-green-button" style={{ ...S.greenBtn, padding:'9px 14px', fontSize:12 }} onClick={exportCsvReport}>📊 CSV export</button>
          <button className="admin-pdf-report-button" style={{ ...S.greenBtn, padding:'9px 14px', fontSize:12, background:'linear-gradient(135deg,#7c3aed,#4f46e5)' }} onClick={generatePdfReport}>📄 PDF report</button>
        </div>
      </div>
    
      <div style={{ display:'grid', gridTemplateColumns:'repeat(2,minmax(0,1fr))', gap:14, marginBottom:18 }}>
        <div style={{ background: themeMode === 'dark' ? '#0b2f2a' : '#f0fdf4', border:'1.5px solid #bbf7d0', borderRadius:14, padding:'18px 18px' }}>
          <p style={{ margin:'0 0 8px', fontSize:10, fontWeight:800, color: themeMode === 'dark' ? '#d1fae5' : '#166534', letterSpacing:'1px', textTransform:'uppercase' }}>Cash Earnings</p>
          <p style={{ margin:0, fontSize:26, fontWeight:900, color: themeMode === 'dark' ? '#a7f3d0' : '#15803d', fontFamily:"'Sora',sans-serif" }}>{formatPKR(analytics?.summary?.cashRevenue || 0)}</p>
        </div>
        <div style={{ background: themeMode === 'dark' ? '#0f1d3d' : '#eff6ff', border:'1.5px solid #bfdbfe', borderRadius:14, padding:'18px 18px' }}>
          <p style={{ margin:'0 0 8px', fontSize:10, fontWeight:800, color: themeMode === 'dark' ? '#bfdbfe' : '#1d4ed8', letterSpacing:'1px', textTransform:'uppercase' }}>Online Earnings</p>
          <p style={{ margin:0, fontSize:26, fontWeight:900, color: themeMode === 'dark' ? '#bfdbfe' : '#2563eb', fontFamily:"'Sora',sans-serif" }}>{formatPKR(analytics?.summary?.onlineRevenue || 0)}</p>
        </div>
      </div>
    
      <div style={{ display:'grid', gridTemplateColumns:'repeat(auto-fit, minmax(150px, 1fr))', gap:12, marginBottom:18 }}>
        {Object.entries(analytics?.rangeBreakdown || {}).map(([key, item]) => (
          <div key={key} style={{ background: themeMode === 'dark' ? '#111827' : '#f8fafc', border:'1px solid #e2e8f0', borderRadius:12, padding:'14px 12px' }}>
            <p style={{ margin:'0 0 4px', fontSize:10, fontWeight:800, color: themeMode === 'dark' ? '#cbd5e1' : '#64748b', textTransform:'uppercase', letterSpacing:'1px' }}>{key}-Month</p>
            <p style={{ margin:0, fontSize:18, fontWeight:900, color: themeMode === 'dark' ? '#f8fafc' : '#0f172a', fontFamily:"'Sora',sans-serif" }}>{formatPKR(item.totalRevenue || 0)}</p>
            <p style={{ margin:'4px 0 0', fontSize:11, color: themeMode === 'dark' ? '#94a3b8' : '#64748b' }}>{item.orderCount || 0} orders</p>
          </div>
        ))}
      </div>
    
      <div style={{ display:'flex', gap:8, marginBottom:16, flexWrap:'wrap' }}>
        {performanceTabs.map((tab) => (
          <button
            key={tab.key}
            onClick={() => setAnalyticsTab(tab.key)}
            style={{
              background: analyticsTab === tab.key ? (themeMode === 'dark' ? '#0f766e' : '#d1fae5') : (themeMode === 'dark' ? '#111827' : '#f8fafc'),
              border: '1px solid rgba(148,163,184,.22)',
              color: analyticsTab === tab.key ? (themeMode === 'dark' ? '#ecfeff' : '#065f46') : (themeMode === 'dark' ? '#e2e8f0' : '#334155'),
              borderRadius:999,
              padding:'8px 12px',
              fontWeight:800,
              fontSize:11,
              letterSpacing:'0.8px',
              textTransform:'uppercase',
              cursor:'pointer',
            }}
          >
            {tab.label}
          </button>
        ))}
      </div>
    
      {analyticsTab === 'overview' && (
        <div style={{ display:'grid', gridTemplateColumns:'1.2fr 0.8fr', gap:16 }}>
          <div style={{ background: themeMode === 'dark' ? '#111827' : '#f8fafc', border:'1px solid #e2e8f0', borderRadius:14, padding:'18px 16px', transition:'all .25s ease' }}>
            <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center', marginBottom:12, gap:12, flexWrap:'wrap' }}>
              <h4 style={{ ...S.cardH, margin:0, color: themeMode === 'dark' ? '#e2e8f0' : '#1e293b' }}>🌍 Regional sales</h4>
              <span style={{ fontSize:10, fontWeight:800, color:'#0f766e', background:'#ccfbf1', padding:'4px 8px', borderRadius:999, letterSpacing:'0.7px', textTransform:'uppercase' }}>{strongestRegion}</span>
            </div>
            {(analytics?.regionBreakdown || []).length === 0 ? (
              <p style={{ margin:0, color: themeMode === 'dark' ? '#cbd5e1' : '#64748b', fontSize:12 }}>No regional sales yet.</p>
            ) : (
              <div style={{ display:'flex', flexDirection:'column', gap:10 }}>
                {(analytics?.regionBreakdown || []).slice(0, 5).map((region) => (
                  <div key={region.region} style={{ display:'flex', justifyContent:'space-between', gap:10, alignItems:'center', borderBottom:'1px solid #e2e8f0', paddingBottom:8 }}>
                    <div>
                      <p style={{ margin:0, fontWeight:800, color: themeMode === 'dark' ? '#f8fafc' : '#0f172a', fontSize:14 }}>{region.region}</p>
                      <p style={{ margin:'2px 0 0', fontSize:11, color: themeMode === 'dark' ? '#cbd5e1' : '#64748b' }}>{region.orders || 0} orders</p>
                    </div>
                    <strong style={{ color:'#10b981', fontFamily:"'JetBrains Mono',monospace", fontSize:13 }}>{formatPKR(region.totalRevenue || 0)}</strong>
                  </div>
                ))}
              </div>
            )}
          </div>
    
          <div style={{ background: themeMode === 'dark' ? 'linear-gradient(135deg, rgba(12,18,22,0.98), rgba(18,24,31,0.98))' : 'linear-gradient(135deg,#f0fdfa,#f8fafc)', border: themeMode === 'dark' ? '1px solid rgba(93,175,143,0.28)' : '1px solid #cfe4da', borderRadius:14, padding:'18px 16px', boxShadow: themeMode === 'dark' ? '0 22px 40px rgba(5,10,14,0.32)' : '0 12px 28px rgba(15,45,32,.07)', transition:'all .25s ease' }}>
            <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center', marginBottom:12, gap:8, flexWrap:'wrap' }}>
              <h4 style={{ ...S.cardH, margin:0, color: themeMode === 'dark' ? '#e5f8ee' : '#173a2d' }}>🧠 AI growth strategy</h4>
              <span style={{ fontSize:10, fontWeight:800, color: themeMode === 'dark' ? '#d8fff0' : '#115e59', background: themeMode === 'dark' ? 'rgba(15,118,110,0.30)' : '#ccfbf1', border:'1px solid rgba(110,231,183,0.4)', padding:'4px 8px', borderRadius:999, letterSpacing:'0.7px', textTransform:'uppercase' }}>smart plan</span>
            </div>
    
            <div style={{ display:'grid', gridTemplateColumns:'repeat(2,minmax(0,1fr))', gap:8, marginBottom:12 }}>
              {aiPulse.map((chip) => (
                <div key={chip.label} style={{ background: themeMode === 'dark' ? 'rgba(255,255,255,0.04)' : '#fff', border:'1px solid rgba(148,163,184,0.22)', borderRadius:10, padding:'8px 10px', backdropFilter:'blur(6px)' }}>
                  <p style={{ margin:0, fontSize:9, fontWeight:800, color: themeMode === 'dark' ? '#9ae6b4' : '#0f766e', textTransform:'uppercase', letterSpacing:'0.8px' }}>{chip.label}</p>
                  <p style={{ margin:'4px 0 0', fontSize:12, fontWeight:800, color: themeMode === 'dark' ? '#ecfeff' : '#173a2d', lineHeight:1.3 }}>{chip.value}</p>
                </div>
              ))}
            </div>
    
            <div style={{ display:'grid', gridTemplateColumns:'repeat(2,minmax(0,1fr))', gap:8, marginBottom:12 }}>
              {aiStrategy.map((item) => (
                <div key={item.label} style={{ background: themeMode === 'dark' ? 'rgba(255,255,255,0.03)' : '#fff', border:'1px solid rgba(148,163,184,0.22)', borderRadius:10, padding:'8px 10px' }}>
                  <p style={{ margin:0, fontSize:9, fontWeight:800, color: item.tone === '#10b981' ? (themeMode === 'dark' ? '#9ae6b4' : '#047857') : item.tone === '#f59e0b' ? (themeMode === 'dark' ? '#fbbf24' : '#92400e') : item.tone === '#f43f5e' ? (themeMode === 'dark' ? '#fda4af' : '#be123c') : (themeMode === 'dark' ? '#a5b4fc' : '#4338ca'), textTransform:'uppercase', letterSpacing:'0.8px' }}>{item.label}</p>
                  <p style={{ margin:'4px 0 0', fontSize:12, fontWeight:800, color: themeMode === 'dark' ? '#f8fafc' : '#173a2d', lineHeight:1.3 }}>{item.value}</p>
                </div>
              ))}
            </div>
    
            <p style={{ margin:'0 0 10px', fontSize:12, color: themeMode === 'dark' ? '#dbeafe' : '#334155', lineHeight:1.7, fontWeight:600 }}>{analytics?.insights?.summaryText || 'No insight available yet.'}</p>
            <ul style={{ margin:0, paddingLeft:18, color: themeMode === 'dark' ? '#d6f4ee' : '#334155', fontSize:12, lineHeight:1.7 }}>
              {(analytics?.insights?.recommendedActions || []).slice(0, 4).map((action) => (
                <li key={action}>{action}</li>
              ))}
            </ul>
          </div>
        </div>
      )}
    
      {analyticsTab === 'products' && (
        <div style={{ display:'grid', gridTemplateColumns:'repeat(auto-fit, minmax(230px, 1fr))', gap:14 }}>
          {productBreakdown.length === 0 ? (
            <p style={{ color: themeMode === 'dark' ? '#cbd5e1' : '#64748b', margin:0 }}>No product performance yet.</p>
          ) : productBreakdown.map((product) => (
            <div key={product.name} style={{ background: themeMode === 'dark' ? '#111827' : '#f8fafc', border:'1px solid rgba(148,163,184,.22)', borderRadius:14, padding:16 }}>
              <div style={{ display:'flex', justifyContent:'space-between', gap:10, alignItems:'center', marginBottom:10 }}>
                <strong style={{ fontSize:15, color: themeMode === 'dark' ? '#f8fafc' : '#0f172a' }}>{product.name}</strong>
                <span style={{ fontSize:10, fontWeight:800, color:'#ecfeff', background:'#0f766e', padding:'4px 8px', borderRadius:999 }}>{product.units} units</span>
              </div>
              <div style={{ display:'flex', justifyContent:'space-between', fontSize:12, color: themeMode === 'dark' ? '#cbd5e1' : '#334155' }}>
                <span>Revenue</span>
                <strong>{formatPKR(product.revenue)}</strong>
              </div>
              <div style={{ height:8, background: themeMode === 'dark' ? '#1f2937' : '#e2e8f0', borderRadius:999, overflow:'hidden', marginTop:12 }}>
                <div style={{ height:'100%', width: `${Math.min((product.revenue / Math.max(...productBreakdown.map(p => p.revenue), 1)) * 100, 100)}%`, background:'linear-gradient(135deg,#10b981,#14b8a6)', borderRadius:999 }} />
              </div>
            </div>
          ))}
        </div>
      )}
    
      {analyticsTab === 'regions' && (
        <div style={{ display:'grid', gridTemplateColumns:'repeat(auto-fit, minmax(220px, 1fr))', gap:14 }}>
          {regionBreakdown.length === 0 ? (
            <p style={{ color: themeMode === 'dark' ? '#cbd5e1' : '#64748b', margin:0 }}>No regional performance yet.</p>
          ) : regionBreakdown.slice(0, 6).map((region) => (
            <div key={region.region} style={{ background: themeMode === 'dark' ? '#111827' : '#f8fafc', border:'1px solid rgba(148,163,184,.22)', borderRadius:14, padding:16 }}>
              <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center', gap:6, marginBottom:10 }}>
                <strong style={{ fontSize:15, color: themeMode === 'dark' ? '#f8fafc' : '#0f172a' }}>{region.region}</strong>
                <span style={{ fontSize:10, fontWeight:800, color: themeMode === 'dark' ? '#d1fae5' : '#065f46', background: themeMode === 'dark' ? '#022c22' : '#d1fae5', padding:'4px 8px', borderRadius:999 }}>{region.orders} orders</span>
              </div>
              <div style={{ display:'flex', justifyContent:'space-between', fontSize:12, color: themeMode === 'dark' ? '#cbd5e1' : '#334155' }}>
                <span>Revenue</span>
                <strong>{formatPKR(region.revenue)}</strong>
              </div>
            </div>
          ))}
        </div>
      )}
    
      {analyticsTab === 'channels' && (
        <div style={{ display:'grid', gridTemplateColumns:'repeat(auto-fit, minmax(220px, 1fr))', gap:14 }}>
          {channelBreakdown.map((channel) => (
            <div key={channel.label} style={{ background: themeMode === 'dark' ? '#111827' : '#f8fafc', border:'1px solid rgba(148,163,184,.22)', borderRadius:14, padding:16 }}>
              <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center', gap:8, marginBottom:10 }}>
                <strong style={{ fontSize:15, color: themeMode === 'dark' ? '#f8fafc' : '#0f172a' }}>{channel.label}</strong>
                <span style={{ fontSize:10, fontWeight:800, color: themeMode === 'dark' ? '#dbeafe' : '#1d4ed8', background: themeMode === 'dark' ? '#172554' : '#dbeafe', padding:'4px 8px', borderRadius:999 }}>{Math.round(channel.share || 0)}%</span>
              </div>
              <div style={{ display:'flex', justifyContent:'space-between', fontSize:12, color: themeMode === 'dark' ? '#cbd5e1' : '#334155', marginBottom:8 }}>
                <span>Revenue</span>
                <strong>{formatPKR(channel.value)}</strong>
              </div>
              <div style={{ height:8, background: themeMode === 'dark' ? '#1f2937' : '#e2e8f0', borderRadius:999, overflow:'hidden' }}>
                <div style={{ height:'100%', width:`${Math.min(channel.share || 0, 100)}%`, background: channel.label === 'Cash' ? 'linear-gradient(135deg,#f59e0b,#f97316)' : 'linear-gradient(135deg,#3b82f6,#60a5fa)', borderRadius:999 }} />
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
