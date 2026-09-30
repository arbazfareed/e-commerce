const SystemSettings = require('../models/SystemSettings');
const { encryptSecret, isEncryptedSecret, hasEncryptionKey } = require('../config/credentialVault');

const publicSettings = (settings) => ({
  internationalEnabled: settings.internationalEnabled !== false,
  codEnabled: settings.codEnabled,
  codFeeMode: settings.codFeeMode,
  codFee: settings.codFee,
  codThreshold: settings.codThreshold,
  courierProvider: settings.courierProvider,
  courierEnabled: Boolean(settings.courierEnabled),
  courierMode: settings.courierMode || 'sandbox',
  courierApiKeyConfigured: Boolean(settings.courierApiKey),
  easypaisaEnabled: Boolean(settings.easypaisaEnabled),
  easypaisaMode: settings.easypaisaMode || 'sandbox',
  easypaisaMerchantId: settings.easypaisaMerchantId || '',
  easypaisaApiKeyConfigured: Boolean(settings.easypaisaApiKey),
  credentialEncryptionReady: hasEncryptionKey(),
  legacySecretsNeedEncryption: Boolean(
    (settings.courierApiKey && !isEncryptedSecret(settings.courierApiKey))
    || (settings.easypaisaApiKey && !isEncryptedSecret(settings.easypaisaApiKey))
  ),
});

const checkoutSettings = (settings) => ({
  internationalEnabled: settings.internationalEnabled !== false,
  codEnabled: settings.codEnabled,
  codFeeMode: settings.codFeeMode,
  codFee: settings.codFee,
  codThreshold: settings.codThreshold,
  // No online gateway adapter is implemented yet. Saved provider settings do not activate checkout.
  supportedPaymentMethods: settings.codEnabled ? ['COD'] : [],
});

const getPublicSettings = async (req, res) => {
  const settings = await SystemSettings.findOne({ key: 'global' }).lean()
    || await SystemSettings.create({ key: 'global' });
  res.json(checkoutSettings(settings));
};

const getSettings = async (req, res) => {
  const settings = await SystemSettings.findOne({ key: 'global' }).select('+courierApiKey +easypaisaApiKey')
    .lean() || await SystemSettings.create({ key: 'global' });
  if (hasEncryptionKey()) {
    const migrations = {};
    for (const field of ['courierApiKey', 'easypaisaApiKey']) {
      if (settings[field] && !isEncryptedSecret(settings[field])) {
        migrations[field] = encryptSecret(settings[field]);
        settings[field] = migrations[field];
      }
    }
    if (Object.keys(migrations).length) await SystemSettings.updateOne({ _id: settings._id }, { $set: migrations });
  }
  res.json(publicSettings(settings));
};

const updateSettings = async (req, res) => {
  const allowed = [
    'internationalEnabled', 'codEnabled', 'codFeeMode', 'codFee', 'codThreshold',
    'courierProvider', 'courierEnabled', 'courierMode',
    'easypaisaEnabled', 'easypaisaMode', 'easypaisaMerchantId',
  ];
  const update = {};
  for (const field of allowed) if (req.body[field] !== undefined) update[field] = req.body[field];
  for (const field of ['internationalEnabled', 'codEnabled', 'courierEnabled', 'easypaisaEnabled'])
    if (update[field] !== undefined && typeof update[field] !== 'boolean')
      return res.status(400).json({ message: `${field} must be true or false.` });
  if (update.codFeeMode && !['flat', 'percentage'].includes(update.codFeeMode))
    return res.status(400).json({ message: 'codFeeMode must be flat or percentage.' });
  for (const field of ['codFee', 'codThreshold'])
    if (update[field] !== undefined && (!Number.isFinite(Number(update[field])) || Number(update[field]) < 0))
      return res.status(400).json({ message: `${field} must be a non-negative number.` });
  for (const field of ['courierMode', 'easypaisaMode'])
    if (update[field] !== undefined && !['sandbox', 'live'].includes(update[field]))
      return res.status(400).json({ message: `${field} must be sandbox or live.` });
  if (update.courierProvider !== undefined && (typeof update.courierProvider !== 'string' || update.courierProvider.trim().length > 100))
    return res.status(400).json({ message: 'Courier provider must be at most 100 characters.' });
  if (update.easypaisaMerchantId !== undefined && (typeof update.easypaisaMerchantId !== 'string' || update.easypaisaMerchantId.trim().length > 120))
    return res.status(400).json({ message: 'EasyPaisa merchant ID must be at most 120 characters.' });

  const secretFields = [
    ['courierApiKey', 'clearCourierApiKey'],
    ['easypaisaApiKey', 'clearEasypaisaApiKey'],
  ];
  for (const [field, clearField] of secretFields) {
    const incoming = req.body[field];
    if (req.body[clearField] === true) {
      update[field] = '';
      continue;
    }
    if (incoming === undefined || incoming === null || (typeof incoming === 'string' && !incoming.trim())) continue;
    if (typeof incoming !== 'string' || incoming.length > 4096)
      return res.status(400).json({ message: `${field} must be text no longer than 4096 characters.` });
    if (!hasEncryptionKey())
      return res.status(503).json({ message: 'Configure SETTINGS_ENCRYPTION_KEY in the backend environment before saving provider secrets.' });
    try { update[field] = encryptSecret(incoming.trim()); }
    catch (error) { return res.status(503).json({ message: error.message }); }
  }

  const settings = await SystemSettings.findOneAndUpdate(
    { key: 'global' }, { $set: update }, { new: true, upsert: true, setDefaultsOnInsert: true }
  ).select('+courierApiKey +easypaisaApiKey');
  res.json(publicSettings(settings));
};

module.exports = { getPublicSettings, getSettings, updateSettings, publicSettings, checkoutSettings };
