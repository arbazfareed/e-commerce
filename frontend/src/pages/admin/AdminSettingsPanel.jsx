export default function AdminSettingsPanel({
  S,
  ZONE_LABELS,
  cashForm,
  customerPasswordForm,
  customerPasswordSaving,
  getUSDRate,
  handleManualCashSale,
  ownPasswordForm,
  ownPasswordSaving,
  saveRate,
  saveStoreSettings,
  saveZone,
  setCashForm,
  setCustomerPasswordForm,
  setOwnPasswordForm,
  setStoreSettings,
  setUsdRate,
  setZoneRates,
  settingsSaved,
  storeSettings,
  submitCustomerPasswordReset,
  submitOwnPasswordChange,
  themeMode,
  usdRate,
  usdSaved,
  zoneRates,
  zoneSaved
}) {
  return (
    <div className="admin-settings-page" style={{ animation:'fadeUp .35s ease' }}>
      <div style={S.pgTop}>
        <div>
          <h1 style={S.pgTitle}>Settings</h1>
          <p style={S.pgSub}>Configure pricing, currency, and zone-based shipping rates</p>
        </div>
      </div>

      <div className="admin-password-card admin-settings-card" style={{ ...S.card, background: themeMode === 'dark' ? 'linear-gradient(180deg, rgba(15,23,42,0.98), rgba(9,17,21,0.96))' : 'linear-gradient(135deg, rgba(255,255,255,0.94), rgba(240,250,244,0.9))', borderColor: themeMode === 'dark' ? 'rgba(148,163,184,0.18)' : '#dfece4', boxShadow: themeMode === 'dark' ? '0 18px 40px rgba(2,6,23,0.32)' : '0 16px 38px rgba(15,23,42,.08)', marginBottom:20 }}>
        <h3 style={{ ...S.cardH, marginBottom:6, color: themeMode === 'dark' ? '#e2e8f0' : '#1e293b' }}>🔐 Password & account security</h3>
        <p style={{ margin:'0 0 18px', fontSize:12, color: themeMode === 'dark' ? '#cbd5e1' : '#64748b' }}>
          Set a new password without entering the old one. Customer resets email a one-time link (expires in 20 minutes). New passwords must have at least 12 characters.
        </p>
        <p className="admin-password-warning" style={{ margin:'0 0 18px', padding:'10px 12px', borderRadius:10, border: themeMode === 'dark' ? '1px solid rgba(251,191,36,.25)' : '1px solid #f3d08a', background: themeMode === 'dark' ? 'rgba(120,83,12,.16)' : '#fffbeb', color: themeMode === 'dark' ? '#fde68a' : '#854d0e', fontSize:11, lineHeight:1.5 }}>
          Keep this admin session private and sign out on shared devices. Anyone with access to your signed-in admin session can change account passwords.
        </p>

        <div style={{ display:'grid', gridTemplateColumns:'repeat(auto-fit,minmax(260px,1fr))', gap:16 }}>
          <section style={{ padding:16, borderRadius:14, border: themeMode === 'dark' ? '1px solid rgba(148,163,184,.2)' : '1px solid #e2ece6', background: themeMode === 'dark' ? 'rgba(15,23,42,.5)' : '#fff' }}>
            <h4 style={{ ...S.cardH, color: themeMode === 'dark' ? '#e2e8f0' : '#1e293b', marginBottom:6 }}>Change your password</h4>
            <p style={{ margin:'0 0 14px', fontSize:11, color: themeMode === 'dark' ? '#aebfba' : '#64748b' }}>Choose a new password you can remember and confirm it below.</p>
            <form onSubmit={submitOwnPasswordChange} style={{ display:'grid', gap:11 }}>
              <label style={S.lbl}>New password
                <input style={S.inp} type="password" autoComplete="new-password" minLength={12} value={ownPasswordForm.newPassword} onChange={event => setOwnPasswordForm(form => ({ ...form, newPassword:event.target.value }))} required />
              </label>
              <label style={S.lbl}>Confirm new password
                <input style={S.inp} type="password" autoComplete="new-password" minLength={12} value={ownPasswordForm.confirmPassword} onChange={event => setOwnPasswordForm(form => ({ ...form, confirmPassword:event.target.value }))} required />
              </label>
              <button className="admin-password-submit admin-green-button" type="submit" style={{ ...S.greenBtn, justifySelf:'start' }} disabled={ownPasswordSaving}>{ownPasswordSaving ? 'Saving…' : 'Update my password'}</button>
            </form>
          </section>

          <section style={{ padding:16, borderRadius:14, border: themeMode === 'dark' ? '1px solid rgba(148,163,184,.2)' : '1px solid #e2ece6', background: themeMode === 'dark' ? 'rgba(15,23,42,.5)' : '#fff' }}>
            <h4 style={{ ...S.cardH, color: themeMode === 'dark' ? '#e2e8f0' : '#1e293b', marginBottom:6 }}>Email a customer reset link</h4>
            <p style={{ margin:'0 0 14px', fontSize:11, color: themeMode === 'dark' ? '#aebfba' : '#64748b' }}>The customer chooses their own password from a secure, single-use link.</p>
            <form onSubmit={submitCustomerPasswordReset} style={{ display:'grid', gap:11 }}>
              <label style={S.lbl}>Customer email
                <input style={S.inp} type="email" autoComplete="off" value={customerPasswordForm.email} onChange={event => setCustomerPasswordForm(form => ({ ...form, email:event.target.value }))} required />
              </label>
              <button className="admin-password-submit admin-green-button" type="submit" style={{ ...S.greenBtn, justifySelf:'start' }} disabled={customerPasswordSaving}>{customerPasswordSaving ? 'Sending…' : 'Send password reset email'}</button>
            </form>
          </section>
        </div>
      </div>

      <div className="admin-settings-card" style={{
        ...S.card,
        background: themeMode === 'dark' ? 'linear-gradient(180deg, rgba(15,23,42,0.98), rgba(9,17,21,0.96))' : 'linear-gradient(135deg, rgba(255,255,255,0.88), rgba(255,255,255,0.74))',
        borderColor: themeMode === 'dark' ? 'rgba(148,163,184,0.18)' : 'rgba(148,163,184,0.18)',
        boxShadow: themeMode === 'dark' ? '0 18px 40px rgba(2,6,23,0.32)' : '0 16px 38px rgba(15,23,42,.08)',
        marginBottom:20,
      }}>
        <h3 style={{ ...S.cardH, marginBottom:6, color: themeMode === 'dark' ? '#e2e8f0' : '#1e293b' }}>💵 Cash on Delivery & Auto Sales Log</h3>
        <p style={{ margin:'0 0 18px', fontSize:12, color: themeMode === 'dark' ? '#cbd5e1' : '#64748b' }}>
          Control COD availability, record manual cash collections at delivery, and keep admin earnings history organized by date, day, week, month, and time.
        </p>

        <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:14, marginBottom:18 }}>
          <div>
            <label style={themeMode === 'dark' ? { ...S.lbl, color:'#dbeafe' } : S.lbl}>Cash amount collected</label>
            <input style={themeMode === 'dark' ? { ...S.inp, background:'#0f172a', border:'1.5px solid rgba(148,163,184,0.28)', color:'#e2e8f0', boxShadow:'inset 0 1px 0 rgba(148,163,184,0.08)' } : S.inp} type="number" min="0" value={cashForm.amount} onChange={e => setCashForm(f => ({ ...f, amount: e.target.value }))} placeholder="e.g. 2500" />
          </div>
          <div>
            <label style={themeMode === 'dark' ? { ...S.lbl, color:'#dbeafe' } : S.lbl}>Collection time</label>
            <input style={themeMode === 'dark' ? { ...S.inp, background:'#0f172a', border:'1.5px solid rgba(148,163,184,0.28)', color:'#e2e8f0', boxShadow:'inset 0 1px 0 rgba(148,163,184,0.08)' } : S.inp} type="datetime-local" value={cashForm.paidAt} onChange={e => setCashForm(f => ({ ...f, paidAt: e.target.value }))} />
          </div>
          <div style={{ gridColumn:'1 / -1' }}>
            <label style={themeMode === 'dark' ? { ...S.lbl, color:'#dbeafe' } : S.lbl}>Notes / cash details</label>
            <textarea style={themeMode === 'dark' ? { ...S.inp, background:'#0f172a', border:'1.5px solid rgba(148,163,184,0.28)', color:'#e2e8f0', boxShadow:'inset 0 1px 0 rgba(148,163,184,0.08)', minHeight:80, resize:'vertical' } : { ...S.inp, minHeight:80, resize:'vertical' }} value={cashForm.notes} onChange={e => setCashForm(f => ({ ...f, notes: e.target.value }))} placeholder="Customer name, delivery note, cash collected at doorstep..." />
          </div>
        </div>
        <button className="admin-green-button" style={S.greenBtn} onClick={handleManualCashSale}>💰 Record cash sale</button>
      </div>

      <div className="admin-settings-card" style={{
        ...S.card,
        background: themeMode === 'dark' ? 'linear-gradient(180deg, rgba(15,23,42,0.98), rgba(9,17,21,0.96))' : 'linear-gradient(135deg, rgba(255,255,255,0.88), rgba(255,255,255,0.74))',
        borderColor: themeMode === 'dark' ? 'rgba(148,163,184,0.18)' : 'rgba(148,163,184,0.18)',
        boxShadow: themeMode === 'dark' ? '0 18px 40px rgba(2,6,23,0.32)' : '0 16px 38px rgba(15,23,42,.08)',
        marginBottom:20,
      }}>
        <h3 style={{ ...S.cardH, marginBottom:6, color: themeMode === 'dark' ? '#e2e8f0' : '#1e293b' }}>💵 Checkout & provider setup</h3>
        <p style={{ margin:'0 0 18px', fontSize:12, color: themeMode === 'dark' ? '#cbd5e1' : '#64748b' }}>
          Configure COD and save courier/EasyPaisa sandbox details for a future adapter. Provider toggles do not activate payment capture or courier booking until the server integration is implemented.
        </p>
        {!storeSettings.credentialEncryptionReady && <p role="alert" style={{ margin:'0 0 14px', padding:'10px 12px', borderRadius:10, border:'1px solid #f3d08a', background:themeMode === 'dark' ? '#342b1e' : '#fffbeb', color:themeMode === 'dark' ? '#fde68a' : '#854d0e', fontSize:12, lineHeight:1.55 }}>Provider secrets are locked until <code>SETTINGS_ENCRYPTION_KEY</code> is added to the backend environment (at least 32 characters). Secret inputs are disabled rather than saving credentials in plaintext.</p>}
        {storeSettings.legacySecretsNeedEncryption && <p role="alert" style={{ margin:'0 0 14px', padding:'10px 12px', borderRadius:10, border:'1px solid #f3d08a', background:themeMode === 'dark' ? '#342b1e' : '#fffbeb', color:themeMode === 'dark' ? '#fde68a' : '#854d0e', fontSize:12, lineHeight:1.55 }}>An older courier secret is still stored unencrypted. Set <code>SETTINGS_ENCRYPTION_KEY</code>; the server will encrypt it when settings are next loaded.</p>}
        <div style={{ display:'grid', gridTemplateColumns:'repeat(2,minmax(0,1fr))', gap:14, marginBottom:16 }}>
          <label style={{ gridColumn:'1 / -1', display:'flex', alignItems:'center', gap:10, cursor:'pointer', padding:'12px 14px', borderRadius:12, border:themeMode === 'dark' ? '1px solid rgba(110,231,183,0.22)' : '1px solid #bbf7d0', background:themeMode === 'dark' ? 'rgba(6,95,70,0.18)' : '#f0fdf4' }}>
            <input type="checkbox" checked={storeSettings.internationalEnabled !== false} onChange={e => setStoreSettings(s => ({ ...s, internationalEnabled:e.target.checked }))} />
            <span style={{ fontWeight:800, color:themeMode === 'dark' ? '#d1fae5' : '#166534', fontSize:13 }}>Enable international shopping</span>
            <span style={{ fontWeight:500, color:themeMode === 'dark' ? '#b9c7bf' : '#64748b', fontSize:11 }}>Shows the USD market option and allows international orders.</span>
          </label>
          <label style={{ display:'flex', alignItems:'center', gap:10, cursor:'pointer', padding:'12px 14px', borderRadius:12, border:themeMode === 'dark' ? '1px solid rgba(110,231,183,0.22)' : '1px solid #bbf7d0', background:themeMode === 'dark' ? 'rgba(6,95,70,0.18)' : '#f0fdf4' }}>
            <input type="checkbox" checked={storeSettings.codEnabled} onChange={e => setStoreSettings(s => ({ ...s, codEnabled:e.target.checked }))} />
            <span style={{ fontWeight:800, color:themeMode === 'dark' ? '#d1fae5' : '#166534', fontSize:13 }}>Enable COD checkout</span>
          </label>
          <div>
            <label style={S.lbl}>COD fee mode</label>
            <select style={S.inp} value={storeSettings.codFeeMode} onChange={e => setStoreSettings(s => ({ ...s, codFeeMode:e.target.value }))}>
              <option value="flat">Flat fee (PKR)</option><option value="percentage">Percentage of subtotal</option>
            </select>
          </div>
          <div>
            <label style={S.lbl}>{storeSettings.codFeeMode === 'percentage' ? 'COD fee (%)' : 'COD fee (PKR)'}</label>
            <input style={S.inp} type="number" min="0" value={storeSettings.codFee} onChange={e => setStoreSettings(s => ({ ...s, codFee:Number(e.target.value) }))} />
          </div>
          <div>
            <label style={S.lbl}>Free COD above (PKR, optional)</label>
            <input style={S.inp} type="number" min="0" value={storeSettings.codThreshold} onChange={e => setStoreSettings(s => ({ ...s, codThreshold:Number(e.target.value) }))} />
          </div>
          <div>
            <label style={S.lbl}>Courier provider</label>
            <select style={S.inp} value={storeSettings.courierProvider || ''} onChange={e => setStoreSettings(s => ({ ...s, courierProvider:e.target.value }))}>
              <option value="">No courier API</option><option value="PostEx">PostEx</option><option value="Trax">Trax</option><option value="TCS">TCS</option><option value="Leopards">Leopards</option><option value="Custom">Other provider (adapter needed)</option>
            </select>
          </div>
          <div>
            <label style={S.lbl}>Courier environment</label>
            <select style={S.inp} value={storeSettings.courierMode || 'sandbox'} onChange={e => setStoreSettings(s => ({ ...s, courierMode:e.target.value }))}>
              <option value="sandbox">Sandbox / test</option><option value="live">Live (configuration only)</option>
            </select>
          </div>
          <label style={{ gridColumn:'1 / -1', display:'flex', alignItems:'center', gap:9, padding:'10px 12px', borderRadius:10, background:themeMode === 'dark' ? '#18271e' : '#f0fdf4', color:themeMode === 'dark' ? '#d1fae5' : '#166534', fontSize:12, fontWeight:800 }}>
            <input type="checkbox" checked={Boolean(storeSettings.courierEnabled)} onChange={e => setStoreSettings(s => ({ ...s, courierEnabled:e.target.checked }))} /> Enable courier dispatch setting <span style={{ fontWeight:500 }}>(booking remains off until provider adapter is implemented)</span>
          </label>
          <div>
            <label style={S.lbl}>Courier API token / key</label>
            <input style={S.inp} type="password" autoComplete="new-password" disabled={!storeSettings.credentialEncryptionReady} placeholder={storeSettings.courierApiKeyConfigured ? 'Secret saved; blank keeps it' : 'Sandbox key from provider'} value={storeSettings.courierApiKey || ''} onChange={e => setStoreSettings(s => ({ ...s, courierApiKey:e.target.value, clearCourierApiKey:false }))} />
            {storeSettings.courierApiKeyConfigured && <button type="button" onClick={() => setStoreSettings(s => ({ ...s, courierApiKey:'', clearCourierApiKey:true }))} style={{ marginTop:5, border:0, padding:0, background:'none', color:themeMode === 'dark' ? '#fca5a5' : '#b91c1c', fontSize:11, fontWeight:700, cursor:'pointer' }}>Clear saved courier secret</button>}
          </div>
          <div style={{ gridColumn:'1 / -1', borderTop:`1px solid ${themeMode === 'dark' ? '#34463c' : '#dfece4'}`, paddingTop:14, marginTop:4 }}>
            <h4 style={{ margin:'0 0 5px', color:themeMode === 'dark' ? '#e2e8f0' : '#1e293b', fontSize:15 }}>📲 EasyPaisa setup placeholder</h4>
            <p style={{ margin:'0 0 12px', color:themeMode === 'dark' ? '#b9c7bf' : '#64748b', fontSize:11, lineHeight:1.55 }}>Store sandbox merchant details for later. EasyPaisa will not appear as a working checkout method until official API docs are reviewed and payment verification/webhooks are implemented.</p>
          </div>
          <label style={{ display:'flex', alignItems:'center', gap:9, color:themeMode === 'dark' ? '#d1fae5' : '#166534', fontSize:12, fontWeight:800 }}>
            <input type="checkbox" checked={Boolean(storeSettings.easypaisaEnabled)} onChange={e => setStoreSettings(s => ({ ...s, easypaisaEnabled:e.target.checked }))} /> Mark EasyPaisa for future activation
          </label>
          <div>
            <label style={S.lbl}>EasyPaisa environment</label>
            <select style={S.inp} value={storeSettings.easypaisaMode || 'sandbox'} onChange={e => setStoreSettings(s => ({ ...s, easypaisaMode:e.target.value }))}>
              <option value="sandbox">Sandbox / test</option><option value="live">Live (configuration only)</option>
            </select>
          </div>
          <div>
            <label style={S.lbl}>Merchant / account ID</label>
            <input style={S.inp} maxLength={120} value={storeSettings.easypaisaMerchantId || ''} onChange={e => setStoreSettings(s => ({ ...s, easypaisaMerchantId:e.target.value }))} placeholder="DEMO-MERCHANT-ID (replace with sandbox ID)" />
          </div>
          <div>
            <label style={S.lbl}>EasyPaisa API secret</label>
            <input style={S.inp} type="password" autoComplete="new-password" disabled={!storeSettings.credentialEncryptionReady} value={storeSettings.easypaisaApiKey || ''} onChange={e => setStoreSettings(s => ({ ...s, easypaisaApiKey:e.target.value, clearEasypaisaApiKey:false }))} placeholder={storeSettings.easypaisaApiKeyConfigured ? 'Secret saved; blank keeps it' : 'Sandbox secret only'} />
            {storeSettings.easypaisaApiKeyConfigured && <button type="button" onClick={() => setStoreSettings(s => ({ ...s, easypaisaApiKey:'', clearEasypaisaApiKey:true }))} style={{ marginTop:5, border:0, padding:0, background:'none', color:themeMode === 'dark' ? '#fca5a5' : '#b91c1c', fontSize:11, fontWeight:700, cursor:'pointer' }}>Clear saved EasyPaisa secret</button>}
          </div>
          <p role="note" style={{ gridColumn:'1 / -1', margin:0, color:themeMode === 'dark' ? '#cbd5e1' : '#64748b', fontSize:11, lineHeight:1.55 }}>Never paste live credentials into chat or source code. Secrets are encrypted in MongoDB; the encryption key must remain stable and be backed up separately. Provider endpoints are intentionally not editable here to prevent unsafe server requests.</p>
        </div>
        <button className="admin-green-button" style={S.greenBtn} onClick={saveStoreSettings}>
          {settingsSaved ? '✓ Saved!' : '💾 Save checkout & provider settings'}
        </button>
      </div>

      {/* Exchange rate card */}
      <div className="admin-settings-card" style={{
        ...S.card,
        background: themeMode === 'dark' ? 'linear-gradient(180deg, rgba(15,23,42,0.98), rgba(9,17,21,0.96))' : 'linear-gradient(135deg, rgba(255,255,255,0.88), rgba(255,255,255,0.74))',
        borderColor: themeMode === 'dark' ? 'rgba(148,163,184,0.18)' : 'rgba(148,163,184,0.18)',
        boxShadow: themeMode === 'dark' ? '0 18px 40px rgba(2,6,23,0.32)' : '0 16px 38px rgba(15,23,42,.08)',
        marginBottom:20,
      }}>
        <h3 style={{ ...S.cardH, marginBottom:6, color: themeMode === 'dark' ? '#e2e8f0' : '#1e293b' }}>💱 PKR → USD Exchange Rate</h3>
        <p style={{ margin:'0 0 18px', fontSize:12, color: themeMode === 'dark' ? '#cbd5e1' : '#64748b' }}>
          Used to auto-calculate USD price when you enter PKR. Current: <strong>1 USD = Rs {getUSDRate()}</strong>
        </p>
        <div style={{ display:'flex', gap:12, alignItems:'flex-end', maxWidth:380 }}>
          <div style={{ flex:1 }}>
            <label style={themeMode === 'dark' ? { ...S.lbl, color:'#dbeafe' } : S.lbl}>1 USD equals (PKR)</label>
            <div style={{ position:'relative' }}>
              <span style={S.pre}>Rs</span>
              <input style={themeMode === 'dark' ? { ...S.inp, background:'#0f172a', border:'1.5px solid rgba(148,163,184,0.28)', color:'#e2e8f0', boxShadow:'inset 0 1px 0 rgba(148,163,184,0.08)', paddingLeft:36 } : { ...S.inp, paddingLeft:36 }} type="number" min="1" step="0.01" value={usdRate} onChange={e => setUsdRate(e.target.value)} />
            </div>
          </div>
          <button className="admin-green-button" style={{ ...S.greenBtn, whiteSpace:'nowrap', flexShrink:0 }} onClick={saveRate}>
            {usdSaved ? '✓ Saved!' : '💾 Save Rate'}
          </button>
        </div>
        <p style={{ margin:'10px 0 0', fontSize:11, color: themeMode === 'dark' ? '#94a3b8' : '#94a3b8' }}>e.g. rate = 278 → Rs 1,000 = $3.60. USD auto-fills when you type PKR in Add/Edit Product.</p>
      </div>

      {/* Zone-based shipping card */}
      <div className="admin-settings-card" style={{
        ...S.card,
        background: themeMode === 'dark' ? 'linear-gradient(180deg, rgba(15,23,42,0.98), rgba(9,17,21,0.96))' : 'linear-gradient(135deg, rgba(255,255,255,0.88), rgba(255,255,255,0.74))',
        borderColor: themeMode === 'dark' ? 'rgba(148,163,184,0.18)' : 'rgba(148,163,184,0.18)',
        boxShadow: themeMode === 'dark' ? '0 18px 40px rgba(2,6,23,0.32)' : '0 16px 38px rgba(15,23,42,.08)',
      }}>
        <h3 style={{ ...S.cardH, marginBottom:4, color: themeMode === 'dark' ? '#e2e8f0' : '#1e293b' }}>🌍 Zone-Based Shipping Rates</h3>
        <p style={{ margin:'0 0 4px', fontSize:12, color: themeMode === 'dark' ? '#cbd5e1' : '#64748b' }}>
          Formula: <strong style={{ color: themeMode === 'dark' ? '#f8fafc' : '#0f172a' }}>Shipping = Base Rate + (Total Weight × Per-KG Rate)</strong>
        </p>
        <p style={{ margin:'0 0 18px', fontSize:11, color: themeMode === 'dark' ? '#94a3b8' : '#94a3b8' }}>
          Items with no weight entered (glasses, accessories, fruit) only pay the base rate — no per-kg charge.
          Zone is auto-detected from the customer's destination (e.g. Multan → Karachi = Domestic, Pakistan → Dubai = Middle East).
        </p>

        <div style={{ display:'grid', gridTemplateColumns:'repeat(auto-fill,minmax(280px,1fr))', gap:14, marginBottom:20 }}>
          {Object.entries(ZONE_LABELS).map(([zone, label]) => {
            const r = zoneRates[zone] || { baseRate:0, perKg:0, minFee:0 };
            return (
              <div key={zone} className="admin-zone-rate-card" style={{ background: themeMode === 'dark' ? '#0f172a' : '#f8fafc', border: themeMode === 'dark' ? '1.5px solid rgba(148,163,184,0.28)' : '1.5px solid #e2e8f0', borderRadius:14, padding:'16px', boxShadow: themeMode === 'dark' ? 'inset 0 1px 0 rgba(148,163,184,0.08)' : 'none' }}>
                <p style={{ margin:'0 0 12px', fontSize:11, fontWeight:800, color: themeMode === 'dark' ? '#e2e8f0' : '#334155', textTransform:'uppercase', letterSpacing:'0.8px' }}>{label}</p>
                <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr 1fr', gap:8 }}>
                  <div>
                    <label style={{ ...S.lbl, fontSize:9, color: themeMode === 'dark' ? '#dbeafe' : '#64748b' }}>Base (Rs)</label>
                    <input style={themeMode === 'dark' ? { ...S.inp, padding:'8px 10px', fontSize:12, background:'#0f172a', border:'1.5px solid rgba(148,163,184,0.28)', color:'#e2e8f0' } : { ...S.inp, padding:'8px 10px', fontSize:12 }} type="number" min="0"
                      value={r.baseRate}
                      onChange={e => setZoneRates(z => ({...z, [zone]: {...z[zone], baseRate: Number(e.target.value)}}))} />
                  </div>
                  <div>
                    <label style={{ ...S.lbl, fontSize:9, color: themeMode === 'dark' ? '#dbeafe' : '#64748b' }}>Per KG (Rs)</label>
                    <input style={themeMode === 'dark' ? { ...S.inp, padding:'8px 10px', fontSize:12, background:'#0f172a', border:'1.5px solid rgba(148,163,184,0.28)', color:'#e2e8f0' } : { ...S.inp, padding:'8px 10px', fontSize:12 }} type="number" min="0"
                      value={r.perKg}
                      onChange={e => setZoneRates(z => ({...z, [zone]: {...z[zone], perKg: Number(e.target.value)}}))} />
                  </div>
                  <div>
                    <label style={{ ...S.lbl, fontSize:9, color: themeMode === 'dark' ? '#dbeafe' : '#64748b' }}>Min Fee (Rs)</label>
                    <input style={themeMode === 'dark' ? { ...S.inp, padding:'8px 10px', fontSize:12, background:'#0f172a', border:'1.5px solid rgba(148,163,184,0.28)', color:'#e2e8f0' } : { ...S.inp, padding:'8px 10px', fontSize:12 }} type="number" min="0"
                      value={r.minFee}
                      onChange={e => setZoneRates(z => ({...z, [zone]: {...z[zone], minFee: Number(e.target.value)}}))} />
                  </div>
                </div>
              </div>
            );
          })}
        </div>

        <button className="admin-green-button" style={S.greenBtn} onClick={saveZone}>
          {zoneSaved ? '✓ Saved!' : '💾 Save Zone Rates'}
        </button>
        <p style={{ margin:'10px 0 0', fontSize:11, color: themeMode === 'dark' ? '#94a3b8' : '#94a3b8' }}>
          Customers see the shipping fee auto-calculated at checkout based on their delivery country/city.
        </p>
      </div>
    </div>
  );
}
