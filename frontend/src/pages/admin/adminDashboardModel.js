import { formatPKR } from '../../utils/priceUtils';
import { downloadCsv, ordersToCsvRows, productsToCsvRows } from './csvExport';

export function buildAdminDashboardModel({ analytics, flash, kpiFilter, orders, products, revPKR }) {
  const formatCompactNumber = (value) => new Intl.NumberFormat('en-PK', {
      notation: 'compact',
      maximumFractionDigits: 1,
    }).format(Number(value || 0));

  const salesChartSections = [
      {
        title: 'Daily revenue',
        data: (analytics?.dailySeries || []).slice(-7).map((item) => ({
          label: new Date(item.date).toLocaleDateString('en-PK', { month: 'short', day: 'numeric' }),
          value: Number(item.totalRevenue || 0),
        })),
      },
      {
        title: 'Weekly revenue',
        data: (analytics?.weeklySeries || []).slice(-6).map((item) => ({
          label: new Date(item.weekStart).toLocaleDateString('en-PK', { month: 'short', day: 'numeric' }),
          value: Number(item.totalRevenue || 0),
        })),
      },
      {
        title: 'Monthly revenue',
        data: (analytics?.monthlySeries || []).slice(-6).map((item) => ({
          label: new Date(`${item.month}-01T00:00:00`).toLocaleDateString('en-PK', { month: 'short', year: '2-digit' }),
          value: Number(item.totalRevenue || 0),
        })),
      },
    ];

  const premiumRegionStrategy = {
      Lahore: { shopper: 'premium gift buyers', trigger: 'gift-led urgency', product: 'home décor, gifting, and premium kitchen essentials' },
      Karachi: { shopper: 'high-volume urban shoppers', trigger: 'social proof + fast delivery', product: 'fashion accessories, daily essentials, and bundle offers' },
      Islamabad: { shopper: 'trust-first professionals', trigger: 'quality reassurance + same-day confidence', product: 'wellness, home upgrades, and curated premium bundles' },
      Multan: { shopper: 'family repeat buyers', trigger: 'value-packed bundles', product: 'household essentials and seasonal bundles' },
      Rawalpindi: { shopper: 'gift-oriented families', trigger: 'bundle gifting + free-shipping threshold', product: 'giftable home and lifestyle bundles' },
      Faisalabad: { shopper: 'value-focused volume buyers', trigger: 'cross-sell / repeat-driving bundles', product: 'textile, home, and utility bundles' },
      'Punjab': { shopper: 'regional repeat buyers', trigger: 'bundle savings + local trust', product: 'home and daily-use bundles' },
      'Sindh': { shopper: 'city-driven shoppers', trigger: 'fast-turnover offers', product: 'daily essentials and lifestyle accessories' },
      'Khyber Pakhtunkhwa': { shopper: 'practical value seekers', trigger: 'seasonal promotions', product: 'home essentials and utility gifts' },
      'Balochistan': { shopper: 'high-intent discoverers', trigger: 'limited-time trust-building', product: 'bare essentials and gifting creates' },
    };

  const regionalCampaigns = (analytics?.regionBreakdown || []).slice(0, 4).map((region, index) => {
      const offerPercent = 12 + index * 5;
      const baseProduct = analytics?.topProducts?.[0]?.name || 'best-selling product';
      const strategy = premiumRegionStrategy[region.region] || {
        shopper: 'growth-market shoppers',
        trigger: 'limited-time value push',
        product: 'best-selling product bundles',
      };

      return {
        region: region.region,
        revenue: region.totalRevenue || 0,
        orders: region.orders || 0,
        offer: `${offerPercent}% ${strategy.trigger} offer`,
        message: `Position ${baseProduct} for ${strategy.shopper} in ${region.region} with a premium bundle story, clear proof points, and a strong local delivery promise.`,
        target: region.totalRevenue > 0 ? 'High-intent audience' : 'New market test',
        angle: strategy.product,
      };
    });

  const productRecommendations = (() => {
      if (!products.length) return [];
      const topNames = new Set((analytics?.topProducts || []).slice(0, 3).map((product) => product.name));
      const topProductsList = products.filter((product) => topNames.has(product.name));
      const fallbackProducts = products.filter((product) => !topNames.has(product.name));

      return (topProductsList.length ? topProductsList : products.slice(0, 3)).map((baseProduct) => {
        const categoryMatches = products.filter((product) => product.category === baseProduct.category && product.name !== baseProduct.name).slice(0, 2);
        const bundleItems = [baseProduct.name, ...categoryMatches.map((item) => item.name)];
        const offerValue = baseProduct.pricePKR ? Math.round(baseProduct.pricePKR * 0.15) : 0;
        const categoryMood = baseProduct.category === 'Home' ? 'gift-ready household edit'
          : baseProduct.category === 'Fashion' ? 'style-first bundle momentum'
          : baseProduct.category === 'Beauty' ? 'self-care premium upsell'
          : baseProduct.category === 'Kitchen' ? 'utility-led premium upgrade'
          : 'high-conversion bestseller stack';

        return {
          name: baseProduct.name,
          category: baseProduct.category || 'Featured',
          offer: `${offerValue ? 'Rs ' + formatCompactNumber(offerValue) : 'Bundle'} off`,
          bundle: bundleItems.length ? bundleItems : ['Quick-add accessory', 'Gift add-on'],
          rationale: `Best for ${categoryMood} and repeat-purchase conversion in Pakistan’s high-trust buying clusters.`,
        };
      }).concat((fallbackProducts.slice(0, 2) || []).map((product) => ({
        name: product.name,
        category: product.category || 'Suggested',
        offer: 'High-value bundle',
        bundle: [product.name, 'Fast-moving add-on', 'Top-ups pack'],
        rationale: 'Perfect for expanding category reach and increasing average order value without slashing margin.',
      }))).slice(0, 4);
    })();

  const exportCsvReport = () => {
      const rows = [
        ['Report', 'IndusCart Sales Intelligence Summary'],
        ['Generated At', new Date().toLocaleString('en-PK')],
        ['Total Revenue', formatPKR(analytics?.summary?.totalRevenue || 0)],
        ['Cash Revenue', formatPKR(analytics?.summary?.cashRevenue || 0)],
        ['Online Revenue', formatPKR(analytics?.summary?.onlineRevenue || 0)],
        ['Total Orders', String(analytics?.summary?.totalOrders || orders.length)],
        ['Top Product', analytics?.topProducts?.[0]?.name || 'No product'],
        ['Strongest Region', strongestRegion],
        ['', ''],
        ['Region', 'Revenue', 'Orders'],
        ...((analytics?.regionBreakdown || []).map((item) => [item.region, String(item.totalRevenue || 0), String(item.orders || 0)])),
        ['', ''],
        ['Recommendation', 'Action'],
        ...((analytics?.insights?.recommendedActions || []).slice(0, 6).map((action) => [action, 'Recommended'])),
      ];

      downloadCsv('induscart-sales-report.csv', rows);
    };

  const exportProductsCsv = () => {
      downloadCsv('induscart-products.csv', productsToCsvRows(products));
    };

  const exportOrdersCsv = () => {
      downloadCsv('induscart-orders.csv', ordersToCsvRows(orders));
    };

  const generatePdfReport = () => {
      const reportHtml = `
        <html>
          <head>
            <title>IndusCart Sales Intelligence Report</title>
            <style>
              body { font-family: "DM Sans", "Segoe UI", sans-serif; background:#f8fafc; color:#0f172a; padding:24px; }
              .box { background:#fff; border:1px solid #e2e8f0; border-radius:16px; padding:18px; margin-bottom:16px; }
              h1 { margin:0 0 10px; }
              h2, h3 { margin:0 0 10px; }
              table { width:100%; border-collapse:collapse; }
              th, td { border:1px solid #e2e8f0; padding:8px 10px; text-align:left; }
              .meta { display:flex; justify-content:space-between; gap:12px; flex-wrap:wrap; }
              .kpi { display:grid; grid-template-columns:repeat(4,1fr); gap:12px; }
              .chip { display:inline-block; background:#ecfdf5; color:#065f46; padding:6px 10px; border-radius:999px; font-weight:700; }
              .campaign { background:#fef3c7; border:1px solid #fed7aa; padding:12px; border-radius:12px; margin-top:10px; }
            </style>
          </head>
          <body>
            <div class="box">
              <h1>IndusCart Premium Sales Intelligence Report</h1>
              <div class="meta">
                <p><strong>Generated:</strong> ${new Date().toLocaleString('en-PK')}</p>
                <p class="chip">Cash: ${formatPKR(analytics?.summary?.cashRevenue || 0)} · Online: ${formatPKR(analytics?.summary?.onlineRevenue || 0)}</p>
              </div>
            </div>
            <div class="kpi">
              <div class="box"><h3>Total Revenue</h3><p>${formatPKR(analytics?.summary?.totalRevenue || 0)}</p></div>
              <div class="box"><h3>Orders</h3><p>${analytics?.summary?.totalOrders || 0}</p></div>
              <div class="box"><h3>Top Product</h3><p>${analytics?.topProducts?.[0]?.name || '—'}</p></div>
              <div class="box"><h3>Avg Order</h3><p>${formatPKR(analytics?.summary?.averageOrderValue || 0)}</p></div>
            </div>
            <div class="box">
              <h2>Regional performance</h2>
              <table>
                <thead><tr><th>Region</th><th>Revenue</th><th>Orders</th></tr></thead>
                <tbody>
                  ${(analytics?.regionBreakdown || []).map((region) => `<tr><td>${region.region}</td><td>${formatPKR(region.totalRevenue || 0)}</td><td>${region.orders || 0}</td></tr>`).join('') || '<tr><td colspan="3">No regional data yet</td></tr>'}
                </tbody>
              </table>
            </div>
            <div class="box">
              <h2>Regional marketing campaigns</h2>
              ${(regionalCampaigns || []).map((campaign) => `
                <div class="campaign">
                  <strong>${campaign.region}</strong><br>
                  ${campaign.offer} · ${campaign.target}<br>
                  ${campaign.message}
                </div>
              `).join('') || '<p>No campaign recommendations yet.</p>'}
            </div>
            <div class="box">
              <h2>AI strategy summary</h2>
              <p>${analytics?.insights?.summaryText || 'No insight available yet.'}</p>
              <ul>
                ${(analytics?.insights?.recommendedActions || []).map(action => `<li>${action}</li>`).join('')}
              </ul>
            </div>
          </body>
        </html>
      `;

      const printWindow = window.open('', '_blank', 'width=1200,height=900');
      if (!printWindow) {
        flash('PDF export was blocked. Please allow pop-ups and try again.', false);
        return;
      }
      printWindow.document.write(reportHtml);
      printWindow.document.close();
      setTimeout(() => {
        printWindow.focus();
        printWindow.print();
      }, 300);
    };

  const strongestRegion = analytics?.regionBreakdown?.[0]?.region || 'No region yet';

  const topProductName = analytics?.topProducts?.[0]?.name || 'No product yet';

  const strongestHour = analytics?.hourlySeries?.reduce((best, current) => (current.totalRevenue > best.totalRevenue ? current : best), { hour: '00', totalRevenue: 0 })?.hour || '00';

  const aiPulse = [
      { label: 'Lead Region', value: strongestRegion },
      { label: 'Peak Demand', value: `${strongestHour}:00` },
      { label: 'Best SKU', value: topProductName },
      { label: 'Best Channel', value: (analytics?.summary?.cashRevenue || 0) >= (analytics?.summary?.onlineRevenue || 0) ? 'Cash-led' : 'Online-led' },
    ];

  const aiStrategy = [
      { label: 'Urgency', value: 'High-intent PK buyers', tone: '#f59e0b' },
      { label: 'Focus', value: 'Bundle-led upsells', tone: '#10b981' },
      { label: 'Risk', value: 'Low-stock warnings', tone: '#f43f5e' },
      { label: 'Play', value: 'Regional retargeting', tone: '#60a5fa' },
    ];

  const executiveSummary = {
      momentum: analytics?.summary?.totalRevenue ? Math.min(98, Math.round((analytics.summary.totalRevenue / Math.max(revPKR, 1)) * 100 + 35)) : 76,
      cashShare: analytics?.summary?.totalRevenue ? Math.round(((analytics.summary.cashRevenue || 0) / Math.max(analytics.summary.totalRevenue, 1)) * 100) : 0,
      onlineShare: analytics?.summary?.totalRevenue ? Math.round(((analytics.summary.onlineRevenue || 0) / Math.max(analytics.summary.totalRevenue, 1)) * 100) : 0,
      outlook: analytics?.summary?.cashRevenue >= (analytics?.summary?.onlineRevenue || 0) ? 'Cash-led conversions are currently leading the growth curve.' : 'Online demand is accelerating and should be prioritized for higher-volume campaigns.',
    };

  const filteredSeries = {
      daily: (analytics?.dailySeries || []).slice(-7).map((item) => ({
        label: new Date(item.date).toLocaleDateString('en-PK', { month: 'short', day: 'numeric' }),
        value: kpiFilter === 'all' ? Number(item.totalRevenue || 0) : kpiFilter === 'cash' ? Number(item.cashRevenue || 0) : Number(item.onlineRevenue || 0),
        total: Number(item.totalRevenue || 0),
        cash: Number(item.cashRevenue || 0),
        online: Number(item.onlineRevenue || 0),
      })),
      weekly: (analytics?.weeklySeries || []).slice(-6).map((item) => ({
        label: new Date(item.weekStart).toLocaleDateString('en-PK', { month: 'short', day: 'numeric' }),
        value: kpiFilter === 'all' ? Number(item.totalRevenue || 0) : kpiFilter === 'cash' ? Number(item.cashRevenue || 0) : Number(item.onlineRevenue || 0),
        total: Number(item.totalRevenue || 0),
        cash: Number(item.cashRevenue || 0),
        online: Number(item.onlineRevenue || 0),
      })),
      monthly: (analytics?.monthlySeries || []).slice(-6).map((item) => ({
        label: new Date(`${item.month}-01T00:00:00`).toLocaleDateString('en-PK', { month: 'short', year: '2-digit' }),
        value: kpiFilter === 'all' ? Number(item.totalRevenue || 0) : kpiFilter === 'cash' ? Number(item.cashRevenue || 0) : Number(item.onlineRevenue || 0),
        total: Number(item.totalRevenue || 0),
        cash: Number(item.cashRevenue || 0),
        online: Number(item.onlineRevenue || 0),
      })),
    };

  const kpiValues = {
      all: analytics?.summary?.totalRevenue || revPKR,
      cash: analytics?.summary?.cashRevenue || 0,
      online: analytics?.summary?.onlineRevenue || 0,
    };

  const kpiRows = [
      { label: 'Gross Revenue', key: 'all', value: kpiValues.all, sub: `${analytics?.summary?.totalOrders || orders.length} paid orders` },
      { label: 'Cash Lift (PK)', key: 'cash', value: kpiValues.cash, sub: `${formatPKR(kpiValues.online)} online demand` },
      { label: 'Online Demand', key: 'online', value: kpiValues.online, sub: `${analytics?.topProducts?.[0]?.name || 'Top product'}` },
      { label: 'Top Category Driver', key: 'all', value: analytics?.topProducts?.[0]?.name || '—', sub: `${analytics?.topProducts?.[0]?.soldUnits || 0} units sold` },
    ];

  const performanceTabs = [
      { key: 'overview', label: 'Overview' },
      { key: 'products', label: 'Products' },
      { key: 'regions', label: 'Regions' },
      { key: 'channels', label: 'Channels' },
    ];

  const productBreakdown = (analytics?.topProducts || []).slice(0, 5).map((product) => ({
      name: product.name,
      revenue: product.revenue || 0,
      units: product.soldUnits || 0,
    }));

  const regionBreakdown = (analytics?.regionBreakdown || []).map((region) => ({
      ...region,
      revenue: kpiFilter === 'all' ? Number(region.totalRevenue || 0) : kpiFilter === 'cash' ? Number(region.cashRevenue || 0) : Number(region.onlineRevenue || 0),
    }));

  const channelBreakdown = [
      { label: 'Cash', value: Number(analytics?.summary?.cashRevenue || 0), share: analytics?.summary?.totalRevenue ? ((analytics?.summary?.cashRevenue || 0) / analytics.summary.totalRevenue) * 100 : 0 },
      { label: 'Online', value: Number(analytics?.summary?.onlineRevenue || 0), share: analytics?.summary?.totalRevenue ? ((analytics?.summary?.onlineRevenue || 0) / analytics.summary.totalRevenue) * 100 : 0 },
    ];

  return {
    formatCompactNumber,
    salesChartSections,
    premiumRegionStrategy,
    regionalCampaigns,
    productRecommendations,
    exportCsvReport,
    exportProductsCsv,
    exportOrdersCsv,
    generatePdfReport,
    strongestRegion,
    topProductName,
    strongestHour,
    aiPulse,
    aiStrategy,
    executiveSummary,
    filteredSeries,
    kpiValues,
    kpiRows,
    performanceTabs,
    productBreakdown,
    regionBreakdown,
    channelBreakdown
  };
}
