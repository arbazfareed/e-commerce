export default function NavbarStyles({
  
}) {
  return (
    <style>{`
      .navbar-admin-entry {
        display:inline-flex;
        align-items:center;
        justify-content:center;
        min-width: 46px;
        width: 46px;
        height:44px;
        padding: 0;
        border-radius:14px;
        border:1px solid rgba(187, 247, 208, 0.56);
        background:linear-gradient(145deg, #0b5d43, #0f766e);
        color:#f8fafc;
        box-shadow:0 8px 18px rgba(11, 93, 67, 0.28);
        transition:transform .15s ease, box-shadow .15s ease, border-color .15s ease, filter .15s ease;
        cursor:pointer;
        touch-action:none;
      }
      .navbar-admin-entry:hover {
        transform:translateY(-1px);
        box-shadow:0 10px 22px rgba(11, 93, 67, 0.38);
        border-color: #d1fae5 !important;
        filter:brightness(1.08);
      }
      .navbar-admin-entry:focus-visible { outline:2px solid #d7f3e3; outline-offset:3px; }
      .navbar-portal-label { color:#37654e; font-size:10px; font-weight:900; letter-spacing:1.2px; }
      .navbar-portal-entry { transition:transform .15s ease, border-color .15s ease, background .15s ease, box-shadow .15s ease; }
      .navbar-portal-entry:hover { transform:translateY(-1px); border-color:#b8f0cc !important; background:linear-gradient(145deg,#0a6a4c,#0b826f) !important; box-shadow:0 8px 20px rgba(11,93,67,.26); }
      .navbar-portal-entry:focus-visible { outline:2px solid #16845d; outline-offset:3px; }
      @media (max-width: 760px) {
        .site-nav {
          height: 64px !important;
          padding: 0 16px !important;
          background: rgba(255,255,255,.97) !important;
          box-shadow: 0 5px 22px rgba(15,23,42,.08) !important;
        }
        .site-nav .brandText { font-size:16px !important; max-width:none !important; }
        .site-nav .brandSuffix { display:none !important; }
        .site-nav .mark { width:34px !important; height:34px !important; }
    
        .site-nav > .navbar-brand-group {
          display:flex;
          align-items:center;
          gap:8px;
          min-width: 0;
          max-width: calc(100% - 68px);
          margin-left: auto;
        }
        .navbar-brand-group > a:first-child {
          min-width:0;
          max-width:calc(100% - 50px);
        }
        .navbar-brand-group > a:first-child .brandText {
          overflow: hidden;
          text-overflow: ellipsis;
          white-space: nowrap;
        }
        .navbar-brand-group > .navbar-portal-entry {
          flex:0 0 42px;
        }
    
        .site-nav-links,
        .navbar-live-search,
        .site-nav-auth,
        .desktop-theme-toggle {
          display: none !important;
        }
    
        .site-nav-burger {
          display: block !important;
          position: absolute !important;
          left: 16px !important;
          right: auto !important;
          transform: none !important;
          margin: 0 !important;
          width: 42px !important;
          height: 42px !important;
          border: 1.5px solid rgba(13,92,66,.2) !important;
          border-radius: 14px !important;
          background: linear-gradient(145deg, #f7fff9, #e8f9ee) !important;
          color: #0b5d43 !important;
          font-size: 22px !important;
          line-height: 1 !important;
          font-weight: 800 !important;
          box-shadow: 0 6px 16px rgba(13,92,66,.10) !important;
        }
    
        .mobile-menu-layer {
          position:fixed;
          inset:64px 0 0;
          z-index:199;
          animation: backdropIn .18s ease-out;
        }
        .mobile-menu-backdrop {
          position:absolute;
          inset:0;
          width:100%;
          border:0;
          background:rgba(7,28,20,.18);
          backdrop-filter:blur(2px);
        }
        .mobile-drawer {
          position:absolute !important;
          left: 10px !important;
          right: auto !important;
          width: min(78vw, 300px) !important;
          height: auto !important;
          max-height: calc(100dvh - 88px) !important;
          top: 12px !important;
          border: 1px solid rgba(255,255,255,.78) !important;
          border-radius: 24px !important;
          padding: 20px 16px max(20px, env(safe-area-inset-bottom)) !important;
          background: linear-gradient(165deg, #ffffff 0%, #f6fbf7 56%, #edf7f0 100%) !important;
          box-shadow: 0 24px 64px rgba(4,35,24,.24), 0 2px 8px rgba(4,35,24,.08) !important;
          animation: drawerIn .24s cubic-bezier(.2,.8,.2,1);
          overflow-y: auto;
        }
        .mobile-menu-label {
          padding: 17px 12px 8px;
          color:#668174;
          font-size:9px;
          font-weight:800;
          letter-spacing:1.5px;
          text-transform: uppercase;
        }
        .mobile-drawer-brand {
          display:flex;
          align-items:center;
          gap:11px;
          padding:13px;
          border-radius:18px;
          color:#fff;
          background:linear-gradient(135deg,#0a3d2f,#12684c 68%,#1a7f5d);
          box-shadow:0 12px 24px rgba(10,61,47,.2);
        }
        .mobile-drawer-mark {
          filter:drop-shadow(0 5px 10px rgba(0,0,0,.18));
        }
        .mobile-drawer-brand-copy {
          display:flex;
          flex:1;
          min-width:0;
          flex-direction:column;
          gap:3px;
        }
        .mobile-drawer-brand-copy strong {
          color:#fff;
          font-size:14px;
          font-weight:800;
          letter-spacing:-.3px;
        }
        .mobile-drawer-brand-copy span {
          color:#c9f2db;
          font-size:10px;
          font-weight:600;
        }
        .mobile-drawer .drawer-close {
          display:flex !important;
          align-items:center;
          justify-content:center;
          flex:0 0 34px;
          width:34px !important;
          min-width:34px !important;
          height:34px !important;
          min-height:34px !important;
          padding:0 !important;
          border:1px solid rgba(255,255,255,.25) !important;
          border-radius:11px !important;
          background:rgba(255,255,255,.12) !important;
          color:#fff !important;
          font-size:21px;
          line-height:1;
          cursor:pointer;
        }
        .mobile-drawer a,
        .mobile-drawer button {
          display:flex !important;
          align-items:center;
          gap:12px;
          min-height:50px;
          border-radius:14px !important;
          padding: 0 14px !important;
        }
        .mobile-drawer .mobile-nav-link {
          gap:11px;
          margin-bottom:5px;
          border:1px solid transparent !important;
          color:#40564b;
          font-size:13px;
          font-weight:700;
          text-decoration:none;
          transition:background .16s ease, border-color .16s ease, color .16s ease, transform .16s ease;
        }
        .mobile-drawer .mobile-nav-link:hover {
          background:#f0f8f2;
          color:#0d5c42;
          transform:translateX(2px);
        }
        .mobile-drawer .mobile-nav-link.is-active {
          border-color:#d4eadb !important;
          background:linear-gradient(135deg,#eaf7ee,#dff2e5) !important;
          color:#0b6043 !important;
          box-shadow:0 6px 14px rgba(13,92,66,.07);
        }
        .mobile-nav-icon {
          display:flex;
          align-items:center;
          justify-content:center;
          flex:0 0 36px !important;
          width:36px;
          height:36px;
          border:1px solid #e1eee5;
          border-radius:12px;
          background:#f5faf6;
          color:#3b755a;
          font-size:18px;
          line-height:1;
        }
        .mobile-nav-link.is-active .mobile-nav-icon {
          border-color:#c5e2ce;
          background:#fff;
          color:#0d6a49;
        }
        .mobile-nav-text { flex:1; }
        .mobile-nav-arrow {
          flex:0 0 auto !important;
          color:#91a79a;
          font-size:22px;
          font-weight:400;
        }
        .mobile-nav-link.is-active .mobile-nav-arrow { color:#0d6a49; }
        .mobile-drawer .mobile-guest-card {
          display:flex;
          flex-direction:column;
          gap:5px;
          margin-top:3px;
          padding:14px;
          border:1px solid #e0ebe4;
          border-radius:16px;
          background:rgba(255,255,255,.78);
        }
        .mobile-guest-card > strong,
        .mobile-account-copy strong {
          color:#173a2d;
          font-size:12px;
          font-weight:800;
        }
        .mobile-guest-card > span,
        .mobile-account-copy span {
          color:#718278;
          font-size:10px;
          line-height:1.45;
        }
        .mobile-guest-actions {
          display:flex;
          gap:8px;
          margin-top:8px;
        }
        .mobile-drawer .mobile-guest-actions a {
          justify-content:center;
          flex:1;
          min-height:40px;
          padding:0 10px !important;
          border-radius:11px !important;
          font-size:11px;
          font-weight:800;
          text-decoration:none;
        }
        .mobile-drawer .mobile-guest-actions .mobile-login {
          border:1px solid #dce9e0 !important;
          background:#fff;
          color:#375b49;
        }
        .mobile-drawer .mobile-guest-actions .mobile-register {
          border:1px solid #0d5c42 !important;
          background:linear-gradient(135deg,#167b56,#0d5c42);
          color:#fff;
          box-shadow:0 6px 13px rgba(13,92,66,.16);
        }
        .mobile-drawer .mobile-guest-actions .mobile-register span { flex:0 0 auto; }
        .mobile-account-card {
          display:flex;
          align-items:center;
          gap:9px;
          padding:10px;
          border:1px solid #e0ebe4;
          border-radius:15px;
          background:rgba(255,255,255,.78);
        }
        .mobile-account-avatar {
          display:flex;
          align-items:center;
          justify-content:center;
          flex:0 0 34px;
          width:34px;
          height:34px;
          border-radius:50%;
          background:linear-gradient(135deg,#34b77b,#0d5c42);
          color:#fff;
          font-size:12px;
          font-weight:800;
        }
        .mobile-account-copy {
          display:flex;
          flex:1;
          min-width:0;
          flex-direction:column;
          gap:2px;
        }
        .mobile-drawer .mobile-logout {
          flex:0 0 auto;
          min-height:34px !important;
          padding:0 9px !important;
          border:1px solid #f0d8d6 !important;
          border-radius:9px !important;
          background:#fff8f7;
          color:#a6473d;
          font-size:10px;
          font-weight:800;
          cursor:pointer;
        }
        .mobile-menu-divider {
          border-top:1px solid #dcebe1;
          margin-top:12px;
          padding-top:12px;
        }
        .mobile-admin-entry { margin:12px 4px 0; }
        .mobile-admin-entry-label { display:block; margin:0 8px 6px; color:#789084; font-size:9px; font-weight:800; letter-spacing:1.2px; }
        .mobile-drawer .mobile-admin-entry-link { display:flex; min-height:46px; padding:0 10px !important; border:1px solid #b7d2c0 !important; border-radius:12px !important; background:linear-gradient(135deg,#edf7f0,#e2f0e6) !important; color:#124d39 !important; font-size:12px; font-weight:800; text-decoration:none; box-shadow:0 5px 14px rgba(18,77,57,.08); cursor:pointer; touch-action:none; }
        .mobile-admin-entry-icon { display:grid; width:30px; height:30px; flex:0 0 30px; place-items:center; border:1px solid #c8dfd0; border-radius:10px; background:#f8fcf9; color:#0d6a49; }
        .mobile-theme-toggle {
          display:flex !important;
          align-items:center;
          gap:10px !important;
          width:100%;
          min-height:56px !important;
          margin-top:12px;
          padding:9px 10px !important;
          border:1px solid #e0ebe4 !important;
          border-radius:15px !important;
          background:rgba(255,255,255,.72) !important;
          color:#385449;
          text-align:left;
          cursor:pointer;
        }
        .mobile-theme-icon {
          display:flex;
          flex:0 0 34px !important;
          align-items:center;
          justify-content:center;
          width:34px;
          height:34px;
          border:1px solid #dce9e0;
          border-radius:11px;
          background:#f5faf6;
          color:#0d5c42;
          font-size:18px;
        }
        .mobile-theme-copy {
          display:flex;
          flex:1;
          flex-direction:column;
          gap:2px;
          font-size:11px;
          font-weight:800;
        }
        .mobile-theme-copy small { color:#819187; font-size:9px; font-weight:500; }
        .mobile-theme-switch {
          display:flex;
          align-items:center;
          flex:0 0 36px !important;
          width:36px;
          height:21px;
          padding:2px;
          border-radius:99px;
          background:#d7e3da;
          transition:background .2s ease;
        }
        .mobile-theme-switch i {
          width:17px;
          height:17px;
          border-radius:50%;
          background:#fff;
          box-shadow:0 1px 4px rgba(0,0,0,.18);
          transition:transform .2s ease;
        }
        .mobile-theme-switch.is-dark { background:#16845d; }
        .mobile-theme-switch.is-dark i { transform:translateX(15px); }

        :root[data-theme='dark'] .mobile-drawer .mobile-admin-entry-link {
          border-color:#3d614b !important;
          background:linear-gradient(135deg,#1c3a29,#183326) !important;
          color:#e0f4e6 !important;
          box-shadow:0 6px 16px rgba(0,0,0,.18);
        }
        :root:not([data-theme='dark']) .mobile-drawer .mobile-admin-entry-link {
          border-color:#b7d2c0 !important;
          background:linear-gradient(135deg,#edf7f0,#e2f0e6) !important;
          color:#124d39 !important;
        }
        :root[data-theme='dark'] .mobile-admin-entry-icon {
          border-color:#42614d;
          background:#244331;
          color:#a8e6bb;
        }
    
        @keyframes drawerIn {
          from { opacity: 0; transform: translateX(-22px); }
          to { opacity: 1; transform: translateX(0); }
        }
        @keyframes backdropIn {
          from { opacity: 0; }
          to { opacity: 1; }
        }
      }
      .admin-access-overlay {
        position: fixed;
        inset: 0;
        z-index: 300;
        display: flex;
        align-items: center;
        justify-content: center;
        background: rgba(3, 12, 9, 0.62);
        backdrop-filter: blur(6px);
      }
      .admin-access-modal {
        width: min(92vw, 420px);
        border-radius: 22px;
        border: 1px solid rgba(160, 219, 188, 0.24);
        background: linear-gradient(180deg, rgba(10, 25, 20, 0.98), rgba(8, 19, 16, 0.98));
        box-shadow: 0 32px 80px rgba(0,0,0,0.35);
        padding: 22px 20px 18px;
      }
    `}</style>
  );
}
