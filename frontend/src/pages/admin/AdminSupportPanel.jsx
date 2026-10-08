export default function AdminSupportPanel({
  S,
  TicketCard,
  changeTicketStatus,
  refreshTickets,
  saveTicketReply,
  search,
  setSearch,
  setTicketFilter,
  themeMode,
  ticketFilter,
  tickets
}) {
  return (
    <div style={{ animation:'fadeUp .35s ease' }}>
      <div style={S.pgTop}>
        <div>
          <h1 style={S.pgTitle}>🎧 Support Tickets</h1>
          <p style={S.pgSub}>Customer support requests · {tickets.filter(t=>t.status==='Open').length} open · {tickets.filter(t=>t.status==='Resolved').length} resolved</p>
        </div>
        <button className="admin-green-button" style={S.greenBtn} onClick={refreshTickets}>
          🔄 Refresh
        </button>
      </div>

      {/* KPI row */}
      <div style={{ display:'grid', gridTemplateColumns:'repeat(3,1fr)', gap:14, marginBottom:22 }}>
        {[
          { label:'Total Tickets', val: tickets.length,                                color:'#c7d2fe', bg: themeMode === 'dark' ? 'linear-gradient(135deg, rgba(30,41,59,0.96), rgba(17,24,39,0.96))' : '#eef2ff', border: themeMode === 'dark' ? '#3f4a62' : '#c7d2fe', icon:'🗂️' },
          { label:'Open',          val: tickets.filter(t=>t.status==='Open').length,     color:'#ffe0b5', bg: themeMode === 'dark' ? 'linear-gradient(135deg, rgba(62,45,25,0.96), rgba(35,26,14,0.96))' : '#fffbeb', border: themeMode === 'dark' ? '#7b5b3d' : '#fde68a', icon:'🟡' },
          { label:'Resolved',      val: tickets.filter(t=>t.status==='Resolved').length, color:'#a7f3d0', bg: themeMode === 'dark' ? 'linear-gradient(135deg, rgba(19,59,46,0.96), rgba(11,31,26,0.96))' : '#f0fdf4', border: themeMode === 'dark' ? '#3d7661' : '#bbf7d0', icon:'✅' },
        ].map(k => (
          <div key={k.label} style={{
            background:k.bg,
            border:`1.5px solid ${k.border}`,
            borderRadius:14,
            padding:'16px 20px',
            display:'flex',
            justifyContent:'space-between',
            alignItems:'center',
            boxShadow: themeMode === 'dark' ? '0 10px 24px rgba(0,0,0,0.18)' : '0 2px 8px rgba(15,23,42,0.05)',
          }}>
            <div>
              <p style={{ margin:'0 0 4px', fontSize:10, fontWeight:700, color:k.color, textTransform:'uppercase', letterSpacing:'1px', fontFamily:"'Sora',sans-serif" }}>{k.label}</p>
              <p style={{ margin:0, fontSize:28, fontWeight:900, color: themeMode === 'dark' ? '#f8fbfa' : k.color, lineHeight:1, fontFamily:"'Sora',sans-serif" }}>{k.val}</p>
            </div>
            <span style={{ fontSize:24 }}>{k.icon}</span>
          </div>
        ))}
      </div>

      {/* Filter pills + search */}
      <div style={{ display:'flex', gap:'10px', marginBottom:'18px', flexWrap:'wrap', alignItems:'center' }}>
        <div style={{ display:'flex', gap:6 }}>
          {['All','Open','Resolved'].map(f => {
            const isDark = themeMode === 'dark';
            const isActive = ticketFilter === f;
            const activeBg = f === 'Open' ? (isDark ? '#3d2f21' : '#10b981') : f === 'Resolved' ? (isDark ? '#1f3a31' : '#10b981') : (isDark ? '#163d34' : '#10b981');
            const activeBorder = f === 'Open' ? (isDark ? '#7a5d3d' : '#10b981') : f === 'Resolved' ? (isDark ? '#4e7f68' : '#10b981') : (isDark ? '#4a8d76' : '#10b981');
            return (
              <button key={f} className={`admin-filter-pill ticket-filter-pill${ticketFilter===f ? ' is-active' : ''}`} data-filter={f.toLowerCase()} aria-pressed={ticketFilter===f} onClick={() => setTicketFilter(f)} style={{
                padding:'7px 18px', borderRadius:'999px', border:'1.5px solid',
                borderColor: isActive ? activeBorder : (isDark ? '#33473f' : '#e2e8f0'),
                background: isActive ? activeBg : (isDark ? '#111915' : '#fff'),
                color: isActive ? '#f8fbfa' : (isDark ? '#dfeae4' : '#64748b'),
                fontSize:'13px', fontWeight:'700', cursor:'pointer',
                fontFamily:"'Sora',sans-serif",
              }}>
                {f} {f==='Open' ? '('+tickets.filter(t=>t.status==='Open').length+')' : f==='Resolved' ? '('+tickets.filter(t=>t.status==='Resolved').length+')' : '('+tickets.length+')'}
              </button>
            );
          })}
        </div>
        <input
          style={{ ...S.searchBox, flex:1, minWidth:220, background: themeMode === 'dark' ? '#111915' : '#fff', borderColor: themeMode === 'dark' ? '#33473f' : '#e2e8f0', color: themeMode === 'dark' ? '#edf7f2' : '#1e293b' }}
          placeholder="🔍  Search by name, email, subject, order ID…"
          value={search}
          onChange={e => setSearch(e.target.value)}
        />
      </div>

      {[...tickets]
        .sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt))
        .filter(t => ticketFilter==='All' || t.status===ticketFilter)
        .filter(t => !search.trim() ||
          t.name?.toLowerCase().includes(search.toLowerCase()) ||
          t.email?.toLowerCase().includes(search.toLowerCase()) ||
          (t.subject||'').toLowerCase().includes(search.toLowerCase()) ||
          (t.message||'').toLowerCase().includes(search.toLowerCase()) ||
          (t.orderId||'').toLowerCase().includes(search.toLowerCase())
        ).length === 0 ? (
        <div style={{ ...S.emptyState, background: themeMode === 'dark' ? '#101915' : '#fff', borderRadius:16, border:`1px solid ${themeMode === 'dark' ? '#33473f' : '#e2e8f0'}`, boxShadow: themeMode === 'dark' ? '0 10px 24px rgba(0,0,0,.18)' : '0 2px 8px rgba(0,0,0,0.04)' }}>
          <p style={{ fontSize:'52px', margin:'0 0 12px' }}>🎧</p>
          <p style={{ margin:0, fontSize:'15px', fontWeight:'700', color: themeMode === 'dark' ? '#eff7f2' : '#334155' }}>No {ticketFilter==='All'?'':ticketFilter.toLowerCase()} tickets{search?' matching your search':''}</p>
          <p style={{ margin:'6px 0 0', fontSize:'13px', color: themeMode === 'dark' ? '#a7b8b0' : '#94a3b8' }}>Support tickets from customers will appear here</p>
        </div>
      ) : (
        <div style={{ display:'flex', flexDirection:'column', gap:'12px' }}>
          {[...tickets]
            .sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt))
            .filter(t => ticketFilter==='All' || t.status===ticketFilter)
            .filter(t => !search.trim() ||
              t.name?.toLowerCase().includes(search.toLowerCase()) ||
              t.email?.toLowerCase().includes(search.toLowerCase()) ||
              (t.subject||'').toLowerCase().includes(search.toLowerCase()) ||
              (t.message||'').toLowerCase().includes(search.toLowerCase()) ||
              (t.orderId||'').toLowerCase().includes(search.toLowerCase())
            )
            .map(ticket => (
              <TicketCard
                key={ticket._id}
                ticket={ticket}
                darkMode={themeMode === 'dark'}
                onResolve={() => changeTicketStatus(ticket._id, 'Resolved')}
                onReopen={() => changeTicketStatus(ticket._id, 'Open')}
                onReply={saveTicketReply}
              />
            ))}
        </div>
      )}
    </div>
  );
}
