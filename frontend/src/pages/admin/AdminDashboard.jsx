import { formatPKR, formatUSD } from '../../utils/priceUtils';
import { Badge, MarketBadge } from './AdminPrimitives';
import { STATUS_CFG, STATUS_LIST } from './adminConfig';
import AdminPerformancePanel from './dashboard/AdminPerformancePanel';
import AdminRevenueTrends from './dashboard/AdminRevenueTrends';
import AdminRegionalCampaigns from './dashboard/AdminRegionalCampaigns';
import AdminProductRecommendations from './dashboard/AdminProductRecommendations';
import AdminMarketSplit from './dashboard/AdminMarketSplit';
import AdminOrderStatusPanel from './dashboard/AdminOrderStatusPanel';
import AdminLowStockPanel from './dashboard/AdminLowStockPanel';
import AdminInventoryPanel from './dashboard/AdminInventoryPanel';

export default function AdminDashboard({
  aiPulse,
  aiStrategy,
  analytics,
  analyticsTab,
  channelBreakdown,
  executiveSummary,
  exportCsvReport,
  formatCompactNumber,
  generatePdfReport,
  globalCnt,
  hoveredKpi,
  kpiFilter,
  kpiRows,
  localCnt,
  lowStockProducts,
  openEdit,
  openSection,
  orders,
  performanceTabs,
  productBreakdown,
  productRecommendations,
  products,
  regionBreakdown,
  regionalCampaigns,
  salesChartSections,
  setAnalyticsTab,
  setHoveredKpi,
  setKpiFilter,
  setTimeWindow,
  strongestRegion,
  themeMode,
  timeWindow,
  user,
  S,
  StockCell,
  ThumbCell
}) {
  return (
    <div style={{ animation:'fadeUp .35s ease' }}>
      <div style={{ ...S.pgTop, padding:'10px 0 0' }}>
        <div>
          <h1 style={{ ...S.pgTitle, color: themeMode === 'dark' ? '#e2e8f0' : 'var(--ink, #14251d)' }}>Dashboard</h1>
          <p style={{ ...S.pgSub, color: themeMode === 'dark' ? '#cbd5e1' : '#64748b' }}>Welcome back, <strong style={{ color: themeMode === 'dark' ? '#f8fafc' : '#0f172a' }}>{user?.name}</strong>. Here is the latest health of your store.</p>
        </div>
        <button className="admin-green-button" style={{ ...S.greenBtn, boxShadow:'0 10px 20px rgba(76, 201, 157, 0.22)' }} onClick={() => openSection('add')}>+ Add Product</button>
      </div>

      <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center', gap:12, flexWrap:'wrap', marginBottom:18 }}>
        <div style={{ display:'flex', gap:8, flexWrap:'wrap' }}>
          {['all', 'cash', 'online'].map((mode) => (
            <button
              key={mode}
              onClick={() => setKpiFilter(mode)}
              style={{
                border:'1px solid rgba(148,163,184,.25)',
                background: kpiFilter === mode ? (themeMode === 'dark' ? '#0f766e' : '#d1fae5') : (themeMode === 'dark' ? '#0b1d2d' : '#f8fafc'),
                color: kpiFilter === mode ? (themeMode === 'dark' ? '#ecfeff' : '#065f46') : (themeMode === 'dark' ? '#dbeafe' : '#334155'),
                borderRadius:999,
                padding:'8px 12px',
                fontWeight:800,
                fontSize:11,
                cursor:'pointer',
                textTransform:'uppercase',
                letterSpacing:'0.8px',
              }}
            >
              {mode === 'all' ? 'All' : mode === 'cash' ? 'Cash' : 'Online'}
            </button>
          ))}
        </div>

        <div style={{ display:'flex', gap:8, flexWrap:'wrap' }}>
          {['all', '7d', '30d', '90d', '1y'].map((range) => (
            <button
              key={range}
              onClick={() => setTimeWindow(range)}
              style={{
                border:'1px solid rgba(148,163,184,.25)',
                background: timeWindow === range ? (themeMode === 'dark' ? '#0f766e' : '#d1fae5') : (themeMode === 'dark' ? '#0f172a' : '#f8fafc'),
                color: timeWindow === range ? (themeMode === 'dark' ? '#ecfeff' : '#065f46') : (themeMode === 'dark' ? '#dbeafe' : '#334155'),
                borderRadius:999,
                padding:'8px 10px',
                fontWeight:800,
                fontSize:10,
                cursor:'pointer',
                textTransform:'uppercase',
                letterSpacing:'0.8px',
              }}
            >
              {range === 'all' ? 'All time' : range}
            </button>
          ))}
        </div>
      </div>

      <div style={{ display:'grid', gridTemplateColumns:'repeat(4,1fr)', gap:16, marginBottom:18 }}>
        {kpiRows.map((k) => {
          const value = typeof k.value === 'number' ? formatPKR(k.value) : k.value;
          const accent = k.key === 'cash'
            ? 'linear-gradient(135deg,#80643d,#9a7749)'
            : k.key === 'online'
              ? 'linear-gradient(135deg,#315a69,#287c82)'
              : 'linear-gradient(135deg,#1e5745,#287456)';
          const isActive = kpiFilter === 'all' || k.key === kpiFilter;
          const isHovered = hoveredKpi === k.label;
          return (
            <div key={k.label} className="kpi-card"
              title={`${k.label}: ${value}`}
              onClick={() => (k.key !== 'all' ? setKpiFilter(k.key) : setKpiFilter('all'))}
              onMouseEnter={() => setHoveredKpi(k.label)}
              onMouseLeave={() => setHoveredKpi(null)}
              style={{ background:accent, borderRadius:18, padding:'22px 20px', cursor:'pointer', transition:'transform .2s ease, box-shadow .2s ease, filter .2s ease, opacity .2s ease', boxShadow:`0 ${isHovered ? '10px' : '4px'} 24px ${isActive ? 'rgba(16,185,129,.18)' : 'rgba(15,23,42,.14)'}`, opacity:isActive ? 1 : 0.72, transform:isHovered ? 'translateY(-4px)' : 'translateY(0)', filter:isHovered ? 'saturate(1.08)' : 'saturate(1)' }}>
              <p style={{ margin:'0 0 14px', fontSize:10, fontWeight:700, color:'rgba(255,255,255,.6)', textTransform:'uppercase', letterSpacing:'1px', fontFamily:"'Sora',sans-serif" }}>{k.label}</p>
              <p style={{ margin:'0 0 6px', fontSize:28, fontWeight:900, color:'#fff', letterSpacing:'-1px', lineHeight:1, fontFamily:"'Sora',sans-serif" }}>{value}</p>
              <p style={{ margin:0, fontSize:11, color:'rgba(255,255,255,.55)', fontWeight:500 }}>{k.sub}</p>
            </div>
          );
        })}
      </div>

      <div style={{ ...S.card, marginBottom:20, background: themeMode === 'dark' ? 'linear-gradient(135deg,#0f172a,#0b1f1b)' : 'linear-gradient(135deg,#f8fafc,#ecfdf5)', borderColor: themeMode === 'dark' ? '#1e293b' : '#dfece4', boxShadow: themeMode === 'dark' ? '0 16px 32px rgba(2,6,23,.32)' : '0 16px 34px rgba(11,58,42,.06)' }}>
        <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center', gap:12, flexWrap:'wrap', marginBottom:14 }}>
          <div>
            <p style={{ margin:0, fontSize:10, fontWeight:800, color: themeMode === 'dark' ? '#a7f3d0' : '#0f766e', letterSpacing:'1.2px', textTransform:'uppercase' }}>CEO summary</p>
            <h3 style={{ ...S.cardH, color: themeMode === 'dark' ? '#f8fafc' : '#0f172a', marginTop:6 }}>Executive health snapshot</h3>
          </div>
          <span style={{ fontSize:10, fontWeight:800, color: themeMode === 'dark' ? '#dcfce7' : '#14532d', background: themeMode === 'dark' ? '#052e2b' : '#dcfce7', border:'1px solid rgba(20,83,45,.12)', borderRadius:999, padding:'6px 10px' }}>{executiveSummary.momentum}% momentum</span>
        </div>

        <div style={{ display:'grid', gridTemplateColumns:'1.5fr 1fr', gap:16 }}>
          <div>
            <p style={{ margin:0, fontSize:13, color: themeMode === 'dark' ? '#dbeafe' : '#334155', lineHeight:1.8, fontWeight:600 }}>
              {executiveSummary.outlook}
            </p>
            <div style={{ display:'flex', gap:10, flexWrap:'wrap', marginTop:14 }}>
              {[
                { label: 'Cash share', value: `${executiveSummary.cashShare}%` },
                { label: 'Online share', value: `${executiveSummary.onlineShare}%` },
                { label: 'Best channel', value: (analytics?.summary?.cashRevenue || 0) >= (analytics?.summary?.onlineRevenue || 0) ? 'Cash' : 'Online' },
              ].map((chip) => (
                <span key={chip.label} style={{ background: themeMode === 'dark' ? 'rgba(15,23,42,.72)' : '#f8fafc', border:'1px solid rgba(148,163,184,.32)', borderRadius:999, padding:'7px 10px', fontSize:10, fontWeight:800, color: themeMode === 'dark' ? '#e2e8f0' : '#334155', letterSpacing:'.7px', textTransform:'uppercase' }}>
                  {chip.label}: {chip.value}
                </span>
              ))}
            </div>
          </div>

          <div style={{ display:'grid', gridTemplateColumns:'repeat(2, minmax(0, 1fr))', gap:10 }}>
            <div style={{ background: themeMode === 'dark' ? '#111827' : '#f8fafc', border:'1px solid rgba(148,163,184,.24)', borderRadius:12, padding:'12px 14px' }}>
              <p style={{ margin:0, fontSize:10, fontWeight:800, color: themeMode === 'dark' ? '#94a3b8' : '#64748b', textTransform:'uppercase', letterSpacing:'1px' }}>Revenue</p>
              <p style={{ margin:'8px 0 0', fontSize:18, fontWeight:900, color: themeMode === 'dark' ? '#f8fafc' : '#0f172a', fontFamily:"'Sora',sans-serif" }}>{formatPKR(analytics?.summary?.totalRevenue || 0)}</p>
            </div>
            <div style={{ background: themeMode === 'dark' ? '#111827' : '#f8fafc', border:'1px solid rgba(148,163,184,.24)', borderRadius:12, padding:'12px 14px' }}>
              <p style={{ margin:0, fontSize:10, fontWeight:800, color: themeMode === 'dark' ? '#94a3b8' : '#64748b', textTransform:'uppercase', letterSpacing:'1px' }}>Orders</p>
              <p style={{ margin:'8px 0 0', fontSize:18, fontWeight:900, color: themeMode === 'dark' ? '#f8fafc' : '#0f172a', fontFamily:"'Sora',sans-serif" }}>{analytics?.summary?.totalOrders || orders.length}</p>
            </div>
          </div>
        </div>
      </div>

      {/* ── Sales History & Payment Mix ── */}
      <AdminPerformancePanel {...{ S, aiPulse, aiStrategy, analytics, analyticsTab, channelBreakdown, exportCsvReport, formatPKR, generatePdfReport, openSection, performanceTabs, productBreakdown, regionBreakdown, setAnalyticsTab, strongestRegion, themeMode }} />

      <AdminRevenueTrends {...{ S, formatCompactNumber, formatPKR, salesChartSections, themeMode }} />

      <AdminRegionalCampaigns {...{ S, formatPKR, regionalCampaigns, themeMode }} />

      <AdminProductRecommendations {...{ S, productRecommendations, themeMode }} />

      <AdminMarketSplit {...{ S, globalCnt, localCnt, openSection, products, themeMode }} />

      {/* bottom row */}
      <AdminOrderStatusPanel {...{ Badge, S, STATUS_CFG, STATUS_LIST, formatPKR, openSection, orders, themeMode }} />

      {/* stock alerts */}
      <AdminLowStockPanel {...{ S, lowStockProducts, openEdit, openSection, themeMode }} />

      {/* inventory snapshot */}
      <AdminInventoryPanel {...{ MarketBadge, S, StockCell, ThumbCell, formatPKR, formatUSD, openSection, products, themeMode }} />
    </div>
  );
}
