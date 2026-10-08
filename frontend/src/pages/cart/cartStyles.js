export const S = {
  page:    { minHeight:'100vh', background:'#f8fafc', padding:'28px 20px', fontFamily:"'DM Sans','Segoe UI',sans-serif" },
  topBar:  { maxWidth:'1040px', margin:'0 auto 24px', display:'flex', justifyContent:'space-between', alignItems:'flex-start', flexWrap:'wrap', gap:'14px' },
  layout:  { maxWidth:'1040px', margin:'0 auto', display:'flex', gap:'24px', alignItems:'flex-start', flexWrap:'wrap' },

  card:    { background:'#fff', borderRadius:'16px', padding:'24px', border:'1px solid #e2e8f0', boxShadow:'0 1px 4px rgba(0,0,0,0.05)', flex:1, minWidth:'280px' },
  itemImgBox: { width:'72px', height:'72px', borderRadius:'12px', overflow:'hidden', flexShrink:0, border:'1px solid #e2e8f0', background:'#f8fafc', position:'relative' },
  itemImgPh:  { width:'100%', height:'100%', display:'flex', alignItems:'center', justifyContent:'center', fontSize:'24px', fontWeight:'900', color:'#10b981', background:'linear-gradient(135deg,#f0fdf4,#dcfce7)' },

  qtyBox:  { display:'flex', alignItems:'center', border:'1px solid #e2e8f0', borderRadius:'10px', overflow:'hidden' },
  qtyBtn:  { background:'#f8fafc', border:'none', width:'34px', height:'36px', cursor:'pointer', fontSize:'18px', color:'#334155', fontWeight:'700', display:'flex', alignItems:'center', justifyContent:'center', flexShrink:0 },
  qtyNum:  { padding:'0 14px', fontWeight:'800', fontSize:'15px', color:'#1e293b', minWidth:'32px', textAlign:'center', userSelect:'none' },

  summary: { width:'290px', flexShrink:0, background:'#fff', borderRadius:'16px', padding:'24px', border:'1px solid #e2e8f0', boxShadow:'0 1px 4px rgba(0,0,0,0.05)', position:'sticky', top:'80px' },
  secTitle:{ margin:'0 0 18px', fontSize:'16px', fontWeight:'800', color:'#1e293b' },
  divider: { height:'1px', background:'#f1f5f9', margin:'12px 0 14px' },
  sumRow:  { display:'flex', justifyContent:'space-between', alignItems:'flex-start', marginBottom:'12px' },
  sumLbl:  { fontSize:'13px', color:'#64748b', lineHeight:'1.5' },
  sumVal:  { fontSize:'14px', fontWeight:'700', color:'#334155' },

  lbl:     { display:'block', fontSize:'12px', fontWeight:'800', color:'#475569', marginBottom:'6px', textTransform:'uppercase', letterSpacing:'0.3px' },
  inp:     { width:'100%', padding:'11px 13px', border:'1.5px solid #e2e8f0', borderRadius:'10px', fontSize:'13px', outline:'none', boxSizing:'border-box', background:'#f8fafc', color:'#1e293b', fontFamily:'inherit', marginBottom:'0' },
  errBox:  { background:'#fef2f2', border:'1px solid #fecaca', color:'#dc2626', padding:'10px 14px', borderRadius:'10px', fontSize:'13px', fontWeight:'600', marginBottom:'16px' },
  payOpt:  { display:'flex', alignItems:'center', gap:'10px', padding:'12px', border:'2px solid #e2e8f0', borderRadius:'12px', cursor:'pointer', transition:'all 0.15s', userSelect:'none' },
  payOn:   { borderColor:'#10b981', background:'#f0fdf4' },

  greenBtn: { display:'inline-flex', alignItems:'center', justifyContent:'center', padding:'13px 24px', background:'linear-gradient(135deg,#10b981,#059669)', color:'#fff', border:'none', borderRadius:'12px', fontSize:'14px', fontWeight:'700', cursor:'pointer', textDecoration:'none', boxSizing:'border-box', letterSpacing:'0.2px' },
  ghostBtn: { display:'inline-flex', alignItems:'center', justifyContent:'center', padding:'13px 24px', background:'#f1f5f9', color:'#475569', border:'1px solid #e2e8f0', borderRadius:'12px', fontSize:'14px', fontWeight:'600', cursor:'pointer', textDecoration:'none', boxSizing:'border-box' },

  successCard: { maxWidth:'500px', margin:'60px auto 0', background:'#fff', borderRadius:'22px', padding:'52px 40px', textAlign:'center', border:'1px solid #e2e8f0', boxShadow:'0 8px 48px rgba(0,0,0,0.08)' },
  emptyCard:   { maxWidth:'400px', margin:'80px auto 0', background:'#fff', borderRadius:'22px', padding:'52px 36px', textAlign:'center', border:'1px solid #e2e8f0', boxShadow:'0 4px 24px rgba(0,0,0,0.07)' },
};
