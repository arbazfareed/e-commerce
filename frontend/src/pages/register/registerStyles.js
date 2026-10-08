export default {
  page: {
    minHeight:'100vh',
    background:'linear-gradient(145deg,#f7f4eb 0%,#f1f8f3 52%,#eef5f1 100%)',
    display:'flex', alignItems:'center', justifyContent:'center',
    padding:'24px', fontFamily:"'DM Sans','Segoe UI',sans-serif",
    position:'relative', overflow:'hidden',
  },
  blob1: {
    position:'fixed', width:'500px', height:'500px', borderRadius:'50%',
    background:'radial-gradient(circle,rgba(16,185,129,0.07),transparent 70%)',
    top:'-150px', right:'-80px', pointerEvents:'none',
  },
  blob2: {
    position:'fixed', width:'400px', height:'400px', borderRadius:'50%',
    background:'radial-gradient(circle,rgba(99,102,241,0.06),transparent 70%)',
    bottom:'-120px', left:'-80px', pointerEvents:'none',
  },
  card: {
    background:'#fff', borderRadius:0, padding:'40px 36px',
    width:'100%', maxWidth:'480px',
    boxShadow:'none',
    border:'1px solid rgba(16,185,129,0.10)',
    position:'relative', zIndex:1,
    animation:'fadeIn 0.4s ease',
  },
  header:  { display:'flex', alignItems:'center', gap:'14px', marginBottom:'24px' },
  brand:    { margin:0, fontSize:'22px', fontWeight:'900', color:'#0f172a', letterSpacing:'-0.5px' },
  brandSub: { margin:'2px 0 0', fontSize:'13px', color:'#64748b' },

  /* Step indicator */
  stepRow: {
    display:'flex', alignItems:'center', gap:'8px',
    marginBottom:'28px', position:'relative',
  },
  stepItem:  { display:'flex', alignItems:'center', gap:'6px', zIndex:1 },
  stepDot: {
    width:'26px', height:'26px', borderRadius:'50%',
    display:'flex', alignItems:'center', justifyContent:'center',
    fontSize:'12px', fontWeight:'800', transition:'all 0.3s',
  },
  stepLabel: { fontSize:'11px', fontWeight:'700', whiteSpace:'nowrap', transition:'color 0.3s' },
  stepLine: {
    flex:1, height:'3px', background:'#e2e8f0',
    borderRadius:'4px', position:'relative', overflow:'hidden',
  },
  stepLineFill: {
    position:'absolute', top:0, left:0, height:'100%',
    background:'#10b981', borderRadius:'4px', transition:'width 0.4s ease',
  },

  errBox: {
    background:'#fef2f2', border:'1px solid #fecaca', color:'#dc2626',
    padding:'11px 14px', borderRadius:'12px', fontSize:'13px', fontWeight:'600',
    marginBottom:'20px', display:'flex', alignItems:'center', gap:'8px',
  },

  fg:     { marginBottom:'16px' },
  twoCol: { display:'grid', gridTemplateColumns:'1fr 1fr', gap:'12px' },
  lbl:    {
    display:'block', fontSize:'10px', fontWeight:'800', color:'#40594a',
    marginBottom:'8px', letterSpacing:'0.7px', textTransform:'uppercase',
  },
  optTag: { color:'#94a3b8', fontWeight:'500', marginLeft:'6px', fontSize:'11px' },
  inp: {
    width:'100%', minHeight:'50px', padding:'13px 15px', border:'1px solid #d8e5dc',
    borderRadius:'13px', fontSize:'14px', boxSizing:'border-box',
    color:'#18372a', background:'linear-gradient(180deg,#ffffff 0%,#f9fcfa 100%)',
    boxShadow:'0 1px 2px rgba(10,61,47,.035)',
    fontFamily:"'DM Sans','Segoe UI',sans-serif", fontWeight:'500',
  },
  infoBadge: {
    borderRadius:'12px', padding:'11px 14px',
    marginBottom:'14px', fontSize:'13px', fontWeight:'600',
  },
  btn: {
    width:'100%', padding:'14px',
    background:'linear-gradient(135deg,#10b981,#059669)',
    color:'#fff', border:'none', borderRadius:'13px',
    fontSize:'15px', fontWeight:'700', cursor:'pointer',
    fontFamily:"'DM Sans',sans-serif",
    boxShadow:'0 6px 20px rgba(16,185,129,0.3)',
  },
  backBtn: {
    padding:'14px 20px', background:'#f8fafc',
    color:'#475569', border:'1.5px solid #e2e8f0',
    borderRadius:'13px', fontSize:'15px', fontWeight:'700',
    cursor:'pointer', fontFamily:"'DM Sans',sans-serif",
    whiteSpace:'nowrap',
  },
  spinner: {
    width:'14px', height:'14px',
    border:'2px solid rgba(255,255,255,0.4)',
    borderTop:'2px solid #fff', borderRadius:'50%',
    display:'inline-block', animation:'spin 0.7s linear infinite',
  },
  footer: { textAlign:'center', marginTop:'22px', fontSize:'13px', color:'#64748b' },
  link:   { color:'#10b981', fontWeight:'700', textDecoration:'none' },
};
