import { useEffect, useMemo, useState } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import API, { assetUrl } from '../utils/axiosConfig';
import { useAuth } from '../context/AuthContext';
import { useCart } from '../context/CartContext';
import { formatPKR, formatUSD, getActiveDiscountPercent, getDiscountedPrice } from '../utils/priceUtils';

export default function ProductDetailPage() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { user } = useAuth();
  const { addToCart, addToRecentlyViewed } = useCart();
  const [product, setProduct] = useState(null);
  const [related, setRelated] = useState([]);
  const [selectedImage, setSelectedImage] = useState(0);
  const [quantity, setQuantity] = useState(1);
  const [selectedColor, setSelectedColor] = useState('');
  const [selectedSize, setSelectedSize] = useState('');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [added, setAdded] = useState(false);
  const isPak = !user || user.country === 'Pakistan';
  const market = localStorage.getItem('ic_market_mode') || 'local';
  const isLocalMarket = market === 'local';

  useEffect(() => {
    let active = true;
    setLoading(true);
    setError('');
    API.get(`/api/products/${id}`)
      .then(({ data }) => {
        if (!active) return;
        setProduct(data);
        setSelectedColor(data.colors?.[0] || '');
        setSelectedSize(data.sizes?.[0] || '');
        addToRecentlyViewed(data);
        API.get('/api/products').then(({ data: products }) => {
          if (active) setRelated(products.filter(p => p._id !== data._id && p.category === data.category).slice(0, 4));
        }).catch(() => {});
      })
      .catch(() => active && setError('We could not find that product.'))
      .finally(() => active && setLoading(false));
    return () => { active = false; };
  }, [id]);

  const images = useMemo(() => product?.images?.length ? product.images : [], [product]);
  const restricted = product?.isLocal && !isPak;
  const outOfStock = !product || product.stock < 1;
  const discountPercent = getActiveDiscountPercent(product);
  const originalPrice = Number(isLocalMarket ? product?.pricePKR : product?.priceUSD) || 0;
  const currentPrice = getDiscountedPrice(originalPrice, discountPercent, isLocalMarket ? 'PKR' : 'USD');
  const displayPrice = isLocalMarket ? formatPKR(currentPrice) : formatUSD(currentPrice);
  const alternatePrice = isLocalMarket
    ? formatUSD(getDiscountedPrice(product?.priceUSD, discountPercent, 'USD'))
    : formatPKR(getDiscountedPrice(product?.pricePKR, discountPercent, 'PKR'));

  const handleAdd = () => {
    if (outOfStock || restricted) return;
    addToCart(product, quantity, { color: selectedColor, size: selectedSize });
    setAdded(true);
    setTimeout(() => setAdded(false), 2200);
  };

  if (loading) return <div className="responsive-page" style={S.page}><p style={S.state}>Loading product…</p></div>;
  if (error || !product) return (
    <div className="responsive-page" style={S.page}>
      <div style={S.state}><p style={{ fontSize: 42 }}>🔎</p><h2>{error || 'Product not found'}</h2><Link to="/" style={S.link}>← Back to shopping</Link></div>
    </div>
  );

  return (
    <main className="responsive-page product-detail-page" style={S.page}>
      <div className="product-breadcrumb" style={S.breadcrumb}><Link to="/" style={S.link}>Shop</Link><span>›</span><span>{product.category}</span><span>›</span><strong>{product.name}</strong></div>
      <section className="product-detail-layout" style={S.detail}>
        <div className="product-gallery" style={S.gallery}>
          <div className="product-main-image" style={S.mainImage}>
            {images.length ? <img src={assetUrl(images[selectedImage])} alt={product.name} style={S.image} loading="eager" /> : <span style={S.placeholder}>{product.name[0]}</span>}
          </div>
          {images.length > 1 && <div className="product-thumbs" style={S.thumbs}>{images.map((image, index) => (
            <button key={image + index} className="product-thumb-button" type="button" aria-label={`Show ${product.name}, view ${index + 1}`} aria-pressed={selectedImage === index} onClick={() => setSelectedImage(index)} style={{ ...S.thumb, ...(selectedImage === index ? S.thumbActive : {}) }}>
              <img src={assetUrl(image)} alt={`${product.name}, view ${index + 1}`} />
            </button>
          ))}</div>}
        </div>
        <div className="product-detail-info" style={S.info}>
          <p style={S.category}>{product.category}</p>
          <h1 style={S.title}>{product.name}</h1>
          {(product.subcategory || product.brand || product.model) && (
            <div style={S.meta}>
              {product.subcategory && <span className="product-meta-chip">{product.subcategory}</span>}
              {product.brand && <span className="product-meta-chip">Brand: <strong>{product.brand}</strong></span>}
              {product.model && <span className="product-meta-chip">Model: <strong>{product.model}</strong></span>}
            </div>
          )}
          {(product.colors?.length > 0 || product.sizes?.length > 0) && (
            <div style={S.variants}>
              {product.colors?.length > 0 && <div><label style={S.variantLabel}>Colour</label><div style={S.variantOptions}>{product.colors.map(color => <button type="button" key={color} onClick={() => setSelectedColor(color)} style={{ ...S.variantButton, ...(selectedColor === color ? S.variantButtonActive : {}) }}>{color}</button>)}</div></div>}
              {product.sizes?.length > 0 && <div><label style={S.variantLabel}>Size / Variant</label><div style={S.variantOptions}>{product.sizes.map(size => <button type="button" key={size} onClick={() => setSelectedSize(size)} style={{ ...S.variantButton, ...(selectedSize === size ? S.variantButtonActive : {}) }}>{size}</button>)}</div></div>}
            </div>
          )}
          <div className="product-price-row" style={S.priceRow}>
            <strong className="product-detail-current-price" style={S.price}>{displayPrice}</strong>
            {discountPercent > 0 && <>
              <del className="product-detail-original-price">{isLocalMarket ? formatPKR(originalPrice) : formatUSD(originalPrice)}</del>
              <span className="product-detail-discount">-{discountPercent}%</span>
            </>}
            <span style={S.altPrice}>Approx. {alternatePrice}</span>
          </div>
          <div style={{ ...S.status, color: outOfStock ? '#dc2626' : product.stock < 5 ? '#c2410c' : '#047857', background: outOfStock ? '#fef2f2' : product.stock < 5 ? '#fff7ed' : '#ecfdf5' }}>
            {outOfStock ? '✕ Out of stock' : product.stock < 5 ? `⚠ Only ${product.stock} left` : '✓ In stock and ready to ship'}
          </div>
          {restricted && <p style={S.notice}>🇵🇰 This product is available to customers shopping from Pakistan.</p>}
          <p style={S.description}>{product.description || 'A carefully selected product from our collection.'}</p>
          {!outOfStock && !restricted && <div className="product-purchase" style={S.purchase}>
            <label htmlFor="product-quantity" style={S.label}>Quantity</label>
            <div className="product-quantity-control" style={S.quantity}><button className="quantity-button" type="button" aria-label="Decrease quantity" onClick={() => setQuantity(q => Math.max(1, q - 1))}>−</button><input id="product-quantity" aria-label="Quantity" type="number" min="1" max={product.stock} value={quantity} onChange={e => setQuantity(Math.min(product.stock, Math.max(1, Number(e.target.value) || 1)))} /><button className="quantity-button" type="button" aria-label="Increase quantity" onClick={() => setQuantity(q => Math.min(product.stock, q + 1))}>+</button></div>
            <button type="button" onClick={handleAdd} style={S.addButton}>{added ? '✓ Added to cart' : 'Add to cart'}</button>
            {added && <button type="button" onClick={() => navigate('/cart')} style={S.cartLink}>View cart →</button>}
          </div>}
        </div>
      </section>
      {related.length > 0 && <section className="related-products" style={S.related}><p className="related-kicker">YOU MAY ALSO LIKE</p><h2>More from {product.category}</h2><div className="related-products-grid" style={S.relatedGrid}>{related.map(item => { const itemDiscount = getActiveDiscountPercent(item); const original = isLocalMarket ? item.pricePKR : item.priceUSD; const sale = getDiscountedPrice(original, itemDiscount, isLocalMarket ? 'PKR' : 'USD'); return <Link key={item._id} to={`/products/${item._id}`} style={S.relatedCard} aria-label={`View ${item.name}`}><div style={S.relatedImage}>{item.images?.[0] ? <img src={assetUrl(item.images[0])} alt={item.name} /> : item.name[0]}</div><strong>{item.name}</strong><span>{isLocalMarket ? formatPKR(sale) : formatUSD(sale)}</span></Link>; })}</div></section>}
    </main>
  );
}

const S = {
  page: { maxWidth: 1180, margin: '0 auto', padding: '34px 24px 70px' },
  state: { minHeight: 400, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: 12, color: '#475569' },
  breadcrumb: { display: 'flex', gap: 9, alignItems: 'center', color: '#94a3b8', fontSize: 13, marginBottom: 24, flexWrap: 'wrap' },
  link: { color: '#059669', fontWeight: 700 },
  detail: { display: 'grid', gridTemplateColumns: 'minmax(0, 1.05fr) minmax(340px, .95fr)', gap: 54, alignItems: 'start' },
  gallery: { minWidth: 0 },
  mainImage: { height: 520, borderRadius: 24, background: 'linear-gradient(145deg, #f8fafc, #eef7f2)', overflow: 'hidden', display: 'flex', alignItems: 'center', justifyContent: 'center', border: '1px solid #e2e8f0', boxShadow: '0 18px 44px rgba(15,23,42,.08)' },
  image: { width: '100%', height: '100%', objectFit: 'cover' },
  placeholder: { fontSize: 110, fontWeight: 800, color: '#86efac' },
  thumbs: { display: 'flex', gap: 10, marginTop: 14, overflowX: 'auto' },
  thumb: { width: 76, height: 76, flexShrink: 0, padding: 0, border: '2px solid transparent', borderRadius: 10, overflow: 'hidden', background: '#f8fafc', cursor: 'pointer' },
  thumbActive: { borderColor: '#10b981' },
  info: { padding: '28px 28px 30px', background: '#fff', border: '1px solid #e2e8f0', borderRadius: 24, boxShadow: '0 18px 44px rgba(15,23,42,.07)' },
  category: { color: '#059669', fontSize: 12, fontWeight: 800, textTransform: 'uppercase', letterSpacing: 1, marginBottom: 9 },
  title: { fontSize: 'clamp(30px, 4vw, 48px)', lineHeight: 1.08, color: '#0f172a', margin: '0 0 20px' },
  meta: { display:'flex', flexWrap:'wrap', gap:8, margin:'-8px 0 18px' },
  variants: { display:'flex', flexDirection:'column', gap:16, margin:'0 0 22px' },
  variantLabel: { display:'block', marginBottom:7, color:'#334155', fontSize:12, fontWeight:800 },
  variantOptions: { display:'flex', flexWrap:'wrap', gap:8 },
  variantButton: { padding:'8px 13px', border:'1px solid #cbd5e1', borderRadius:9, background:'#fff', color:'#475569', fontSize:12, fontWeight:700, cursor:'pointer' },
  variantButtonActive: { borderColor:'#059669', background:'#ecfdf5', color:'#047857', boxShadow:'0 0 0 2px rgba(16,185,129,.12)' },
  priceRow: { display: 'flex', gap: 12, alignItems: 'baseline', marginBottom: 18 },
  price: { color: '#059669', fontSize: 28 },
  altPrice: { color: '#94a3b8', fontSize: 14 },
  status: { display: 'inline-block', borderRadius: 999, padding: '8px 13px', fontSize: 13, fontWeight: 700, marginBottom: 14 },
  notice: { background: '#f5f3ff', color: '#6d28d9', padding: 12, borderRadius: 10, fontSize: 13, lineHeight: 1.5 },
  description: { color: '#475569', lineHeight: 1.75, fontSize: 15, whiteSpace: 'pre-wrap', margin: '18px 0 26px' },
  purchase: { borderTop: '1px solid #e2e8f0', paddingTop: 22 },
  label: { display: 'block', color: '#334155', fontSize: 13, fontWeight: 700, marginBottom: 8 },
  quantity: { display: 'flex', width: 140, border: '1px solid #cbd5e1', borderRadius: 10, overflow: 'hidden', marginBottom: 14 },
  addButton: { width: '100%', border: 0, borderRadius: 10, background: '#059669', color: '#fff', fontWeight: 800, fontSize: 16, padding: '15px 20px', cursor: 'pointer' },
  cartLink: { display: 'block', width: '100%', border: 0, background: 'transparent', color: '#059669', fontWeight: 700, padding: '12px 0', cursor: 'pointer' },
  related: { borderTop: '1px solid #e2e8f0', marginTop: 70, paddingTop: 32 },
  relatedGrid: { display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 18, marginTop: 20 },
  relatedCard: { color: '#0f172a', display: 'flex', flexDirection: 'column', gap: 7, fontSize: 14, fontWeight: 700 },
  relatedImage: { height: 170, borderRadius: 14, background: '#f1f5f9', display: 'flex', alignItems: 'center', justifyContent: 'center', overflow: 'hidden', fontSize: 42, color: '#86efac', fontWeight: 800 },
};
