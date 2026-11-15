import { useCallback, useEffect, useState } from 'react';
import API from '../../utils/axiosConfig';
import { formatPKR } from '../../utils/priceUtils';
import BusinessInsightsPanel from './dashboard/BusinessInsightsPanel';
import '../store/storeAdmin.css';

const PERIODS = [[7, '7 days'], [30, '30 days'], [90, '90 days'], [365, '12 months']];

// Main admin: create store owners (sub-admins), manage them and compare every store.
export default function StoresPanel({ themeMode = 'light', flash = () => {} }) {
  const [form, setForm] = useState({ email:'', storeName:'' });
  const [creating, setCreating] = useState(false);
  const [formError, setFormError] = useState('');
  const [credentials, setCredentials] = useState(null);
  const [copied, setCopied] = useState(false);
  const [days, setDays] = useState(30);
  const [rows, setRows] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [selected, setSelected] = useState(null);
  const [busy, setBusy] = useState('');

  const load = useCallback(() => {
    setLoading(true);
    return Promise.resolve(API.get('/api/stores/analytics', { params:{ days } }))
      .then(response => { setRows(Array.isArray(response?.data?.stores) ? response.data.stores : []); setError(''); })
      .catch(err => setError(err.response?.data?.message || 'Stores could not be loaded.'))
      .finally(() => setLoading(false));
  }, [days]);

  useEffect(() => { load(); }, [load]);

  const create = async event => {
    event.preventDefault();
    setFormError('');
    if (!/^\S+@\S+\.\S+$/.test(form.email.trim())) { setFormError('Enter the store owner\'s email address.'); return; }
    if (form.storeName.trim().length < 2) { setFormError('Enter a store name (at least 2 characters).'); return; }
    setCreating(true);
    try {
      const { data } = await API.post('/api/stores', { email:form.email.trim(), storeName:form.storeName.trim() });
      setCredentials({ ...data.credentials, storeName:data.store.name, emailed:data.emailed, isReset:false });
      setCopied(false);
      setForm({ email:'', storeName:'' });
      flash(`Store "${data.store.name}" created.`);
      load();
    } catch (err) {
      setFormError(err.response?.data?.message || 'The store could not be created.');
    } finally {
      setCreating(false);
    }
  };

  const toggleStore = async row => {
    setBusy(row.id);
    try {
      await API.patch(`/api/stores/${row.id}`, { isActive: !row.isActive });
      flash(row.isActive ? `${row.name} is switched off. Its products are hidden and the owner is signed out.` : `${row.name} is switched on.`);
      load();
    } catch (err) {
      setError(err.response?.data?.message || 'The store could not be updated.');
    } finally { setBusy(''); }
  };

  const resetPassword = async row => {
    setBusy(row.id);
    try {
      const { data } = await API.post(`/api/stores/${row.id}/reset-password`);
      setCredentials({ ...data.credentials, storeName:row.name, emailed:data.emailed, isReset:true });
      setCopied(false);
      window.scrollTo?.({ top:0, behavior:'smooth' });
    } catch (err) {
      setError(err.response?.data?.message || 'The password could not be reset.');
    } finally { setBusy(''); }
  };

  const copy = async () => {
    const text = `IndusCart store: ${credentials.storeName}\nSign in: ${credentials.loginUrl}\nUsername: ${credentials.username}\nTemporary password: ${credentials.password}`;
    try { await navigator.clipboard.writeText(text); setCopied(true); } catch { setCopied(false); }
  };

  const totals = rows.reduce((sum, row) => ({ sales: sum.sales + row.netSales, orders: sum.orders + row.orders }), { sales:0, orders:0 });

  return (
    <div className="store-admin" style={{ padding:0, maxWidth:'none' }}>
      <section className="sa-card" aria-labelledby="stores-create-title">
        <h2 id="stores-create-title">Add a store owner</h2>
        <p className="sa-muted" style={{ marginTop:-6 }}>They get their own login. They can only add, edit and delete their own store's products and see their own store's sales. No orders, customers, coupons or settings.</p>
        <form onSubmit={create} aria-label="Create store owner">
          {formError && <p className="sa-alert" role="alert">{formError}</p>}
          <div className="sa-grid">
            <label className="sa-field"><span>Owner's email</span><input type="email" autoComplete="off" value={form.email} onChange={e => setForm(f => ({ ...f, email:e.target.value }))} placeholder="owner@example.com" required /></label>
            <label className="sa-field"><span>Store name</span><input maxLength={80} value={form.storeName} onChange={e => setForm(f => ({ ...f, storeName:e.target.value }))} placeholder="e.g. Lahore Crafts" required /></label>
          </div>
          <div className="sa-actions"><button type="submit" className="sa-primary" disabled={creating}>{creating ? 'Creating…' : 'Create store and login'}</button></div>
        </form>

        {credentials && (
          <div className="sa-alert sa-alert-ok" role="status" style={{ marginTop:16 }}>
            <p style={{ margin:'0 0 8px', fontSize:14 }}><strong>{credentials.isReset ? 'New password' : 'Login details'} for {credentials.storeName}</strong></p>
            <dl className="sa-details" style={{ marginBottom:10 }}>
              <div><dt>Sign-in page</dt><dd>{credentials.loginUrl}</dd></div>
              <div><dt>Username</dt><dd>{credentials.username}</dd></div>
              <div><dt>Temporary password</dt><dd style={{ fontFamily:'ui-monospace, Menlo, monospace' }}>{credentials.password}</dd></div>
            </dl>
            <p style={{ margin:'0 0 10px', fontWeight:500 }}>
              {credentials.emailed ? `These were also emailed to ${credentials.email}. ` : 'Email is not set up, so send these to the owner yourself. '}
              This password is shown only now. The owner will be asked to change it after signing in.
            </p>
            <div className="sa-actions">
              <button type="button" className="sa-primary" onClick={copy}>{copied ? 'Copied ✓' : 'Copy login details'}</button>
              <button type="button" className="sa-ghost" onClick={() => setCredentials(null)}>Done</button>
            </div>
          </div>
        )}
      </section>

      <section className="sa-card" aria-labelledby="stores-list-title">
        <div className="sa-row">
          <div>
            <h2 id="stores-list-title">Stores performance</h2>
            <p className="sa-muted" style={{ margin:'-8px 0 0' }}>Each store's own product sales (PKR, cancelled and returned orders not counted). All stores: {formatPKR(totals.sales)} from {totals.orders} orders.</p>
          </div>
          <div role="group" aria-label="Period" className="sa-row-actions">
            {PERIODS.map(([value, label]) => (
              <button key={value} type="button" className={days === value ? 'sa-primary' : 'sa-ghost'} aria-pressed={days === value} onClick={() => setDays(value)}>{label}</button>
            ))}
          </div>
        </div>
        {error && <p className="sa-alert" role="alert">{error}</p>}
        {loading && !rows.length ? <p className="sa-muted" role="status">Loading…</p> : (
          <div className="sa-table-wrap">
            <table className="sa-table">
              <thead><tr><th>Store</th><th>Owner login</th><th>Products</th><th>Sales</th><th>Change</th><th>Orders</th><th>Returned</th><th>Stock issues</th><th>Status</th><th><span className="sa-sr">Actions</span></th></tr></thead>
              <tbody>
                {rows.map(row => (
                  <tr key={row.key}>
                    <td><strong>{row.name}</strong></td>
                    <td>{row.owner ? <>{row.owner.username}<br /><small className="sa-muted">{row.owner.email}</small></> : <span className="sa-muted">You</span>}</td>
                    <td>{row.products}</td>
                    <td><strong>{formatPKR(row.netSales)}</strong></td>
                    <td>{row.salesChange === null ? <span className="sa-muted">new</span> : <span style={{ color: row.salesChange >= 0 ? '#047857' : '#be123c', fontWeight:800, whiteSpace:'nowrap' }}>{row.salesChange > 0 ? '▲' : row.salesChange < 0 ? '▼' : ''} {Math.abs(row.salesChange)}%</span>}</td>
                    <td>{row.orders}</td>
                    <td className={row.returnRate >= 10 ? 'sa-warn' : ''}>{row.returnRate}%</td>
                    <td className={row.outOfStock + row.lowStock > 0 ? 'sa-warn' : ''} style={{ whiteSpace:'nowrap' }}>{row.outOfStock} out<br />{row.lowStock} low</td>
                    <td><span className={`sa-pill${row.isActive ? ' is-on' : ''}`} style={{ cursor:'default' }}>{row.isActive ? 'Active' : 'Switched off'}</span></td>
                    <td className="sa-cell-actions"><div className="sa-actions-row">
                      <button type="button" className="sa-ghost" onClick={() => setSelected(selected?.key === row.key ? null : row)} aria-expanded={selected?.key === row.key} aria-label={`Report for ${row.name}`}>Report</button>
                      {row.id && <>
                        <button type="button" className="sa-ghost" disabled={busy === row.id} onClick={() => resetPassword(row)} aria-label={`Reset password for ${row.name}`}>Reset password</button>
                        <button type="button" className={`sa-ghost${row.isActive ? ' sa-ghost-danger' : ''}`} disabled={busy === row.id} onClick={() => toggleStore(row)} aria-label={`${row.isActive ? 'Switch off' : 'Switch on'} ${row.name}`}>{row.isActive ? 'Switch off' : 'Switch on'}</button>
                      </>}
                    </div></td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </section>

      {selected && (
        <section className="sa-card" aria-label={`${selected.name} report`}>
          <BusinessInsightsPanel themeMode={themeMode} endpoint="/api/stores/analytics" params={{ store: selected.id || 'main' }} title={`${selected.name}: performance`} />
        </section>
      )}
    </div>
  );
}
