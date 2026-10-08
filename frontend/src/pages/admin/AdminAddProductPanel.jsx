export default function AdminAddProductPanel({
  CATEGORY_TREE,
  CategoryPicker,
  ImagePicker,
  MarketPicker,
  S,
  cats,
  fileRef,
  form,
  formatPKR,
  formatUSD,
  getDiscountedPrice,
  handleAdd,
  newCat,
  newDiscountNow,
  pickImgs,
  pkrToUSD,
  previews,
  removeImg,
  saving,
  setForm,
  setNewCat,
  themeMode
}) {
  return (
    <div style={{ animation:'fadeUp .35s ease' }}>
      <div style={S.pgTop}>
        <div>
          <h1 style={S.pgTitle}>Add New Product</h1>
          <p style={S.pgSub}>Fill all required (*) fields · USD auto-calculates from PKR</p>
        </div>
      </div>

      <div style={{ display:'grid', gridTemplateColumns:'minmax(0, 1.6fr) minmax(260px, 0.75fr)', gap:22, alignItems:'start' }}>
        <div style={{
          ...S.card,
          background: themeMode === 'dark' ? 'linear-gradient(180deg, rgba(15,23,42,0.98), rgba(9,17,21,0.96))' : 'linear-gradient(135deg, rgba(255,255,255,0.88), rgba(255,255,255,0.74))',
          borderColor: themeMode === 'dark' ? 'rgba(148,163,184,0.18)' : 'rgba(148,163,184,0.18)',
          boxShadow: themeMode === 'dark' ? '0 18px 40px rgba(2,6,23,0.32)' : '0 16px 38px rgba(15,23,42,.08)',
          color: themeMode === 'dark' ? '#e2e8f0' : '#1e293b',
          padding: 28,
        }}>
          <form onSubmit={handleAdd} style={{ display:'grid', gap:18 }}>
            <div>
              <label style={S.lbl}>Product Name *</label>
              <input style={S.inp} placeholder="e.g. Multan Blue Pottery Vase" value={form.name} onChange={e => setForm(f=>({...f,name:e.target.value}))} required autoComplete='off' />
            </div>

            <div>
              <label style={S.lbl}>
                Category *{newCat && <span style={{ color:'#10b981', fontWeight:500, fontSize:10, textTransform:'none', letterSpacing:0 }}>{' '}— new category</span>}
              </label>
              <CategoryPicker value={form.category} onChange={v => setForm(f=>({...f,category:v,subcategory:''}))} isNew={newCat} setIsNew={setNewCat} categories={[...new Set([...cats, ...Object.keys(CATEGORY_TREE)])].sort()} inputStyle={S.inp} buttonStyle={S.ghostBtn} />
              {cats.length === 0 && !newCat && (
                <p style={{ margin:'6px 0 0', fontSize:11, color:'#f59e0b', fontWeight:600 }}>⚠️ No categories yet — click "+ New" to create your first one.</p>
              )}
            </div>

            <div style={{ display:'grid', gridTemplateColumns:'repeat(3, minmax(0, 1fr))', gap:14 }}>
              <div>
                <label style={S.lbl}>Subcategory</label>
                <input list="subcategory-options" style={S.inp} placeholder="e.g. Laptops or Handmade" value={form.subcategory} onChange={e => setForm(f=>({...f,subcategory:e.target.value}))} />
                <datalist id="subcategory-options">{(CATEGORY_TREE[form.category] || []).map(v => <option key={v} value={v} />)}</datalist>
              </div>
              <div>
                <label style={S.lbl}>Colours <span style={S.optional}>optional</span></label>
                <input style={S.inp} placeholder="Black, Silver, Blue" value={form.colors} onChange={e => setForm(f=>({...f,colors:e.target.value}))} />
              </div>
              <div>
                <label style={S.lbl}>Sizes / Variants <span style={S.optional}>optional</span></label>
                <input style={S.inp} placeholder="Small, Medium, Large" value={form.sizes} onChange={e => setForm(f=>({...f,sizes:e.target.value}))} />
              </div>
            </div>

            <div style={{ display:'grid', gridTemplateColumns:'repeat(2, minmax(0, 1fr))', gap:14 }}>
              <div>
                <label style={S.lbl}>Brand</label>
                <input style={S.inp} placeholder="e.g. HP, Lenovo" value={form.brand} onChange={e => setForm(f=>({...f,brand:e.target.value}))} />
              </div>
              <div>
                <label style={S.lbl}>Model / Edition</label>
                <input style={S.inp} placeholder="e.g. Pavilion 15" value={form.model} onChange={e => setForm(f=>({...f,model:e.target.value}))} />
              </div>
            </div>

            <label className="admin-visibility-toggle" style={{ ...S.visibilityToggle, marginBottom:0 }}>
              <input type="checkbox" checked={form.isVisible} onChange={e => setForm(f=>({...f,isVisible:e.target.checked}))} />
              <span><strong>Show this product in the shop</strong><small>Turn off to save it as hidden without deleting it.</small></span>
            </label>

            <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:16 }}>
              <div>
                <label style={S.lbl}>🇵🇰 Price PKR *</label>
                <div style={{ position:'relative' }}>
                  <span style={S.pre}>Rs</span>
                  <input style={{ ...S.inp, paddingLeft:36 }} type="number" min="0" placeholder="0" value={form.pricePKR}
                    onChange={e => {
                      const pkr = e.target.value;
                      const usd = pkr ? pkrToUSD(pkr) : '';
                      setForm(f=>({...f, pricePKR:pkr, priceUSD: usd !== '' ? String(usd) : f.priceUSD}));
                    }} required />
                </div>
              </div>
              <div>
                <label style={S.lbl}>🌍 Price USD <span style={{ color:'#10b981', fontWeight:500, fontSize:10, textTransform:'none', letterSpacing:0 }}>(auto)</span></label>
                <div style={{ position:'relative' }}>
                  <span style={S.pre}>$</span>
                  <input style={{ ...S.inp, paddingLeft:28 }} type="number" min="0" step="0.01" placeholder="0.00" value={form.priceUSD} onChange={e => setForm(f=>({...f,priceUSD:e.target.value}))} required />
                </div>
              </div>
            </div>

            <div className="admin-discount-editor" style={{ display:'grid', gap:12, marginTop:4 }}>
              <div>
                <label style={S.lbl}>🏷️ Discount (%)</label>
                <input style={S.inp} type="number" min="0" max="100" step="1" value={form.discountPercent ?? 0}
                  onChange={e => setForm(f => ({ ...f, discountPercent:Math.min(100, Math.max(0, Number(e.target.value) || 0)) }))} />
                <small style={{ display:'block', marginTop:6, color:'#94a3b8' }}>Optional · set 0 for no discount.</small>
              </div>
              <div className="admin-discount-dates" style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:12 }}>
                <div>
                  <label style={S.lbl}>Starts on</label>
                  <input style={S.inp} type="date" value={form.discountStartDate || ''} onChange={e => setForm(f => ({ ...f, discountStartDate:e.target.value }))} />
                </div>
                <div>
                  <label style={S.lbl}>Ends on</label>
                  <input style={S.inp} type="date" value={form.discountEndDate || ''} onChange={e => setForm(f => ({ ...f, discountEndDate:e.target.value }))} />
                </div>
              </div>
              <div className="admin-discount-preview" style={{ display:'flex', justifyContent:'space-between', gap:12, padding:'10px 12px', borderRadius:12, background: themeMode === 'dark' ? 'rgba(15,23,42,0.7)' : '#f8fafc', border:'1px solid rgba(148,163,184,0.18)', flexWrap:'wrap' }}>
                <span style={{ fontSize:12, color: themeMode === 'dark' ? '#d1fae5' : '#166534', fontWeight:700 }}>{newDiscountNow > 0 ? `${newDiscountNow}% OFF · Active now` : Number(form.discountPercent) > 0 ? 'Promotion scheduled or expired' : 'No discount applied'}</span>
                {newDiscountNow > 0 && <strong style={{ fontSize:12, color: themeMode === 'dark' ? '#f8fafc' : '#0f172a' }}>{formatPKR(getDiscountedPrice(form.pricePKR, newDiscountNow, 'PKR'))} <i>·</i> {formatUSD(getDiscountedPrice(form.priceUSD, newDiscountNow, 'USD'))}</strong>}
              </div>
            </div>

            <div>
              <label style={S.lbl}>Stock Quantity *</label>
              <input style={S.inp} type="number" min="0" placeholder="0" value={form.stock} onChange={e => setForm(f=>({...f,stock:e.target.value}))} required />
            </div>

            <div>
              <label style={S.lbl}>⚖️ Weight (kg) <span style={{ color:'#94a3b8', fontWeight:400, fontSize:10, textTransform:'none', letterSpacing:0 }}>(optional)</span></label>
              <div style={{ position:'relative' }}>
                <span style={{ position:'absolute', left:10, top:'50%', transform:'translateY(-50%)', fontSize:11, color:'#94a3b8', fontWeight:700 }}>kg</span>
                <input style={{ ...S.inp, paddingLeft:30 }} type="number" min="0" step="0.1" placeholder="Leave blank for weightless items (glasses, etc.)" value={form.weightKg} onChange={e => setForm(f=>({...f,weightKg:e.target.value}))} />
              </div>
              <p style={{ margin:'6px 0 0', fontSize:10, color:'#94a3b8', lineHeight:1.5 }}>Items with no weight (glasses, accessories, digital) skip the per-kg shipping charge — only the flat base rate applies.</p>
            </div>

            <div>
              <label style={S.lbl}>Description</label>
              <textarea style={{ ...S.inp, height:90, resize:'vertical' }} placeholder="Describe this product clearly…" value={form.description} onChange={e => setForm(f=>({...f,description:e.target.value}))} />
            </div>

            <div>
              <label style={{ ...S.lbl, marginBottom:10 }}>Market Visibility *</label>
              <MarketPicker value={form.isLocal} onChange={v => setForm(f=>({...f,isLocal:v}))} darkMode={themeMode === 'dark'} />
            </div>

            <button className="admin-add-product-submit admin-green-button" type="submit" style={{ ...S.greenBtn, width:'100%', padding:15, fontSize:14 }} disabled={saving}>
              {saving ? '⏳ Publishing…' : '+ Publish Product'}
            </button>
          </form>
        </div>

        <div>
          <div style={{
            ...S.card,
            background: themeMode === 'dark' ? 'linear-gradient(180deg, rgba(15,23,42,0.98), rgba(9,17,21,0.96))' : 'linear-gradient(135deg, rgba(255,255,255,0.88), rgba(255,255,255,0.74))',
            borderColor: themeMode === 'dark' ? 'rgba(148,163,184,0.18)' : 'rgba(148,163,184,0.18)',
            boxShadow: themeMode === 'dark' ? '0 18px 40px rgba(2,6,23,0.32)' : '0 16px 38px rgba(15,23,42,.08)',
            padding: 22,
          }}>
            <h4 style={{ ...S.cardH, marginBottom:16, color: themeMode === 'dark' ? '#e2e8f0' : '#1e293b' }}>Product Photos</h4>
            <ImagePicker previews={previews} onPick={f => pickImgs(f, false)} onRemove={i => removeImg(i, false)} inputRef={fileRef} darkMode={themeMode === 'dark'} />
          </div>
          <div style={{
            ...S.card,
            background: themeMode === 'dark' ? 'linear-gradient(135deg, rgba(6,95,70,0.18), rgba(15,23,42,0.92))' : 'linear-gradient(135deg,#f0fdf4,#ecfdf5)',
            border: themeMode === 'dark' ? '1px solid rgba(110,231,183,0.22)' : '1px solid #bbf7d0',
            marginTop:16,
            padding: 22,
          }}>
            <p style={{ margin:'0 0 12px', fontSize:10, fontWeight:800, color: themeMode === 'dark' ? '#a7f3d0' : '#065f46', letterSpacing:'1px', textTransform:'uppercase' }}>💡 Tips</p>
            <ul style={{ margin:0, paddingLeft:18, fontSize:12, color: themeMode === 'dark' ? '#d1fae5' : '#166534', lineHeight:2.1, fontWeight:500 }}>
              <li>First photo = main display image</li>
              <li>Upload up to <strong>5 photos</strong></li>
              <li>Type PKR → USD auto-fills</li>
              <li><strong>Global</strong> = all customers see it</li>
              <li><strong>Local</strong> = Pakistan mode only</li>
              <li>Stock &lt;5 shows low-stock warning</li>
            </ul>
          </div>
        </div>
      </div>
    </div>
  );
}
