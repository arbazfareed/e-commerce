export default function AdminGlobalStyles() {
  return (
    <style>{`
      @import url('https://fonts.googleapis.com/css2?family=JetBrains+Mono:wght@500;700&display=swap');
      @keyframes spin    { to { transform:rotate(360deg) } }
      @keyframes fadeUp  { from { opacity:0; transform:translateY(14px) } to { opacity:1; transform:none } }
      @keyframes slideUp { from { opacity:0; transform:translateY(20px) } to { opacity:1; transform:none } }
      .admin-page .admin-main h1,
      .admin-page .admin-main h2,
      .admin-page .admin-main h3,
      .admin-page .admin-main h4,
      .admin-page .admin-main h5,
      .admin-page .admin-main h6 { font-family:var(--font-display) !important; letter-spacing:-.035em !important; }
      .admin-page .admin-main .pgTop > div:first-child::before,
      .admin-page .admin-main section[aria-labelledby='coupons-heading'] > div:first-child::before,
      .admin-page .admin-main section[aria-labelledby='reviews-heading'] > div:first-child::before {
        content:'ADMIN WORKSPACE';
        display:block;
        margin-bottom:7px;
        color:#16845d;
        font-family:var(--font-body);
        font-size:10px;
        font-weight:800;
        letter-spacing:1.5px;
        line-height:1.2;
      }
      .admin-page .admin-main .pgTop h1.pgTitle,
      .admin-page .admin-main #coupons-heading,
      .admin-page .admin-main #reviews-heading {
        position:relative;
        padding-left:14px;
        color:#183329 !important;
        font-size:30px !important;
        font-weight:800 !important;
        line-height:1.2 !important;
        letter-spacing:-.045em !important;
      }
      .admin-page .admin-main .pgTop h1.pgTitle::before,
      .admin-page .admin-main #coupons-heading::before,
      .admin-page .admin-main #reviews-heading::before {
        content:'';
        position:absolute;
        top:.12em;
        bottom:.12em;
        left:0;
        width:4px;
        border-radius:99px;
        background:#16845d;
      }
      .admin-page .admin-main .pgTop .pgSub,
      .admin-page .admin-main section[aria-labelledby='coupons-heading'] > div:first-child p,
      .admin-page .admin-main section[aria-labelledby='reviews-heading'] > div:first-child p {
        max-width:680px;
        margin:7px 0 0;
        color:#56675d !important;
        font-size:14px !important;
        font-weight:500 !important;
        line-height:1.6 !important;
      }
      :root[data-theme='dark'] .admin-page .admin-main .pgTop > div:first-child::before,
      :root[data-theme='dark'] .admin-page .admin-main section[aria-labelledby='coupons-heading'] > div:first-child::before,
      :root[data-theme='dark'] .admin-page .admin-main section[aria-labelledby='reviews-heading'] > div:first-child::before { color:#7bd6ac; }
      :root[data-theme='dark'] .admin-page .admin-main .pgTop h1.pgTitle,
      :root[data-theme='dark'] .admin-page .admin-main #coupons-heading,
      :root[data-theme='dark'] .admin-page .admin-main #reviews-heading { color:#edf6f1 !important; }
      :root[data-theme='dark'] .admin-page .admin-main .pgTop h1.pgTitle::before,
      :root[data-theme='dark'] .admin-page .admin-main #coupons-heading::before,
      :root[data-theme='dark'] .admin-page .admin-main #reviews-heading::before { background:#57c995; }
      :root[data-theme='dark'] .admin-page .admin-main .pgTop .pgSub,
      :root[data-theme='dark'] .admin-page .admin-main section[aria-labelledby='coupons-heading'] > div:first-child p,
      :root[data-theme='dark'] .admin-page .admin-main section[aria-labelledby='reviews-heading'] > div:first-child p { color:#bac8bf !important; }
      :root:not([data-theme='dark']) .admin-page .admin-main {
        background:#f5f7f5 !important;
        color:#20392e !important;
      }
      :root[data-theme='dark'] .admin-page .admin-main {
        background:#111815 !important;
        color:#edf6f3 !important;
      }
      :root:not([data-theme='dark']) .admin-page .admin-main h1,
      :root:not([data-theme='dark']) .admin-page .admin-main h2,
      :root:not([data-theme='dark']) .admin-page .admin-main h3,
      :root:not([data-theme='dark']) .admin-page .admin-main h4,
      :root:not([data-theme='dark']) .admin-page .admin-main h5,
      :root:not([data-theme='dark']) .admin-page .admin-main h6 { color:#183b2e !important; }
      :root:not([data-theme='dark']) .admin-page .admin-main .pgSub { color:#607468 !important; }
      :root:not([data-theme='dark']) .admin-page .admin-main th { color:#607468 !important; border-bottom-color:#dce8df !important; }
      :root:not([data-theme='dark']) .admin-page .admin-main td { border-bottom-color:#e7eee8 !important; }
      :root:not([data-theme='dark']) .admin-page .admin-main input:not([type='checkbox']),
      :root:not([data-theme='dark']) .admin-page .admin-main select,
      :root:not([data-theme='dark']) .admin-page .admin-main textarea {
        border-color:#cbd9cf !important;
        border-radius:10px;
      }
      :root[data-theme='dark'] .admin-page .admin-main h1,
      :root[data-theme='dark'] .admin-page .admin-main h2,
      :root[data-theme='dark'] .admin-page .admin-main h3,
      :root[data-theme='dark'] .admin-page .admin-main h4,
      :root[data-theme='dark'] .admin-page .admin-main h5,
      :root[data-theme='dark'] .admin-page .admin-main h6 { font-family:var(--font-display) !important; color:#e7f1eb !important; }
      :root[data-theme='dark'] .nav-btn:hover { background:rgba(16,185,129,.14) !important; color:#f8fffb !important; box-shadow:inset 0 0 0 1px rgba(167,243,208,.20) !important; }
      :root:not([data-theme='dark']) .admin-sidebar .nav-btn:hover { background:#eaf5ee !important; color:#075c43 !important; box-shadow:inset 0 0 0 1px rgba(5,150,105,.14) !important; }
      .admin-password-card input { width:100%; min-height:46px; margin-top:6px; padding:10px 12px; border:1px solid #b9cec0; border-radius:10px; box-sizing:border-box; background:#fbfdfb; color:#10251b; }
      .admin-password-card input:focus { outline:3px solid rgba(16,185,129,.2); border-color:#0b8059; }
      .admin-password-submit { width:100%; min-height:48px; justify-content:center; color:#062e22 !important; background:linear-gradient(135deg,#8ae0bb,#54c7a2) !important; }
      :root[data-theme='dark'] .admin-page .admin-main .admin-green-button { color:#062e22 !important; }
      .admin-page .admin-pdf-report-button { color:#fff !important; }
      :root[data-theme='dark'] .admin-password-card input { border-color:#557264 !important; background:#0b1510 !important; color:#f3faf5 !important; box-shadow:inset 0 1px 2px rgba(0,0,0,.4) !important; }
      :root[data-theme='dark'] .admin-password-card input:focus { outline:3px solid rgba(110,231,183,.22); border-color:#72c9a2 !important; }
      :root[data-theme='dark'] .admin-password-submit { color:#062e22 !important; background:linear-gradient(135deg,#8ae0bb,#54c7a2) !important; }
      .admin-add-product-submit { color:#062e22 !important; background:linear-gradient(135deg,#8ae0bb,#54c7a2) !important; }
      :root[data-theme='dark'] .admin-main .admin-add-product-submit { color:#062e22 !important; }
      :root[data-theme='dark'] .admin-page .admin-market-badge[data-market='local'] { color:#166534 !important; }
      :root[data-theme='dark'] .admin-page .admin-market-badge[data-market='global'] { color:#1d4ed8 !important; }
      :root[data-theme='dark'] .admin-page .admin-status-badge[data-status='pending'] { color:#9a3412 !important; }
      :root[data-theme='dark'] .admin-page .admin-status-badge[data-status='processing'] { color:#1d4ed8 !important; }
      :root[data-theme='dark'] .admin-page .admin-status-badge[data-status='shipped'] { color:#0369a1 !important; }
      :root[data-theme='dark'] .admin-page .admin-status-badge[data-status='delivered'] { color:#166534 !important; }
      :root[data-theme='dark'] .admin-page .admin-status-badge[data-status='cancelled'] { color:#be123c !important; }
      :root[data-theme='dark'] .admin-page .admin-category-new { background:#26322c !important; border-color:#53645a !important; color:#edf4f0 !important; }
      :root[data-theme='dark'] .admin-page .admin-market-summary-local-label { color:#a7f3d0 !important; }
      :root[data-theme='dark'] .admin-page .admin-market-summary-local-count { color:#86efac !important; }
      :root[data-theme='dark'] .admin-page .admin-market-summary-local-description { color:#b7f3cd !important; }
      :root[data-theme='dark'] .admin-page .admin-market-summary-local-share { color:#a7f3d0 !important; }
      :root[data-theme='dark'] .admin-page .admin-market-summary-global-label { color:#bfdbfe !important; }
      :root[data-theme='dark'] .admin-page .admin-market-summary-global-count { color:#93c5fd !important; }
      :root[data-theme='dark'] .admin-page .admin-market-summary-global-description { color:#c4ddf5 !important; }
      :root[data-theme='dark'] .admin-page .admin-market-summary-global-share { color:#bfdbfe !important; }
      .admin-image-picker-add { transition:background .15s ease,border-color .15s ease,transform .15s ease; }
      .admin-image-picker-add:hover { transform:translateY(-1px); }
      .admin-image-picker > div + p { color:#536b5c !important; }
      :root[data-theme='dark'] .admin-image-picker > div + p { color:#bdcbc3 !important; }
      :root[data-theme='dark'] .admin-image-picker-add { background:#26322c !important; border-color:#718479 !important; }
      :root[data-theme='dark'] .admin-image-picker-plus,
      :root[data-theme='dark'] .admin-image-picker-caption { color:#e2eee6 !important; }
      .admin-settings-page .admin-settings-card { border-radius:18px !important; padding:24px !important; }
      :root[data-theme='dark'] .admin-page .admin-main .admin-settings-page .admin-settings-card { background:#1c2320 !important; border-color:#39443f !important; box-shadow:0 14px 32px rgba(0,0,0,.24) !important; }
      :root:not([data-theme='dark']) .admin-page .admin-main .admin-settings-page .admin-settings-card { background:#fff !important; border-color:#dbe7df !important; box-shadow:0 12px 28px rgba(15,45,32,.07) !important; }
      :root[data-theme='dark'] .admin-page .admin-main .admin-settings-page .admin-settings-card h3,
      :root[data-theme='dark'] .admin-page .admin-main .admin-settings-page .admin-settings-card h4 { color:#edf4f0 !important; }
      :root:not([data-theme='dark']) .admin-page .admin-main .admin-settings-page .admin-settings-card h3,
      :root:not([data-theme='dark']) .admin-page .admin-main .admin-settings-page .admin-settings-card h4 { color:#183329 !important; }
      :root[data-theme='dark'] .admin-page .admin-main .admin-settings-page .admin-settings-card p { color:#b9c7bf !important; font-size:12px !important; line-height:1.65 !important; }
      :root:not([data-theme='dark']) .admin-page .admin-main .admin-settings-page .admin-settings-card p { color:#586b60 !important; font-size:12px !important; line-height:1.65 !important; }
      :root[data-theme='dark'] .admin-page .admin-main .admin-settings-page .admin-password-warning { color:#d4dfd8 !important; background:#252d29 !important; border-color:#414c45 !important; border-left:3px solid #82988a !important; }
      :root:not([data-theme='dark']) .admin-page .admin-main .admin-settings-page .admin-password-warning { color:#40594a !important; background:#f4f7f4 !important; border-color:#d8e2da !important; border-left:3px solid #82988a !important; }
      .admin-settings-page .admin-settings-card label { display:block; font-size:10px !important; font-weight:800 !important; letter-spacing:.65px !important; line-height:1.5; }
      :root[data-theme='dark'] .admin-page .admin-main .admin-settings-page .admin-settings-card label { color:#c9d5ce !important; }
      :root:not([data-theme='dark']) .admin-page .admin-main .admin-settings-page .admin-settings-card label { color:#40594a !important; }
      :root[data-theme='dark'] .admin-page .admin-main .admin-settings-page .admin-settings-card input:not([type='checkbox']),
      :root[data-theme='dark'] .admin-page .admin-main .admin-settings-page .admin-settings-card select,
      :root[data-theme='dark'] .admin-page .admin-main .admin-settings-page .admin-settings-card textarea { min-height:40px; border:1px solid #4a5b51 !important; border-radius:10px; background:#242b28 !important; color:#f0f5f1 !important; font-size:13px !important; box-shadow:inset 0 1px 2px rgba(0,0,0,.22) !important; }
      :root:not([data-theme='dark']) .admin-page .admin-main .admin-settings-page .admin-settings-card input:not([type='checkbox']),
      :root:not([data-theme='dark']) .admin-page .admin-main .admin-settings-page .admin-settings-card select,
      :root:not([data-theme='dark']) .admin-page .admin-main .admin-settings-page .admin-settings-card textarea { min-height:40px; border:1px solid #cbd9cf !important; border-radius:10px; background:#fbfdfb !important; color:#183329 !important; font-size:13px !important; }
      :root[data-theme='dark'] .admin-page .admin-main .admin-settings-page .admin-zone-rate-card { background:#252d29 !important; border-color:#48564e !important; }
      :root:not([data-theme='dark']) .admin-page .admin-main .admin-settings-page .admin-zone-rate-card { background:#f5f9f6 !important; border-color:#d4e1d8 !important; }
      .admin-settings-page .admin-settings-card button { min-height:42px; border-radius:10px; color:#062e22 !important; }
      :root[data-theme='dark'] .admin-page .admin-main .admin-settings-page .admin-settings-card button { background:linear-gradient(135deg,#8ae0bb,#54c7a2) !important; color:#062e22 !important; }
      :root[data-theme='dark'] .admin-main .market-picker-option-title,
      :root[data-theme='dark'] .admin-main .market-picker-option-check { color:#dce8e1 !important; }
      :root[data-theme='dark'] .admin-main .market-picker-option.is-active[data-market='global'] .market-picker-option-title,
      :root[data-theme='dark'] .admin-main .market-picker-option.is-active[data-market='global'] .market-picker-option-check { color:#bfdbfe !important; }
      :root[data-theme='dark'] .admin-main .market-picker-option.is-active[data-market='local'] .market-picker-option-title,
      :root[data-theme='dark'] .admin-main .market-picker-option.is-active[data-market='local'] .market-picker-option-check { color:#a7f3d0 !important; }
      :root[data-theme='dark'] .admin-main .market-picker-option-sub { color:#bdcbc3 !important; }
      :root[data-theme='dark'] .admin-main .market-picker-hint { color:#bcebd1 !important; }
      :root:not([data-theme='dark']) .admin-main .market-picker-option-title { color:#334155 !important; }
      :root:not([data-theme='dark']) .admin-main .market-picker-option.is-active[data-market='global'] .market-picker-option-title,
      :root:not([data-theme='dark']) .admin-main .market-picker-option.is-active[data-market='global'] .market-picker-option-check { color:#1d4ed8 !important; }
      :root:not([data-theme='dark']) .admin-main .market-picker-option.is-active[data-market='local'] .market-picker-option-title,
      :root:not([data-theme='dark']) .admin-main .market-picker-option.is-active[data-market='local'] .market-picker-option-check { color:#047857 !important; }
      :root:not([data-theme='dark']) .admin-main .market-picker-option-sub { color:#52675d !important; }
      :root:not([data-theme='dark']) .admin-main .market-picker-hint { color:#145c43 !important; }
      .row-hover:hover { background:#f8fafc; }
      .kpi-card:hover  { transform:translateY(-4px); box-shadow:0 16px 48px rgba(0,0,0,.2) !important; }
      .del-btn:hover   { background:#fef2f2 !important; }
      .edit-btn:hover  { background:#eff6ff !important; }
      .mkt-pill:hover  { opacity:.8; }
      select option    { font-family:var(--font-body); }
      .admin-mobile-heading { display:none; }
      .admin-main { min-width:0; width:100%; max-width:none; }
      .admin-main > * { max-width:100%; }
      ::-webkit-scrollbar       { width:5px; height:5px; }
      ::-webkit-scrollbar-track { background:transparent; }
      ::-webkit-scrollbar-thumb { background:#e2e8f0; border-radius:99px; }
      @media (max-width: 900px) {
        .admin-main { padding:24px 20px !important; }
        .admin-main [style*="repeat(4,1fr)"] { grid-template-columns:repeat(2,minmax(0,1fr)) !important; }
      }
      @media (max-width: 760px) {
        .admin-sidebar {
          width:100% !important;
          min-height:0 !important;
          height:auto !important;
          position:sticky !important;
          top:64px !important;
          z-index:100 !important;
          overflow:visible !important;
          border-right:0 !important;
          box-shadow:0 8px 24px rgba(15,23,42,.14);
        }
        .admin-sidebar > div:first-child { padding:12px 16px !important; }
        .admin-sidebar > nav {
          display:grid !important;
          grid-template-columns:repeat(2,minmax(0,1fr));
          overflow:hidden !important;
          padding:8px 10px 10px !important;
          gap:6px;
        }
        .admin-sidebar .nav-btn {
          width:100% !important;
          min-height:44px !important;
          justify-content:flex-start !important;
          border-left:0 !important;
          border:1px solid rgba(148,163,184,.12) !important;
          border-radius:9px !important;
          padding:10px 12px !important;
          white-space:nowrap !important;
        }
        .admin-sidebar .nav-btn[style*="border-left"] {
          border-color:#10b981 !important;
          background:rgba(16,185,129,.12) !important;
        }
        .admin-sidebar > div:nth-last-child(3),
        .admin-sidebar > div:nth-last-child(2),
        .admin-sidebar > div:last-child { display:none !important; }
        .admin-main {
          width:100% !important;
          max-width:none !important;
          padding:18px 12px 30px !important;
        }
        .admin-mobile-heading {
          display:block;
          padding:16px 16px 15px;
          margin-bottom:12px;
          border-radius:16px;
          color:#fff;
          background:linear-gradient(135deg,#0a3d2f,#12684c 58%,#1a7f5d);
          box-shadow:0 12px 28px rgba(10,61,47,.18);
        }
        .admin-mobile-heading p {
          margin:0 0 6px;
          color:#6ee7b7;
          font-size:9px;
          font-weight:800;
          letter-spacing:1.5px;
        }
        .admin-mobile-heading h1 {
          margin:0;
          font-family:var(--font-display);
          font-size:20px;
          letter-spacing:-.5px;
        }
        .admin-mobile-heading span {
          display:block;
          margin-top:6px;
          color:#cbd5e1;
          font-size:11px;
          line-height:1.45;
        }
        .admin-main [style*="repeat(4,1fr)"] { grid-template-columns:1fr 1fr !important; gap:10px !important; }
        .admin-main [style*="grid-template-columns:1fr 1fr"] { grid-template-columns:1fr !important; }
        .admin-main [style*="padding:24px"] { padding:16px !important; }
        .admin-main table { min-width:650px; }
        .admin-main [style*="overflow-x:auto"],
        .admin-main [style*="overflowX"] { max-width:100%; overflow-x:auto !important; }
        .admin-main .pgTop h1.pgTitle,
        .admin-main #coupons-heading,
        .admin-main #reviews-heading { font-size:24px !important; }
        .admin-main .pgTop { margin-bottom:16px; }
      }
      @media (max-width: 380px) {
        .admin-sidebar > nav { grid-template-columns:1fr; }
        .admin-sidebar .nav-btn { min-height:42px !important; }
        .admin-main { padding-left:10px !important; padding-right:10px !important; }
      }
    `}</style>
  );
}
