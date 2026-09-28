export function Badge({ status, config }) {
  const colors = config[status] || config.Pending;
  return (
    <span style={{ display: 'inline-flex', alignItems: 'center', gap: 5, background: colors.bg, color: colors.color, padding: '4px 12px', borderRadius: 999, fontSize: 11, fontWeight: 800, letterSpacing: '0.3px' }}>
      <span style={{ width: 6, height: 6, borderRadius: '50%', background: colors.dot, flexShrink: 0 }} />
      {status}
    </span>
  );
}

export function MarketBadge({ isLocal }) {
  return (
    <span style={{
      display: 'inline-flex', alignItems: 'center', gap: 4,
      background: isLocal ? '#ecfdf5' : '#eff6ff',
      color: isLocal ? '#059669' : '#2563eb',
      border: `1px solid ${isLocal ? '#bbf7d0' : '#bfdbfe'}`,
      padding: '3px 10px', borderRadius: 999, fontSize: 11, fontWeight: 800, whiteSpace: 'nowrap',
    }}>
      {isLocal ? '🇵🇰 Local' : '🌍 Global'}
    </span>
  );
}

export function Toast({ toast }) {
  if (!toast) return null;
  return (
    <div style={{
      position: 'fixed', bottom: 28, right: 28, zIndex: 9999,
      padding: '14px 22px', borderRadius: 14, fontSize: 13, fontWeight: 700, color: '#fff',
      background: toast.ok ? 'linear-gradient(135deg,#064e3b,#065f46)' : 'linear-gradient(135deg,#7f1d1d,#991b1b)',
      boxShadow: '0 12px 40px rgba(0,0,0,.3)', backdropFilter: 'blur(8px)',
      border: `1px solid ${toast.ok ? 'rgba(16,185,129,.3)' : 'rgba(248,113,113,.3)'}`,
      display: 'flex', alignItems: 'center', gap: 10, animation: 'slideUp .3s ease',
    }}>
      <span style={{ fontSize: 16 }}>{toast.ok ? '✓' : '✕'}</span>{toast.text}
    </div>
  );
}

export function ImagePicker({ previews, onPick, onRemove, inputRef, max = 5 }) {
  return (
    <div>
      <div style={{ display: 'flex', flexWrap: 'wrap', gap: 10 }}>
        {previews.map((url, index) => (
          <div key={index} style={{ position: 'relative' }}>
            <img src={url} alt={`Selected product image ${index + 1}`} style={{ width: 82, height: 82, objectFit: 'cover', borderRadius: 12, border: '2px solid #e2e8f0', display: 'block' }} />
            <button type="button" onClick={() => onRemove(index)} style={{ position: 'absolute', top: -7, right: -7, background: '#ef4444', border: '2.5px solid #fff', color: '#fff', borderRadius: '50%', width: 22, height: 22, cursor: 'pointer', fontSize: 11, fontWeight: 900, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 0 }}>
              ×
            </button>
          </div>
        ))}
        {previews.length < max && (
          <label style={{ width: 82, height: 82, border: '2px dashed #cbd5e1', borderRadius: 12, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', background: '#f8fafc', gap: 4 }}>
            <span style={{ fontSize: 24, color: '#94a3b8' }}>+</span>
            <span style={{ fontSize: 10, color: '#94a3b8', fontWeight: 700 }}>Photo</span>
            <input ref={inputRef} type="file" accept="image/jpeg,image/png,image/webp" multiple style={{ display: 'none' }} onChange={event => { onPick(event.target.files); if (inputRef.current) inputRef.current.value = ''; }} />
          </label>
        )}
      </div>
      <p style={{ margin: '8px 0 0', fontSize: 11, color: '#94a3b8' }}>Up to {max} images · JPG PNG WEBP · 5 MB each</p>
    </div>
  );
}

export function MarketPicker({ value, onChange, hint = true }) {
  const options = [
    { value: false, flag: '🌍', title: 'Global', sub: 'Visible to ALL customers\n(Pakistan + International)', color: '#2563eb', activeBg: '#eff6ff', activeBorder: '#93c5fd' },
    { value: true, flag: '🇵🇰', title: 'Pakistan Only', sub: 'Visible only to local\nPakistan customers', color: '#059669', activeBg: '#ecfdf5', activeBorder: '#6ee7b7' },
  ];
  return (
    <div>
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
        {options.map(option => {
          const active = value === option.value;
          return (
            <label key={String(option.value)} style={{ display: 'flex', flexDirection: 'column', gap: 6, padding: '14px 16px', borderRadius: 14, cursor: 'pointer', userSelect: 'none', border: `2px solid ${active ? option.activeBorder : '#e2e8f0'}`, background: active ? option.activeBg : '#f8fafc', transition: 'all .15s' }}>
              <input type="radio" style={{ display: 'none' }} checked={active} onChange={() => onChange(option.value)} />
              <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                <span style={{ fontSize: 20 }}>{option.flag}</span>
                <span style={{ fontSize: 13, fontWeight: 800, color: active ? option.color : '#64748b', fontFamily: "'Sora',sans-serif" }}>{option.title}</span>
                {active && <span style={{ marginLeft: 'auto', fontSize: 14, color: option.color }}>✓</span>}
              </div>
              <p style={{ margin: 0, fontSize: 11, color: '#94a3b8', fontWeight: 400, whiteSpace: 'pre-line', lineHeight: 1.5 }}>{option.sub}</p>
            </label>
          );
        })}
      </div>
      {hint && <p style={{ margin: '8px 0 0', fontSize: 11, color: value ? '#059669' : '#2563eb', fontWeight: 600 }}>
        {value ? '🇵🇰 Only Pakistani customers (shopping in PKR mode) will see this product.' : '🌍 Everyone sees this product — both local and international customers.'}
      </p>}
    </div>
  );
}

export function CategoryPicker({ value, onChange, isNew, setIsNew, categories = [], inputStyle, buttonStyle }) {
  if (isNew) {
    return (
      <div style={{ display: 'flex', gap: 8 }}>
        <input style={inputStyle} placeholder="Type new category name…" value={value} onChange={event => onChange(event.target.value)} autoFocus />
        <button type="button" style={buttonStyle} onClick={() => { setIsNew(false); onChange(''); }}>✕</button>
      </div>
    );
  }
  return (
    <div style={{ display: 'flex', gap: 8 }}>
      <select style={{ ...inputStyle, flex: 1 }} value={categories.includes(value) ? value : ''} onChange={event => onChange(event.target.value)}>
        <option value="">— Select category —</option>
        {categories.map(category => <option key={category} value={category}>{category}</option>)}
      </select>
      <button type="button" style={buttonStyle} onClick={() => { setIsNew(true); onChange(''); }}>+ New</button>
    </div>
  );
}
