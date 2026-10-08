export default function AdminProductsPanel({
  MarketBadge,
  S,
  StockCell,
  ThumbCell,
  cats,
  exportProductsCsv,
  fCat,
  fMarket,
  filteredProducts,
  formatPKR,
  formatUSD,
  globalCnt,
  handleDelete,
  isCompact,
  localCnt,
  oos,
  openEdit,
  openSection,
  products,
  search,
  setFCat,
  setFMarket,
  setSearch,
  themeMode
}) {
  return (
    <div style={{ animation:'fadeUp .35s ease' }}>
      <div style={S.pgTop}>
        <div>
          <h1 style={S.pgTitle}>Products</h1>
          <p style={S.pgSub}>{products.length} total · {localCnt} local · {globalCnt} global · {oos} out of stock</p>
        </div>
        <div style={{ display:'flex', gap:8, flexWrap:'wrap', justifyContent:'flex-end' }}>
          <button type="button" className="admin-filter-pill" style={{ ...S.ghostBtn, padding:'10px 14px', fontSize:12 }} onClick={exportProductsCsv}>⬇ Export products CSV</button>
          <button className="admin-green-button" style={S.greenBtn} onClick={() => openSection('add')}>+ Add Product</button>
        </div>
      </div>

      {/* filter bar */}
      <div style={{
        display:'grid',
        gap:10,
        marginBottom:18,
        gridTemplateColumns: isCompact ? '1fr' : 'minmax(0, 1fr) auto auto',
        alignItems:'center',
      }}>
        <input style={{
          ...S.searchBox,
          background: themeMode === 'dark' ? '#0f172a' : '#fff',
          borderColor: themeMode === 'dark' ? '#243244' : '#e2e8f0',
          color: themeMode === 'dark' ? '#e2e8f0' : '#1e293b',
          boxShadow: themeMode === 'dark' ? 'inset 0 1px 0 rgba(148,163,184,.08)' : 'inset 0 1px 1px rgba(15,23,42,0.03)',
          width: '100%',
        }} placeholder="🔍  Search products…" value={search} onChange={e => setSearch(e.target.value)} />
        <select style={{
          ...S.sel,
          background: themeMode === 'dark' ? '#0f172a' : '#fff',
          borderColor: themeMode === 'dark' ? '#243244' : '#e2e8f0',
          color: themeMode === 'dark' ? '#e2e8f0' : '#334155',
          width: isCompact ? '100%' : 'auto',
        }} value={fCat} onChange={e => setFCat(e.target.value)}>
          <option value="All">All Categories</option>
          {cats.map(c => <option key={c}>{c}</option>)}
        </select>
        {/* market filter pills */}
        <div style={{ display:'flex', gap:6, flexShrink:0, flexWrap:'wrap', justifyContent:isCompact ? 'stretch' : 'flex-start' }}>
          {[
            { v:'all',    label:'All',       cnt: products.length,  activeColor:'#475569', activeBg:'#f1f5f9', activeBorder:'#cbd5e1' },
            { v:'local',  label:'🇵🇰 Local',  cnt: localCnt,         activeColor:'#059669', activeBg:'#ecfdf5', activeBorder:'#6ee7b7' },
            { v:'global', label:'🌍 Global', cnt: globalCnt,         activeColor:'#2563eb', activeBg:'#eff6ff', activeBorder:'#93c5fd' },
          ].map(o => {
            const on = fMarket === o.v;
            return (
              <button key={o.v} className={`mkt-pill admin-filter-pill${on ? ' is-active' : ''}`} data-filter={o.v} aria-pressed={on} onClick={() => setFMarket(o.v)}
                style={{
                  padding:'8px 14px', borderRadius:999, fontSize:12, fontWeight:700, cursor:'pointer',
                  border: `1.5px solid ${on ? o.activeBorder : '#e2e8f0'}`,
                  background: on ? o.activeBg : '#fff',
                  color: on ? o.activeColor : '#64748b',
                  transition:'all .15s', fontFamily:"'Sora',sans-serif",
                  flex: isCompact ? '1 1 95px' : '0 0 auto',
                }}>
                {o.label} <span style={{ opacity:.65 }}>({o.cnt})</span>
              </button>
            );
          })}
        </div>
      </div>

      <div style={{
        ...S.card,
        background: themeMode === 'dark' ? 'linear-gradient(180deg, rgba(15,23,42,0.96), rgba(9,16,22,0.96))' : 'linear-gradient(135deg, rgba(255,255,255,0.92), rgba(255,255,255,0.78))',
        borderColor: themeMode === 'dark' ? 'rgba(148,163,184,0.18)' : 'rgba(148,163,184,0.18)',
        boxShadow: themeMode === 'dark' ? '0 18px 40px rgba(2,6,23,0.36)' : '0 16px 38px rgba(15,23,42,.08)',
      }}>
        <div style={{ overflowX:'auto' }}>
          <table style={{
            ...S.tbl,
            color: themeMode === 'dark' ? '#e2e8f0' : '#334155',
            display: isCompact ? 'block' : 'table',
            width: isCompact ? '100%' : '100%',
          }}>
            <thead style={{ display: isCompact ? 'none' : 'table-header-group' }}>
              <tr>{['','Name','Category','PKR Price','USD Price','Discount','Stock','Market','Visibility','Actions'].map(h => <th key={h} style={S.th}>{h}</th>)}</tr>
            </thead>
            <tbody>
              {filteredProducts.length === 0 && (
                <tr><td colSpan={10} style={{ textAlign:'center', padding:'4rem', color:'#94a3b8', fontSize:14 }}>No products found.</td></tr>
              )}
              {filteredProducts.map(p => (
                isCompact ? (
                  <tr key={p._id} className="row-hover" style={{ display:'block', marginBottom:12, border:'1px solid rgba(148,163,184,0.18)', borderRadius:14, background: themeMode === 'dark' ? 'rgba(15,23,42,0.96)' : '#fff', overflow:'hidden' }}>
                    <td colSpan={10} style={{ display:'block', padding:12 }}>
                      <div style={{ display:'grid', gridTemplateColumns:'44px minmax(0,1fr) auto', gap:12, alignItems:'flex-start' }}>
                        <div style={{ position:'relative', display:'inline-block' }}>
                          <ThumbCell p={p} />
                          {(p.images||[]).length > 1 && (
                            <span style={{ position:'absolute', top:-5, right:-5, background:'#6366f1', color:'#fff', borderRadius:999, fontSize:9, fontWeight:800, padding:'2px 5px' }}>+{p.images.length-1}</span>
                          )}
                        </div>
                        <div style={{ minWidth:0 }}>
                          <p style={{ margin:'0 0 4px', fontWeight:800, color: themeMode === 'dark' ? '#f8fafc' : '#1e293b', fontFamily:"'Sora',sans-serif", fontSize:16, lineHeight:1.35 }}>{p.name}</p>
                          {p.description && <p style={{ margin:0, fontSize:12, color: themeMode === 'dark' ? '#a8b7b2' : '#64748b', lineHeight:1.5 }}>{p.description.slice(0,60)}{p.description.length>60?'…':''}</p>}
                        </div>
                        <div style={{ display:'flex', flexDirection:'column', alignItems:'flex-end', gap:8 }}>
                          <div style={{ fontWeight:900, color: themeMode === 'dark' ? '#a7f3d0' : '#10b981', whiteSpace:'nowrap', fontFamily:"'JetBrains Mono',monospace", fontSize:15 }}>{formatPKR(p.pricePKR)}</div>
                          <button className="edit-btn" style={{
                            ...S.editBtn,
                            background: themeMode === 'dark' ? 'linear-gradient(135deg, rgba(96,165,250,0.18), rgba(59,130,246,0.14))' : '#edf6ff',
                            borderColor: themeMode === 'dark' ? 'rgba(96,165,250,0.35)' : '#bfdbfe',
                            color: themeMode === 'dark' ? '#dbeafe' : '#1d4ed8',
                            padding:'6px 10px',
                            marginRight:0,
                          }} onClick={() => openEdit(p)}>✏️ Edit</button>
                        </div>
                      </div>

                      <div style={{ display:'grid', gridTemplateColumns:'repeat(2, minmax(0, 1fr))', gap:8, marginTop:12, paddingTop:10, borderTop:'1px solid rgba(148,163,184,0.14)' }}>
                        <div>
                          <div style={{ fontSize:10, letterSpacing:'0.7px', textTransform:'uppercase', color: themeMode === 'dark' ? '#9bb6af' : '#94a3b8', marginBottom:4, fontWeight:800 }}>Category</div>
                          <span className="admin-cat-tag" style={{ ...S.catTag, display:'inline-block', background: themeMode === 'dark' ? 'rgba(59,130,246,0.16)' : '#f1f5f9', color: themeMode === 'dark' ? '#dbeafe' : '#334155' }}>{p.category}</span>
                        </div>
                        <div>
                          <div style={{ fontSize:10, letterSpacing:'0.7px', textTransform:'uppercase', color: themeMode === 'dark' ? '#9bb6af' : '#94a3b8', marginBottom:4, fontWeight:800 }}>Stock</div>
                          <StockCell n={p.stock} />
                        </div>
                        <div>
                          <div style={{ fontSize:10, letterSpacing:'0.7px', textTransform:'uppercase', color: themeMode === 'dark' ? '#9bb6af' : '#94a3b8', marginBottom:4, fontWeight:800 }}>Market</div>
                          <MarketBadge isLocal={p.isLocal} />
                        </div>
                        <div>
                          <div style={{ fontSize:10, letterSpacing:'0.7px', textTransform:'uppercase', color: themeMode === 'dark' ? '#9bb6af' : '#94a3b8', marginBottom:4, fontWeight:800 }}>Visibility</div>
                          <span className={`admin-visibility-tag ${p.isVisible === false ? 'is-hidden' : 'is-visible'}`} style={{ ...S.catTag, display:'inline-block', background:p.isVisible === false ? (themeMode === 'dark' ? '#3b1d25' : '#fff1f2') : (themeMode === 'dark' ? '#133d2b' : '#ecfdf5'), color:p.isVisible === false ? (themeMode === 'dark' ? '#fecdd3' : '#9f1239') : (themeMode === 'dark' ? '#a7f3d0' : '#047857') }}>{p.isVisible === false ? 'Hidden' : 'Visible'}</span>
                        </div>
                      </div>
                    </td>
                  </tr>
                ) : (
                  <tr key={p._id} className="row-hover">
                    <td style={S.td}>
                      <div style={{ position:'relative', display:'inline-block' }}>
                        <ThumbCell p={p} />
                        {(p.images||[]).length > 1 && (
                          <span style={{ position:'absolute', top:-5, right:-5, background:'#6366f1', color:'#fff', borderRadius:999, fontSize:9, fontWeight:800, padding:'2px 5px' }}>+{p.images.length-1}</span>
                        )}
                      </div>
                    </td>
                    <td style={{ ...S.td, maxWidth:180 }}>
                      <p style={{ margin:'0 0 2px', fontWeight:700, color: themeMode === 'dark' ? '#f8fafc' : '#1e293b', fontFamily:"'Sora',sans-serif" }}>{p.name}</p>
                      {p.description && <p style={{ margin:0, fontSize:11, color: themeMode === 'dark' ? '#a8b7b2' : '#64748b' }}>{p.description.slice(0,50)}{p.description.length>50?'…':''}</p>}
                    </td>
                    <td style={S.td}><span className="admin-cat-tag" style={{ ...S.catTag, background: themeMode === 'dark' ? 'rgba(59,130,246,0.16)' : '#f1f5f9', color: themeMode === 'dark' ? '#dbeafe' : '#334155' }}>{p.category}</span></td>
                    <td style={{ ...S.td, fontWeight:800, color: themeMode === 'dark' ? '#a7f3d0' : '#10b981', whiteSpace:'nowrap', fontFamily:"'JetBrains Mono',monospace" }}>{formatPKR(p.pricePKR)}</td>
                    <td style={{ ...S.td, fontWeight:800, color: themeMode === 'dark' ? '#dbeafe' : '#6366f1', whiteSpace:'nowrap', fontFamily:"'JetBrains Mono',monospace" }}>{formatUSD(p.priceUSD)}</td>
                    <td style={S.td}>{Number(p.discountPercent) > 0 ? <span className="admin-discount-chip" style={{ background: themeMode === 'dark' ? 'rgba(251,191,36,0.18)' : '#fef3c7', color: themeMode === 'dark' ? '#fef3c7' : '#a16207', borderRadius:999, padding:'4px 8px', fontWeight:800 }}>{`-${p.discountPercent}%`}</span> : '—'}</td>
                    <td style={S.td}><StockCell n={p.stock} /></td>
                    <td style={S.td}><MarketBadge isLocal={p.isLocal} /></td>
                    <td style={S.td}><span className={`admin-visibility-tag ${p.isVisible === false ? 'is-hidden' : 'is-visible'}`} style={{ ...S.catTag, background:p.isVisible === false ? (themeMode === 'dark' ? '#3b1d25' : '#fff1f2') : (themeMode === 'dark' ? '#133d2b' : '#ecfdf5'), color:p.isVisible === false ? (themeMode === 'dark' ? '#fecdd3' : '#9f1239') : (themeMode === 'dark' ? '#a7f3d0' : '#047857') }}>{p.isVisible === false ? 'Hidden' : 'Visible'}</span></td>
                    <td style={{ ...S.td, whiteSpace:'nowrap' }}>
                      <button className="edit-btn" style={{
                        ...S.editBtn,
                        background: themeMode === 'dark' ? 'linear-gradient(135deg, rgba(96,165,250,0.18), rgba(59,130,246,0.14))' : '#edf6ff',
                        borderColor: themeMode === 'dark' ? 'rgba(96,165,250,0.35)' : '#bfdbfe',
                        color: themeMode === 'dark' ? '#dbeafe' : '#1d4ed8',
                        boxShadow: themeMode === 'dark' ? 'inset 0 0 0 1px rgba(147,197,253,0.18)' : 'none',
                      }} onClick={() => openEdit(p)}>✏️ Edit</button>
                      <button className="del-btn" style={{
                        ...S.deleteBtn,
                        background: themeMode === 'dark' ? 'rgba(127,29,29,0.16)' : '#fff5f5',
                        borderColor: themeMode === 'dark' ? 'rgba(252,165,165,0.32)' : '#fecaca',
                        color: themeMode === 'dark' ? '#fecaca' : '#ef4444',
                      }} onClick={() => handleDelete(p._id, p.name)}>🗑️</button>
                    </td>
                  </tr>
                )
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
