const client = require('prom-client');

client.collectDefaultMetrics({
  prefix: 'induscart_',
  register: client.register,
});

const httpRequestDuration = new client.Histogram({
  name: 'induscart_http_request_duration_seconds',
  help: 'Duration of HTTP requests in seconds',
  labelNames: ['method', 'route', 'status_code'],
  buckets: [0.05, 0.1, 0.3, 0.5, 1, 2, 5],
});

const ordersCounter = new client.Counter({
  name: 'induscart_orders_total',
  help: 'Number of orders successfully created in IndusCart',
  labelNames: ['payment_method'],
});

const metricsMiddleware = (req, res, next) => {
  if (req.path === '/metrics') return next();

  const start = process.hrtime.bigint();
  res.on('finish', () => {
    const routePath = req.route?.path;
    const route = routePath
      ? `${req.baseUrl || ''}${routePath}` || '/'
      : 'unmatched';
    const duration = Number(process.hrtime.bigint() - start) / 1e9;

    httpRequestDuration
      .labels(req.method, route, String(res.statusCode))
      .observe(duration);
  });

  next();
};

module.exports = {
  client,
  metricsMiddleware,
  ordersCounter,
};