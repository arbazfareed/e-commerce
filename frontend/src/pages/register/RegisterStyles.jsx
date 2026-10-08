export default function RegisterStyles() {
  return (
    <style>{`
      @keyframes fadeIn  { from{opacity:0;transform:translateY(14px)} to{opacity:1;transform:translateY(0)} }
      @keyframes spin    { to { transform:rotate(360deg); } }
      .inp:focus { border-color:#16845d !important; background:#fff !important;
             box-shadow:0 0 0 4px rgba(22,132,93,0.12), 0 3px 10px rgba(13,92,66,0.06) !important; outline:none; }
      .inp:hover:not(:focus) { border-color:#b8d1c1 !important; background:#fff !important; }
      .inp { transition:border-color .18s ease, box-shadow .18s ease, background .18s ease; }
      .reg-btn:hover:not(:disabled) { opacity:0.92; transform:translateY(-1px); }
      .reg-btn { transition:all 0.15s; }
      .back-btn:hover { background:#f1f5f9 !important; }
      .back-btn { transition:background 0.15s; }
      .register-shell {
        width:min(100%, 980px);
        display:grid;
        grid-template-columns:minmax(0,.86fr) minmax(430px,.9fr);
        border-radius:30px;
        overflow:hidden;
        background:#fff;
        box-shadow:0 24px 80px rgba(15,23,42,.16);
        position:relative;
        z-index:1;
      }
      .register-shell > div {
        display:flex;
        flex-direction:column;
        justify-content:center;
      }
      .register-visual {
        min-height:650px;
        position:relative;
        background:#78350f;
        overflow:hidden;
      }
      .register-visual::after {
        content:'';
        position:absolute;
        inset:0;
        background:linear-gradient(145deg,rgba(69,26,3,.08),rgba(69,26,3,.72));
        pointer-events:none;
      }
      .register-visual .auth-visual-image {
        object-position:center;
      }
      .register-visual-content {
        position:absolute;
        inset:auto 32px 34px;
        color:#fff;
        z-index:1;
      }
      .register-visual-kicker {
        color:#fef3c7;
        font-size:10px;
        font-weight:800;
        letter-spacing:1.7px;
      }
      .register-visual h1 {
        margin:12px 0;
        font-family:'Sora',sans-serif;
        font-size:32px;
        line-height:1.12;
        letter-spacing:-1px;
      }
      .register-visual h1 em { color:#fcd34d; font-style:normal; }
      .register-visual p {
        max-width:315px;
        margin:0;
        color:rgba(255,255,255,.8);
        font-size:13px;
        line-height:1.6;
      }
      .register-note {
        display:inline-flex;
        margin-top:20px;
        padding:8px 12px;
        border:1px solid rgba(255,255,255,.24);
        border-radius:99px;
        background:rgba(255,255,255,.1);
        font-size:10px;
        font-weight:700;
      }
      @media (max-width:760px) {
        .register-page { padding:14px !important; align-items:flex-start !important; }
        .register-shell { display:block; max-width:440px; border-radius:22px; }
        .register-shell > div { display:block; }
        .register-form-card { padding:28px 22px 24px !important; border:0 !important; }
        .register-visual { min-height:180px; background-position:center; }
        .register-visual-content { inset:22px 22px auto; }
        .register-visual h1 { font-size:24px; margin:7px 0; }
        .register-visual p { font-size:11px; max-width:290px; }
        .register-note { display:none; }
      }
    `}</style>
  );
}
