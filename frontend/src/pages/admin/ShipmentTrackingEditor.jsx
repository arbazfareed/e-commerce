import { useEffect, useState } from 'react';
import API from '../../utils/axiosConfig';

export default function ShipmentTrackingEditor({ order, darkMode = false, onSaved = () => {}, flash = () => {} }) {
  const [open, setOpen] = useState(false);
  const [saving, setSaving] = useState(false);
  const [form, setForm] = useState({ provider: order.shippingProvider || '', trackingNumber: order.trackingNumber || '', trackingUrl: order.trackingUrl || '' });
  const ink = darkMode ? '#e7f2eb' : '#1e293b';
  const muted = darkMode ? '#bdcbc3' : '#64748b';
  const input = { width:'100%', boxSizing:'border-box', minHeight:38, padding:'8px 10px', border:`1px solid ${darkMode ? '#53645a' : '#cbd5e1'}`, borderRadius:8, background:darkMode ? '#111a15' : '#fff', color:darkMode ? '#f1f7f3' : '#1e293b', font:'inherit', fontSize:12 };

  useEffect(() => {
    setForm({ provider: order.shippingProvider || '', trackingNumber: order.trackingNumber || '', trackingUrl: order.trackingUrl || '' });
  }, [order._id, order.shippingProvider, order.trackingNumber, order.trackingUrl]);

  const submit = async event => {
    event.preventDefault();
    setSaving(true);
    try {
      const { data } = await API.put(`/api/orders/${order._id}/shipment`, form);
      onSaved(data);
      flash(data.courierDispatchStatus === 'manual_tracking'
        ? 'Manual tracking details saved. The parcel was not booked through a courier API.'
        : 'Tracking details cleared.');
    } catch (error) {
      flash(error.response?.data?.message || 'Tracking details could not be saved.', false);
    } finally { setSaving(false); }
  };

  return <details open={open} onToggle={event => setOpen(event.currentTarget.open)} style={{ marginTop:7, minWidth:220 }}>
    <summary style={{ cursor:'pointer', color:darkMode ? '#a7f3d0' : '#047857', fontSize:11, fontWeight:800 }}>🚚 Shipment / tracking</summary>
    <form onSubmit={submit} onClick={event => event.stopPropagation()} style={{ display:'grid', gap:8, width:270, maxWidth:'min(82vw, 320px)', padding:11, marginTop:8, border:`1px solid ${darkMode ? '#3f5247' : '#dbe7df'}`, borderRadius:10, background:darkMode ? '#18211c' : '#f8fcf9', boxShadow:'0 8px 20px rgba(15,23,42,.1)' }}>
      <p style={{ margin:0, color:muted, fontSize:10, lineHeight:1.45 }}>Enter tracking manually. This does not book a parcel or verify carrier events.</p>
      <label htmlFor={`ship-provider-${order._id}`} style={{ display:'grid', gap:4, color:ink, fontSize:11, fontWeight:700 }}>Courier name<input id={`ship-provider-${order._id}`} style={input} maxLength={80} value={form.provider} onChange={event => setForm(current => ({ ...current, provider:event.target.value }))} placeholder="e.g. TCS" /></label>
      <label htmlFor={`ship-number-${order._id}`} style={{ display:'grid', gap:4, color:ink, fontSize:11, fontWeight:700 }}>Tracking number<input id={`ship-number-${order._id}`} style={input} maxLength={120} value={form.trackingNumber} onChange={event => setForm(current => ({ ...current, trackingNumber:event.target.value }))} placeholder="Courier consignment number" /></label>
      <label htmlFor={`ship-url-${order._id}`} style={{ display:'grid', gap:4, color:ink, fontSize:11, fontWeight:700 }}>HTTPS tracking link<input id={`ship-url-${order._id}`} style={input} type="url" value={form.trackingUrl} onChange={event => setForm(current => ({ ...current, trackingUrl:event.target.value }))} placeholder="https://carrier.example/track/..." /></label>
      <button type="submit" disabled={saving} style={{ minHeight:36, border:0, borderRadius:8, background:'#059669', color:'#fff', fontSize:11, fontWeight:800, cursor:saving ? 'wait' : 'pointer' }}>{saving ? 'Saving…' : 'Save tracking details'}</button>
    </form>
  </details>;
}
