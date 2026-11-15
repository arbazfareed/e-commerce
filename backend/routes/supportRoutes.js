const express = require('express');
const rateLimit = require('express-rate-limit');
const router  = express.Router();
const { requireValidId } = require('../middleware/validateObjectId');
const ctrl    = require('../controllers/supportController');
const { protect, admin } = require('../middleware/authMiddleware');

// ── User routes ──────────────────────────────────────────────
// Logged-in user submits a ticket
router.post('/tickets',             protect,        ctrl.createTicket);

// Guest (no auth) submits a ticket
const guestTicketLimiter = rateLimit({
  windowMs: 60 * 60 * 1000,
  limit: 5,
  standardHeaders: 'draft-8',
  legacyHeaders: false,
  message: { message: 'Too many support requests. Please try again later.' },
});
router.post('/tickets/guest',       guestTicketLimiter, ctrl.createGuestTicket);

// Logged-in user sees their own tickets (+ admin replies)
router.get('/tickets/my',           protect,        ctrl.getMyTickets);

// ── Admin routes ─────────────────────────────────────────────
// Admin gets all tickets
router.get('/tickets',              protect, admin, ctrl.getAllTickets);

// Admin updates ticket status
router.put('/tickets/:id/status', protect, admin, requireValidId('Ticket'), ctrl.updateStatus);

// Admin replies to a ticket
router.put('/tickets/:id/reply', protect, admin, requireValidId('Ticket'), ctrl.replyTicket);

module.exports = router;
