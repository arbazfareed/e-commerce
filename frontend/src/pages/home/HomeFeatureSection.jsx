export default function HomeFeatureSection({
  styles
}) {
  return (
    <section className="feature-section" style={styles.featureSection}>
      <div className="feature-grid" style={styles.featureGrid}>
        <div className="feature-card" style={styles.featureCard}>
          <span style={styles.featureIcon}>🌿</span>
          <div>
            <h2 style={styles.featureTitle}>Premium curation</h2>
            <p style={styles.featureText}>Thoughtfully selected products that bring quality, style, and everyday ease to your routine.</p>
          </div>
        </div>
        <div className="feature-card" style={styles.featureCard}>
          <span style={styles.featureIcon}>🚚</span>
          <div>
            <h2 style={styles.featureTitle}>Faster fulfillment</h2>
            <p style={styles.featureText}>Smooth shipping coordination and order visibility designed for a premium shopping experience.</p>
          </div>
        </div>
        <div className="feature-card" style={styles.featureCard}>
          <span style={styles.featureIcon}>💚</span>
          <div>
            <h2 style={styles.featureTitle}>Support local growth</h2>
            <p style={styles.featureText}>Every purchase supports quality makers, independent sellers, and meaningful local brands.</p>
          </div>
        </div>
      </div>
    </section>
  );
}
