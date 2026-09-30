import { useEffect, useState } from 'react';
import API from '../../utils/axiosConfig';

const EMPTY_FORM = {
  code: '', description: '', discountType: 'percentage', discountValue: '',
  currency: 'PKR', minimumOrderAmount: '0', expiresAt: '', usageLimit: '', isActive: true,
};

const fieldStyle = darkMode => ({
  width: '100%', boxSizing: 'border-box', padding: '10px 12px', border: `1px solid ${darkMode ? '#41534a' : '#cbd5e1'}`,
  borderRadius: 9, background: darkMode ? '#101a15' : '#fff', color: darkMode ? '#eef7f1' : '#1e293b', font: 'inherit', fontSize: 13,
});
const labelStyle = darkMode => ({ display: 'grid', gap: 6, color: darkMode ? '#d1ded6' : '#475569', fontSize: 12, fontWeight: 700 });

export default function CouponsPanel({ darkMode = false, flash = () => {} }) {
  const [coupons, setCoupons] = useState([]);
  const [form, setForm] = useState(EMPTY_FORM);
  const [editingId, setEditingId] = useState(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  const loadCoupons = async () => {
    try {
      const { data } = await API.get('/api/coupons');
      setCoupons(Array.isArray(data) ? data : []);
    } catch (error) {
      flash(error.response?.data?.message || 'Could not load coupons.', false);
    } finally { setLoading(false); }
  };

  useEffect(() => { loadCoupons(); }, []);

  const set = key => event => setForm(current => ({ ...current, [key]: event.target.type === 'checkbox' ? event.target.checked : event.target.value }));

  const resetForm = () => { setForm(EMPTY_FORM); setEditingId(null); };

  const editCoupon = coupon => {
    setEditingId(coupon._id);
    setForm({
      code: coupon.code || '', description: coupon.description || '', discountType: coupon.discountType || 'percentage',
      discountValue: String(coupon.discountValue ?? ''), currency: coupon.currency || 'PKR',
      minimumOrderAmount: String(coupon.minimumOrderAmount ?? 0), expiresAt: coupon.expiresAt || '',
      usageLimit: coupon.usageLimit == null ? '' : String(coupon.usageLimit), isActive: coupon.isActive !== false,
    });
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const submit = async event => {
    event.preventDefault();
    setSaving(true);
    try {
      const payload = { ...form, code: form.code.trim().toUpperCase(), discountValue: Number(form.discountValue), minimumOrderAmount: Number(form.minimumOrderAmount || 0), usageLimit: form.usageLimit ? Number(form.usageLimit) : null };
      if (editingId) await API.put(`/api/coupons/${editingId}`, payload);
      else await API.post('/api/coupons', payload);
      await loadCoupons();
      resetForm();
      flash(editingId ? 'Coupon updated.' : 'Coupon created.');
    } catch (error) {
      flash(error.response?.data?.message || 'Coupon could not be saved.', false);
    } finally { setSaving(false); }
  };

  const removeCoupon = async coupon => {
    if (!window.confirm(`Delete coupon ${coupon.code}?`)) return;
    try {
      await API.delete(`/api/coupons/${coupon._id}`);
      setCoupons(current => current.filter(item => item._id !== coupon._id));
      if (editingId === coupon._id) resetForm();
      flash('Coupon deleted.');
    } catch (error) { flash(error.response?.data?.message || 'Coupon could not be deleted.', false); }
  };

  const panel = {
    background: darkMode ? 'linear-gradient(180deg,#111c18,#0c1512)' : 'linear-gradient(135deg,#fff,#f6fbf8)',
    border: `1px solid ${darkMode ? '#30443a' : '#dfece4'}`, borderRadius: 16, padding: 20,
    boxShadow: darkMode ? '0 14px 32px rgba(0,0,0,.22)' : '0 12px 28px rgba(15,45,32,.06)',
    color: darkMode ? '#e7f2eb' : '#1e293b', marginBottom: 18,
  };
  const strongColor = darkMode ? '#edf6f1' : '#173a2d';

  return (
    <section aria-labelledby="coupons-heading">
      <div style={{ marginBottom: 18 }}>
        <h1 id="coupons-heading" style={{ margin: '0 0 5px', fontSize: 27, fontWeight: 900, color: strongColor }}>Promo codes</h1>
        <p style={{ margin: 0, color: darkMode ? '#b9c7bf' : '#64748b', fontSize: 13, lineHeight: 1.6 }}>Create and manage checkout discounts. Flat offers and minimum order amounts use the selected currency.</p>
      </div>

      <form onSubmit={submit} style={panel}>
        <h2 style={{ margin: '0 0 16px', fontSize: 17, color: strongColor }}>{editingId ? 'Edit coupon' : 'Create a coupon'}</h2>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit,minmax(190px,1fr))', gap: 14 }}>
          <label style={labelStyle(darkMode)}>Coupon code<input style={fieldStyle(darkMode)} value={form.code} onChange={set('code')} placeholder="WELCOME10" minLength={3} maxLength={40} required /></label>
          <label style={labelStyle(darkMode)}>Discount type<select style={fieldStyle(darkMode)} value={form.discountType} onChange={set('discountType')}><option value="percentage">Percentage</option><option value="flat">Flat amount</option></select></label>
          <label style={labelStyle(darkMode)}>{form.discountType === 'percentage' ? 'Discount percent' : `Flat amount (${form.currency})`}<input style={fieldStyle(darkMode)} type="number" min="0.01" max={form.discountType === 'percentage' ? 100 : undefined} step={form.discountType === 'percentage' ? '1' : '0.01'} value={form.discountValue} onChange={set('discountValue')} required /></label>
          <label style={labelStyle(darkMode)}>Currency for flat amount / minimum<select style={fieldStyle(darkMode)} value={form.currency} onChange={set('currency')}><option value="PKR">PKR · Pakistani rupees</option><option value="USD">USD · US dollars</option></select></label>
          <label style={labelStyle(darkMode)}>Minimum order amount<input style={fieldStyle(darkMode)} type="number" min="0" step="0.01" value={form.minimumOrderAmount} onChange={set('minimumOrderAmount')} /></label>
          <label style={labelStyle(darkMode)}>Expiry date (optional)<input style={fieldStyle(darkMode)} type="date" value={form.expiresAt} onChange={set('expiresAt')} /></label>
          <label style={labelStyle(darkMode)}>Maximum uses (blank = unlimited)<input style={fieldStyle(darkMode)} type="number" min="1" step="1" value={form.usageLimit} onChange={set('usageLimit')} placeholder="Unlimited" /></label>
          <label style={labelStyle(darkMode)}>Description (optional)<input style={fieldStyle(darkMode)} maxLength={200} value={form.description} onChange={set('description')} placeholder="First order promotion" /></label>
        </div>
        <label style={{ display: 'flex', alignItems: 'center', gap: 8, marginTop: 14, color: darkMode ? '#dbe7df' : '#475569', fontSize: 13, fontWeight: 700 }}><input type="checkbox" checked={form.isActive} onChange={set('isActive')} /> Coupon is active</label>
        <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap', marginTop: 18 }}>
          <button type="submit" disabled={saving} style={{ border: 0, borderRadius: 10, background: '#059669', color: '#fff', padding: '10px 16px', fontSize: 13, fontWeight: 800, cursor: saving ? 'wait' : 'pointer' }}>{saving ? 'Saving…' : editingId ? 'Save changes' : 'Create coupon'}</button>
          {editingId && <button type="button" onClick={resetForm} style={{ border: `1px solid ${darkMode ? '#52665c' : '#cbd5e1'}`, borderRadius: 10, background: 'transparent', color: strongColor, padding: '10px 16px', fontSize: 13, fontWeight: 700, cursor: 'pointer' }}>Cancel edit</button>}
        </div>
      </form>

      <div style={panel}>
        <h2 style={{ margin: '0 0 14px', fontSize: 17, color: strongColor }}>Your coupons</h2>
        {loading ? <p style={{ color: darkMode ? '#b9c7bf' : '#64748b' }}>Loading coupons…</p> : coupons.length === 0 ? <p style={{ color: darkMode ? '#b9c7bf' : '#64748b' }}>No coupons yet. Create one above to get started.</p> : (
          <div style={{ display: 'grid', gap: 10 }}>
            {coupons.map(coupon => {
              const expired = coupon.expiresAt && coupon.expiresAt < new Date().toISOString().slice(0, 10);
              const exhausted = coupon.usageLimit && coupon.usageCount >= coupon.usageLimit;
              const active = coupon.isActive && !expired && !exhausted;
              return <article key={coupon._id} style={{ display: 'flex', gap: 14, alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', padding: '13px 14px', borderRadius: 12, border: `1px solid ${darkMode ? '#30443a' : '#e2ece6'}`, background: darkMode ? '#121f19' : '#fff' }}>
                <div style={{ minWidth: 180, flex: 1 }}>
                  <strong style={{ display: 'block', color: strongColor, letterSpacing: '.5px', fontSize: 14 }}>{coupon.code} <span style={{ color: active ? '#059669' : '#b45309', fontSize: 11 }}>{active ? '· Active' : '· Inactive / expired'}</span></strong>
                  <span style={{ display: 'block', marginTop: 4, color: darkMode ? '#bdcbc2' : '#64748b', fontSize: 12, lineHeight: 1.5 }}>{coupon.discountType === 'percentage' ? `${coupon.discountValue}% off` : `${coupon.currency === 'USD' ? '$' : 'Rs '}${coupon.discountValue} off`} · minimum {coupon.currency === 'USD' ? '$' : 'Rs '}{coupon.minimumOrderAmount || 0}</span>
                  <span style={{ display: 'block', marginTop: 3, color: darkMode ? '#95a79c' : '#94a3b8', fontSize: 11 }}>Uses: {coupon.usageCount || 0}{coupon.usageLimit ? ` / ${coupon.usageLimit}` : ' · unlimited'}{coupon.expiresAt ? ` · Expires ${coupon.expiresAt}` : ''}</span>
                </div>
                <div style={{ display: 'flex', gap: 8 }}><button type="button" onClick={() => editCoupon(coupon)} style={{ ...fieldStyle(darkMode), width: 'auto', padding: '8px 11px', cursor: 'pointer', fontWeight: 700 }}>Edit</button><button type="button" onClick={() => removeCoupon(coupon)} style={{ ...fieldStyle(darkMode), width: 'auto', padding: '8px 11px', cursor: 'pointer', color: darkMode ? '#fca5a5' : '#b91c1c', fontWeight: 700 }}>Delete</button></div>
              </article>;
            })}
          </div>
        )}
      </div>
    </section>
  );
}
