export default function HomeStyles({
  
}) {
  return (
    <style>{`
      @keyframes pulse {
        0%, 100% { opacity: 1; }
        50%       { opacity: 0.5; }
      }
    
      @keyframes hero-image-carousel {
        0%, 18% { transform:translateX(0); }
        22%, 38% { transform:translateX(-20%); }
        42%, 58% { transform:translateX(-40%); }
        62%, 78% { transform:translateX(-60%); }
        82%, 100% { transform:translateX(-80%); }
      }
    
      .hero-image-slider {
        position:absolute;
        inset:0;
        overflow:hidden;
        pointer-events:none;
        z-index:0;
      }
    
      .hero-image-track {
        display:flex;
        width:500%;
        height:100%;
        will-change:transform;
      }
    
      .hero-image-slide {
        position:relative;
        flex:0 0 20%;
        height:100%;
        overflow:hidden;
      }
    
      .hero-image-slide img {
        display:block;
        width:100%;
        height:100%;
        object-fit:cover;
        object-position:center 46%;
      }
    
      .hero-image-slide::after {
        content:'';
        position:absolute;
        inset:0;
        background:linear-gradient(120deg,rgba(5,19,16,.78) 0%,rgba(16,56,48,.70) 42%,rgba(62,52,24,.44) 100%);
      }
    
      @media (prefers-reduced-motion: no-preference) {
        .hero-image-track { animation:hero-image-carousel 36s ease-in-out infinite; }
      }
    
      @media (max-width:760px) {
        .hero-image-slide img { object-position:68% center; }
      }
    
      @media (prefers-reduced-motion: reduce) {
        .hero-image-track { animation:none !important; transform:translateX(0) !important; }
      }
    
      @media (min-width: 761px) and (prefers-reduced-motion: no-preference) {
        .hero-image-slider { contain:paint; }
      }
    
      .hero-copy .hero-stats {
        align-items:center;
        gap:8px;
        margin-top:18px;
      }
    
      .hero-copy .hero-stat {
        display:inline-flex;
        align-items:center;
        gap:6px;
        padding:8px 12px;
        border:1px solid rgba(255,255,255,.18);
        border-radius:999px;
        background:rgba(255,255,255,.08);
        line-height:1.3;
        white-space:nowrap;
      }
    
      .hero-copy .hero-stat strong {
        color:#fff;
        font-weight:900;
      }
    
      @media (max-width: 760px) {
        .hero {
          padding-top: 42px !important;
          padding-left: 20px !important;
          padding-right: 20px !important;
          padding-bottom: 28px !important;
          background-position: 72% center !important;
        }
    
        .hero-content {
          grid-template-columns: 1fr !important;
          gap: 0 !important;
        }
    
        .hero-copy {
          max-width: 100% !important;
        }
    
        .hero-shell { display:none !important; }
    
        .hero-copy > div:first-child {
          margin-bottom: 14px !important;
        }
    
        .hero-copy h1 {
          font-size: clamp(34px, 9vw, 48px) !important;
          line-height: 1.02 !important;
          letter-spacing: -0.055em !important;
          margin-bottom: 13px !important;
        }
    
        .hero-copy p {
          font-size: 14px !important;
          line-height: 1.65 !important;
          margin-bottom: 18px !important;
          max-width: 440px !important;
        }
    
        .hero-tools {
          margin-top: 22px !important;
          width: 100% !important;
        }
    
        .hero-tools .search-wrapper {
          max-width: none !important;
        }
    
        .hero-tools .market-toggle {
          display: grid !important;
          grid-template-columns: 1fr 1fr;
          gap: 8px !important;
        }
    
        .hero-tools .market-toggle button {
          flex: 1 1 auto;
          min-width: 0 !important;
          padding-left: 12px !important;
          padding-right: 12px !important;
          font-size: 12px !important;
        }
    
        .hero-copy .hero-stats {
          display: grid !important;
          grid-template-columns: repeat(3, minmax(0, 1fr)) !important;
          gap: 8px !important;
          margin-top: 18px !important;
        }
    
        .hero-copy .hero-stat {
          display:flex;
          min-width:0;
          flex-direction:column;
          gap:3px;
          padding:9px 8px;
          border:1px solid rgba(255,255,255,.16);
          border-radius:12px;
          background:rgba(255,255,255,.07);
          font-size:9px;
          line-height:1.3;
        }
    
        .hero-copy .hero-stat strong {
          font-size:13px;
        }
    
        .hero-copy .hero-actions {
          flex-direction: row !important;
          align-items: center !important;
          gap: 10px !important;
          margin-bottom: 0 !important;
        }
    
        .hero-copy .hero-actions button {
          width: auto !important;
        }
    
        .feature-section {
          margin-top: 8px !important;
          padding: 0 16px !important;
        }
    
        .feature-grid {
          grid-template-columns: 1fr !important;
          gap: 12px !important;
        }
    
        .feature-card {
          padding: 14px 14px !important;
        }
    
        .cat-container,
        .subcat-container {
          padding-left: 16px !important;
          padding-right: 16px !important;
        }
    
        .main {
          padding: 22px 16px 32px !important;
        }
    
        .controls {
          margin-bottom: 20px !important;
          align-items: stretch !important;
        }
    
        .sort-select {
          width: 100% !important;
        }
    
        .grid,
        .recent-grid {
          grid-template-columns: 1fr !important;
          gap: 16px !important;
        }
      }
    
      @media (min-width: 520px) and (max-width: 760px) {
        .home-page .product-row,
        .home-page .recent-product-row {
          grid-template-columns:repeat(2,minmax(0,1fr)) !important;
          gap:14px !important;
        }
      }
    
      @media (min-width: 761px) and (max-width: 980px) {
        .hero-copy h1 {
          font-size: 48px !important;
        }
    
        .hero-content,
        .hero-tools {
          max-width: 920px !important;
        }
      }
    
      @media (max-width: 420px) {
        .hero {
          background-position: 68% center !important;
          min-height: 0;
          padding-top: 34px !important;
        }
    
        .hero-copy h1 {
          font-size: clamp(32px, 9.2vw, 40px) !important;
        }
    
        .hero-copy .hero-actions {
          align-items: center;
          flex-direction: row;
          gap: 10px !important;
          margin-bottom: 0 !important;
        }
    
        .hero-copy .hero-actions button {
          width: auto;
          padding: 12px 16px !important;
        }
    
        .hero-tools .market-toggle {
          grid-template-columns: 1fr !important;
        }
    
        .hero-tools .market-toggle button {
          flex-basis: 100%;
          width: 100%;
          min-width: 0 !important;
        }
    
        .hero-tools .search-input {
          font-size: 15px !important;
        }
    
        .cat-btn,
        .subcat-btn {
          font-size: 11px !important;
          padding-left: 12px !important;
          padding-right: 12px !important;
        }
      }
    `}</style>
  );
}
