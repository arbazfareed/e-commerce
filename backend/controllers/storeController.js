const mongoose = require('mongoose');
const Store = require('../models/Store');
const User = require('../models/User');
const Order = require('../models/Order');
const Product = require('../models/Product');
const SystemSettings = require('../models/SystemSettings');
const emailService = require('../services/emailService');
const { sendServerError } = require('../utils/httpErrors');
const { generatePassword, generateUsername, slugify } = require('../utils/credentials');
const { buildStoreReport, buildStoresOverview, MAIN } = require('../utils/storeAnalytics');
const { clearInactiveStoreCache } = require('../utils/storeStatus');

const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

const loginUrl = () => `${emailService.getFrontendUrl() || ''}/admin/login`;

// Send the new login details to the store owner when email is set up. Never throws.
const emailCredentials = async ({ to, storeName, username, password, isReset }) => {
  if (!emailService.isConfigured()) return false;
  const { escapeHtml, layout } = emailService;
  const url = loginUrl();
  try {
    await emailService.sendEmail({
      to,
      subject: isReset ? `Your new IndusCart store password (${storeName})` : `Your IndusCart store is ready: ${storeName}`,
      text: `${isReset ? 'Your store password was reset.' : `Welcome! Your store "${storeName}" is ready on IndusCart.`}\n\nSign in: ${url}\nUsername: ${username}\nTemporary password: ${password}\n\nPlease change this password after you sign in (Account tab).`,
      html: layout(`<p>${isReset ? 'Your store password was reset.' : `Welcome! Your store <strong>${escapeHtml(storeName)}</strong> is ready on IndusCart.`}</p>
<p>Sign in at <a href="${escapeHtml(url)}">${escapeHtml(url)}</a></p>
<p>Username: <strong>${escapeHtml(username)}</strong><br>Temporary password: <strong>${escapeHtml(password)}</strong></p>
<p>Please change this password after you sign in (Account tab).</p>`),
    });
    return true;
  } catch (error) {
    console.error('Store credentials email failed:', error.code || 'EMAIL_ERROR', '-', error.message);
    return false;
  }
};

const storeView = (store, owner, productCount = 0) => ({
  _id: store._id,
  name: store.name,
  slug: store.slug,
  isActive: store.isActive !== false,
  createdAt: store.createdAt,
  productCount,
  owner: owner ? { _id: owner._id, username: owner.username, email: owner.email, mustChangePassword: Boolean(owner.mustChangePassword) } : null,
});

// GET /api/stores — main admin: every store with its owner and product count.
const listStores = async (req, res) => {
  try {
    const [stores, owners, counts] = await Promise.all([
      Store.find().sort({ createdAt: -1 }).lean(),
      User.find({ isSubAdmin: true }).select('username email store mustChangePassword').lean(),
      Product.aggregate([{ $match: { store: { $ne: null } } }, { $group: { _id: '$store', count: { $sum: 1 } } }]),
    ]);
    const ownerByStore = new Map(owners.map(owner => [String(owner.store), owner]));
    const countByStore = new Map(counts.map(row => [String(row._id), row.count]));
    res.json(stores.map(store => storeView(store, ownerByStore.get(String(store._id)), countByStore.get(String(store._id)) || 0)));
  } catch (error) {
    sendServerError(res, error);
  }
};

// POST /api/stores {email, storeName} — main admin creates a store and its owner account.
// The username and a temporary password are generated and returned once.
const createStore = async (req, res) => {
  const email = typeof req.body?.email === 'string' ? req.body.email.trim().toLowerCase() : '';
  const storeName = typeof req.body?.storeName === 'string' ? req.body.storeName.trim().replace(/\s+/g, ' ') : '';
  if (!EMAIL_PATTERN.test(email) || email.length > 254) return res.status(400).json({ message: 'Enter a valid email address.' });
  if (storeName.length < 2 || storeName.length > 80) return res.status(400).json({ message: 'Store name must be 2 to 80 characters.' });

  try {
    if (await User.exists({ email })) return res.status(409).json({ message: 'An account with this email already exists. Use a different email for the store owner.' });
    if (await Store.exists({ nameKey: storeName.toLowerCase() })) return res.status(409).json({ message: 'A store with this name already exists.' });

    const username = await generateUsername(storeName, async candidate => Boolean(await User.exists({ username: candidate })));
    let slug = slugify(storeName);
    if (await Store.exists({ slug })) slug = `${slug}-${username.slice(-4)}`;
    const password = generatePassword();

    const store = await Store.create({ name: storeName, nameKey: storeName.toLowerCase(), slug, createdBy: req.user._id });
    let owner;
    try {
      owner = await User.create({
        name: storeName, email, username, password,
        isAdmin: false, isSubAdmin: true, store: store._id, mustChangePassword: true,
      });
    } catch (error) {
      await Store.deleteOne({ _id: store._id });
      throw error;
    }

    const emailed = await emailCredentials({ to: email, storeName, username, password, isReset: false });
    res.status(201).json({
      store: storeView(store, owner, 0),
      credentials: { username, password, email, loginUrl: loginUrl() },
      emailed,
    });
  } catch (error) {
    if (error?.code === 11000) return res.status(409).json({ message: 'This store name, email or username is already in use. Please try again.' });
    sendServerError(res, error, 'The store could not be created.');
  }
};

// PATCH /api/stores/:id {name?, isActive?} — rename or switch a store on/off.
const updateStore = async (req, res) => {
  try {
    const store = await Store.findById(req.params.id);
    if (!store) return res.status(404).json({ message: 'Store not found.' });
    if (req.body.name !== undefined) {
      const name = typeof req.body.name === 'string' ? req.body.name.trim().replace(/\s+/g, ' ') : '';
      if (name.length < 2 || name.length > 80) return res.status(400).json({ message: 'Store name must be 2 to 80 characters.' });
      if (name.toLowerCase() !== store.nameKey && await Store.exists({ nameKey: name.toLowerCase() }))
        return res.status(409).json({ message: 'A store with this name already exists.' });
      store.name = name;
      store.nameKey = name.toLowerCase();
    }
    if (req.body.isActive !== undefined) {
      if (typeof req.body.isActive !== 'boolean') return res.status(400).json({ message: 'isActive must be true or false.' });
      store.isActive = req.body.isActive;
    }
    await store.save();
    if (req.body.isActive === false) {
      // Sign the owner out everywhere when the store is switched off.
      await User.updateMany({ store: store._id, isSubAdmin: true }, { $inc: { tokenVersion: 1 } });
    }
    clearInactiveStoreCache();
    const owner = await User.findOne({ store: store._id, isSubAdmin: true }).select('username email mustChangePassword').lean();
    res.json(storeView(store.toObject(), owner, await Product.countDocuments({ store: store._id })));
  } catch (error) {
    sendServerError(res, error);
  }
};

// POST /api/stores/:id/reset-password — new temporary password for the store owner.
const resetStorePassword = async (req, res) => {
  try {
    const store = await Store.findById(req.params.id).lean();
    if (!store) return res.status(404).json({ message: 'Store not found.' });
    const owner = await User.findOne({ store: store._id, isSubAdmin: true });
    if (!owner) return res.status(404).json({ message: 'This store has no owner account.' });
    const password = generatePassword();
    owner.password = password;
    owner.mustChangePassword = true;
    owner.tokenVersion = (owner.tokenVersion || 0) + 1;
    await owner.save();
    const emailed = await emailCredentials({ to: owner.email, storeName: store.name, username: owner.username, password, isReset: true });
    res.json({ credentials: { username: owner.username, password, email: owner.email, loginUrl: loginUrl() }, emailed });
  } catch (error) {
    sendServerError(res, error);
  }
};

const loadAnalyticsData = () => Promise.all([
  Order.find().select('user guestContact products.product products.name products.price products.quantity currency totalPrice address.city address.country paymentMethod isPaid status isManualCash createdAt')
    .populate('user', 'name email').lean(),
  Product.find().select('name stock isVisible createdAt pricePKR store').lean(),
  SystemSettings.findOne({ key: 'global' }).select('usdRate').lean(),
]);

// GET /api/stores/analytics?days=30[&store=<id>|main]
//  - store owner: their own store only (shopper details removed)
//  - main admin: every store side by side, or one store's full report with ?store=
const getStoreAnalytics = async (req, res) => {
  try {
    const days = Number(req.query.days) || 30;
    const now = new Date();
    const [orders, products, settings] = await loadAnalyticsData();
    const usdRate = settings?.usdRate;

    if (req.storeScope) {
      const report = buildStoreReport({ orders, products, storeKey: String(req.storeScope), usdRate, days, now, forStoreOwner: true });
      return res.json({ ...report, store: { _id: req.storeScope, name: req.store?.name || '' } });
    }

    const requested = req.query.store;
    if (requested) {
      if (requested !== MAIN && !mongoose.isValidObjectId(requested)) return res.status(404).json({ message: 'Store not found.' });
      const store = requested === MAIN ? { _id: null, name: 'IndusCart (main store)' } : await Store.findById(requested).select('name isActive').lean();
      if (!store) return res.status(404).json({ message: 'Store not found.' });
      const report = buildStoreReport({ orders, products, storeKey: requested, usdRate, days, now });
      return res.json({ ...report, store });
    }

    const stores = await Store.find().select('name isActive').lean();
    const owners = await User.find({ isSubAdmin: true }).select('username email store').lean();
    const ownerByStore = new Map(owners.map(owner => [String(owner.store), owner]));
    const rows = buildStoresOverview({
      orders, products, usdRate, days, now,
      stores: stores.map(store => ({ ...store, owner: ownerByStore.get(String(store._id)) })),
    });
    res.json({ periodDays: [7, 30, 90, 365].includes(days) ? days : 30, currency: 'PKR', stores: rows });
  } catch (error) {
    sendServerError(res, error);
  }
};

// GET /api/stores/me — the signed-in store owner's store.
const getMyStore = async (req, res) => {
  if (!req.storeScope) return res.status(400).json({ message: 'The main admin does not belong to one store.' });
  const productCount = await Product.countDocuments({ store: req.storeScope });
  res.json({ _id: req.storeScope, name: req.store?.name || '', isActive: true, productCount });
};

module.exports = { listStores, createStore, updateStore, resetStorePassword, getStoreAnalytics, getMyStore };
