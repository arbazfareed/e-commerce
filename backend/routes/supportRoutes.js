const express = require('express');
const router  = express.Router();
const ctrl    = require('../controllers/supportController');
const { protect, admin } = require('../middleware/authMiddleware');

// ── User routes ──────────────────────────────────────────────
// Logged-in user submits a ticket
router.post('/tickets',             protect,        ctrl.createTicket);

// Guest (no auth) submits a ticket
router.post('/tickets/guest',                       ctrl.createGuestTicket);

// Logged-in user sees their own tickets (+ admin replies)
router.get('/tickets/my',           protect,        ctrl.getMyTickets);

// ── Admin routes ─────────────────────────────────────────────
// Admin gets all tickets
router.get('/tickets',              protect, admin, ctrl.getAllTickets);

// Admin updates ticket status
router.put('/tickets/:id/status',   protect, admin, ctrl.updateStatus);

// Admin replies to a ticket
router.put('/tickets/:id/reply',    protect, admin, ctrl.replyTicket);

module.exports = router;
