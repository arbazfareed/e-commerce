export default function AdminLowStockPanel({
  S,
  lowStockProducts,
  openEdit,
  openSection,
  themeMode
}) {
  return (
    <section aria-labelledby="low-stock-heading" style={{ ...S.card, marginBottom:20, background:themeMode === 'dark' ? 'linear-gradient(180deg,#231e13,#111827)' : 'linear-gradient(135deg,#fffbeb,#fff)', borderColor:themeMode === 'dark' ? '#66512b' : '#f3d08a', boxShadow:themeMode === 'dark' ? '0 12px 28px rgba(0,0,0,.22)' : '0 12px 28px rgba(120,83,12,.06)' }}>
      <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center', gap:12, flexWrap:'wrap', marginBottom:lowStockProducts.length ? 12 : 0 }}>
        <div><h3 id="low-stock-heading" style={{ ...S.cardH, color:themeMode === 'dark' ? '#fde68a' : '#854d0e' }}>⚠️ Low-stock alerts</h3><p style={{ margin:'4px 0 0', color:themeMode === 'dark' ? '#d8c9a3' : '#92400e', fontSize:12 }}>Visible products with fewer than 5 units remaining.</p></div>
        <span style={{ borderRadius:999, padding:'6px 10px', background:themeMode === 'dark' ? '#48391e' : '#fef3c7', color:themeMode === 'dark' ? '#fde68a' : '#92400e', fontSize:12, fontWeight:900 }}>{lowStockProducts.length} need attention</span>
      </div>
      {lowStockProducts.length === 0 ? <p style={{ margin:0, color:themeMode === 'dark' ? '#b9c7bf' : '#64748b', fontSize:13 }}>All visible products have at least 5 units in stock.</p> : <div style={{ display:'grid', gap:8 }}>
        {lowStockProducts.slice(0, 8).map(product => <div key={product._id} style={{ display:'flex', justifyContent:'space-between', alignItems:'center', gap:12, flexWrap:'wrap', padding:'9px 11px', borderRadius:10, background:themeMode === 'dark' ? 'rgba(15,23,42,.55)' : '#fff', border:`1px solid ${themeMode === 'dark' ? '#55472c' : '#f3e2b5'}` }}>
          <div style={{ minWidth:0 }}><strong style={{ color:themeMode === 'dark' ? '#f8fafc' : '#1e293b', fontSize:13 }}>{product.name}</strong><span style={{ display:'block', marginTop:3, color:themeMode === 'dark' ? '#cbd5e1' : '#64748b', fontSize:11 }}>{product.category} · {Number(product.stock) > 0 ? `${product.stock} left` : 'Out of stock'}</span></div>
          <button type="button" onClick={() => openEdit(product)} style={{ border:'1px solid #d6a851', borderRadius:8, padding:'7px 10px', background:themeMode === 'dark' ? '#40331b' : '#fffbeb', color:themeMode === 'dark' ? '#fde68a' : '#854d0e', fontSize:11, fontWeight:800, cursor:'pointer' }}>Update stock</button>
        </div>)}
        {lowStockProducts.length > 8 && <p style={{ margin:'2px 0 0', color:themeMode === 'dark' ? '#cbd5e1' : '#64748b', fontSize:11 }}>Showing 8 of {lowStockProducts.length}. <button type="button" onClick={() => openSection('products')} style={{ border:0, background:'none', color:themeMode === 'dark' ? '#a7f3d0' : '#047857', fontWeight:800, cursor:'pointer' }}>View all products</button></p>}
      </div>}
    </section>
  );
}
