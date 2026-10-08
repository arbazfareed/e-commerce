export default function AdminProductEditModal({
  CATEGORY_TREE,
  CategoryPicker,
  ImagePicker,
  MarketPicker,
  S,
  cats,
  eForm,
  eNewCat,
  ePrevs,
  eRef,
  eSaving,
  editDiscountNow,
  editP,
  formatPKR,
  formatUSD,
  getDiscountedPrice,
  handleEditSave,
  pickImgs,
  pkrToUSD,
  removeImg,
  setEForm,
  setENewCat,
  setEditP,
  themeMode
}) {
  return (
    <div className="admin-edit-overlay" style={S.overlay} onClick={() => setEditP(null)}>
      <div className="admin-edit-modal" style={{
        ...S.modal,
        background: themeMode === 'dark' ? 'linear-gradient(180deg, rgba(15,23,42,0.98), rgba(12,20,24,0.98))' : '#ffffff',
        border: themeMode === 'dark' ? '1px solid rgba(148,163,184,0.18)' : '1px solid #e2e8f0',
        boxShadow: themeMode === 'dark' ? '0 28px 70px rgba(2,6,23,0.52)' : '0 32px 80px rgba(15,23,42,0.16)',
      }} onClick={e => e.stopPropagation()}>
        <div className="admin-modal-header" style={{
          ...S.mHead,
          background: themeMode === 'dark' ? 'linear-gradient(135deg, rgba(15,23,42,0.96), rgba(17,24,39,0.96))' : '#f8fafc',
          borderBottom: themeMode === 'dark' ? '1px solid rgba(148,163,184,0.18)' : '1px solid #f1f5f9',
        }}>
          <div>
            <h3 style={{ margin:0, fontSize:17, fontWeight:800, color: themeMode === 'dark' ? '#f8fafc' : '#0f172a', fontFamily:"'Sora',sans-serif" }}>Edit Product</h3>
            <p style={{ margin:'3px 0 0', fontSize:12, color: themeMode === 'dark' ? '#a5b4fc' : '#64748b', fontFamily:"'JetBrains Mono',monospace" }}>{editP._id.slice(-10).toUpperCase()}</p>
          </div>
          <button className="admin-modal-close" style={{ ...S.closeX, background: themeMode === 'dark' ? '#172033' : '#f1f5f9', color: themeMode === 'dark' ? '#e2e8f0' : '#475569', border: themeMode === 'dark' ? '1px solid rgba(148,163,184,0.18)' : 'none' }} onClick={() => setEditP(null)}>✕</button>
        </div>
        <div className="admin-modal-body" style={{ ...S.mBody, background: themeMode === 'dark' ? 'rgba(9,14,18,0.88)' : '#fff' }}>
          {/* images */}
          <div style={{ marginBottom:20 }}>
            <label style={S.lbl}>Product Images</label>
              <ImagePicker previews={ePrevs} onPick={f => pickImgs(f, true)} onRemove={i => removeImg(i, true)} inputRef={eRef} darkMode={themeMode === 'dark'} />
          </div>
          <div style={S.grid2}>
            <div>
              <label style={S.lbl}>Product Name *</label>
              <input style={S.inp} value={eForm.name} onChange={e => setEForm(f => ({...f, name:e.target.value}))} />
            </div>
            <div>
              <label style={S.lbl}>Category *</label>
              <CategoryPicker value={eForm.category} onChange={v => setEForm(f => ({...f, category:v, subcategory:''}))} isNew={eNewCat} setIsNew={setENewCat} categories={[...new Set([...cats, ...Object.keys(CATEGORY_TREE)])].sort()} inputStyle={S.inp} buttonStyle={S.ghostBtn} />
            </div>
            <div>
              <label style={S.lbl}>Subcategory</label>
              <input list="edit-subcategory-options" style={S.inp} placeholder="e.g. Laptops or Handmade" value={eForm.subcategory || ''} onChange={e => setEForm(f => ({...f, subcategory:e.target.value}))} />
              <datalist id="edit-subcategory-options">{(CATEGORY_TREE[eForm.category] || []).map(v => <option key={v} value={v} />)}</datalist>
            </div>
            <div>
              <label style={S.lbl}>Brand</label>
              <input style={S.inp} placeholder="e.g. HP, Lenovo" value={eForm.brand || ''} onChange={e => setEForm(f => ({...f, brand:e.target.value}))} />
            </div>
            <div>
              <label style={S.lbl}>Model / Edition</label>
              <input style={S.inp} placeholder="e.g. Pavilion 15" value={eForm.model || ''} onChange={e => setEForm(f => ({...f, model:e.target.value}))} />
            </div>
            <div>
              <label style={S.lbl}>Colours <span style={S.optional}>optional · comma separated</span></label>
              <input style={S.inp} placeholder="Black, Silver, Blue" value={eForm.colors || ''} onChange={e => setEForm(f => ({...f, colors:e.target.value}))} />
            </div>
            <div>
              <label style={S.lbl}>Sizes / Variants <span style={S.optional}>optional · comma separated</span></label>
              <input style={S.inp} placeholder="Small, Medium, Large" value={eForm.sizes || ''} onChange={e => setEForm(f => ({...f, sizes:e.target.value}))} />
            </div>
            <label className="admin-visibility-toggle" style={{ ...S.visibilityToggle, gridColumn:'1/-1' }}>
              <input type="checkbox" checked={eForm.isVisible !== false} onChange={e => setEForm(f => ({...f, isVisible:e.target.checked}))} />
              <span><strong>Show this product in the shop</strong><small>Hidden products remain available in Admin.</small></span>
            </label>
            <div style={{ position:'relative' }}>
              <label style={S.lbl}>🇵🇰 Price PKR *</label>
              <div style={{ position:'relative' }}>
                <span style={S.pre}>Rs</span>
                <input style={{ ...S.inp, paddingLeft:36 }} type="number" min="0" value={eForm.pricePKR}
                  onChange={e => {
                    const pkr = e.target.value;
                    const usd = pkr ? pkrToUSD(pkr) : '';
                    setEForm(f => ({...f, pricePKR:pkr, priceUSD: usd !== '' ? String(usd) : f.priceUSD}));
                  }} />
              </div>
            </div>
            <div style={{ position:'relative' }}>
              <label style={S.lbl}>🌍 Price USD <span style={{ color:'#10b981', fontWeight:500, fontSize:10, textTransform:'none', letterSpacing:0 }}>(auto)</span></label>
              <div style={{ position:'relative' }}>
                <span style={S.pre}>$</span>
                <input style={{ ...S.inp, paddingLeft:28 }} type="number" min="0" step="0.01" value={eForm.priceUSD} onChange={e => setEForm(f => ({...f, priceUSD:e.target.value}))} />
              </div>
            </div>
            <div className="admin-discount-editor" style={{ gridColumn:'1/-1' }}>
              <div>
                <label style={S.lbl}>🏷️ Discount (%)</label>
                <input style={S.inp} type="number" min="0" max="100" step="1" value={eForm.discountPercent ?? 0}
                  onChange={e => setEForm(f => ({ ...f, discountPercent:Math.min(100, Math.max(0, Number(e.target.value) || 0)) }))} />
                <small>Set 0 to show the regular price.</small>
              </div>
              <div className="admin-discount-dates">
                <div>
                  <label style={S.lbl}>Starts on</label>
                  <input style={S.inp} type="date" value={eForm.discountStartDate || ''} onChange={e => setEForm(f => ({ ...f, discountStartDate:e.target.value }))} />
                </div>
                <div>
                  <label style={S.lbl}>Ends on</label>
                  <input style={S.inp} type="date" value={eForm.discountEndDate || ''} onChange={e => setEForm(f => ({ ...f, discountEndDate:e.target.value }))} />
                </div>
              </div>
              <div className="admin-discount-preview">
                <span>{editDiscountNow > 0 ? `${editDiscountNow}% OFF · Active now` : Number(eForm.discountPercent) > 0 ? 'Promotion scheduled or expired' : 'No discount applied'}</span>
                {editDiscountNow > 0 && <strong>{formatPKR(getDiscountedPrice(eForm.pricePKR, editDiscountNow, 'PKR'))} <i>·</i> {formatUSD(getDiscountedPrice(eForm.priceUSD, editDiscountNow, 'USD'))}</strong>}
              </div>
            </div>
            <div>
              <label style={S.lbl}>Stock</label>
              <input style={S.inp} type="number" min="0" value={eForm.stock} onChange={e => setEForm(f => ({...f, stock:e.target.value}))} />
            </div>
            <div>
              <label style={S.lbl}>⚖️ Weight (kg) <span style={{ color:'#94a3b8', fontWeight:400, fontSize:10, textTransform:'none', letterSpacing:0 }}>(optional)</span></label>
              <div style={{ position:'relative' }}>
                <span style={{ position:'absolute', left:10, top:'50%', transform:'translateY(-50%)', fontSize:11, color:'#94a3b8', fontWeight:700 }}>kg</span>
                <input style={{ ...S.inp, paddingLeft:30 }} type="number" min="0" step="0.1" placeholder="Leave blank if no weight" value={eForm.weightKg} onChange={e => setEForm(f => ({...f, weightKg:e.target.value}))} />
              </div>
              <p style={{ margin:'4px 0 0', fontSize:10, color:'#94a3b8' }}>Used to calculate shipping fee</p>
            </div>
            <div>
              <label style={S.lbl}>Description</label>
              <textarea style={{ ...S.inp, height:78, resize:'vertical' }} value={eForm.description} onChange={e => setEForm(f => ({...f, description:e.target.value}))} />
            </div>
            {/* ── MARKET VISIBILITY (full-width, improved) ── */}
            <div style={{ gridColumn:'1/-1' }}>
              <label style={{ ...S.lbl, marginBottom:10 }}>Market Visibility *</label>
              <MarketPicker value={eForm.isLocal} onChange={v => setEForm(f => ({...f, isLocal:v}))} darkMode={themeMode === 'dark'} />
            </div>
          </div>
        </div>
        <div className="admin-modal-footer" style={S.mFoot}>
          <button style={S.ghostBtn} onClick={() => setEditP(null)}>Cancel</button>
          <button className="admin-green-button" style={S.greenBtn} onClick={handleEditSave} disabled={eSaving}>
            {eSaving ? '⏳ Saving…' : '💾 Save Changes'}
          </button>
        </div>
      </div>
    </div>
  );
}
