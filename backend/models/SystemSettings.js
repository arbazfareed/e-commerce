const mongoose = require('mongoose');

const systemSettingsSchema = new mongoose.Schema({
  key: { type: String, default: 'global', unique: true, immutable: true },
  codEnabled: { type: Boolean, default: true },
  codFeeMode: { type: String, enum: ['flat', 'percentage'], default: 'flat' },
  codFee: { type: Number, min: 0, default: 0 },
  // COD fees are waived when the product total reaches this value (0 disables the threshold).
  codThreshold: { type: Number, min: 0, default: 0 },
  courierProvider: { type: String, trim: true, default: '' },
  courierApiKey: { type: String, select: false, default: '' },
}, { timestamps: true });

module.exports = mongoose.model('SystemSettings', systemSettingsSchema);
