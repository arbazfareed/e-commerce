// Builds sitemap.xml for the storefront: home page plus every visible product.
const escapeXml = value => String(value).replace(/[<>&'"]/g, c => ({ '<': '&lt;', '>': '&gt;', '&': '&amp;', "'": '&apos;', '"': '&quot;' }[c]));

const buildSitemap = (storeUrl, products = []) => {
  const base = storeUrl.replace(/\/+$/, '');
  const entry = (loc, lastmod, priority) => `  <url><loc>${escapeXml(loc)}</loc>${lastmod ? `<lastmod>${new Date(lastmod).toISOString().slice(0, 10)}</lastmod>` : ''}<priority>${priority}</priority></url>`;
  return [
    '<?xml version="1.0" encoding="UTF-8"?>',
    '<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">',
    entry(`${base}/`, null, '1.0'),
    entry(`${base}/support`, null, '0.3'),
    ...products.map(product => entry(`${base}/products/${product._id}`, product.updatedAt, '0.8')),
    '</urlset>',
  ].join('\n');
};

module.exports = { buildSitemap };
