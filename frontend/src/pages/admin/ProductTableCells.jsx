import { useState } from 'react';
import { assetUrl } from '../../utils/axiosConfig';

export const ThumbCell = ({ p }) => {
  const [err, setErr] = useState(false);
  const img = p.images?.[0];
  return img && !err
    ? <img src={assetUrl(img)} alt={p.name}
        style={{ width:46, height:46, borderRadius:10, objectFit:'cover', border:'1.5px solid #e2e8f0', display:'block' }}
        onError={() => setErr(true)} />
    : <div style={{ width:46, height:46, borderRadius:10, background:'linear-gradient(135deg,#f0fdf4,#dcfce7)', display:'flex', alignItems:'center', justifyContent:'center', fontSize:18, fontWeight:900, color:'#10b981', border:'1.5px solid #d1fae5', fontFamily:"'Sora',sans-serif" }}>
        {p.name[0]}
      </div>;
};
export const StockCell = ({ n }) => (
  <span style={{ fontWeight:800, fontFamily:"'JetBrains Mono',monospace", fontSize:13, color: n===0?'#ef4444':n<5?'#f97316':'#334155' }}>
    {n===0 ? '⊘ Out' : n<5 ? `⚠ ${n}` : n}
  </span>
);
