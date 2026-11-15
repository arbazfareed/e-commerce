import { useState } from 'react';
import API from '../utils/axiosConfig';
import { useAuth } from '../context/AuthContext';
import { getDeliveryCountries } from '../utils/countries';
import { isValidPhone } from '../utils/phone';

const card = { width:'min(100%, 560px)', padding:'clamp(20px,4vw,32px)', border:'1px solid #d8e8de', borderRadius:20, background:'#fff', boxShadow:'0 18px 44px rgba(15,45,32,.08)', color:'#183329' };
const label = { display:'grid', gap:6, marginBottom:14, color:'#334d40', fontSize:11, fontWeight:800, letterSpacing:.6, textTransform:'uppercase' };
const input = { width:'100%', boxSizing:'border-box', minHeight:46, padding:'10px 12px', border:'1px solid #b9cec0', borderRadius:10, background:'#fbfdfb', color:'#10251b', fontSize:15, fontWeight:500, textTransform:'none', letterSpacing:0 };
const button = { minHeight:46, padding:'0 20px', border:0, borderRadius:10, background:'linear-gradient(135deg,#087f5b,#056344)', color:'#fff', fontSize:14, fontWeight:800, cursor:'pointer' };
const note = ok => ({ margin:'0 0 14px', padding:'10px 12px', borderRadius:10, fontWeight:700, fontSize:13, border:`1px solid ${ok ? '#a7e6c1' : '#fecaca'}`, background: ok ? '#effcf4' : '#fff1f2', color: ok ? '#17633e' : '#9f1239' });

export default function AccountPage() {
  const { user, updateUser } = useAuth();
  const [profile, setProfile] = useState({ name:user?.name || '', phone:user?.phone || '', city:user?.city || '', country:user?.country || 'Pakistan' });
  const [profileMsg, setProfileMsg] = useState(null);
  const [savingProfile, setSavingProfile] = useState(false);
  const [pw, setPw] = useState({ currentPassword:'', newPassword:'', confirmPassword:'' });
  const [pwMsg, setPwMsg] = useState(null);
  const [savingPw, setSavingPw] = useState(false);

  const saveProfile = async event => {
    event.preventDefault();
    setProfileMsg(null);
    if (!profile.name.trim()) { setProfileMsg({ ok:false, text:'Name cannot be empty.' }); return; }
    if (profile.phone.trim() && !isValidPhone(profile.phone, profile.country)) {
      setProfileMsg({ ok:false, text: profile.country === 'Pakistan' ? 'Enter a valid mobile number, for example 0300 1234567.' : 'Enter a valid phone number with country code.' });
      return;
    }
    setSavingProfile(true);
    try {
      const { data } = await API.put('/api/auth/profile', profile);
      updateUser({ name:data.name, phone:data.phone, city:data.city, country:data.country });
      setProfileMsg({ ok:true, text:'Your details were saved.' });
    } catch (error) {
      setProfileMsg({ ok:false, text:error.response?.data?.message || 'Your details could not be saved.' });
    } finally { setSavingProfile(false); }
  };

  const changePassword = async event => {
    event.preventDefault();
    setPwMsg(null);
    if (pw.newPassword.length < 12) { setPwMsg({ ok:false, text:'Your new password must be at least 12 characters.' }); return; }
    if (pw.newPassword !== pw.confirmPassword) { setPwMsg({ ok:false, text:'The new passwords do not match.' }); return; }
    setSavingPw(true);
    try {
      const { data } = await API.patch('/api/auth/password', { currentPassword:pw.currentPassword, newPassword:pw.newPassword });
      if (data.token) updateUser({ token:data.token });
      setPw({ currentPassword:'', newPassword:'', confirmPassword:'' });
      setPwMsg({ ok:true, text:data.message || 'Your password was changed.' });
    } catch (error) {
      setPwMsg({ ok:false, text:error.response?.data?.message || 'Your password could not be changed.' });
    } finally { setSavingPw(false); }
  };

  return (
    <main className="responsive-page account-page" style={{ minHeight:'calc(100vh - 64px)', display:'grid', justifyItems:'center', alignContent:'start', gap:20, padding:'32px 16px', background:'linear-gradient(145deg,#f1f8f3,#e8f2ed)' }}>
      <section style={card} aria-labelledby="account-title">
        <h1 id="account-title" style={{ margin:'0 0 4px', fontSize:24, fontWeight:800 }}>My account</h1>
        <p style={{ margin:'0 0 20px', color:'#52675d', fontSize:14 }}>{user?.email}</p>
        <form onSubmit={saveProfile}>
          {profileMsg && <p role={profileMsg.ok ? 'status' : 'alert'} style={note(profileMsg.ok)}>{profileMsg.text}</p>}
          <label style={label}>Full name
            <input style={input} autoComplete="name" maxLength={80} value={profile.name} onChange={e => setProfile(p => ({ ...p, name:e.target.value }))} required />
          </label>
          <label style={label}>Mobile number
            <input style={input} type="tel" autoComplete="tel" maxLength={40} placeholder="0300 1234567" value={profile.phone} onChange={e => setProfile(p => ({ ...p, phone:e.target.value }))} />
          </label>
          <label style={label}>City
            <input style={input} autoComplete="address-level2" maxLength={80} value={profile.city} onChange={e => setProfile(p => ({ ...p, city:e.target.value }))} />
          </label>
          <label style={label}>Country
            <select style={input} value={profile.country} onChange={e => setProfile(p => ({ ...p, country:e.target.value }))}>
              {getDeliveryCountries({ current:profile.country }).map(name => <option key={name} value={name}>{name}</option>)}
            </select>
          </label>
          <button type="submit" style={button} disabled={savingProfile}>{savingProfile ? 'Saving…' : 'Save my details'}</button>
        </form>
      </section>

      <section style={card} aria-labelledby="password-title">
        <h2 id="password-title" style={{ margin:'0 0 16px', fontSize:19, fontWeight:800 }}>Change password</h2>
        <form onSubmit={changePassword}>
          {pwMsg && <p role={pwMsg.ok ? 'status' : 'alert'} style={note(pwMsg.ok)}>{pwMsg.text}</p>}
          <label style={label}>Current password
            <input style={input} type="password" autoComplete="current-password" value={pw.currentPassword} onChange={e => setPw(p => ({ ...p, currentPassword:e.target.value }))} required />
          </label>
          <label style={label}>New password (at least 12 characters)
            <input style={input} type="password" autoComplete="new-password" minLength={12} value={pw.newPassword} onChange={e => setPw(p => ({ ...p, newPassword:e.target.value }))} required />
          </label>
          <label style={label}>Confirm new password
            <input style={input} type="password" autoComplete="new-password" minLength={12} value={pw.confirmPassword} onChange={e => setPw(p => ({ ...p, confirmPassword:e.target.value }))} required />
          </label>
          <button type="submit" style={button} disabled={savingPw}>{savingPw ? 'Updating…' : 'Update password'}</button>
        </form>
      </section>
      <style>{`
        :root[data-theme='dark'] .account-page { background:linear-gradient(145deg,#0b1510,#102019) !important; }
        :root[data-theme='dark'] .account-page section { background:#14241c !important; border-color:#355342 !important; color:#edf6f3 !important; }
        :root[data-theme='dark'] .account-page label { color:#d4e5da !important; }
        :root[data-theme='dark'] .account-page input, :root[data-theme='dark'] .account-page select { background:#0b1510 !important; border-color:#557264 !important; color:#f3faf5 !important; }
      `}</style>
    </main>
  );
}
