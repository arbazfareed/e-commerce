// Business analytics for the admin dashboard.
//
// Rules used everywhere here:
// - All money is in PKR. USD orders are converted with the store's USD rate.
// - "Net sales" leave out Cancelled and Returned orders.
// - A period is compared with the period of the same length just before it.

const CLOSED_LOST = new Set(['Cancelled', 'Returned']);
const DAY = 24 * 60 * 60 * 1000;

const round = (value, digits = 0) => {
  const factor = 10 ** digits;
  return Math.round((Number(value) || 0) * factor) / factor;
};
const percent = (part, whole) => (whole ? round((part / whole) * 100, 1) : 0);
const growth = (current, previous) => (previous ? round(((current - previous) / previous) * 100, 1) : (current ? null : 0));

const toPKR = (amount, order, usdRate) => (order.currency === 'USD' ? (Number(amount) || 0) * usdRate : Number(amount) || 0);

const customerKey = order => {
  if (order.user) return `u:${order.user._id || order.user}`;
  if (order.guestContact?.email) return `g:${String(order.guestContact.email).toLowerCase()}`;
  return null;
};
const customerLabel = order => ({
  name: order.user?.name || order.guestContact?.name || 'Customer',
  email: order.user?.email || order.guestContact?.email || '',
  guest: !order.user,
});

const cityOf = order => {
  const city = String(order.address?.city || '').trim();
  return city ? city.replace(/\b\w/g, c => c.toUpperCase()) : 'Unknown';
};

// Totals for one set of orders.
const summarize = (orders, usdRate) => {
  const s = {
    orders: orders.length, netOrders: 0, netSales: 0, productSales: 0, shippingFees: 0, codFees: 0,
    discounts: 0, units: 0, cancelled: 0, returned: 0, delivered: 0, open: 0,
    codToCollect: 0, collected: 0, international: 0, couponOrders: 0, lostSales: 0,
  };
  for (const order of orders) {
    const total = toPKR(order.totalPrice, order, usdRate);
    if (order.status === 'Cancelled') s.cancelled += 1;
    if (order.status === 'Returned') s.returned += 1;
    if (CLOSED_LOST.has(order.status)) { s.lostSales += total; continue; }
    s.netOrders += 1;
    s.netSales += total;
    s.productSales += toPKR(Math.max(0, (order.productTotal || 0) - (order.couponDiscount || 0)), order, usdRate);
    s.shippingFees += toPKR(order.shippingFee, order, usdRate);
    s.codFees += toPKR(order.codFee, order, usdRate);
    s.discounts += toPKR(order.couponDiscount, order, usdRate);
    s.units += (order.products || []).reduce((sum, item) => sum + (Number(item.quantity) || 0), 0);
    if (order.couponCode) s.couponOrders += 1;
    if (String(order.address?.country || 'Pakistan').toLowerCase() !== 'pakistan') s.international += 1;
    if (order.status === 'Delivered') s.delivered += 1; else s.open += 1;
    if (order.isPaid) s.collected += total;
    else if (['COD', 'Cash'].includes(order.paymentMethod)) s.codToCollect += total;
  }
  return {
    ...s,
    netSales: round(s.netSales), productSales: round(s.productSales), shippingFees: round(s.shippingFees),
    codFees: round(s.codFees), discounts: round(s.discounts), codToCollect: round(s.codToCollect),
    collected: round(s.collected), lostSales: round(s.lostSales),
    averageOrderValue: s.netOrders ? round(s.netSales / s.netOrders) : 0,
    cancelRate: percent(s.cancelled, s.orders),
    returnRate: percent(s.returned, s.orders),
    couponUseRate: percent(s.couponOrders, s.netOrders),
    internationalShare: percent(s.international, s.netOrders),
  };
};

const buildBusinessAnalytics = ({
  orders = [], products = [], coupons = [], usdRate = 278, now = new Date(), days = 30,
} = {}) => {
  const rate = Number(usdRate) > 0 ? Number(usdRate) : 278;
  const periodDays = [7, 30, 90, 365].includes(Number(days)) ? Number(days) : 30;
  const end = now.getTime();
  const start = end - periodDays * DAY;
  const prevStart = start - periodDays * DAY;
  const dated = orders.filter(order => order.createdAt && !Number.isNaN(new Date(order.createdAt).getTime()));
  const inPeriod = dated.filter(order => { const t = new Date(order.createdAt).getTime(); return t > start && t <= end; });
  const inPrevious = dated.filter(order => { const t = new Date(order.createdAt).getTime(); return t > prevStart && t <= start; });

  const current = summarize(inPeriod, rate);
  const previous = summarize(inPrevious, rate);

  // ── Customers: new vs returning, repeat rate, best customers ──
  const firstOrderAt = new Map();
  const lifetime = new Map();
  for (const order of dated) {
    const key = customerKey(order);
    if (!key || order.isManualCash) continue;
    const t = new Date(order.createdAt).getTime();
    if (!firstOrderAt.has(key) || t < firstOrderAt.get(key)) firstOrderAt.set(key, t);
    if (CLOSED_LOST.has(order.status)) continue;
    const entry = lifetime.get(key) || { ...customerLabel(order), orders: 0, spent: 0, lastOrderAt: 0 };
    entry.orders += 1;
    entry.spent += toPKR(order.totalPrice, order, rate);
    entry.lastOrderAt = Math.max(entry.lastOrderAt, t);
    lifetime.set(key, entry);
  }
  const periodCustomers = new Set(inPeriod.filter(o => !CLOSED_LOST.has(o.status) && !o.isManualCash).map(customerKey).filter(Boolean));
  let newCustomers = 0;
  for (const key of periodCustomers) if (firstOrderAt.get(key) > start) newCustomers += 1;
  const allCustomers = [...lifetime.values()];
  const repeatCustomers = allCustomers.filter(c => c.orders >= 2).length;
  const customers = {
    activeInPeriod: periodCustomers.size,
    newInPeriod: newCustomers,
    returningInPeriod: periodCustomers.size - newCustomers,
    totalCustomers: allCustomers.length,
    repeatRate: percent(repeatCustomers, allCustomers.length),
    averageLifetimeValue: allCustomers.length ? round(allCustomers.reduce((s, c) => s + c.spent, 0) / allCustomers.length) : 0,
    top: allCustomers.sort((a, b) => b.spent - a.spent).slice(0, 8).map(c => ({
      name: c.name, email: c.email, guest: c.guest, orders: c.orders, spent: round(c.spent), lastOrderAt: new Date(c.lastOrderAt).toISOString(),
    })),
    // Bought before but not in the last 60 days: worth a "we miss you" coupon.
    lapsed: allCustomers.filter(c => c.lastOrderAt < end - 60 * DAY).length,
  };

  // ── Products: sales, returns and stock cover in the period ──
  const productStats = new Map();
  for (const order of inPeriod) {
    for (const item of order.products || []) {
      const id = item.product ? String(item.product) : `name:${item.name}`;
      const entry = productStats.get(id) || { id, name: item.name, units: 0, revenue: 0, returnedUnits: 0, cancelledUnits: 0 };
      const qty = Number(item.quantity) || 0;
      if (order.status === 'Returned') entry.returnedUnits += qty;
      else if (order.status === 'Cancelled') entry.cancelledUnits += qty;
      else { entry.units += qty; entry.revenue += toPKR((item.price || 0) * qty, order, rate); }
      productStats.set(id, entry);
    }
  }
  const productById = new Map(products.map(p => [String(p._id), p]));
  const productRows = [...productStats.values()].map(row => {
    const product = productById.get(row.id);
    const dailyUnits = row.units / periodDays;
    const stock = product ? Number(product.stock) || 0 : null;
    return {
      ...row,
      revenue: round(row.revenue),
      returnRate: percent(row.returnedUnits, row.units + row.returnedUnits),
      stock,
      daysOfStockLeft: stock !== null && dailyUnits > 0 ? round(stock / dailyUnits) : null,
    };
  });
  const topProducts = [...productRows].sort((a, b) => b.revenue - a.revenue).slice(0, 10);
  const soldIds = new Set([...productStats.keys()]);
  const visible = products.filter(p => p.isVisible !== false);
  const inventory = {
    totalProducts: visible.length,
    outOfStock: visible.filter(p => Number(p.stock) <= 0).map(p => ({ id: String(p._id), name: p.name })),
    lowStock: visible.filter(p => Number(p.stock) > 0 && Number(p.stock) < 5).map(p => ({ id: String(p._id), name: p.name, stock: Number(p.stock) })),
    // Selling fast: less than two weeks of stock at the current pace.
    restockSoon: productRows.filter(r => r.daysOfStockLeft !== null && r.daysOfStockLeft < 14 && r.stock > 0)
      .sort((a, b) => a.daysOfStockLeft - b.daysOfStockLeft).slice(0, 8)
      .map(r => ({ id: r.id, name: r.name, stock: r.stock, daysOfStockLeft: r.daysOfStockLeft, unitsSold: r.units })),
    // In stock, older than the period, and no sales in it.
    notSelling: visible.filter(p => Number(p.stock) > 0 && !soldIds.has(String(p._id))
      && (!p.createdAt || new Date(p.createdAt).getTime() < start))
      .sort((a, b) => Number(b.stock) - Number(a.stock)).slice(0, 8)
      .map(p => ({ id: String(p._id), name: p.name, stock: Number(p.stock) })),
    stockValue: round(visible.reduce((s, p) => s + Math.max(0, Number(p.stock) || 0) * (Number(p.pricePKR) || 0), 0)),
  };
  const highReturnProducts = productRows.filter(r => r.returnedUnits >= 2 && r.returnRate >= 20)
    .sort((a, b) => b.returnRate - a.returnRate).slice(0, 5);

  // ── Cities: where sales and problems come from ──
  const cityMap = new Map();
  for (const order of inPeriod) {
    const city = cityOf(order);
    const entry = cityMap.get(city) || { city, orders: 0, netSales: 0, cancelled: 0, returned: 0 };
    entry.orders += 1;
    if (order.status === 'Cancelled') entry.cancelled += 1;
    else if (order.status === 'Returned') entry.returned += 1;
    else entry.netSales += toPKR(order.totalPrice, order, rate);
    cityMap.set(city, entry);
  }
  const cities = [...cityMap.values()].map(c => ({
    ...c, netSales: round(c.netSales), failedRate: percent(c.cancelled + c.returned, c.orders),
  })).sort((a, b) => b.netSales - a.netSales);

  // ── Coupons: what each code cost and brought in ──
  const couponMap = new Map();
  for (const order of inPeriod) {
    if (!order.couponCode || CLOSED_LOST.has(order.status)) continue;
    const entry = couponMap.get(order.couponCode) || { code: order.couponCode, orders: 0, discount: 0, netSales: 0 };
    entry.orders += 1;
    entry.discount += toPKR(order.couponDiscount, order, rate);
    entry.netSales += toPKR(order.totalPrice, order, rate);
    couponMap.set(order.couponCode, entry);
  }
  const couponRows = [...couponMap.values()].map(c => ({
    ...c, discount: round(c.discount), netSales: round(c.netSales), discountShare: percent(c.discount, c.netSales + c.discount),
  })).sort((a, b) => b.netSales - a.netSales);
  const activeUnused = coupons.filter(c => c.isActive !== false && !couponMap.has(c.code)
    && (!c.expiresAt || c.expiresAt >= new Date(end).toISOString().slice(0, 10))).map(c => c.code);

  // ── Orders by status and by day of week (period) ──
  const statusCounts = {};
  for (const order of inPeriod) statusCounts[order.status || 'Pending'] = (statusCounts[order.status || 'Pending'] || 0) + 1;
  const weekdays = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map(day => ({ day, orders: 0, netSales: 0 }));
  for (const order of inPeriod) {
    if (CLOSED_LOST.has(order.status)) continue;
    const d = weekdays[new Date(order.createdAt).getDay()];
    d.orders += 1; d.netSales += toPKR(order.totalPrice, order, rate);
  }
  weekdays.forEach(d => { d.netSales = round(d.netSales); });
  // Open orders waiting more than 3 days for the next step.
  const staleOpen = dated.filter(o => ['Pending', 'Processing'].includes(o.status) && new Date(o.createdAt).getTime() < end - 3 * DAY).length;

  // Daily net sales for a trend line.
  const trend = [];
  for (let i = periodDays - 1; i >= 0; i -= 1) {
    const dayStart = end - (i + 1) * DAY;
    const dayEnd = end - i * DAY;
    const dayOrders = inPeriod.filter(o => { const t = new Date(o.createdAt).getTime(); return t > dayStart && t <= dayEnd && !CLOSED_LOST.has(o.status); });
    trend.push({ date: new Date(dayEnd).toISOString().slice(0, 10), orders: dayOrders.length, netSales: round(dayOrders.reduce((s, o) => s + toPKR(o.totalPrice, o, rate), 0)) });
  }

  const kpis = {
    netSales: { value: current.netSales, previous: previous.netSales, change: growth(current.netSales, previous.netSales) },
    orders: { value: current.netOrders, previous: previous.netOrders, change: growth(current.netOrders, previous.netOrders) },
    averageOrderValue: { value: current.averageOrderValue, previous: previous.averageOrderValue, change: growth(current.averageOrderValue, previous.averageOrderValue) },
    units: { value: current.units, previous: previous.units, change: growth(current.units, previous.units) },
    newCustomers: { value: customers.newInPeriod },
    cancelRate: { value: current.cancelRate, previous: previous.cancelRate },
    returnRate: { value: current.returnRate, previous: previous.returnRate },
    codToCollect: { value: current.codToCollect },
  };

  const suggestions = buildSuggestions({
    current, previous, customers, inventory, cities, couponRows, activeUnused, highReturnProducts,
    weekdays, staleOpen, periodDays, topProducts,
  });

  return {
    currency: 'PKR', usdRate: rate, periodDays,
    periodStart: new Date(start).toISOString(), periodEnd: new Date(end).toISOString(),
    kpis, current, previous, customers, topProducts, highReturnProducts, inventory,
    cities: cities.slice(0, 12), coupons: couponRows, unusedCoupons: activeUnused,
    statusCounts, weekdays, trend, staleOpenOrders: staleOpen, suggestions,
  };
};

const pkr = n => `Rs ${Math.round(n).toLocaleString('en-PK')}`;

// Plain, data-driven advice. Each item says why (the number) and what to do.
const buildSuggestions = (d) => {
  const out = [];
  const add = (priority, area, title, detail) => out.push({ priority, area, title, detail });
  const { current, previous } = d;

  if (current.orders === 0) {
    add('high', 'Sales', 'No orders in this period',
      `There were no orders in the last ${d.periodDays} days. Share your best product on WhatsApp and social media with a small launch coupon, and check that checkout works on a phone.`);
    return out;
  }
  if (previous.netSales > 0 && current.netSales < previous.netSales * 0.85) {
    add('high', 'Sales', `Sales are down ${Math.abs(Math.round(((current.netSales - previous.netSales) / previous.netSales) * 100))}%`,
      `Net sales fell from ${pkr(previous.netSales)} to ${pkr(current.netSales)}. Run a short promotion on your top product and email past customers.`);
  } else if (previous.netSales > 0 && current.netSales > previous.netSales * 1.15) {
    add('low', 'Sales', `Sales are up ${Math.round(((current.netSales - previous.netSales) / previous.netSales) * 100)}%`,
      'Keep what is working: check that your best sellers have enough stock for the next few weeks.');
  }
  if (current.returnRate >= 10) {
    add('high', 'Returns', `${current.returnRate}% of orders were returned`,
      'Refused COD parcels cost you two-way shipping. Call or WhatsApp customers to confirm COD orders before you ship, especially for first-time buyers.');
  }
  const riskyCity = d.cities.find(c => c.orders >= 5 && c.failedRate >= 25);
  if (riskyCity) {
    add('high', 'Returns', `${riskyCity.city}: ${riskyCity.failedRate}% of orders cancelled or returned`,
      `${riskyCity.cancelled + riskyCity.returned} of ${riskyCity.orders} orders from ${riskyCity.city} did not complete. Confirm every order from this city by phone, or ask for a small advance payment.`);
  }
  if (current.cancelRate >= 15) {
    add('medium', 'Orders', `${current.cancelRate}% of orders were cancelled`,
      'Contact customers within a few hours of ordering; the longer an order waits, the more often it is cancelled.');
  }
  if (d.staleOpen > 0) {
    add(d.staleOpen >= 5 ? 'high' : 'medium', 'Orders', `${d.staleOpen} order${d.staleOpen === 1 ? '' : 's'} waiting more than 3 days`,
      'These are still Pending or Processing. Ship them or contact the customer today; slow delivery is the main reason for refused COD parcels.');
  }
  if (current.codToCollect > 0) {
    add('medium', 'Cash', `${pkr(current.codToCollect)} cash still to collect`,
      'This is COD money for orders that are not delivered yet. Check with your courier that it is on the way, and mark orders Delivered when the cash arrives.');
  }
  d.inventory.restockSoon.slice(0, 3).forEach(p => add('high', 'Stock', `Restock ${p.name}`,
    `Only ${p.stock} left: about ${p.daysOfStockLeft} days at the current pace (${p.unitsSold} sold in ${d.periodDays} days).`));
  if (d.inventory.outOfStock.length) {
    add('medium', 'Stock', `${d.inventory.outOfStock.length} product${d.inventory.outOfStock.length === 1 ? ' is' : 's are'} out of stock`,
      `${d.inventory.outOfStock.slice(0, 3).map(p => p.name).join(', ')}${d.inventory.outOfStock.length > 3 ? '…' : ''}. Restock them or hide them so shoppers do not leave disappointed.`);
  }
  if (d.inventory.notSelling.length) {
    const names = d.inventory.notSelling.slice(0, 3).map(p => p.name).join(', ');
    add('medium', 'Stock', `${d.inventory.notSelling.length} product${d.inventory.notSelling.length === 1 ? '' : 's'} did not sell in ${d.periodDays} days`,
      `${names}. Improve the photos and description, set a time-limited discount, or bundle them with a best seller.`);
  }
  d.highReturnProducts.slice(0, 2).forEach(p => add('medium', 'Products', `${p.name} is often returned (${p.returnRate}%)`,
    'Check that the photos, size and description match the real product, and ask returning customers why.'));
  if (d.customers.totalCustomers >= 10 && d.customers.repeatRate < 20) {
    add('medium', 'Customers', `Only ${d.customers.repeatRate}% of customers ordered again`,
      'Put a thank-you coupon for the next order in every parcel or confirmation email. Repeat customers are cheaper than new ones.');
  }
  if (d.customers.lapsed >= 5) {
    add('low', 'Customers', `${d.customers.lapsed} customers have not ordered for 60+ days`,
      'Send them a "we miss you" message with a small coupon and your newest products.');
  }
  const top = d.topProducts[0];
  if (top && current.averageOrderValue > 0) {
    add('low', 'Sales', `Raise the average order above ${pkr(current.averageOrderValue)}`,
      `Offer a bundle with ${top.name} (your best seller) or free shipping above about ${pkr(Math.ceil((current.averageOrderValue * 1.3) / 100) * 100)}.`);
  }
  const bestDay = [...d.weekdays].sort((a, b) => b.netSales - a.netSales)[0];
  if (bestDay && bestDay.orders >= 3) {
    add('low', 'Marketing', `${bestDay.day} is your best day`,
      `Most sales come on ${bestDay.day}. Post new products and promotions the day before so they are seen when people buy.`);
  }
  const costly = d.couponRows.find(c => c.orders >= 3 && c.discountShare >= 25);
  if (costly) {
    add('medium', 'Coupons', `Coupon ${costly.code} gives away ${costly.discountShare}% of the order`,
      `${costly.orders} orders used it for ${pkr(costly.discount)} in discounts. Lower the discount or add a minimum order amount.`);
  }
  if (d.activeUnused.length) {
    add('low', 'Coupons', `${d.activeUnused.length} active coupon${d.activeUnused.length === 1 ? ' was' : 's were'} not used`,
      `${d.activeUnused.slice(0, 3).join(', ')}. Share them with customers or switch them off.`);
  }
  if (current.netOrders >= 10 && current.internationalShare === 0) {
    add('low', 'Growth', 'No international orders yet',
      'International shipping is set up. Share your store with Pakistani communities abroad (UAE, UK, Saudi Arabia) on social media.');
  }

  const order = { high: 0, medium: 1, low: 2 };
  return out.sort((a, b) => order[a.priority] - order[b.priority]).slice(0, 12);
};

module.exports = { buildBusinessAnalytics, buildSuggestions, summarize };
