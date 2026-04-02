const Ticket = require('../models/Ticket');
const User = require('../models/User');
const { sendTicketEmail } = require('../services/emailService');
const { v4: uuidv4 } = require('uuid');

exports.purchaseTicket = async (req, res) => {
  try {
    const { eventName, eventDate, eventLocation, ticketType, price, quantity } = req.body;
    const userId = req.user.id;

    if (!eventName || !eventDate || !eventLocation || !ticketType || !price || !quantity) {
      return res.status(400).json({
        success: false,
        message: 'Все поля обязательны для покупки билета',
      });
    }

    const user = await User.findById(userId);
    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'Пользователь не найден',
      });
    }

    const ticketNumber = `TICKET-${Date.now()}-${uuidv4().slice(0, 8).toUpperCase()}`;

    const ticket = new Ticket({
      userId,
      eventName,
      eventDate,
      eventLocation,
      ticketType,
      price,
      quantity,
      ticketNumber,
      status: 'active',
    });

    await ticket.save();

    try {
      await sendTicketEmail(user.email, {
        eventName,
        eventDate,
        eventLocation,
        ticketType,
        quantity,
        price,
        ticketNumber,
      }, user.firstName);
    } catch (emailError) {
      console.error('Ошибка отправки билета по email:', emailError);
    }

    res.status(201).json({
      success: true,
      message: 'Билет успешно куплен. Проверьте вашу почту',
      ticket: {
        id: ticket._id,
        ticketNumber: ticket.ticketNumber,
        eventName: ticket.eventName,
        eventDate: ticket.eventDate,
        eventLocation: ticket.eventLocation,
        ticketType: ticket.ticketType,
        price: ticket.price,
        quantity: ticket.quantity,
        status: ticket.status,
        purchaseDate: ticket.purchaseDate,
      },
    });
  } catch (error) {
    console.error('Ошибка покупки билета:', error);
    res.status(500).json({
      success: false,
      message: 'Ошибка при покупке билета',
      error: error.message,
    });
  }
};

exports.getMyTickets = async (req, res) => {
  try {
    const userId = req.user.id;

    const tickets = await Ticket.find({ userId }).sort({ purchaseDate: -1 });

    res.status(200).json({
      success: true,
      count: tickets.length,
      tickets: tickets.map(ticket => ({
        id: ticket._id,
        ticketNumber: ticket.ticketNumber,
        eventName: ticket.eventName,
        eventDate: ticket.eventDate,
        eventLocation: ticket.eventLocation,
        ticketType: ticket.ticketType,
        price: ticket.price,
        quantity: ticket.quantity,
        status: ticket.status,
        purchaseDate: ticket.purchaseDate,
      })),
    });
  } catch (error) {
    console.error('Ошибка получения билетов:', error);
    res.status(500).json({
      success: false,
      message: 'Ошибка при получении билетов',
    });
  }
};

exports.getTicketById = async (req, res) => {
  try {
    const { ticketId } = req.params;
    const userId = req.user.id;

    const ticket = await Ticket.findById(ticketId);

    if (!ticket) {
      return res.status(404).json({
        success: false,
        message: 'Билет не найден',
      });
    }

    if (ticket.userId.toString() !== userId) {
      return res.status(403).json({
        success: false,
        message: 'Доступ запрещен',
      });
    }

    res.status(200).json({
      success: true,
      ticket: {
        id: ticket._id,
        ticketNumber: ticket.ticketNumber,
        eventName: ticket.eventName,
        eventDate: ticket.eventDate,
        eventLocation: ticket.eventLocation,
        ticketType: ticket.ticketType,
        price: ticket.price,
        quantity: ticket.quantity,
        status: ticket.status,
        purchaseDate: ticket.purchaseDate,
      },
    });
  } catch (error) {
    console.error('Ошибка получения билета:', error);
    res.status(500).json({
      success: false,
      message: 'Ошибка при получении билета',
    });
  }
};

exports.cancelTicket = async (req, res) => {
  try {
    const { ticketId } = req.params;
    const userId = req.user.id;

    const ticket = await Ticket.findById(ticketId);

    if (!ticket) {
      return res.status(404).json({
        success: false,
        message: 'Билет не найден',
      });
    }

    if (ticket.userId.toString() !== userId) {
      return res.status(403).json({
        success: false,
        message: 'Доступ запрещен',
      });
    }

    if (ticket.status === 'cancelled') {
      return res.status(400).json({
        success: false,
        message: 'Билет уже отменен',
      });
    }

    ticket.status = 'cancelled';
    await ticket.save();

    res.status(200).json({
      success: true,
      message: 'Билет отменен',
      ticket: {
        id: ticket._id,
        ticketNumber: ticket.ticketNumber,
        status: ticket.status,
      },
    });
  } catch (error) {
    console.error('Ошибка отмены билета:', error);
    res.status(500).json({
      success: false,
      message: 'Ошибка при отмене билета',
    });
  }
};
