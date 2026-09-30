import { useEffect, useState } from 'react';
import API from '../../utils/axiosConfig';

const STATUS_OPTIONS = ['pending', 'approved', 'rejected'];

export default function ReviewsPanel({ darkMode = false, flash = () => {} }) {
  const [reviews, setReviews] = useState([]);
  const [loading, setLoading] = useState(true);
  const [busyId, setBusyId] = useState('');
  const ink = darkMode ? '#edf6f1' : '#173a2d';
  const muted = darkMode ? '#b9c7bf' : '#64748b';

  const load = async () => {
    try {
      const { data } = await API.get('/api/reviews/admin');
      setReviews(Array.isArray(data) ? data : []);
    } catch (error) { flash(error.response?.data?.message || 'Could not load reviews.', false); }
    finally { setLoading(false); }
  };
  useEffect(() => { load(); }, []);

  const updateStatus = async (reviewId, status) => {
    setBusyId(reviewId);
    try {
      const { data } = await API.patch(`/api/reviews/${reviewId}/status`, { status });
      setReviews(current => current.map(review => review._id === reviewId ? data : review));
      flash(`Review ${status}.`);
    } catch (error) { flash(error.response?.data?.message || 'Review could not be updated.', false); }
    finally { setBusyId(''); }
  };

  return (
    <section aria-labelledby="reviews-heading">
      <div style={{ marginBottom: 18 }}>
        <h1 id="reviews-heading" style={{ margin: '0 0 5px', fontSize: 27, fontWeight: 900, color: ink }}>Product reviews</h1>
        <p style={{ margin: 0, color: muted, fontSize: 13, lineHeight: 1.6 }}>Reviews are submitted only by customers with a delivered order. Approve a review before it appears publicly.</p>
      </div>
      <div style={{ display: 'grid', gap: 12 }}>
        {loading ? <p style={{ color: muted }}>Loading reviews…</p> : reviews.length === 0 ? <div style={{ padding: 22, borderRadius: 14, background: darkMode ? '#121f19' : '#fff', border: `1px solid ${darkMode ? '#30443a' : '#dfece4'}`, color: muted }}>No reviews have been submitted yet.</div> : reviews.map(review => (
          <article key={review._id} style={{ padding: 16, borderRadius: 14, background: darkMode ? '#121f19' : '#fff', border: `1px solid ${darkMode ? '#30443a' : '#dfece4'}`, boxShadow: darkMode ? '0 10px 24px rgba(0,0,0,.18)' : '0 8px 20px rgba(15,45,32,.04)' }}>
            <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: 12, flexWrap: 'wrap' }}>
              <div style={{ flex: 1, minWidth: 220 }}>
                <strong style={{ color: ink, fontSize: 15 }}>{review.product?.name || 'Removed product'}</strong>
                <p style={{ margin: '5px 0', color: '#d69e2e', fontSize: 16 }} aria-label={`${review.rating} out of 5 stars`}>{'★'.repeat(review.rating)}{'☆'.repeat(5 - review.rating)}</p>
                <p style={{ margin: '6px 0', color: darkMode ? '#d4e1d9' : '#334155', fontSize: 13, lineHeight: 1.65, whiteSpace: 'pre-wrap' }}>{review.comment}</p>
                <span style={{ color: muted, fontSize: 11 }}>{review.user?.name || 'Customer'} · {new Date(review.createdAt).toLocaleDateString()}</span>
              </div>
              <div style={{ display: 'flex', gap: 7, alignItems: 'center' }}>
                <span style={{ padding: '5px 9px', borderRadius: 999, background: review.status === 'approved' ? (darkMode ? '#123b2a' : '#dcfce7') : review.status === 'rejected' ? (darkMode ? '#451e26' : '#ffe4e6') : (darkMode ? '#422f15' : '#fef3c7'), color: review.status === 'approved' ? (darkMode ? '#a7f3d0' : '#166534') : review.status === 'rejected' ? (darkMode ? '#fecdd3' : '#9f1239') : (darkMode ? '#fde68a' : '#92400e'), fontSize: 11, fontWeight: 800 }}>{review.status}</span>
                {STATUS_OPTIONS.filter(status => status !== review.status).map(status => <button key={status} type="button" disabled={busyId === review._id} onClick={() => updateStatus(review._id, status)} style={{ border: `1px solid ${darkMode ? '#52665c' : '#cbd5e1'}`, borderRadius: 8, padding: '7px 9px', background: 'transparent', color: ink, textTransform: 'capitalize', fontSize: 11, fontWeight: 700, cursor: busyId === review._id ? 'wait' : 'pointer' }}>{busyId === review._id ? 'Saving…' : status}</button>)}
              </div>
            </div>
          </article>
        ))}
      </div>
    </section>
  );
}
