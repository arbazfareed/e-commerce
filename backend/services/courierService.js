const SystemSettings = require('../models/SystemSettings');

// Provider adapters can be added without coupling order creation to a courier SDK.
const dispatchOrder = async (order) => {
  const settings = await SystemSettings.findOne({ key: 'global' }).select('+courierApiKey').lean();
  if (!settings || !settings.courierProvider || !settings.courierApiKey) {
    return { dispatched: false, status: 'not_configured', reason: 'not_configured' };
  }
  // No provider is enabled until its adapter is implemented; never make an order fail.
  return { dispatched: false, status: 'unsupported', reason: 'provider_not_supported' };
};

module.exports = { dispatchOrder };
