const SystemSettings = require('../models/SystemSettings');

const publicSettings = (settings) => ({
  codEnabled: settings.codEnabled,
  codFeeMode: settings.codFeeMode,
  codFee: settings.codFee,
  codThreshold: settings.codThreshold,
  courierProvider: settings.courierProvider,
  courierApiKeyConfigured: Boolean(settings.courierApiKey),
});

const checkoutSettings = (settings) => ({
  codEnabled: settings.codEnabled,
  codFeeMode: settings.codFeeMode,
  codFee: settings.codFee,
  codThreshold: settings.codThreshold,
});

const getPublicSettings = async (req, res) => {
  const settings = await SystemSettings.findOne({ key: 'global' }).lean()
    || await SystemSettings.create({ key: 'global' });
  res.json(checkoutSettings(settings));
};

const getSettings = async (req, res) => {
  const settings = await SystemSettings.findOne({ key: 'global' }).select('+courierApiKey')
    .lean() || await SystemSettings.create({ key: 'global' });
  res.json(publicSettings(settings));
};

const updateSettings = async (req, res) => {
  const allowed = ['codEnabled', 'codFeeMode', 'codFee', 'codThreshold', 'courierProvider', 'courierApiKey'];
  const update = {};
  for (const field of allowed) if (req.body[field] !== undefined) update[field] = req.body[field];
  if (update.codFeeMode && !['flat', 'percentage'].includes(update.codFeeMode))
    return res.status(400).json({ message: 'codFeeMode must be flat or percentage.' });
  for (const field of ['codFee', 'codThreshold'])
    if (update[field] !== undefined && (!Number.isFinite(Number(update[field])) || Number(update[field]) < 0))
      return res.status(400).json({ message: `${field} must be a non-negative number.` });
  const settings = await SystemSettings.findOneAndUpdate(
    { key: 'global' }, { $set: update }, { new: true, upsert: true, setDefaultsOnInsert: true }
  ).select('+courierApiKey');
  res.json(publicSettings(settings));
};

module.exports = { getPublicSettings, getSettings, updateSettings };
