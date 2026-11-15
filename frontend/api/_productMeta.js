// Builds the <head> tags for a product page so WhatsApp, Facebook and Google
// see the product's own title, picture, price and rating without running JavaScript.
const SITE_NAME = 'IndusCart Valley';

const escapeHtml = (value) => String(value ?? '')
  .replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;')
  .replace(/"/g, '&quot;').replace(/'/g, '&#39;');

// JSON inside <script> must not be able to close the tag.
const safeJson = (value) => JSON.stringify(value)
  .replace(/</g, '\\u003c').replace(/>/g, '\\u003e').replace(/&/g, '\\u0026')
  .replace(/\u2028/g, '\\u2028').replace(/\u2029/g, '\\u2029');

const plain = (text, max) => {
  const clean = String(text ?? '').replace(/\s+/g, ' ').trim();
  return clean.length > max ? `${clean.slice(0, max - 1).trimEnd()}…` : clean;
};

const imageUrl = (path, apiBase) => {
  if (!path) return '';
  if (/^https?:\/\//i.test(path)) return path;
  const clean = String(path).replace(/^\/+/, '');
  return `${apiBase}/${clean.startsWith('uploads/') ? clean : `uploads/${clean}`}`;
};

// Same rule as the shop (src/utils/currencyUtils.js): dates are YYYY-MM-DD strings.
const activeDiscount = (product, now = new Date()) => {
  const pct = Math.min(100, Math.max(0, Number(product.discountPercent) || 0));
  if (!pct) return 0;
  const today = now.toISOString().slice(0, 10);
  if (product.discountStartDate && today < product.discountStartDate) return 0;
  if (product.discountEndDate && today > product.discountEndDate) return 0;
  return pct;
};

const buildProductMeta = (product, { siteUrl, apiBase, now = new Date() }) => {
  const url = `${siteUrl}/products/${encodeURIComponent(product._id)}`;
  const title = `${plain(product.name, 80)} | ${SITE_NAME}`;
  const price = Math.round((Number(product.pricePKR) || 0) * (1 - activeDiscount(product, now) / 100));
  const pricePart = price > 0 ? `Rs ${price.toLocaleString('en-PK')}. ` : '';
  const description = plain(`${pricePart}${product.description || `${product.name} from ${SITE_NAME}.`}`, 180);
  const images = (Array.isArray(product.images) ? product.images : []).map(i => imageUrl(i, apiBase)).filter(Boolean);
  const image = images[0] || `${siteUrl}/og-default.jpg`;

  const jsonLd = {
    '@context': 'https://schema.org',
    '@type': 'Product',
    name: plain(product.name, 150),
    description: plain(product.description, 500) || undefined,
    image: images.length ? images.slice(0, 5) : [image],
    sku: String(product._id),
    category: product.category || undefined,
    brand: product.brand ? { '@type': 'Brand', name: plain(product.brand, 80) } : undefined,
    offers: price > 0 ? {
      '@type': 'Offer',
      url,
      priceCurrency: 'PKR',
      price: String(price),
      availability: Number(product.stock) > 0 ? 'https://schema.org/InStock' : 'https://schema.org/OutOfStock',
      seller: { '@type': 'Organization', name: product.storeName || SITE_NAME },
    } : undefined,
    aggregateRating: Number(product.reviewCount) > 0 ? {
      '@type': 'AggregateRating',
      ratingValue: String(product.averageRating),
      reviewCount: String(product.reviewCount),
    } : undefined,
  };

  return [
    `<title>${escapeHtml(title)}</title>`,
    `<meta name="description" content="${escapeHtml(description)}" />`,
    `<link rel="canonical" href="${escapeHtml(url)}" />`,
    `<meta property="og:type" content="product" />`,
    `<meta property="og:site_name" content="${SITE_NAME}" />`,
    `<meta property="og:title" content="${escapeHtml(title)}" />`,
    `<meta property="og:description" content="${escapeHtml(description)}" />`,
    `<meta property="og:url" content="${escapeHtml(url)}" />`,
    `<meta property="og:image" content="${escapeHtml(image)}" />`,
    price > 0 ? `<meta property="product:price:amount" content="${price}" />` : '',
    price > 0 ? `<meta property="product:price:currency" content="PKR" />` : '',
    `<meta name="twitter:card" content="summary_large_image" />`,
    `<script type="application/ld+json">${safeJson(jsonLd)}</script>`,
  ].filter(Boolean).join('\n    ');
};

// Replace the default site-wide tags in index.html with the product's own.
const injectHead = (html, headTags) => html
  .replace(/<title>[\s\S]*?<\/title>\s*/i, '')
  .replace(/<meta\s+name="description"[^>]*>\s*/gi, '')
  .replace(/<meta\s+property="og:(?:type|site_name|title|description|image(?::[a-z]+)?|url)"[^>]*>\s*/gi, '')
  .replace(/<meta\s+name="twitter:card"[^>]*>\s*/gi, '')
  .replace(/<\/head>/i, `    ${headTags}\n  </head>`);

module.exports = { buildProductMeta, injectHead, escapeHtml, safeJson };
