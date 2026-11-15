const mongoose = require('mongoose');

const systemSettingsSchema = new mongoose.Schema({
  key: { type: String, default: 'global', unique: true, immutable: true },
  internationalEnabled: { type: Boolean, default: true },
  codEnabled: { type: Boolean, default: true },
  codFeeMode: { type: String, enum: ['flat', 'percentage'], default: 'flat' },
  codFee: { type: Number, min: 0, default: 0 },
  // COD fees are waived when the product total reaches this value (0 disables the threshold).
  codThreshold: { type: Number, min: 0, default: 0 },
  // 1 USD = usdRate PKR. Used to convert PKR shipping and COD fees on USD orders.
  usdRate: { type: Number, min: 1, max: 100000, default: 278 },
  // Admin overrides for zone shipping rates, merged over the defaults in utils/zoneShipping.js.
  zoneRates: { type: mongoose.Schema.Types.Mixed, default: null },
  courierProvider: { type: String, trim: true, default: '' },
  courierEnabled: { type: Boolean, default: false },
  courierMode: { type: String, enum: ['sandbox', 'live'], default: 'sandbox' },
  courierApiKey: { type: String, select: false, default: '' },
  easypaisaEnabled: { type: Boolean, default: false },
  easypaisaMode: { type: String, enum: ['sandbox', 'live'], default: 'sandbox' },
  easypaisaMerchantId: { type: String, trim: true, default: '' },
  easypaisaApiKey: { type: String, select: false, default: '' },
}, { timestamps: true });

module.exports = mongoose.model('SystemSettings', systemSettingsSchema);
