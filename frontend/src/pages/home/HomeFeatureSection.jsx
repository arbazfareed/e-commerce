const icons = {
  leaf: <path d="M5 19c0-8 5-13 14-14-1 9-6 14-14 14Zm0 0 7-7" />,
  truck: <><path d="M2.5 6h11v9h-11zM13.5 9h4l3 3v3h-7" /><circle cx="6.5" cy="17.5" r="1.6" /><circle cx="17" cy="17.5" r="1.6" /></>,
  hands: <><path d="M12 20s-7-4.3-7-9.6A3.9 3.9 0 0 1 12 8a3.9 3.9 0 0 1 7 2.4C19 15.7 12 20 12 20Z" /></>,
};

const FEATURES = [
  ['leaf', 'Premium curation', 'Thoughtfully selected products that bring quality, style and everyday ease to your routine.'],
  ['truck', 'Careful delivery', 'Clear order updates and tracking for every parcel, delivered across Pakistan.'],
  ['hands', 'Support local makers', 'Every purchase supports independent sellers and Pakistan’s artisan heritage.'],
];

export default function HomeFeatureSection({ styles }) {
  return (
    <section className="feature-section lux-features" style={styles.featureSection}>
      <div className="feature-grid" style={styles.featureGrid}>
        {FEATURES.map(([icon, title, text]) => (
          <div key={title} className="feature-card" style={styles.featureCard}>
            <span className="lux-feature-icon" aria-hidden="true">
              <svg viewBox="0 0 24 24" width="22" height="22" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">{icons[icon]}</svg>
            </span>
            <div>
              <h2 style={styles.featureTitle}>{title}</h2>
              <p style={styles.featureText}>{text}</p>
            </div>
          </div>
        ))}
      </div>
    </section>
  );
}
