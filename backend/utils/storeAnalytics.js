// Store-level analytics built on the business analytics engine.
// A store's sales are the order lines for its own products; shipping, COD fees and
// order-level coupons belong to the marketplace, so they are left out here.
const { buildBusinessAnalytics } = require('./businessAnalytics');

const MAIN = 'main';
const storeKeyOf = product => (product?.store ? String(product.store) : MAIN);

const scopeOrdersToStore = (orders, productStore, storeKey) => {
  const scoped = [];
  for (const order of orders) {
    const items = (order.products || []).filter(item => item.product && productStore.get(String(item.product)) === storeKey);
    if (!items.length) continue;
    const lineTotal = items.reduce((sum, item) => sum + (Number(item.price) || 0) * (Number(item.quantity) || 0), 0);
    scoped.push({
      ...order,
      products: items,
      productTotal: lineTotal,
      totalPrice: lineTotal,
      shippingFee: 0,
      codFee: 0,
      couponDiscount: 0,
      couponCode: '',
    });
  }
  return scoped;
};

// What a store owner may see: no shopper names/emails, no marketplace coupons,
// and only advice they can act on (their products and stock, not shipping or cash).
const STORE_OWNER_AREAS = new Set(['Sales', 'Stock', 'Products', 'Returns', 'Marketing', 'Growth']);
const redactForStoreOwner = report => ({
  ...report,
  customers: { ...report.customers, top: [] },
  coupons: [],
  unusedCoupons: [],
  suggestions: report.suggestions.filter(item => STORE_OWNER_AREAS.has(item.area) && !/cash still to collect/i.test(item.title)),
});

const buildStoreReport = ({ orders, products, storeKey, usdRate, days, now, forStoreOwner = false }) => {
  const productStore = new Map(products.map(p => [String(p._id), storeKeyOf(p)]));
  const storeProducts = products.filter(p => storeKeyOf(p) === storeKey);
  const report = buildBusinessAnalytics({
    orders: scopeOrdersToStore(orders, productStore, storeKey),
    products: storeProducts, coupons: [], usdRate, days, now,
  });
  const result = { ...report, scope: 'store', productCount: storeProducts.length };
  return forStoreOwner ? redactForStoreOwner(result) : result;
};

// One row per store for the main admin's comparison table.
const buildStoresOverview = ({ orders, products, stores, usdRate, days, now }) => {
  const rows = [{ key: MAIN, id: null, name: 'IndusCart (main store)', isActive: true, owner: null }, ...stores.map(store => ({
    key: String(store._id), id: String(store._id), name: store.name, isActive: store.isActive !== false,
    owner: store.owner ? { username: store.owner.username, email: store.owner.email } : null,
  }))];
  return rows.map(row => {
    const report = buildStoreReport({ orders, products, storeKey: row.key, usdRate, days, now });
    return {
      ...row,
      products: report.productCount,
      netSales: report.kpis.netSales.value,
      salesChange: report.kpis.netSales.change,
      orders: report.kpis.orders.value,
      units: report.current.units,
      returnRate: report.current.returnRate,
      cancelRate: report.current.cancelRate,
      outOfStock: report.inventory.outOfStock.length,
      lowStock: report.inventory.lowStock.length,
    };
  }).sort((a, b) => b.netSales - a.netSales);
};

module.exports = { buildStoreReport, buildStoresOverview, scopeOrdersToStore, redactForStoreOwner, MAIN };
