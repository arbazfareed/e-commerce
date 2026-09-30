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
    {wishlist.length === 0 ? <section style={{ padding:'45px 22px', textAlign:'center', background:'var(--surface, #fff)', border:'1px solid #e2e8f0', borderRadius:18 }}><p style={{ fontSize:44, margin:'0 0 10px' }}>♡</p><h2 style={{ margin:'0 0 8px', color:'var(--ink, #1e293b)', fontSize:20 }}>Nothing saved yet</h2><p style={{ margin:'0 0 18px', color:'var(--muted, #64748b)', fontSize:13 }}>Tap the heart on a product to add it here.</p><Link to="/" style={{ display:'inline-block', padding:'11px 17px', borderRadius:10, background:'#059669', color:'#fff', textDecoration:'none', fontWeight:800, fontSize:13 }}>Browse products</Link></section> : <div className="wishlist-grid">
      {wishlist.map(product => {
        const price = getDiscountedPrice(isPak ? product.pricePKR : product.priceUSD, getActiveDiscountPercent(product), currency);
        return <article key={product._id} className="wishlist-card">
          <Link to={`/products/${product._id}`} className="wishlist-product-image" aria-label={`View ${product.name}`}>
            {product.images?.[0]
              ? <img src={assetUrl(product.images[0])} alt={product.name} loading="lazy" />
              : <span className="wishlist-image-placeholder">{product.name?.[0] || 'I'}</span>}
          </Link>
          <div className="wishlist-card-body">
            <h2><Link to={`/products/${product._id}`} className="wishlist-product-title">{product.name}</Link></h2>
            <strong className="wishlist-product-price">{isPak ? formatPKR(price) : formatUSD(price)}</strong>
            <div className="wishlist-actions">
              <button className="wishlist-move-button" type="button" disabled={!product.stock} onClick={() => { addToCart(product); removeFromWishlist(product._id); navigate('/cart'); }}>{product.stock ? 'Move to cart' : 'Out of stock'}</button>
              <button className="wishlist-remove-button" type="button" onClick={() => removeFromWishlist(product._id)} aria-label={`Remove ${product.name} from wishlist`}>Remove</button>
            </div>
          </div>
        </article>;
      })}
    </div>}
  </main>;
}