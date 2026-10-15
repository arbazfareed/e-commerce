// backend/server.js
const express  = require('express');
const cors     = require('cors');
const helmet   = require('helmet');
const dotenv   = require('dotenv');
const path     = require('path');
const mongoose = require('mongoose');
const connectDB = require('./config/db');
const { assertEnvironment, getCorsOptions } = require('./config/env');
const { client, metricsMiddleware } = require('./middleware/metrics');

dotenv.config();
assertEnvironment();

const app = express();
const uploadsDir = path.join(__dirname, 'uploads');

// ─── Middleware ───────────────────────────────────────────────
app.use(cors(getCorsOptions()));
app.use(helmet({ crossOriginResourcePolicy: { policy: 'cross-origin' } }));
app.use(express.json({ limit: '1mb' }));
app.use(metricsMiddleware);
// Ensure database is connected for API requests (vital for serverless environments like Vercel)
app.use(async (req, res, next) => {
  if (req.path.startsWith('/api') && mongoose.connection.readyState !== 1) {
    if (!process.env.MONGO_URI) {
      return res.status(503).json({
        error: 'Database not configured',
        message: 'MONGO_URI is missing. Please add it to your Vercel Project Settings -> Environment Variables.',
      });
    }
    try {
      await connectDB();
    } catch (err) {
      return res.status(503).json({
        error: 'Database connection failed',
        message: err.message,
      });
    }
  }
  next();
});

// ─── Routes ───────────────────────────────────────────────────
app.use('/api/auth',     require('./routes/authRoutes'));
app.use('/api/products', require('./routes/productRoutes'));
app.use('/api/orders',   require('./routes/orderRoutes'));
app.use('/api/coupons',  require('./routes/couponRoutes'));
app.use('/api/reviews',  require('./routes/reviewRoutes'));
app.use('/api/wishlist', require('./routes/wishlistRoutes'));
app.use('/api/cart',     require('./routes/cartRoutes'));
app.use('/api/support',  require('./routes/supportRoutes'));   // ← NEW
app.use('/api/settings', require('./routes/settingsRoutes'));

// ─── Home Route ───────────────────────────────────────────────
app.get('/', (req, res) => {
  const isDbReady = mongoose.connection.readyState === 1;
  res.status(200).send(`IndusCart API is running ✅${isDbReady ? ' (Database connected)' : ''}`);
});
app.get('/health/live', (req, res) => {
  res.status(200).json({ status: 'ok', service: 'induscart-api' });
});
app.get('/health/ready', (req, res) => {
  const ready = mongoose.connection.readyState === 1;
  res.status(ready ? 200 : 503).json({
    status: ready ? 'ok' : 'unavailable',
    database: ready ? 'connected' : 'disconnected',
  });
});
app.get('/metrics', async (req, res, next) => {
  try {
    res.setHeader('Content-Type', client.register.contentType);
    res.end(await client.register.metrics());
  } catch (error) {
    next(error);
  }
});

app.use((req, res) => {
  res.status(404).json({ message: 'Route not found.' });
});

app.use((error, req, res, next) => {
  console.error(`${req.method} ${req.originalUrl}:`, error.message);
  if (res.headersSent) return next(error);
  const status = error.statusCode || (error.message.includes('CORS') ? 403 : 500);
  res.status(status).json({ message: status === 500 ? 'Internal server error.' : error.message });
});

// ─── Connect DB & Start Server ────────────────────────────────
const startServer = async () => {
  await connectDB();
  const PORT = process.env.PORT || 5000;
  return app.listen(PORT, () => console.log(`🚀 Server running on port ${PORT}`));
};

if (require.main === module && !process.env.VERCEL) {
  startServer();
}

const shutdown = async (signal) => {
  console.log(`${signal} received. Closing database connection.`);
  await mongoose.connection.close(false);
  process.exit(0);
};

process.once('SIGINT', () => shutdown('SIGINT'));
process.once('SIGTERM', () => shutdown('SIGTERM'));

module.exports = app;
module.exports.app = app;
module.exports.startServer = startServer;

