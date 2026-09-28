import { Link } from 'react-router-dom';

export default function NotFoundPage() {
  return (
    <main className="responsive-page" style={{ maxWidth: 720, margin: '10vh auto', padding: 24, textAlign: 'center' }}>
      <p style={{ fontSize: 14, fontWeight: 800, color: '#059669' }}>404 · PAGE NOT FOUND</p>
      <h1>We couldn’t find that page</h1>
      <p>The link may be outdated, or the page may have moved.</p>
      <Link to="/" style={{ color: '#047857', fontWeight: 700 }}>Back to the shop</Link>
    </main>
  );
}
