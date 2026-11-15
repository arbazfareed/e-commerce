import { useEffect, useState } from 'react';
import API from '../../../utils/axiosConfig';
import { formatPKR } from '../../../utils/priceUtils';

const PERIODS = [[7, '7 days'], [30, '30 days'], [90, '90 days'], [365, '12 months']];
const PRIORITY = {
  high:   { label:'Do first',  light:['#fff1f2', '#9f1239', '#fecdd3'], dark:['rgba(127,29,29,.35)', '#fecdd3', 'rgba(248,113,113,.35)'] },
  medium: { label:'This week', light:['#fffbeb', '#854d0e', '#fde68a'], dark:['rgba(120,83,15,.35)', '#fde68a', 'rgba(251,191,36,.3)'] },
  low:    { label:'Idea',      light:['#f0fdf4', '#166534', '#bbf7d0'], dark:['rgba(6,95,70,.3)', '#bbf7d0', 'rgba(110,231,183,.25)'] },
};

const Change = ({ value, inverse = false, dark }) => {
  if (value === null || value === undefined) return <span style={{ fontSize:11, color: dark ? '#94a3b8' : '#64748b' }}>new</span>;
  if (value === 0) return <span style={{ fontSize:11, color: dark ? '#94a3b8' : '#64748b' }}>no change</span>;
  const good = inverse ? value < 0 : value > 0;
  return <span style={{ fontSize:11, fontWeight:800, color: good ? (dark ? '#6ee7b7' : '#047857') : (dark ? '#fda4af' : '#be123c') }}>{value > 0 ? '▲' : '▼'} {Math.abs(value)}%</span>;
};

// endpoint/params let the same panel show the whole business, one store (main admin),
// or a store owner's own store (/api/stores/analytics, which answers with scope: 'store').
export default function BusinessInsightsPanel({ themeMode = 'light', endpoint = '/api/orders/business', params = null, title = 'Business insights' }) {
  const dark = themeMode === 'dark';
  const [days, setDays] = useState(30);
  const [data, setData] = useState(null);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let active = true;
    setLoading(true);
    setError('');
    API.get(endpoint, { params:{ ...(params || {}), days } })
      .then(({ data: result }) => {
        if (!active) return;
        // Never let an unexpected reply break the whole dashboard.
        const valid = result && result.kpis && result.current && result.customers && result.inventory
          && Array.isArray(result.suggestions) && Array.isArray(result.trend);
        if (valid) setData(result); else { setData(null); setError('Business insights are not available yet.'); }
      })
      .catch(err => { if (active) setError(err.response?.data?.message || 'Business insights could not be loaded.'); })
      .finally(() => { if (active) setLoading(false); });
    return () => { active = false; };
  }, [days, endpoint, params?.store]);

  const c = {
    card: { background: dark ? 'rgba(15,23,42,.72)' : '#fff', border: dark ? '1px solid rgba(148,163,184,.18)' : '1px solid #e2ece6', borderRadius:16, padding:16 },
    h: { margin:'0 0 10px', fontSize:14, fontWeight:900, color: dark ? '#e2e8f0' : '#14251d' },
    muted: { color: dark ? '#94a3b8' : '#64748b', fontSize:12 },
    text: { color: dark ? '#e2e8f0' : '#1e293b' },
    th: { textAlign:'left', padding:'6px 8px', fontSize:10, letterSpacing:.6, textTransform:'uppercase', color: dark ? '#94a3b8' : '#64748b', borderBottom: dark ? '1px solid rgba(148,163,184,.2)' : '1px solid #e2e8f0' },
    td: { padding:'7px 8px', fontSize:12, color: dark ? '#e2e8f0' : '#1e293b', borderBottom: dark ? '1px solid rgba(148,163,184,.1)' : '1px solid #f1f5f9' },
  };

  const k = data?.kpis;
  // Store reports count only that store's order lines: no shipping, COD cash or coupons.
  const storeScope = data?.scope === 'store';
  const maxTrend = Math.max(1, ...(data?.trend || []).map(d => d.netSales));
  const kpiCards = k ? [
    ['Net sales', formatPKR(k.netSales.value), <Change key="c" value={k.netSales.change} dark={dark} />, 'Cancelled and returned orders not counted'],
    ['Orders', String(k.orders.value), <Change key="c" value={k.orders.change} dark={dark} />, `${data.current.units} items sold`],
    ['Average order', formatPKR(k.averageOrderValue.value), <Change key="c" value={k.averageOrderValue.change} dark={dark} />, 'Net sales ÷ orders'],
    ['New customers', String(k.newCustomers.value), null, `${data.customers.returningInPeriod} returning`],
    ['Cancelled', `${k.cancelRate.value}%`, null, `before: ${k.cancelRate.previous}%`],
    ['Returned', `${k.returnRate.value}%`, null, `before: ${k.returnRate.previous}%`],
    ...(storeScope ? [['Products', String(data.productCount ?? data.inventory.totalProducts), null, `${data.inventory.outOfStock.length} out of stock`]] : [
      ['COD to collect', formatPKR(k.codToCollect.value), null, 'Not delivered or paid yet'],
      ['Repeat customers', `${data.customers.repeatRate}%`, null, `of ${data.customers.totalCustomers} customers`],
    ]),
  ] : [];

  return (
    <section aria-labelledby="business-insights-title" style={{ marginBottom:22 }}>
      <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center', gap:12, flexWrap:'wrap', marginBottom:12 }}>
        <div>
          <h2 id="business-insights-title" style={{ margin:0, fontSize:19, fontWeight:900, color: dark ? '#f8fafc' : '#0f172a' }}>{title}</h2>
          <p style={{ ...c.muted, margin:'3px 0 0' }}>All amounts in PKR{data ? ` (USD orders at Rs ${data.usdRate} per $)` : ''}. Compared with the {days === 365 ? '12 months' : `${days} days`} before.{storeScope ? ' Sales are this store\'s products only (shipping and COD fees not included).' : ''}</p>
        </div>
        <div role="group" aria-label="Period" style={{ display:'flex', gap:6, flexWrap:'wrap' }}>
          {PERIODS.map(([value, label]) => (
            <button key={value} type="button" aria-pressed={days === value} onClick={() => setDays(value)} style={{
              border:'1px solid rgba(148,163,184,.3)', borderRadius:999, padding:'7px 12px', fontSize:11, fontWeight:800, cursor:'pointer',
              background: days === value ? (dark ? '#0f766e' : '#d1fae5') : (dark ? '#0b1d2d' : '#f8fafc'),
              color: days === value ? (dark ? '#ecfeff' : '#065f46') : (dark ? '#dbeafe' : '#334155'),
            }}>{label}</button>
          ))}
        </div>
      </div>

      {error && <p role="alert" style={{ ...c.card, color: dark ? '#fecdd3' : '#9f1239' }}>{error}</p>}
      {loading && !data && <p role="status" style={{ ...c.card, ...c.muted }}>Loading insights…</p>}

      {data && <div style={{ opacity: loading ? 0.6 : 1, transition:'opacity .2s' }}>
        <div style={{ display:'grid', gridTemplateColumns:'repeat(auto-fit, minmax(150px, 1fr))', gap:10, marginBottom:12 }}>
          {kpiCards.map(([label, value, change, hint]) => (
            <div key={label} style={c.card}>
              <p style={{ ...c.muted, margin:0, fontWeight:800, textTransform:'uppercase', fontSize:10, letterSpacing:.6 }}>{label}</p>
              <p style={{ margin:'6px 0 2px', fontSize:20, fontWeight:900, ...c.text }}>{value}</p>
              <div style={{ display:'flex', gap:6, alignItems:'baseline', flexWrap:'wrap' }}>{change}<span style={{ ...c.muted, fontSize:11 }}>{hint}</span></div>
            </div>
          ))}
        </div>

        <div style={{ ...c.card, marginBottom:12 }}>
          <h3 style={c.h}>Suggestions for you</h3>
          {data.suggestions.length === 0 && <p style={c.muted}>Nothing urgent. Keep going!</p>}
          <ol style={{ listStyle:'none', margin:0, padding:0, display:'grid', gap:8 }}>
            {data.suggestions.map(item => {
              const [bg, fg, border] = (dark ? PRIORITY[item.priority].dark : PRIORITY[item.priority].light);
              return (
                <li key={item.title} style={{ display:'flex', gap:10, alignItems:'flex-start', padding:'10px 12px', borderRadius:12, background:bg, border:`1px solid ${border}` }}>
                  <span style={{ flexShrink:0, fontSize:10, fontWeight:900, textTransform:'uppercase', letterSpacing:.5, color:fg, minWidth:62 }}>{PRIORITY[item.priority].label}<br /><span style={{ fontWeight:700, opacity:.8 }}>{item.area}</span></span>
                  <span><strong style={{ color:fg, fontSize:13 }}>{item.title}</strong><br /><span style={{ fontSize:12, ...c.text }}>{item.detail}</span></span>
                </li>
              );
            })}
          </ol>
        </div>

        <div style={{ ...c.card, marginBottom:12 }}>
          <h3 style={c.h}>Daily net sales</h3>
          <div role="img" aria-label={`Daily net sales for the last ${days} days`} style={{ display:'flex', alignItems:'flex-end', gap: days > 90 ? 0 : 2, height:90 }}>
            {data.trend.map(day => (
              <div key={day.date} title={`${day.date}: ${formatPKR(day.netSales)} · ${day.orders} orders`} style={{ flex:1, minWidth:1, height:`${Math.max(2, (day.netSales / maxTrend) * 100)}%`, background: day.netSales ? (dark ? '#34d399' : '#10b981') : (dark ? 'rgba(148,163,184,.2)' : '#e2e8f0'), borderRadius:'3px 3px 0 0' }} />
            ))}
          </div>
          <div style={{ display:'flex', justifyContent:'space-between', ...c.muted, fontSize:10, marginTop:4 }}><span>{data.trend[0]?.date}</span><span>{data.trend[data.trend.length - 1]?.date}</span></div>
        </div>

        <div style={{ display:'grid', gridTemplateColumns:'repeat(auto-fit, minmax(300px, 1fr))', gap:12 }}>
          <div style={c.card}>
            <h3 style={c.h}>Best products</h3>
            {data.topProducts.length === 0 ? <p style={c.muted}>No sales in this period.</p> : (
              <table style={{ width:'100%', borderCollapse:'collapse' }}>
                <thead><tr><th style={c.th}>Product</th><th style={c.th}>Sold</th><th style={c.th}>Sales</th><th style={c.th}>Stock left</th></tr></thead>
                <tbody>{data.topProducts.slice(0, 6).map(p => (
                  <tr key={p.id}><td style={c.td}>{p.name}</td><td style={c.td}>{p.units}</td><td style={c.td}>{formatPKR(p.revenue)}</td>
                    <td style={c.td}>{p.stock === null ? '—' : `${p.stock}${p.daysOfStockLeft !== null ? ` (~${p.daysOfStockLeft} days)` : ''}`}</td></tr>
                ))}</tbody>
              </table>
            )}
          </div>

          <div style={c.card}>
            <h3 style={c.h}>Cities</h3>
            {data.cities.length === 0 ? <p style={c.muted}>No orders in this period.</p> : (
              <table style={{ width:'100%', borderCollapse:'collapse' }}>
                <thead><tr><th style={c.th}>City</th><th style={c.th}>Orders</th><th style={c.th}>Sales</th><th style={c.th}>Cancelled / returned</th></tr></thead>
                <tbody>{data.cities.slice(0, 6).map(city => (
                  <tr key={city.city}><td style={c.td}>{city.city}</td><td style={c.td}>{city.orders}</td><td style={c.td}>{formatPKR(city.netSales)}</td>
                    <td style={{ ...c.td, color: city.failedRate >= 25 ? (dark ? '#fda4af' : '#be123c') : c.td.color, fontWeight: city.failedRate >= 25 ? 800 : 400 }}>{city.failedRate}%</td></tr>
                ))}</tbody>
              </table>
            )}
          </div>

          <div style={c.card}>
            <h3 style={c.h}>Stock to act on</h3>
            <p style={{ ...c.muted, margin:'0 0 8px' }}>Stock value: {formatPKR(data.inventory.stockValue)} across {data.inventory.totalProducts} products</p>
            <ul style={{ margin:0, paddingLeft:18, display:'grid', gap:4, fontSize:12, ...c.text }}>
              {data.inventory.restockSoon.map(p => <li key={`r${p.id}`}><strong>Restock:</strong> {p.name}: {p.stock} left (~{p.daysOfStockLeft} days)</li>)}
              {data.inventory.outOfStock.slice(0, 5).map(p => <li key={`o${p.id}`}><strong>Out of stock:</strong> {p.name}</li>)}
              {data.inventory.notSelling.slice(0, 5).map(p => <li key={`n${p.id}`}><strong>Not selling:</strong> {p.name} ({p.stock} in stock)</li>)}
              {!data.inventory.restockSoon.length && !data.inventory.outOfStock.length && !data.inventory.notSelling.length && <li style={{ listStyle:'none', marginLeft:-18, ...c.muted }}>Stock looks healthy.</li>}
            </ul>
          </div>

          {(!storeScope || data.customers.top.length > 0) && <div style={c.card}>
            <h3 style={c.h}>Top customers</h3>
            {data.customers.top.length === 0 ? <p style={c.muted}>No customers yet.</p> : (
              <table style={{ width:'100%', borderCollapse:'collapse' }}>
                <thead><tr><th style={c.th}>Customer</th><th style={c.th}>Orders</th><th style={c.th}>Spent</th></tr></thead>
                <tbody>{data.customers.top.slice(0, 6).map(cu => (
                  <tr key={`${cu.email}-${cu.name}`}><td style={c.td}>{cu.name}{cu.guest ? <span style={{ ...c.muted, fontSize:10 }}> · guest</span> : ''}<br /><span style={{ ...c.muted, fontSize:10 }}>{cu.email}</span></td><td style={c.td}>{cu.orders}</td><td style={c.td}>{formatPKR(cu.spent)}</td></tr>
                ))}</tbody>
              </table>
            )}
            <p style={{ ...c.muted, margin:'8px 0 0' }}>Average spend per customer: {formatPKR(data.customers.averageLifetimeValue)} · {data.customers.lapsed} have not ordered for 60+ days</p>
          </div>}

          {!storeScope && <div style={c.card}>
            <h3 style={c.h}>Coupons</h3>
            {data.coupons.length === 0 ? <p style={c.muted}>No coupons used in this period.</p> : (
              <table style={{ width:'100%', borderCollapse:'collapse' }}>
                <thead><tr><th style={c.th}>Code</th><th style={c.th}>Orders</th><th style={c.th}>Discount given</th><th style={c.th}>Sales</th></tr></thead>
                <tbody>{data.coupons.slice(0, 6).map(cp => (
                  <tr key={cp.code}><td style={c.td}>{cp.code}</td><td style={c.td}>{cp.orders}</td><td style={c.td}>{formatPKR(cp.discount)} ({cp.discountShare}%)</td><td style={c.td}>{formatPKR(cp.netSales)}</td></tr>
                ))}</tbody>
              </table>
            )}
            <p style={{ ...c.muted, margin:'8px 0 0' }}>{data.current.couponUseRate}% of orders used a coupon{data.unusedCoupons.length ? ` · unused: ${data.unusedCoupons.slice(0, 4).join(', ')}` : ''}</p>
          </div>}

          <div style={c.card}>
            <h3 style={c.h}>Money breakdown</h3>
            <table style={{ width:'100%', borderCollapse:'collapse' }}>
              <tbody>
                {(storeScope ? [
                  ['Product sales', data.current.productSales],
                  ['Paid so far', data.current.collected],
                  ['Lost to cancellations and returns', -data.current.lostSales],
                ] : [
                  ['Products (after coupons)', data.current.productSales],
                  ['Shipping charged', data.current.shippingFees],
                  ['COD fees charged', data.current.codFees],
                  ['Coupon discounts given', -data.current.discounts],
                  ['Cash collected (paid orders)', data.current.collected],
                  ['Lost to cancellations and returns', -data.current.lostSales],
                ]).map(([label, value]) => (
                  <tr key={label}><td style={c.td}>{label}</td><td style={{ ...c.td, textAlign:'right', fontWeight:700 }}>{value < 0 ? `−${formatPKR(-value)}` : formatPKR(value)}</td></tr>
                ))}
              </tbody>
            </table>
            <p style={{ ...c.muted, margin:'8px 0 0' }}>International: {data.current.internationalShare}% of orders · Busiest day: {[...data.weekdays].sort((a, b) => b.netSales - a.netSales).find(d => d.netSales > 0)?.day || '—'}</p>
          </div>
        </div>
      </div>}
    </section>
  );
}
