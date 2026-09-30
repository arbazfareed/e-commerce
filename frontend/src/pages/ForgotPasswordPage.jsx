import { useState } from 'react';
import { Link } from 'react-router-dom';
import API from '../utils/axiosConfig';

export default function ForgotPasswordPage() {
  const [email, setEmail] = useState('');
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');
  const [submitting, setSubmitting] = useState(false);

  const submit = async event => {
    event.preventDefault();
    setMessage('');
    setError('');
    setSubmitting(true);
    try {
      const { data } = await API.post('/api/auth/password/reset/request', { email:email.trim() });
      setMessage(data.message || 'If an eligible account exists for that email, a password reset link will be sent shortly.');
    } catch (requestError) {
      setError(requestError.response?.data?.message || 'We could not process the request. Please try again later.');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <main className="forgot-password-page">
      <section className="forgot-password-card" aria-labelledby="forgot-password-title">
        <span className="forgot-password-kicker">ACCOUNT RECOVERY</span>
        <h1 id="forgot-password-title">Forgot your password?</h1>
        <p>Enter the email address on your account. If it’s eligible, we’ll send a secure reset link that expires after 20 minutes.</p>
        <form onSubmit={submit}>
          <label htmlFor="recovery-email">Email address</label>
          <input id="recovery-email" type="email" autoComplete="email" maxLength={254} value={email} onChange={event => setEmail(event.target.value)} required />
          <button type="submit" disabled={submitting}>{submitting ? 'Sending…' : 'Send reset link'}</button>
        </form>
        {message && <p className="forgot-password-message" role="status">{message}</p>}
        {error && <p className="forgot-password-error" role="alert">{error}</p>}
        <Link className="forgot-password-back" to="/login">← Back to sign in</Link>
      </section>
      <style>{`
        .forgot-password-page { min-height:calc(100vh - 64px); display:grid; place-items:center; padding:24px; background:linear-gradient(145deg,#f1f8f3,#e8f2ed); }
        .forgot-password-card { width:min(100%,460px); padding:clamp(24px,5vw,40px); border:1px solid #d8e8de; border-radius:24px; background:#fff; box-shadow:0 24px 60px rgba(15,45,32,.12); color:#183329; }
        .forgot-password-kicker { color:#087f5b; font-size:10px; font-weight:900; letter-spacing:1.4px; }
        .forgot-password-card h1 { margin:9px 0 10px; font:800 25px/1.2 'Sora','Segoe UI',sans-serif; color:#183329; }
        .forgot-password-card > p { margin:0 0 22px; color:#52675d; font-size:14px; line-height:1.6; }
        .forgot-password-card label { display:block; margin-bottom:7px; color:#334d40; font-size:11px; font-weight:800; letter-spacing:.7px; text-transform:uppercase; }
        .forgot-password-card input { width:100%; box-sizing:border-box; min-height:48px; margin-bottom:13px; padding:11px 13px; border:1px solid #b9cec0; border-radius:11px; background:#fbfdfb; color:#10251b; font:500 15px 'Segoe UI',sans-serif; }
        .forgot-password-card input:focus { outline:3px solid rgba(16,185,129,.2); border-color:#0b8059; }
        .forgot-password-card form button { width:100%; min-height:48px; border:0; border-radius:11px; background:linear-gradient(135deg,#087f5b,#056344); color:#fff; font-size:14px; font-weight:800; cursor:pointer; }
        .forgot-password-card form button:disabled { cursor:wait; opacity:.65; }
        .forgot-password-message,.forgot-password-error { margin:14px 0 0 !important; padding:11px 12px; border-radius:10px; font-weight:700; }
        .forgot-password-message { border:1px solid #a7e6c1; background:#effcf4; color:#17633e !important; }
        .forgot-password-error { border:1px solid #fecaca; background:#fff1f2; color:#9f1239 !important; }
        .forgot-password-back { display:inline-block; margin-top:18px; color:#086b4b; font-weight:700; text-decoration:none; }
        :root[data-theme='dark'] .forgot-password-page { background:linear-gradient(145deg,#0b1510,#102019); }
        :root[data-theme='dark'] .forgot-password-card { background:#14241c; border-color:#355342; color:#edf6f3; }
        :root[data-theme='dark'] .forgot-password-card h1 { color:#edf6f3; }
        :root[data-theme='dark'] .forgot-password-card > p { color:#b8cfc8; }
        :root[data-theme='dark'] .forgot-password-card label { color:#d4e5da; }
        :root[data-theme='dark'] .forgot-password-card input { background:#0b1510 !important; border-color:#557264 !important; color:#f3faf5 !important; }
        :root[data-theme='dark'] .forgot-password-card form button { background:linear-gradient(135deg,#75e0b7,#42bd8e); color:#062e22; }
        :root[data-theme='dark'] .forgot-password-back { color:#8de2b9; }
        @media(max-width:480px) { .forgot-password-page { padding:14px; } .forgot-password-card { border-radius:18px; } }
      `}</style>
    </main>
  );
}
