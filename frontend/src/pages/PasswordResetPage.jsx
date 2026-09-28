import { useEffect, useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import API from '../utils/axiosConfig';

export default function PasswordResetPage() {
  const { token = '' } = useParams();
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [error, setError] = useState('');
  const [done, setDone] = useState(false);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    const referrerPolicy = document.createElement('meta');
    referrerPolicy.name = 'referrer';
    referrerPolicy.content = 'no-referrer';
    document.head.appendChild(referrerPolicy);
    return () => referrerPolicy.remove();
  }, []);

  const submit = async (event) => {
    event.preventDefault();
    setError('');
    if (newPassword.length < 12) {
      setError('Choose a password with at least 12 characters.');
      return;
    }
    if (newPassword !== confirmPassword) {
      setError('The password confirmation does not match.');
      return;
    }

    setSaving(true);
    try {
      await API.post('/api/auth/password/reset', { token, newPassword });
      setNewPassword('');
      setConfirmPassword('');
      setDone(true);
    } catch (requestError) {
      setError(requestError.response?.data?.message || 'This reset link is invalid or expired. Request a new one from the store administrator.');
    } finally {
      setSaving(false);
    }
  };

  return (
    <main className="password-reset-page">
      <style>{`
        .password-reset-page { min-height:calc(100vh - 60px); display:grid; place-items:center; padding:24px; background:linear-gradient(145deg,#f1f8f3,#e8f2ed); }
        .password-reset-card { width:min(100%,460px); padding:clamp(24px,5vw,40px); border:1px solid #d8e8de; border-radius:24px; background:#fff; box-shadow:0 24px 60px rgba(15,45,32,.12); color:#183329; }
        .password-reset-card h1 { margin:0 0 10px; font:800 25px/1.2 'Sora','Segoe UI',sans-serif; color:#183329; }
        .password-reset-card p { margin:0 0 22px; color:#52675d; font-size:14px; line-height:1.6; }
        .password-reset-card label { display:grid; gap:7px; margin:0 0 16px; color:#334d40; font-size:11px; font-weight:800; letter-spacing:.7px; text-transform:uppercase; }
        .password-reset-card input { width:100%; box-sizing:border-box; min-height:48px; padding:11px 13px; border:1px solid #b9cec0; border-radius:11px; background:#fbfdfb; color:#10251b; font:500 15px 'Segoe UI',sans-serif; }
        .password-reset-card input:focus { outline:3px solid rgba(16,185,129,.2); border-color:#0b8059; }
        .password-reset-submit { width:100%; min-height:48px; border:0; border-radius:11px; background:linear-gradient(135deg,#087f5b,#056344); color:#fff; font-size:14px; font-weight:800; cursor:pointer; }
        .password-reset-submit:disabled { cursor:wait; opacity:.65; }
        .password-reset-error { padding:11px 12px; border:1px solid #fecaca; border-radius:10px; background:#fff1f2; color:#9f1239 !important; font-weight:700; }
        .password-reset-success { padding:12px; border:1px solid #a7e6c1; border-radius:10px; background:#effcf4; color:#17633e !important; font-weight:700; }
        .password-reset-link { display:inline-block; margin-top:18px; color:#086b4b; font-weight:700; text-decoration:none; }
        @media (max-width:480px) { .password-reset-page { padding:14px; } .password-reset-card { border-radius:18px; } }
        :root[data-theme='dark'] .password-reset-page { background:linear-gradient(145deg,#0b1510,#102019); }
        :root[data-theme='dark'] .password-reset-card { background:#14241c; border-color:#355342; color:#edf6f3; }
        :root[data-theme='dark'] .password-reset-card h1 { color:#edf6f3; }
        :root[data-theme='dark'] .password-reset-card p { color:#b8cfc8; }
        :root[data-theme='dark'] .password-reset-card label { color:#d4e5da; }
        :root[data-theme='dark'] .password-reset-card input { background:#0b1510 !important; border-color:#557264 !important; color:#f3faf5 !important; }
        :root[data-theme='dark'] .password-reset-submit { background:linear-gradient(135deg,#75e0b7,#42bd8e); color:#062e22 !important; }
        :root[data-theme='dark'] .password-reset-link { color:#8de2b9; }
      `}</style>
      <section className="password-reset-card" aria-labelledby="password-reset-title">
        <h1 id="password-reset-title">Choose a new password</h1>
        {done ? (
          <>
            <p className="password-reset-success" role="status">Your password has been updated. You can now sign in with it.</p>
            <Link className="password-reset-link" to="/login">Continue to sign in →</Link>
          </>
        ) : (
          <>
            <p>This secure, one-time link expires 20 minutes after it was sent. Your password must be at least 12 characters.</p>
            {error && <p className="password-reset-error" role="alert">{error}</p>}
            <form onSubmit={submit}>
              <label htmlFor="reset-new-password">New password
                <input id="reset-new-password" type="password" autoComplete="new-password" minLength={12} value={newPassword} onChange={event => setNewPassword(event.target.value)} required />
              </label>
              <label htmlFor="reset-confirm-password">Confirm new password
                <input id="reset-confirm-password" type="password" autoComplete="new-password" minLength={12} value={confirmPassword} onChange={event => setConfirmPassword(event.target.value)} required />
              </label>
              <button className="password-reset-submit" type="submit" disabled={saving}>{saving ? 'Updating…' : 'Update password'}</button>
            </form>
            <Link className="password-reset-link" to="/login">Back to sign in</Link>
          </>
        )}
      </section>
    </main>
  );
}
