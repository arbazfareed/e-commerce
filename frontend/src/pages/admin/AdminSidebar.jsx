import BrandMark from '../../components/BrandMark';

const ICONS = {
  dashboard: <><rect x="3.5" y="3.5" width="7" height="8" rx="1.6" /><rect x="13.5" y="3.5" width="7" height="5" rx="1.6" /><rect x="13.5" y="11.5" width="7" height="9" rx="1.6" /><rect x="3.5" y="14.5" width="7" height="6" rx="1.6" /></>,
  products: <><path d="M3.5 7.5 12 3l8.5 4.5v9L12 21l-8.5-4.5z" /><path d="M3.5 7.5 12 12l8.5-4.5M12 12v9" /></>,
  add: <><circle cx="12" cy="12" r="8.5" /><path d="M12 8v8M8 12h8" /></>,
  orders: <><path d="M5 4h14l-1.2 15.2a1 1 0 0 1-1 .8H7.2a1 1 0 0 1-1-.8z" /><path d="M9 8a3 3 0 0 0 6 0" /></>,
  stores: <><path d="M4 9.5 5.5 4h13L20 9.5" /><path d="M4 9.5h16a0 0 0 0 1 0 0 2.7 2.7 0 0 1-5.3 0 2.7 2.7 0 0 1-5.4 0A2.7 2.7 0 0 1 4 9.5z" /><path d="M5.5 12.5V20h13v-7.5M10 20v-4.5h4V20" /></>,
  coupons: <><path d="M3.5 12V4.5a1 1 0 0 1 1-1H12l8.5 8.5-8.5 8.5z" /><circle cx="8" cy="8" r="1.4" /></>,
  reviews: <path d="m12 3.8 2.5 5.1 5.6.8-4 3.9 1 5.6-5.1-2.6-5 2.6.9-5.6-4-3.9 5.6-.8z" />,
  settings: <><circle cx="12" cy="12" r="3" /><path d="M19.4 15a1.7 1.7 0 0 0 .3 1.8l.1.1a2 2 0 1 1-2.8 2.8l-.1-.1a1.7 1.7 0 0 0-1.8-.3 1.7 1.7 0 0 0-1 1.5V21a2 2 0 1 1-4 0v-.1a1.7 1.7 0 0 0-1.1-1.5 1.7 1.7 0 0 0-1.8.3l-.1.1a2 2 0 1 1-2.8-2.8l.1-.1a1.7 1.7 0 0 0 .3-1.8 1.7 1.7 0 0 0-1.5-1H3a2 2 0 1 1 0-4h.1a1.7 1.7 0 0 0 1.5-1.1 1.7 1.7 0 0 0-.3-1.8l-.1-.1a2 2 0 1 1 2.8-2.8l.1.1a1.7 1.7 0 0 0 1.8.3H9a1.7 1.7 0 0 0 1-1.5V3a2 2 0 1 1 4 0v.1a1.7 1.7 0 0 0 1 1.5 1.7 1.7 0 0 0 1.8-.3l.1-.1a2 2 0 1 1 2.8 2.8l-.1.1a1.7 1.7 0 0 0-.3 1.8V9a1.7 1.7 0 0 0 1.5 1H21a2 2 0 1 1 0 4h-.1a1.7 1.7 0 0 0-1.5 1z" /></>,
  logout: <><path d="M15 4h3a2 2 0 0 1 2 2v12a2 2 0 0 1-2 2h-3" /><path d="M10 17l-5-5 5-5M5 12h11" /></>,
};

export const Icon = ({ name, size = 18 }) => (
  <svg className="ap-icon" viewBox="0 0 24 24" width={size} height={size} fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">{ICONS[name]}</svg>
);

const GROUPS = [
  ['Overview', [{ id:'dashboard', label:'Dashboard' }]],
  ['Catalog', [{ id:'products', label:'Products', countKey:'products' }, { id:'add', label:'Add Product' }]],
  ['Sales', [{ id:'orders', label:'Orders', countKey:'pending', warn:true }, { id:'coupons', label:'Promo Codes' }, { id:'reviews', label:'Reviews' }]],
  ['Business', [{ id:'stores', label:'Stores' }, { id:'settings', label:'Settings' }]],
];

export default function AdminSidebar({ tab, openSection, counts, user, onLogout }) {
  return (
    <aside className="admin-sidebar ap-sidebar">
      <div className="ap-brand">
        <span className="ap-brand-mark"><BrandMark size={26} /></span>
        <span>
          <strong>IndusCart</strong>
          <small>Admin Console</small>
        </span>
      </div>

      <nav className="ap-nav" aria-label="Admin sections">
        {GROUPS.map(([group, items]) => (
          <div className="ap-group" key={group}>
            <p className="ap-group-label">{group}</p>
            {items.map(item => {
              const count = item.countKey ? counts[item.countKey] : 0;
              const active = tab === item.id;
              return (
                <button key={item.id} type="button" className={`nav-btn ap-nav-btn${active ? ' is-active' : ''}`} aria-current={active ? 'page' : undefined} onClick={() => openSection(item.id)}>
                  <Icon name={item.id} />
                  <span className="ap-nav-label">{item.label}</span>
                  {count > 0 && <span className={`ap-badge${item.warn ? ' is-warn' : ''}`}>{count}</span>}
                </button>
              );
            })}
          </div>
        ))}
      </nav>

      <div className="ap-glance" aria-label="Catalog at a glance">
        <p className="ap-group-label">At a glance</p>
        <div className="ap-glance-grid">
          <span><strong>{counts.products}</strong>Products</span>
          <span><strong>{counts.orders}</strong>Orders</span>
          <span className={counts.oos > 0 ? 'is-alert' : ''}><strong>{counts.oos}</strong>Out of stock</span>
          <span><strong>{counts.local}/{counts.global}</strong>PK / Global</span>
        </div>
      </div>

      <div className="ap-user">
        <span className="ap-avatar">{user?.name?.[0]?.toUpperCase() || 'A'}</span>
        <span className="ap-user-text">
          <strong>{user?.name}</strong>
          <small>Administrator</small>
        </span>
        <button type="button" className="ap-logout" title="Log out" aria-label="Log out" onClick={onLogout}><Icon name="logout" size={16} /></button>
      </div>
    </aside>
  );
}
