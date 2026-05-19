const mongoose = require('mongoose');

const SupportTicketSchema = new mongoose.Schema({
  user:       { type: mongoose.Schema.Types.ObjectId, ref: 'User', default: null },
  name:       { type: String, required: true, trim: true },
  email:      { type: String, required: true, trim: true, lowercase: true },
  subject:    { type: String, default: 'General', trim: true },
  message:    { type: String, required: true, trim: true },
  orderId:    { type: String, default: '', trim: true },
  status:     { type: String, enum: ['Open', 'Resolved'], default: 'Open' },
  adminReply: { type: String, default: '' },
  resolvedAt: { type: Date, default: null },
}, { timestamps: true });

module.exports = mongoose.model('SupportTicket', SupportTicketSchema);
