const SupportTicket = require('../models/SupportTicket');

/* ── Create ticket (logged-in user) ─────────────────────────── */
exports.createTicket = async (req, res) => {
  try {
    const { name, email, subject, message, orderId } = req.body;
    if (!name || !email || !message)
      return res.status(400).json({ message: 'Name, email and message are required.' });

    const ticket = await SupportTicket.create({
      user:    req.user._id,
      name:    name.trim(),
      email:   email.trim().toLowerCase(),
      subject: subject || 'General',
      message: message.trim(),
      orderId: orderId || '',
    });
    res.status(201).json(ticket);
  } catch (err) {
    console.error('createTicket:', err);
    res.status(500).json({ message: 'Server error.' });
  }
};

/* ── Create ticket (guest / not logged in) ───────────────────── */
exports.createGuestTicket = async (req, res) => {
  try {
    const { name, email, subject, message, orderId } = req.body;
    if (!name || !email || !message)
      return res.status(400).json({ message: 'Name, email and message are required.' });

    const ticket = await SupportTicket.create({
      user:    null,
      name:    name.trim(),
      email:   email.trim().toLowerCase(),
      subject: subject || 'General',
      message: message.trim(),
      orderId: orderId || '',
    });
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
    const { text } = req.body;
    if (!text || !text.trim())
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
