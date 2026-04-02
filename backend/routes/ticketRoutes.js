const express = require('express');
const { purchaseTicket, getMyTickets, getTicketById, cancelTicket } = require('../controllers/ticketController');
const auth = require('../middleware/auth');

const router = express.Router();

router.post('/purchase', auth, purchaseTicket);
router.get('/my-tickets', auth, getMyTickets);
router.get('/:ticketId', auth, getTicketById);
router.put('/:ticketId/cancel', auth, cancelTicket);

module.exports = router;
