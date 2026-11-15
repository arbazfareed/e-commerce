import { useCallback, useEffect, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import API, { assetUrl } from '../utils/axiosConfig';
import { useAuth } from '../context/AuthContext';
import { formatPKR } from '../utils/priceUtils';
import BusinessInsightsPanel from './admin/dashboard/BusinessInsightsPanel';
import StoreProductForm from './store/StoreProductForm';
import './store/storeAdmin.css';
import usePageMeta from '../hooks/usePageMeta';

const TABS = [
  ['overview', 'Overview'],
  ['products', 'My products'],
  ['add', 'Add product'],
  ['account', 'Account'],
];

// Panel for a store owner (sub-admin). Everything here is limited to their own store
// by the server; this page never calls main-admin endpoints.
export default function StoreAdminPage() {
  usePageMeta('My store');
  const { user, updateUser } = useAuth();
  const { section } = useParams();
  const navigate = useNavigate();
  const tab = TABS.some(([id]) => id === section) ? section : 'overview';
  const open = id => navigate(id === 'overview' ? '/admin' : `/admin/${id}`);
  const themeMode = typeof document !== 'undefined' && document.documentElement.dataset.theme === 'dark' ? 'dark' : 'light';

  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [notice, setNotice] = useState('');
  const [editing, setEditing] = useState(null);
  const [confirmDelete, setConfirmDelete] = useState(null);
  const [query, setQuery] = useState('');

  const loadProducts = useCallback(() => {
    setLoading(true);
    return Promise.resolve(API.get('/api/products/manage'))
      .then(response => { setProducts(Array.isArray(response?.data) ? response.data : []); setError(''); })
      .catch(err => setError(err.response?.data?.message || 'Your products could not be loaded.'))
      .finally(() => setLoading(false));
  }, []);

  useEffect(() => { loadProducts(); }, [loadProducts]);

  const flash = text => { setNotice(text); window.setTimeout(() => setNotice(''), 3500); };

  const removeProduct = async product => {
    try {
      await API.delete(`/api/products/${product._id}`);
      setProducts(list => list.filter(item => item._id !== product._id));
      flash(`${product.name} was deleted.`);
    } catch (err) {
      setError(err.response?.data?.message || 'The product could not be deleted.');
    } finally {
      setConfirmDelete(null);
    }
  };

  const toggleVisible = async product => {
    try {
      const body = new FormData();
      body.append('isVisible', String(product.isVisible === false));
      const { data } = await API.put(`/api/products/${product._id}`, body, { headers: { 'Content-Type': 'multipart/form-data' } });
      setProducts(list => list.map(item => (item._id === data._id ? data : item)));
    } catch (err) {
      setError(err.response?.data?.message || 'The product could not be updated.');
    }
  };

  const filtered = products.filter(product => !query.trim()
    || `${product.name} ${product.category} ${product.subcategory}`.toLowerCase().includes(query.trim().toLowerCase()));
  const lowStock = products.filter(product => Number(product.stock) < 5).length;

  return (
    <main className={`store-admin${themeMode === 'dark' ? ' is-dark' : ''}`}>
      <header className="sa-hero">
        <div>
          <p className="sa-kicker">Store owner</p>
          <h1>{user?.storeName || user?.name || 'My store'}</h1>
          <p className="sa-sub">Signed in as <strong>{user?.username || user?.email}</strong>. You can manage this store's products and see its sales.</p>
        </div>
        <div className="sa-hero-stats">
          <span><strong>{products.length}</strong> products</span>
          <span><strong>{lowStock}</strong> low on stock</span>
        </div>
      </header>

      {user?.mustChangePassword && (
        <p className="sa-alert sa-alert-warn" role="alert">
          You are using a temporary password. <button type="button" className="sa-link" onClick={() => open('account')}>Choose your own password</button> to keep your store safe.
        </p>
      )}

      <nav className="sa-tabs" aria-label="Store sections">
        {TABS.map(([id, label]) => (
          <button key={id} type="button" className={tab === id ? 'is-active' : ''} aria-current={tab === id ? 'page' : undefined}
            onClick={() => { setEditing(null); open(id); }}>{label}</button>
        ))}
      </nav>

      {notice && <p className="sa-alert sa-alert-ok" role="status">{notice}</p>}
      {error && <p className="sa-alert" role="alert">{error}</p>}

      {tab === 'overview' && (
        <BusinessInsightsPanel themeMode={themeMode} endpoint="/api/stores/analytics" title="My store performance" />
      )}

      {tab === 'products' && (editing ? (
        <StoreProductForm product={editing} onCancel={() => setEditing(null)}
          onSaved={saved => { setProducts(list => list.map(item => (item._id === saved._id ? saved : item))); setEditing(null); flash('Product saved.'); }} />
      ) : (
        <section className="sa-card" aria-labelledby="sa-products-title">
          <div className="sa-row">
            <h2 id="sa-products-title">My products</h2>
            <div className="sa-row-actions">
              <input type="search" aria-label="Search my products" placeholder="Search my products" value={query} onChange={e => setQuery(e.target.value)} />
              <button type="button" className="sa-primary" onClick={() => open('add')}>+ Add product</button>
            </div>
          </div>
          {loading ? <p className="sa-muted" role="status">Loading…</p> : filtered.length === 0 ? (
            <p className="sa-muted">{products.length ? 'No products match your search.' : 'No products yet. Add your first product to start selling.'}</p>
          ) : (
            <div className="sa-table-wrap">
              <table className="sa-table">
                <thead><tr><th>Product</th><th>Category</th><th>Price</th><th>Stock</th><th>In shop</th><th><span className="sa-sr">Actions</span></th></tr></thead>
                <tbody>
                  {filtered.map(product => (
                    <tr key={product._id}>
                      <td>
                        <div className="sa-product">
                          <span className="sa-thumb">{product.images?.[0] ? <img src={assetUrl(product.images[0])} alt="" /> : product.name?.[0]}</span>
                          <strong>{product.name}</strong>
                        </div>
                      </td>
                      <td>{[product.category, product.subcategory].filter(Boolean).join(' · ')}</td>
                      <td>{formatPKR(product.pricePKR)}{product.discountPercent > 0 && <small className="sa-muted"> −{product.discountPercent}%</small>}</td>
                      <td className={Number(product.stock) < 5 ? 'sa-warn' : ''}>{product.stock}</td>
                      <td>
                        <button type="button" className={`sa-pill${product.isVisible === false ? '' : ' is-on'}`} aria-pressed={product.isVisible !== false}
                          aria-label={`${product.isVisible === false ? 'Show' : 'Hide'} ${product.name} in the shop`} onClick={() => toggleVisible(product)}>
                          {product.isVisible === false ? 'Hidden' : 'Visible'}
                        </button>
                      </td>
                      <td className="sa-cell-actions">
                        {confirmDelete === product._id ? (
                          <>
                            <button type="button" className="sa-danger" onClick={() => removeProduct(product)}>Confirm delete</button>
                            <button type="button" className="sa-ghost" onClick={() => setConfirmDelete(null)}>Keep</button>
                          </>
                        ) : (
                          <>
                            <button type="button" className="sa-ghost" onClick={() => setEditing(product)} aria-label={`Edit ${product.name}`}>Edit</button>
                            <button type="button" className="sa-ghost sa-ghost-danger" onClick={() => setConfirmDelete(product._id)} aria-label={`Delete ${product.name}`}>Delete</button>
                          </>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </section>
      ))}

      {tab === 'add' && (
        <StoreProductForm onSaved={saved => { setProducts(list => [saved, ...list]); flash(`${saved.name} is published.`); open('products'); }} />
      )}

      {tab === 'account' && <AccountTab user={user} updateUser={updateUser} flash={flash} />}
    </main>
  );
}

function AccountTab({ user, updateUser, flash }) {
  const [form, setForm] = useState({ currentPassword:'', newPassword:'', confirmPassword:'' });
  const [error, setError] = useState('');
  const [saving, setSaving] = useState(false);

  const submit = async event => {
    event.preventDefault();
    setError('');
    if (form.newPassword.length < 12) { setError('Your new password must be at least 12 characters.'); return; }
    if (form.newPassword !== form.confirmPassword) { setError('The new passwords do not match.'); return; }
    setSaving(true);
    try {
      const { data } = await API.patch('/api/auth/password', { currentPassword:form.currentPassword, newPassword:form.newPassword });
      updateUser({ ...(data.token ? { token:data.token } : {}), mustChangePassword:false });
      setForm({ currentPassword:'', newPassword:'', confirmPassword:'' });
      flash('Your password was changed.');
    } catch (err) {
      setError(err.response?.data?.message || 'Your password could not be changed.');
    } finally {
      setSaving(false);
    }
  };

  return (
    <section className="sa-card sa-form" aria-labelledby="sa-account-title">
      <h2 id="sa-account-title">Account</h2>
      <dl className="sa-details">
        <div><dt>Store</dt><dd>{user?.storeName}</dd></div>
        <div><dt>Username</dt><dd>{user?.username}</dd></div>
        <div><dt>Email</dt><dd>{user?.email}</dd></div>
      </dl>
      <form onSubmit={submit} aria-label="Change password">
        <h3>Change password</h3>
        {error && <p className="sa-alert" role="alert">{error}</p>}
        <div className="sa-grid">
          <label className="sa-field"><span>Current password</span><input type="password" autoComplete="current-password" value={form.currentPassword} onChange={e => setForm(f => ({ ...f, currentPassword:e.target.value }))} required /></label>
          <label className="sa-field"><span>New password (12+ characters)</span><input type="password" autoComplete="new-password" minLength={12} value={form.newPassword} onChange={e => setForm(f => ({ ...f, newPassword:e.target.value }))} required /></label>
          <label className="sa-field"><span>Confirm new password</span><input type="password" autoComplete="new-password" minLength={12} value={form.confirmPassword} onChange={e => setForm(f => ({ ...f, confirmPassword:e.target.value }))} required /></label>
        </div>
        <div className="sa-actions"><button type="submit" className="sa-primary" disabled={saving}>{saving ? 'Updating…' : 'Update password'}</button></div>
      </form>
    </section>
  );
}
