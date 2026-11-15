const test = require('node:test');
const assert = require('node:assert/strict');
const { buildSitemap } = require('../utils/sitemap');

test('sitemap lists the home page and every product on the store URL', () => {
  const xml = buildSitemap('https://shop.test/', [{ _id: 'abc123', updatedAt: '2026-11-01T10:00:00Z' }]);
  assert.match(xml, /<loc>https:\/\/shop\.test\/<\/loc>/);
  assert.match(xml, /<loc>https:\/\/shop\.test\/products\/abc123<\/loc><lastmod>2026-11-01<\/lastmod>/);
  assert.match(xml, /^<\?xml/);
});
