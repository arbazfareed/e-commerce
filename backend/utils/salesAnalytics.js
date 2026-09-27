const normalizePaymentChannel = (paymentMethod = '') => {
  const method = String(paymentMethod || '').trim();
  if (!method) return 'online';
  const normalized = method.toLowerCase();
  if (['cod', 'cash', 'cash on delivery', 'manual cash'].includes(normalized)) return 'cash';
  return 'online';
};

const getRegionalBucket = (order = {}) => {
  const address = order.address || {};
  const city = String(address.city || '').trim().toLowerCase();
  const country = String(address.country || '').trim().toLowerCase();

  if (country && country !== 'pakistan') return 'International';

  const regionMap = {
    karachi: 'Sindh', lahore: 'Punjab', islamabad: 'Punjab', rawalpindi: 'Punjab', multan: 'Punjab',
    faisalabad: 'Punjab', peshawar: 'Khyber Pakhtunkhwa', quetta: 'Balochistan', swat: 'Khyber Pakhtunkhwa',
    abbottabad: 'Khyber Pakhtunkhwa', gujranwala: 'Punjab', sialkot: 'Punjab', hyderabad: 'Sindh',
    sukkur: 'Sindh', bahawalpur: 'Punjab', sargodha: 'Punjab', muzaffarabad: 'Azad Kashmir', dubai: 'International',
  };

  return regionMap[city] || 'Pakistan (Other)';
};

const getMonthStart = (date) => new Date(date.getFullYear(), date.getMonth(), 1);
const getWeekStart = (date) => {
  const d = new Date(date);
  const day = d.getDay();
  const diff = (day === 0 ? -6 : 1 - day);
  d.setDate(d.getDate() + diff);
  d.setHours(0, 0, 0, 0);
  return d;
};

const formatKey = (d) => d.toISOString().slice(0, 10);
const formatMonthKey = (d) => `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;
const formatHourKey = (d) => String(d.getHours()).padStart(2, '0');
const formatDayName = (d) => d.toLocaleDateString('en-US', { weekday: 'short' });

const createPeriodBucket = (label, startDate, endDate) => ({
  label,
  startDate,
  endDate,
  totalRevenue: 0,
  cashRevenue: 0,
  onlineRevenue: 0,
  orderCount: 0,
  soldUnits: 0,
});

const aggregateOrder = (accumulator, order) => {
  const totalRevenue = Number(order.totalPrice) || 0;
  const channel = normalizePaymentChannel(order.paymentMethod);
  const orderUnits = (order.products || []).reduce((sum, product) => sum + Number(product.quantity || 0), 0);

  accumulator.totalRevenue += totalRevenue;
  accumulator.orderCount += 1;
  accumulator.soldUnits += orderUnits;

  if (channel === 'cash') accumulator.cashRevenue += totalRevenue;
  else accumulator.onlineRevenue += totalRevenue;

  const productNameMap = new Map();
  (order.products || []).forEach((product) => {
    const name = product.name || 'Unknown Product';
    const qty = Number(product.quantity || 0);
    const price = Number(product.price || 0) * qty;
    const entry = productNameMap.get(name) || { name, soldUnits: 0, revenue: 0 };
    entry.soldUnits += qty;
    entry.revenue += price;
    productNameMap.set(name, entry);
  });

  productNameMap.forEach((entry) => {
    const existing = accumulator.productMap.get(entry.name) || { name: entry.name, soldUnits: 0, revenue: 0 };
    existing.soldUnits += entry.soldUnits;
    existing.revenue += entry.revenue;
    accumulator.productMap.set(entry.name, existing);
  });
};

const buildSalesAnalytics = (orders = [], now = new Date(), periods = [3, 6, 9, 12]) => {
  const sourceOrders = Array.isArray(orders) ? orders : [];
  const safeNow = now instanceof Date && !Number.isNaN(now.getTime()) ? new Date(now) : new Date();

  const summary = {
    totalRevenue: 0,
    cashRevenue: 0,
    onlineRevenue: 0,
    totalOrders: 0,
    totalUnitsSold: 0,
    averageOrderValue: 0,
  };

  const productMap = new Map();
  const byDate = new Map();
  const byMonth = new Map();
  const byWeek = new Map();
  const byHour = new Map();
  const byDayOfWeek = new Map();
  const byRegion = new Map();

  const allOrders = [...sourceOrders].sort((a, b) => new Date(a.createdAt || 0) - new Date(b.createdAt || 0));

  allOrders.forEach((order) => {
    const createdAt = order.createdAt ? new Date(order.createdAt) : new Date();
    if (Number.isNaN(createdAt.getTime())) return;

    const orderRevenue = Number(order.totalPrice) || 0;
    const channel = normalizePaymentChannel(order.paymentMethod);
    const orderUnits = (order.products || []).reduce((sum, product) => sum + Number(product.quantity || 0), 0);

    summary.totalRevenue += orderRevenue;
    summary.totalOrders += 1;
    summary.totalUnitsSold += orderUnits;
    if (channel === 'cash') summary.cashRevenue += orderRevenue;
    else summary.onlineRevenue += orderRevenue;

    const dateKey = formatKey(createdAt);
    const monthKey = formatMonthKey(createdAt);
    const weekStart = getWeekStart(createdAt);
    const weekKey = formatKey(weekStart);
    const hourKey = formatHourKey(createdAt);
    const weekday = formatDayName(createdAt);
    const regionKey = getRegionalBucket(order);

    const dateBucket = byDate.get(dateKey) || { date: dateKey, totalRevenue: 0, cashRevenue: 0, onlineRevenue: 0, orders: 0 };
    dateBucket.totalRevenue += orderRevenue;
    dateBucket.orders += 1;
    if (channel === 'cash') dateBucket.cashRevenue += orderRevenue;
    else dateBucket.onlineRevenue += orderRevenue;
    byDate.set(dateKey, dateBucket);

    const monthBucket = byMonth.get(monthKey) || { month: monthKey, totalRevenue: 0, cashRevenue: 0, onlineRevenue: 0, orders: 0 };
    monthBucket.totalRevenue += orderRevenue;
    monthBucket.orders += 1;
    if (channel === 'cash') monthBucket.cashRevenue += orderRevenue;
    else monthBucket.onlineRevenue += orderRevenue;
    byMonth.set(monthKey, monthBucket);

    const weekBucket = byWeek.get(weekKey) || { weekStart: weekKey, totalRevenue: 0, cashRevenue: 0, onlineRevenue: 0, orders: 0 };
    weekBucket.totalRevenue += orderRevenue;
    weekBucket.orders += 1;
    if (channel === 'cash') weekBucket.cashRevenue += orderRevenue;
    else weekBucket.onlineRevenue += orderRevenue;
    byWeek.set(weekKey, weekBucket);

    const hourBucket = byHour.get(hourKey) || { hour: hourKey, totalRevenue: 0, cashRevenue: 0, onlineRevenue: 0, orders: 0 };
    hourBucket.totalRevenue += orderRevenue;
    hourBucket.orders += 1;
    if (channel === 'cash') hourBucket.cashRevenue += orderRevenue;
    else hourBucket.onlineRevenue += orderRevenue;
    byHour.set(hourKey, hourBucket);

    const weekdayBucket = byDayOfWeek.get(weekday) || { day: weekday, totalRevenue: 0, cashRevenue: 0, onlineRevenue: 0, orders: 0 };
    weekdayBucket.totalRevenue += orderRevenue;
    weekdayBucket.orders += 1;
    if (channel === 'cash') weekdayBucket.cashRevenue += orderRevenue;
    else weekdayBucket.onlineRevenue += orderRevenue;
    byDayOfWeek.set(weekday, weekdayBucket);

    const regionBucket = byRegion.get(regionKey) || { region: regionKey, totalRevenue: 0, cashRevenue: 0, onlineRevenue: 0, orders: 0 };
    regionBucket.totalRevenue += orderRevenue;
    regionBucket.orders += 1;
    if (channel === 'cash') regionBucket.cashRevenue += orderRevenue;
    else regionBucket.onlineRevenue += orderRevenue;
    byRegion.set(regionKey, regionBucket);

    (order.products || []).forEach((product) => {
      const name = product.name || 'Unknown Product';
      const qty = Number(product.quantity || 0);
      if (!qty) return;
      const entry = productMap.get(name) || { name, soldUnits: 0, revenue: 0 };
      entry.soldUnits += qty;
      entry.revenue += Number(product.price || 0) * qty;
      productMap.set(name, entry);
    });
  });

  summary.averageOrderValue = summary.totalOrders ? summary.totalRevenue / summary.totalOrders : 0;

  const topProducts = [...productMap.values()].sort((a, b) => b.soldUnits - a.soldUnits || b.revenue - a.revenue).map((item) => ({
    name: item.name,
    soldUnits: item.soldUnits,
    revenue: item.revenue,
  }));

  const monthlySeries = [...byMonth.values()].sort((a, b) => new Date(`${a.month}-01`) - new Date(`${b.month}-01`));
  const weeklySeries = [...byWeek.values()].sort((a, b) => new Date(a.weekStart) - new Date(b.weekStart));
  const dailySeries = [...byDate.values()].sort((a, b) => new Date(a.date) - new Date(b.date));
  const hourlySeries = [...byHour.values()].sort((a, b) => Number(a.hour) - Number(b.hour));
  const dayOfWeekSeries = [...byDayOfWeek.values()].sort((a, b) => ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].indexOf(a.day) - ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].indexOf(b.day));
  const regionBreakdown = [...byRegion.values()].sort((a, b) => b.totalRevenue - a.totalRevenue);

  const rangeBreakdown = {};
  (periods || []).forEach((period) => {
    const startMonth = new Date(safeNow.getFullYear(), safeNow.getMonth() - (period - 1), 1);
    const endMonth = new Date(safeNow.getFullYear(), safeNow.getMonth() + 1, 0, 23, 59, 59, 999);
    const periodBucket = createPeriodBucket(`${period}M`, startMonth, endMonth);

    monthlySeries.forEach((item) => {
      const date = new Date(`${item.month}-01T00:00:00Z`);
      if (date >= startMonth && date <= endMonth) {
        periodBucket.totalRevenue += item.totalRevenue;
        periodBucket.cashRevenue += item.cashRevenue;
        periodBucket.onlineRevenue += item.onlineRevenue;
        periodBucket.orderCount += item.orders;
        periodBucket.soldUnits += item.orders ? 0 : 0;
      }
    });

    const sourceForPeriod = allOrders.filter((order) => {
      const createdAt = order.createdAt ? new Date(order.createdAt) : null;
      if (!createdAt || Number.isNaN(createdAt.getTime())) return false;
      return createdAt >= startMonth && createdAt <= endMonth;
    });

    periodBucket.totalRevenue = sourceForPeriod.reduce((sum, order) => sum + (Number(order.totalPrice) || 0), 0);
    periodBucket.cashRevenue = sourceForPeriod.filter((order) => normalizePaymentChannel(order.paymentMethod) === 'cash').reduce((sum, order) => sum + (Number(order.totalPrice) || 0), 0);
    periodBucket.onlineRevenue = sourceForPeriod.filter((order) => normalizePaymentChannel(order.paymentMethod) !== 'cash').reduce((sum, order) => sum + (Number(order.totalPrice) || 0), 0);
    periodBucket.orderCount = sourceForPeriod.length;
    periodBucket.soldUnits = sourceForPeriod.reduce((sum, order) => sum + (order.products || []).reduce((itemSum, product) => itemSum + Number(product.quantity || 0), 0), 0);

    rangeBreakdown[period] = periodBucket;
  });

  const strongestRegion = regionBreakdown[0] || { region: 'No sales', totalRevenue: 0 };
  const peakHour = hourlySeries.reduce((best, current) => (current.totalRevenue > best.totalRevenue ? current : best), { hour: '00', totalRevenue: 0 });
  const peakDay = dayOfWeekSeries.reduce((best, current) => (current.totalRevenue > best.totalRevenue ? current : best), { day: 'Mon', totalRevenue: 0 });
  const cashShare = summary.totalRevenue ? (summary.cashRevenue / summary.totalRevenue) * 100 : 0;
  const onlineShare = summary.totalRevenue ? (summary.onlineRevenue / summary.totalRevenue) * 100 : 0;
  const topProduct = topProducts[0] || { name: 'No product yet', soldUnits: 0, revenue: 0 };
  const bestChannel = cashShare >= onlineShare ? 'Cash sales' : 'Online sales';
  const regionGrowthHint = strongestRegion.totalRevenue > 0 ? `${strongestRegion.region} is the best-performing region right now.` : 'Regional demand has not started to peak yet.';

  const insights = {
    summaryText: `${regionGrowthHint} ${topProduct.name} is your strongest product, while ${bestChannel.toLowerCase()} are leading the revenue mix. Cash contributes ${cashShare.toFixed(1)}% and online contributes ${onlineShare.toFixed(1)}%.`,
    customerPsychology: [
      'Cash buyers respond best when they feel security, convenience, and zero confusion at the point of purchase.',
      'Online buyers convert faster when they see trust signals, time pressure, and a clear value message in one screen.',
      'Local demand spikes when campaigns match the customer’s region, timing, and buying behavior rather than using one-size-fits-all messaging.',
      'High-intent users buy when the offer feels both obvious and low-risk, so simplify the choice and highlight proof.',
    ],
    recommendedActions: [
      `Push the strongest offer in ${strongestRegion.region || 'your top market'} with a regional campaign and bundle messaging tied to ${topProduct.name}.`,
      `Bundle ${topProduct.name} with its most complementary items to raise average order value without lowering conversion speed.`,
      `Schedule your strongest promotions around ${peakHour.hour}:00 and ${peakDay.day} to catch the highest-converting customer windows.`,
      `Give cash customers a delivery-first trust message and make the payment process feel easy, safe, and transparent.`,
      'Use localized proof, customer reactions, and simple urgency triggers in your sales copy to reduce hesitation and increase click-throughs.',
      'Refresh your product hero copy to highlight the benefit first, then price, then trust signals to improve action and confidence.',
    ],
    marketingStrategy: {
      position: 'Lead with the result, not the feature: show the customer what they gain, why it matters now, and why the offer is safe to act on.',
      aiApproach: 'Use revenue patterns from region, payment channel, product demand, and time-of-day to personalize offers, bundles, and pressure points without guesswork.',
      humanPsychology: 'Shoppers convert when they feel certainty, urgency, and social proof. Reduce decision fatigue and guide the customer toward one confident and easy next step.',
      offerPlay: 'Use a strong hero offer for the top region, pair it with a product bundle around your top SKU, and time the campaign at the highest-demand hour.',
      channelPlay: cashShare >= onlineShare ? 'Cash is currently the strongest conversion channel, so invest in trust-building scripts, delivery confidence, and faster in-person reassurance.' : 'Online is the stronger growth channel, so focus on urgency, trust badges, and conversion-optimized landing copy.',
    },
  };

  return {
    generatedAt: new Date().toISOString(),
    summary: {
      ...summary,
      cashRevenue: summary.cashRevenue,
      onlineRevenue: summary.onlineRevenue,
    },
    topProducts,
    monthlySeries,
    weeklySeries,
    dailySeries,
    hourlySeries,
    dayOfWeekSeries,
    regionBreakdown,
    rangeBreakdown,
    paymentBreakdown: {
      cash: summary.cashRevenue,
      online: summary.onlineRevenue,
    },
    insights,
  };
};

module.exports = { buildSalesAnalytics, normalizePaymentChannel, getRegionalBucket };
