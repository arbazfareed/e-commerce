import { Link, useNavigate } from 'react-router-dom';
import { useCart } from '../context/CartContext';
import { assetUrl } from '../utils/axiosConfig';
import { formatPKR, formatUSD, getActiveDiscountPercent, getDiscountedPrice } from '../utils/priceUtils';
import { useAuth } from '../context/AuthContext';

export default function WishlistPage() {
  const { wishlist, removeFromWishlist, addToCart } = useCart();
  const { user } = useAuth();
  const navigate = useNavigate();
  const isPak = !user || user.country === 'Pakistan';
  const currency = isPak ? 'PKR' : 'USD';

  return <main className="responsive-page wishlist-page" style={{ maxWidth:1120, minHeight:'70vh', margin:'0 auto', padding:'34px 22px 70px' }}>
    <header style={{ marginBottom:22 }}><h1 style={{ margin:'0 0 6px', fontSize:30, fontWeight:900, color:'var(--ink, #0f172a)' }}>Your wishlist</h1><p style={{ margin:0, color:'var(--muted, #64748b)', fontSize:14 }}>Saved products stay here so you can come back to them later.</p></header>
    {wishlist.length === 0 ? <section style={{ padding:'45px 22px', textAlign:'center', background:'var(--surface, #fff)', border:'1px solid #e2e8f0', borderRadius:18 }}><p style={{ fontSize:44, margin:'0 0 10px' }}>♡</p><h2 style={{ margin:'0 0 8px', color:'var(--ink, #1e293b)', fontSize:20 }}>Nothing saved yet</h2><p style={{ margin:'0 0 18px', color:'var(--muted, #64748b)', fontSize:13 }}>Tap the heart on a product to add it here.</p><Link to="/" style={{ display:'inline-block', padding:'11px 17px', borderRadius:10, background:'#059669', color:'#fff', textDecoration:'none', fontWeight:800, fontSize:13 }}>Browse products</Link></section> : <div style={{ display:'grid', gridTemplateColumns:'repeat(auto-fit,minmax(225px,1fr))', gap:15 }}>
      {wishlist.map(product => {
        const price = getDiscountedPrice(isPak ? product.pricePKR : product.priceUSD, getActiveDiscountPercent(product), currency);
        return <article key={product._id} style={{ overflow:'hidden', background:'var(--surface, #fff)', border:'1px solid #e2e8f0', borderRadius:16, boxShadow:'0 7px 20px rgba(15,23,42,.05)' }}>
          <Link to={`/products/${product._id}`} aria-label={`View ${product.name}`} style={{ display:'block', height:190, background:'#f1f5f9', overflow:'hidden' }}>{product.images?.[0] ? <img src={assetUrl(product.images[0])} alt={product.name} style={{ width:'100%', height:'100%', objectFit:'cover' }} /> : <span style={{ height:'100%', display:'grid', placeItems:'center', color:'#059669', fontSize:42, fontWeight:900 }}>{product.name?.[0] || 'I'}</span>}</Link>
          <div style={{ padding:14 }}><h2 style={{ margin:'0 0 7px', fontSize:16, lineHeight:1.4 }}><Link to={`/products/${product._id}`} style={{ color:'var(--ink, #1e293b)', textDecoration:'none' }}>{product.name}</Link></h2><strong style={{ color:'#047857', fontSize:15 }}>{isPak ? formatPKR(price) : formatUSD(price)}</strong>
            <div style={{ display:'flex', gap:8, marginTop:13 }}><button type="button" disabled={!product.stock} onClick={() => { addToCart(product); removeFromWishlist(product._id); navigate('/cart'); }} style={{ flex:1, border:0, borderRadius:9, background:product.stock ? '#059669' : '#94a3b8', color:'#fff', padding:'9px 10px', fontWeight:800, cursor:product.stock ? 'pointer' : 'not-allowed' }}>{product.stock ? 'Move to cart' : 'Out of stock'}</button><button type="button" onClick={() => removeFromWishlist(product._id)} aria-label={`Remove ${product.name} from wishlist`} style={{ border:'1px solid #fecaca', borderRadius:9, background:'#fff5f5', color:'#b91c1c', padding:'9px 11px', fontWeight:800, cursor:'pointer' }}>Remove</button></div>
          </div>
        </article>;
      })}
    </div>}
  </main>;
}