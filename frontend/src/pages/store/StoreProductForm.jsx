import { useEffect, useRef, useState } from 'react';
import API, { assetUrl } from '../../utils/axiosConfig';

const MULTIPART = { headers: { 'Content-Type': 'multipart/form-data' } };

const EMPTY = {
  name:'', category:'', subcategory:'', brand:'', pricePKR:'', priceUSD:'', discountPercent:0,
  stock:'', weightKg:'', colors:'', sizes:'', description:'', isLocal:false, isVisible:true,
};

const fromProduct = product => product ? {
  name: product.name || '', category: product.category || '', subcategory: product.subcategory || '', brand: product.brand || '',
  pricePKR: product.pricePKR ?? '', priceUSD: product.priceUSD ?? '', discountPercent: product.discountPercent || 0,
  stock: product.stock ?? '', weightKg: product.weightKg || '', colors: (product.colors || []).join(', '), sizes: (product.sizes || []).join(', '),
  description: product.description || '', isLocal: Boolean(product.isLocal), isVisible: product.isVisible !== false,
} : EMPTY;

// Add or edit one product of the store owner's own store. The server decides the store.
export default function StoreProductForm({ product = null, onSaved, onCancel }) {
  const editing = Boolean(product?._id);
  const [form, setForm] = useState(() => fromProduct(product));
  const [keptImages, setKeptImages] = useState(product?.images || []);
  const [files, setFiles] = useState([]);
  const [categories, setCategories] = useState([]);
  const [error, setError] = useState('');
  const [saving, setSaving] = useState(false);
  const fileRef = useRef(null);

  useEffect(() => {
    setForm(fromProduct(product));
    setKeptImages(product?.images || []);
    setFiles([]);
    setError('');
  }, [product]);

  useEffect(() => {
    let active = true;
    Promise.resolve(API.get('/api/products/categories'))
      .then(response => { if (active && Array.isArray(response?.data)) setCategories(response.data); })
      .catch(() => {});
    return () => { active = false; };
  }, []);

  const set = (field, value) => setForm(current => ({ ...current, [field]: value }));
  const imageCount = keptImages.length + files.length;

  const pickFiles = event => {
    const chosen = Array.from(event.target.files || []);
    const room = 5 - keptImages.length - files.length;
    if (chosen.length > room) setError(`A product can have at most 5 images. ${room > 0 ? `You can add ${room} more.` : 'Remove one first.'}`);
    setFiles(current => [...current, ...chosen.slice(0, Math.max(0, room))]);
    if (fileRef.current) fileRef.current.value = '';
  };

  const submit = async event => {
    event.preventDefault();
    setError('');
    if (!form.name.trim() || !form.category.trim()) { setError('Name and category are required.'); return; }
    if (!(Number(form.pricePKR) > 0) || !(Number(form.priceUSD) > 0)) { setError('Enter both prices (PKR and USD) above 0.'); return; }
    if (form.stock === '' || Number(form.stock) < 0) { setError('Enter how many you have in stock.'); return; }
    const discount = Number(form.discountPercent) || 0;
    if (discount < 0 || discount > 100) { setError('Discount must be between 0 and 100 percent.'); return; }

    const body = new FormData();
    Object.entries(form).forEach(([key, value]) => body.append(key, typeof value === 'boolean' ? String(value) : String(value).trim()));
    files.forEach(file => body.append('images', file));
    if (editing) {
      body.append('replaceImages', 'true');
      keptImages.forEach(image => body.append('keptImages', image));
    }
    setSaving(true);
    try {
      const { data } = editing
        ? await API.put(`/api/products/${product._id}`, body, MULTIPART)
        : await API.post('/api/products', body, MULTIPART);
      onSaved?.(data, editing);
      if (!editing) { setForm(EMPTY); setFiles([]); setKeptImages([]); }
    } catch (err) {
      setError(err.response?.data?.message || 'The product could not be saved.');
    } finally {
      setSaving(false);
    }
  };

  const field = (label, name, props = {}) => (
    <label className="sa-field">
      <span>{label}</span>
      <input value={form[name]} onChange={e => set(name, e.target.value)} {...props} />
    </label>
  );

  return (
    <form className="sa-card sa-form" onSubmit={submit} aria-label={editing ? 'Edit product' : 'Add product'}>
      <h2>{editing ? `Edit: ${product.name}` : 'Add a product'}</h2>
      {error && <p className="sa-alert" role="alert">{error}</p>}
      <div className="sa-grid">
        {field('Product name *', 'name', { maxLength:200, required:true })}
        <label className="sa-field">
          <span>Category *</span>
          <input list="sa-categories" value={form.category} onChange={e => set('category', e.target.value)} maxLength={100} required />
          <datalist id="sa-categories">{categories.map(name => <option key={name} value={name} />)}</datalist>
        </label>
        {field('Subcategory', 'subcategory', { maxLength:100 })}
        {field('Brand', 'brand', { maxLength:100 })}
        {field('Price (PKR) *', 'pricePKR', { type:'number', min:1, step:'any', required:true })}
        {field('Price (USD) *', 'priceUSD', { type:'number', min:0.01, step:'any', required:true })}
        {field('Discount (%)', 'discountPercent', { type:'number', min:0, max:100 })}
        {field('Stock *', 'stock', { type:'number', min:0, required:true })}
        {field('Weight (kg)', 'weightKg', { type:'number', min:0, step:'any', placeholder:'For shipping' })}
        {field('Colours (comma separated)', 'colors', { placeholder:'Red, Blue' })}
        {field('Sizes (comma separated)', 'sizes', { placeholder:'S, M, L' })}
      </div>
      <label className="sa-field">
        <span>Description</span>
        <textarea rows={4} maxLength={5000} value={form.description} onChange={e => set('description', e.target.value)} />
      </label>
      <div className="sa-checks">
        <label><input type="checkbox" checked={form.isVisible} onChange={e => set('isVisible', e.target.checked)} /> Show in the shop</label>
        <label><input type="checkbox" checked={form.isLocal} onChange={e => set('isLocal', e.target.checked)} /> Pakistan delivery only</label>
      </div>

      <div className="sa-field">
        <span>Images ({imageCount}/5)</span>
        <div className="sa-images">
          {keptImages.map(image => (
            <figure key={image}>
              <img src={assetUrl(image)} alt="" />
              <button type="button" aria-label="Remove image" onClick={() => setKeptImages(list => list.filter(item => item !== image))}>×</button>
            </figure>
          ))}
          {files.map((file, index) => (
            <figure key={`${file.name}-${index}`}>
              <img src={URL.createObjectURL(file)} alt="" />
              <button type="button" aria-label={`Remove ${file.name}`} onClick={() => setFiles(list => list.filter((_, i) => i !== index))}>×</button>
            </figure>
          ))}
          {imageCount < 5 && (
            <label className="sa-upload">
              <input ref={fileRef} type="file" accept="image/jpeg,image/png,image/webp" multiple onChange={pickFiles} />
              + Add images
            </label>
          )}
        </div>
        <small>JPG, PNG or WEBP, up to 5 MB each.</small>
      </div>

      <div className="sa-actions">
        <button type="submit" className="sa-primary" disabled={saving}>{saving ? 'Saving…' : editing ? 'Save changes' : 'Publish product'}</button>
        {onCancel && <button type="button" className="sa-ghost" onClick={onCancel}>Cancel</button>}
      </div>
    </form>
  );
}
