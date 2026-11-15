const SupportTicket = require('../models/SupportTicket');

// Validate and clean ticket fields; returns { error } or { value }.
const readTicket = (body = {}) => {
  const text = (value, max) => (typeof value === 'string' ? value.trim().slice(0, max) : '');
  const name = text(body.name, 120);
  const email = text(body.email, 254).toLowerCase();
  const message = text(body.message, 5000);
  if (!name || !email || !message) return { error: 'Name, email and message are required.' };
  if (!/^\S+@\S+\.\S+$/.test(email)) return { error: 'Please enter a valid email address.' };
  if (message.length < 5) return { error: 'Please describe your question in a few more words.' };
  return { value: { name, email, message, subject: text(body.subject, 120) || 'General', orderId: text(body.orderId, 40) } };
};

/* ── Create ticket (logged-in user) ─────────────────────────── */
exports.createTicket = async (req, res) => {
  try {
    const ticketInput = readTicket(req.body);
    if (ticketInput.error) return res.status(400).json({ message: ticketInput.error });

    const ticket = await SupportTicket.create({ user: req.user._id, ...ticketInput.value });
    res.status(201).json(ticket);
  } catch (err) {
    console.error('createTicket:', err);
    res.status(500).json({ message: 'Server error.' });
  }
};

/* ── Create ticket (guest / not logged in) ───────────────────── */
exports.createGuestTicket = async (req, res) => {
  try {
    const ticketInput = readTicket(req.body);
    if (ticketInput.error) return res.status(400).json({ message: ticketInput.error });

    const ticket = await SupportTicket.create({ user: null, ...ticketInput.value });
    res.status(201).json(ticket);
  } catch (err) {
    console.error('createGuestTicket:', err);
    res.status(500).json({ message: 'Server error.' });
  }
};

/* ── Get current user's own tickets ─────────────────────────── */
exports.getMyTickets = async (req, res) => {
  try {
    const tickets = await SupportTicket
      .find({ user: req.user._id })
      .sort({ createdAt: -1 });
    res.json(tickets);
  } catch (err) {
    console.error('getMyTickets:', err);
    res.status(500).json({ message: 'Server error.' });
  }
};

/* ── Admin: get all tickets ──────────────────────────────────── */
exports.getAllTickets = async (req, res) => {
  try {
    const tickets = await SupportTicket
      .find()
      .populate('user', 'name email')
      .sort({ createdAt: -1 });
    res.json(tickets);
  } catch (err) {
    console.error('getAllTickets:', err);
    res.status(500).json({ message: 'Server error.' });
  }
};

/* ── Admin: update ticket status ─────────────────────────────── */
exports.updateStatus = async (req, res) => {
  try {
    const { status } = req.body;
    if (!['Open', 'Resolved'].includes(status))
      return res.status(400).json({ message: 'Invalid status.' });

    const ticket = await SupportTicket.findByIdAndUpdate(
      req.params.id,
      {
        status,
        resolvedAt: status === 'Resolved' ? new Date() : null,
      },
      { new: true }
    );
    if (!ticket) return res.status(404).json({ message: 'Ticket not found.' });
    res.json(ticket);
  } catch (err) {
    console.error('updateStatus:', err);
    res.status(500).json({ message: 'Server error.' });
  }
};

/* ── Admin: save reply (user will see this) ──────────────────── */
exports.replyTicket = async (req, res) => {
  try {
    const text = typeof req.body?.text === 'string' ? req.body.text.slice(0, 5000) : '';
    if (!text.trim())
      return res.status(400).json({ message: 'Reply text is required.' });

    const ticket = await SupportTicket.findByIdAndUpdate(
      req.params.id,
      { adminReply: text.trim() },
      { new: true }
    );
    if (!ticket) return res.status(404).json({ message: 'Ticket not found.' });
    res.json(ticket);
  } catch (err) {
    console.error('replyTicket:', err);
    res.status(500).json({ message: 'Server error.' });
  }
};

exports.readTicket = readTicket;
