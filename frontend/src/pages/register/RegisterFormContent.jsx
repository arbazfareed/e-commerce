export default function RegisterFormContent({
  BrandMark,
  COUNTRIES,
  Link,
  S,
  error,
  form,
  goNext,
  isPak,
  loading,
  set,
  setError,
  setStep,
  step,
  submit
}) {
  return (
    <div className="register-shell">
      <section className="register-visual">
        <img className="auth-visual-image" src="/honey-register.svg" alt="Honey and handcrafted goods from Pakistan" />
        <div className="register-visual-content">
          <span className="register-visual-kicker">JOIN THE INDUSCART COMMUNITY</span>
          <h1>Create your<br /><em>everyday story.</em></h1>
          <p>Save your favorite finds, checkout faster, and discover makers worth supporting.</p>
          <span className="register-note">✦ Your new collection starts here</span>
        </div>
      </section>
      <div className="register-form-card" style={S.card}>
    
      {/* ── Header ── */}
      <div style={S.header}>
        <BrandMark size={48} style={{ filter:'drop-shadow(0 6px 10px rgba(13,92,66,.2))' }} />
        <div>
          <h1 style={S.brand}><span style={{ color:'#10b981' }}>Indus</span>Cart 🇵🇰</h1>
          <p style={S.brandSub}>Create your free account</p>
          </div>
        </div>
      {/* ── Step indicator ── */}
      <div style={S.stepRow}>
        {[1, 2].map(n => (
          <div key={n} style={S.stepItem}>
            <div style={{
              ...S.stepDot,
              background: step >= n ? '#10b981' : '#e2e8f0',
              color:      step >= n ? '#fff'    : '#94a3b8',
            }}>{n}</div>
            <span style={{ ...S.stepLabel, color: step >= n ? '#10b981' : '#94a3b8' }}>
              {n === 1 ? 'Account Info' : 'Location & Password'}
            </span>
          </div>
        ))}
        <div style={S.stepLine}>
          <div style={{ ...S.stepLineFill, width: step === 2 ? '100%' : '0%' }} />
        </div>
      </div>
    
      {/* ── Error box ── */}
      {error && (
        <div style={S.errBox}>
          <span>⚠️</span> {error}
        </div>
      )}
    
      {/* ════════════════ STEP 1 ════════════════ */}
      {step === 1 && (
        <form onSubmit={goNext} noValidate style={{ animation:'fadeIn 0.3s ease' }}>
          <div style={S.fg}>
            <label htmlFor="register-name" style={S.lbl}>Full Name *</label>
            <input
              className="inp" style={S.inp}
              id="register-name"
              placeholder="e.g. Muhammad Ali"
              value={form.name} onChange={set('name')} required
            />
          </div>
    
          <div style={S.fg}>
            <label htmlFor="register-email" style={S.lbl}>Email Address *</label>
            <input
              className="inp" style={S.inp}
              id="register-email"
              type="email" placeholder="you@example.com"
              value={form.email} onChange={set('email')} required
            />
          </div>
    
          <div style={{ ...S.fg, marginBottom:'24px' }}>
            <label htmlFor="register-phone" style={S.lbl}>
              Phone Number
              <span style={S.optTag}>(optional)</span>
            </label>
            <input
              className="inp" style={S.inp}
              id="register-phone"
              type="tel"
              placeholder="+92 300 1234567"
              value={form.phone} onChange={set('phone')} autoComplete="tel"
            />
          </div>
    
          <button className="reg-btn" style={S.btn} type="submit">
            Continue → &nbsp;Step 2
          </button>
        </form>
      )}
    
      {/* ════════════════ STEP 2 ════════════════ */}
      {step === 2 && (
        <form onSubmit={submit} noValidate style={{ animation:'fadeIn 0.3s ease' }}>
    
          {/* Country + City */}
          <div style={S.twoCol}>
            <div style={S.fg}>
              <label htmlFor="register-country" style={S.lbl}>Country *</label>
              <select id="register-country" className="inp" style={S.inp} value={form.country} onChange={set('country')} required>
                {COUNTRIES.map(c => <option key={c} value={c}>{c}</option>)}
              </select>
            </div>
            <div style={S.fg}>
              <label htmlFor="register-city" style={S.lbl}>
                City
                <span style={S.optTag}>(optional)</span>
              </label>
              <input
                className="inp" style={S.inp}
                id="register-city"
                placeholder={isPak ? 'e.g. Karachi' : 'e.g. London'}
                value={form.city} onChange={set('city')} autoComplete="off"
              />
            </div>
          </div>
    
          {/* Currency badge */}
          <div style={{
            ...S.infoBadge,
            background: isPak ? '#f0fdf4' : '#eff6ff',
            border: `1px solid ${isPak ? '#bbf7d0' : '#bfdbfe'}`,
            color:  isPak ? '#166534' : '#1d4ed8',
          }}>
            {isPak
              ? '🇵🇰 Prices will be shown in Pakistani Rupees (PKR) for you.'
              : '🌍 Prices will be shown in US Dollars (USD) for international customers.'}
          </div>
    
          {/* Password */}
          <div style={S.fg}>
            <label htmlFor="register-password" style={S.lbl}>Password *</label>
            <input
              className="inp" style={S.inp}
              id="register-password"
              type="password" minLength={8} placeholder="At least 8 characters"
              value={form.password} onChange={set('password')} required
            />
          </div>
    
          {/* Confirm */}
          <div style={{ ...S.fg, marginBottom:'22px' }}>
            <label htmlFor="register-confirm-password" style={S.lbl}>Confirm Password *</label>
            <input
              className="inp" style={S.inp}
              id="register-confirm-password"
              type="password" placeholder="Re-enter your password"
              value={form.confirm} onChange={set('confirm')} required
            />
          </div>
    
          {/* Buttons */}
          <div style={{ display:'flex', gap:'10px' }}>
            <button
              type="button"
              className="back-btn"
              style={S.backBtn}
              onClick={() => { setStep(1); setError(''); }}
            >
              ← Back
            </button>
            <button
              className="reg-btn"
              style={{ ...S.btn, flex:1, opacity: loading ? 0.75 : 1 }}
              type="submit"
              disabled={loading}
            >
              {loading
                ? <span style={{ display:'flex', alignItems:'center', gap:'8px', justifyContent:'center' }}>
                    <span style={S.spinner} /> Creating account…
                  </span>
                : 'Create Account →'}
            </button>
          </div>
        </form>
      )}
    
      <p style={S.footer}>
        Already have an account?{' '}
        <Link to="/login" style={S.link}>Sign in →</Link>
      </p>
    </div>
    </div>
  );
}
