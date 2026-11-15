import { createRequire } from 'node:module';
import { describe, it, expect } from 'vitest';

const require = createRequire(import.meta.url);
const { buildProductMeta, injectHead } = require('../../api/_productMeta.js');

const shell = `<!DOCTYPE html><html><head>
<title>IndusCart Valley | Skincare</title>
<meta name="description" content="default" />
<meta property="og:title" content="default" />
<meta property="og:image" content="https://x/og-default.jpg" />
<meta property="og:image:width" content="1200" />
<meta name="twitter:card" content="summary_large_image" />
</head><body><div id="root"></div></body></html>`;

const product = {
  _id: '6740a1b2c3d4e5f6a7b8c901', name: 'Rose Petal Soap', description: 'Hand-made <b>rose</b> soap with "petals".',
  pricePKR: 1000, discountPercent: 10, stock: 4, images: ['uploads/rose.jpg'], category: 'Skincare',
  averageRating: 4.6, reviewCount: 12, storeName: 'Craft House',
};
const opts = { siteUrl: 'https://shop.example', apiBase: 'https://api.example', now: new Date('2026-11-15') };

describe('product page share previews', () => {
  it('puts the product title, discounted price, image and rating in the head', () => {
    const html = injectHead(shell, buildProductMeta(product, opts));
    expect(html).toContain('<title>Rose Petal Soap | IndusCart Valley</title>');
    expect(html).toContain('content="https://api.example/uploads/rose.jpg"');
    expect(html).toContain('<link rel="canonical" href="https://shop.example/products/6740a1b2c3d4e5f6a7b8c901" />');
    expect(html).toContain('Rs 900.');
    const ld = JSON.parse(html.match(/<script type="application\/ld\+json">(.*)<\/script>/)[1]);
    expect(ld.offers.price).toBe('900');
    expect(ld.offers.availability).toBe('https://schema.org/InStock');
    expect(ld.aggregateRating.reviewCount).toBe('12');
    expect(ld.offers.seller.name).toBe('Craft House');
  });

  it('removes the default tags instead of duplicating them', () => {
    const html = injectHead(shell, buildProductMeta(product, opts));
    expect(html.match(/<title>/g)).toHaveLength(1);
    expect(html.match(/property="og:title"/g)).toHaveLength(1);
    expect(html).not.toContain('og:image:width');
    expect(html).not.toContain('content="default"');
  });

  it('escapes product text so it cannot inject markup', () => {
    const evil = { ...product, name: '"><script>alert(1)</script>', description: '</script><script>alert(2)</script>' };
    const html = injectHead(shell, buildProductMeta(evil, opts));
    expect(html).not.toContain('<script>alert');
    expect(html).toContain('&lt;script&gt;alert(1)');
  });

  it('ignores a discount that has ended', () => {
    const html = buildProductMeta({ ...product, discountEndDate: '2026-11-01' }, opts);
    expect(html).toContain('Rs 1,000.');
  });

  it('marks sold-out products and skips ratings without reviews', () => {
    const ld = JSON.parse(buildProductMeta({ ...product, stock: 0, reviewCount: 0, discountPercent: 0 }, opts)
      .match(/<script type="application\/ld\+json">(.*)<\/script>/)[1]);
    expect(ld.offers.availability).toBe('https://schema.org/OutOfStock');
    expect(ld.offers.price).toBe('1000');
    expect(ld.aggregateRating).toBeUndefined();
  });
});
