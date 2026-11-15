export const S = {
  root:      { display:'flex', minHeight:'100vh', background:'#f5f7f5', fontFamily:"'DM Sans','Segoe UI',sans-serif" },
  centered:  { display:'flex', flexDirection:'column', alignItems:'center', justifyContent:'center', minHeight:'100vh', background:'var(--page, #f5faf6)' },
  spinRing:  { width:40, height:40, border:'3px solid #e2e8f0', borderTop:'3px solid #10b981', borderRadius:'50%', animation:'spin .8s linear infinite' },

  side:      { width:226, minHeight:'100vh', background:'linear-gradient(180deg, rgba(6,20,17,0.98) 0%, rgba(10,26,22,0.98) 100%)', display:'flex', flexDirection:'column', flexShrink:0, position:'sticky', top:0, height:'100vh', overflowY:'auto', borderRight:'1px solid rgba(145,175,163,0.12)', boxShadow:'inset -1px 0 0 rgba(255,255,255,0.04), 0 18px 38px rgba(2,6,23,0.18)' },
  sideLogo:  { display:'flex', alignItems:'center', gap:12, padding:'24px 18px 18px', borderBottom:'1px solid rgba(255,255,255,.06)' },
  navBtn:    { display:'flex', alignItems:'center', gap:10, width:'100%', padding:'11px 18px', background:'none', border:'none', color:'#ecfeff', fontSize:13, fontWeight:700, cursor:'pointer', transition:'all .15s', outline:'none', borderLeft:'3px solid transparent', letterSpacing:'.15px', fontFamily:"'DM Sans','Segoe UI',sans-serif" },
  navOn:     { background:'linear-gradient(90deg, rgba(25,82,68,.46), rgba(16,185,129,.15))', color:'#f8fffb', fontWeight:900, borderLeft:'3px solid #7fe0bd', boxShadow:'inset 0 0 0 1px rgba(167,243,208,.18), 0 12px 24px rgba(16,185,129,.12)' },
  navBadge:  { marginLeft:'auto', borderRadius:999, fontSize:10, fontWeight:900, padding:'2px 8px', minWidth:20, textAlign:'center', boxShadow:'inset 0 0 0 1px rgba(255,255,255,.12)' },
  miniStats: { display:'flex', justifyContent:'space-around', padding:'16px 18px', borderTop:'1px solid rgba(255,255,255,.06)', borderBottom:'1px solid rgba(255,255,255,.06)' },
  sideUser:  { padding:'16px 18px', display:'flex', alignItems:'center', gap:10, borderTop:'1px solid rgba(255,255,255,.06)', marginTop:'auto', background:'rgba(15,23,42,.12)' },
  ava:       { width:34, height:34, borderRadius:'50%', background:'linear-gradient(135deg,#34d399,#0d5c42)', display:'flex', alignItems:'center', justifyContent:'center', fontSize:13, fontWeight:800, color:'#fff', flexShrink:0, boxShadow:'0 6px 14px rgba(16,185,129,.28)' },
  logoutBtn: { background:'rgba(255,255,255,.04)', border:'1px solid rgba(255,255,255,.16)', color:'#d1fae5', borderRadius:7, width:30, height:30, cursor:'pointer', fontSize:14, display:'flex', alignItems:'center', justifyContent:'center', flexShrink:0 },

  main: { flex:1, padding:'32px 36px', width:'100%', maxWidth:'100%', minWidth:0, minHeight:'100vh', overflowX:'hidden', color:'#20392e', background:'#f6f4ee', boxSizing:'border-box' },
  pgTop:     { display:'flex', justifyContent:'space-between', alignItems:'flex-start', marginBottom:24, flexWrap:'wrap', gap:14 },
  pgTitle: { margin:0, fontSize:32, fontWeight:600, color:'var(--ink, #10261c)', letterSpacing:'-0.6px', fontFamily:"'Fraunces','Georgia',serif", lineHeight:1.1 },
  pgSub: { margin:'8px 0 0', fontSize:13.5, color:'#5f6f67', fontWeight:500 },

  card: { background:'#fff', borderRadius:20, padding:24, boxShadow:'0 1px 2px rgba(16,38,28,.04), 0 18px 40px -30px rgba(16,38,28,.35)', border:'1px solid rgba(16,38,28,.08)', marginBottom:20, transition:'box-shadow .25s ease' },
  cardH: { margin:0, fontSize:16, fontWeight:600, color:'#10261c', fontFamily:"'Fraunces','Georgia',serif", letterSpacing:'-0.2px' },
  linkBtn:   { background:'none', border:'none', color:'var(--brand-dark, #0d5c42)', fontSize:12, fontWeight:700, cursor:'pointer', fontFamily:"'DM Sans','Segoe UI',sans-serif" },
  emptyState:{ textAlign:'center', padding:'60px 20px', color:'#94a3b8' },

  searchBox: { flex:1, minWidth:220, padding:'11px 16px', border:'1px solid rgba(16,38,28,.14)', borderRadius:12, fontSize:13, background:'#fff', outline:'none', fontFamily:"'DM Sans','Segoe UI',sans-serif", fontWeight:500, color:'#1e293b' },
  sel: { padding:'11px 14px', border:'1px solid rgba(16,38,28,.14)', borderRadius:12, fontSize:13, background:'#fff', cursor:'pointer', outline:'none', fontFamily:"'DM Sans','Segoe UI',sans-serif", fontWeight:600, color:'#2f4339' },

  tbl:  { width:'100%', borderCollapse:'collapse', fontSize:13 },
  th: { textAlign:'left', padding:'12px 14px', borderBottom:'1px solid rgba(16,38,28,0.10)', background:'#f7f5ef', color:'#6b7a73', fontWeight:800, fontSize:10.5, textTransform:'uppercase', letterSpacing:'.9px', whiteSpace:'nowrap', fontFamily:"'DM Sans','Segoe UI',sans-serif" },
  td: { padding:'14px 14px', borderBottom:'1px solid rgba(16,38,28,0.07)', verticalAlign:'middle', color:'#2f4339' },

  catTag: { background:'#f3efe6', color:'#5c4a2c', padding:'3px 10px', borderRadius:999, fontSize:11, fontWeight:700, fontFamily:"'DM Sans','Segoe UI',sans-serif" },

  editBtn: { background:'#ffffff', border:'1px solid rgba(16,38,28,.14)', color:'#0b3d2e', borderRadius:10, padding:'7px 12px', fontSize:12, cursor:'pointer', fontWeight:800, marginRight:6, transition:'background .15s, transform .15s', fontFamily:"'DM Sans','Segoe UI',sans-serif" },
  deleteBtn: { background:'#fff5f5', border:'1px solid #fecaca', color:'#ef4444', borderRadius:10, padding:'7px 10px', fontSize:12, cursor:'pointer', fontWeight:800, transition:'background .15s, transform .15s', boxShadow:'inset 0 0 0 1px rgba(254,202,202,0.12)' },

  greenBtn: { background:'linear-gradient(135deg,#0f5a43,#0b3d2e)', color:'#ffffff', border:'1px solid rgba(11,61,46,0.6)', borderRadius:12, padding:'11px 22px', fontSize:13, fontWeight:800, cursor:'pointer', letterSpacing:'.2px', fontFamily:"'DM Sans','Segoe UI',sans-serif", boxShadow:'0 12px 24px -12px rgba(11,61,46,.7), inset 0 1px 0 rgba(255,255,255,.12)' },
  ghostBtn: { background:'#ffffff', border:'1px solid rgba(16,38,28,.14)', color:'#2f4339', borderRadius:12, padding:'10px 16px', fontSize:12.5, fontWeight:700, cursor:'pointer', whiteSpace:'nowrap', fontFamily:"'DM Sans','Segoe UI',sans-serif" },

  lbl:  { display:'block', fontSize:10, fontWeight:800, color:'#64748b', marginBottom:7, letterSpacing:'.8px', textTransform:'uppercase', fontFamily:"'Sora',sans-serif" },
  optional: { color:'#94a3b8', fontWeight:500, textTransform:'none', letterSpacing:0 },
  visibilityToggle: { display:'flex', alignItems:'flex-start', gap:10, padding:'12px 14px', marginBottom:18, border:'1px solid #bbf7d0', borderRadius:12, background:'#f0fdf4', color:'#166534', cursor:'pointer' },
  inp: { padding:'11px 13px', border:'1px solid rgba(16,38,28,.16)', borderRadius:12, fontSize:13, background:'#fff', outline:'none', boxSizing:'border-box', width:'100%', color:'#1e293b', fontFamily:"'DM Sans','Segoe UI',sans-serif", fontWeight:500, transition:'border-color .15s, box-shadow .15s' },
  pre:  { position:'absolute', left:12, top:'50%', transform:'translateY(-50%)', fontSize:11, fontWeight:800, color:'#94a3b8', pointerEvents:'none', zIndex:2, fontFamily:"'Sora',sans-serif", userSelect:'none' },

  grid2:     { display:'grid', gridTemplateColumns:'1fr 1fr', gap:16 },

  overlay:   { position:'fixed', inset:0, background:'rgba(2,6,23,.65)', display:'flex', alignItems:'center', justifyContent:'center', zIndex:1000, padding:20, backdropFilter:'blur(4px)' },
  modal:     { background:'#fff', borderRadius:22, width:'100%', maxWidth:640, maxHeight:'92vh', overflow:'hidden', display:'flex', flexDirection:'column', boxShadow:'0 32px 80px rgba(0,0,0,.4)' },
  mHead:     { display:'flex', justifyContent:'space-between', alignItems:'center', padding:'22px 26px', borderBottom:'1px solid #f1f5f9' },
  mBody:     { padding:'24px 26px', overflowY:'auto', flex:1 },
  mFoot:     { padding:'18px 26px', borderTop:'1px solid #f1f5f9', display:'flex', justifyContent:'flex-end', gap:10, background:'#fafbfc' },
  closeX:    { background:'#f1f5f9', border:'none', borderRadius:9, width:34, height:34, cursor:'pointer', fontSize:13, color:'#475569', fontWeight:800, display:'flex', alignItems:'center', justifyContent:'center' },
};
