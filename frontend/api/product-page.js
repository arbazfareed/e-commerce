// Serves /products/:id with product-specific <head> tags (share previews + Google product data).
// Any failure falls back to the normal app shell, so the page always loads.
const { buildProductMeta, injectHead } = require('./_productMeta');

const API_BASE = (process.env.VITE_API_URL || 'https://e-commerce-backend-afjdevops.vercel.app').replace(/\/+$/, '');
const ID_PATTERN = /^[a-f0-9]{24}$/i;

const fetchWithTimeout = async (url, ms) => {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), ms);
  try { return await fetch(url, { signal: controller.signal, headers: { accept: 'application/json, text/html' } }); }
  finally { clearTimeout(timer); }
};

module.exports = async (req, res) => {
  const host = req.headers['x-forwarded-host'] || req.headers.host;
  const siteUrl = `https://${host}`;
  let html;
  try {
    const shell = await fetchWithTimeout(`${siteUrl}/index.html`, 4000);
    if (!shell.ok) throw new Error(`shell ${shell.status}`);
    html = await shell.text();
  } catch {
    // Without the shell we cannot render anything useful; let the browser load it directly.
    res.statusCode = 307;
    res.setHeader('Location', '/');
    return res.end();
  }

  const id = String(req.query?.id || '');
  if (ID_PATTERN.test(id)) {
    try {
      const response = await fetchWithTimeout(`${API_BASE}/api/products/${id}`, 3500);
      if (response.ok) {
        const product = await response.json();
        if (product && product._id) html = injectHead(html, buildProductMeta(product, { siteUrl, apiBase: API_BASE }));
      }
    } catch { /* keep default tags */ }
  }

  res.setHeader('Content-Type', 'text/html; charset=utf-8');
  // Short CDN cache: prices and stock change, previews only need to be roughly current.
  res.setHeader('Cache-Control', 'public, max-age=0, s-maxage=300, stale-while-revalidate=600');
  res.statusCode = 200;
  res.end(html);
};
