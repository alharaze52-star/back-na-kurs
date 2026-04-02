require('dotenv').config();
const express = require('express');
const cors = require('cors');
const path = require('path');
const connectDB = require('./backend/config/db');
const authRoutes = require('./backend/routes/authRoutes');
const ticketRoutes = require('./backend/routes/ticketRoutes');

const app = express();

connectDB();

app.use(express.json());
app.use(express.urlencoded({ extended: true }));

app.use(cors({
  origin: '*',
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH'],
  allowedHeaders: ['Content-Type', 'Authorization'],
}));

app.use('/uploads', express.static(path.join(__dirname, 'uploads')));

app.use('/api/auth', authRoutes);
app.use('/api/tickets', ticketRoutes);

app.get('/', (req, res) => {
  res.json({
    message: '🎬 Comic Con Tickets API',
    version: '2.0.0',
    endpoints: {
      auth: {
        register: 'POST /api/auth/register',
        verifyEmail: 'POST /api/auth/verify-email',
        login: 'POST /api/auth/login',
        getMe: 'GET /api/auth/me (требует токена)',
        updateProfile: 'PUT /api/auth/profile (требует токена)',
        uploadAvatar: 'POST /api/auth/upload-avatar (требует токена)',
      },
      tickets: {
        purchase: 'POST /api/tickets/purchase (требует токена)',
        getMyTickets: 'GET /api/tickets/my-tickets (требует токена)',
        getTicket: 'GET /api/tickets/:ticketId (требует токена)',
        cancelTicket: 'PUT /api/tickets/:ticketId/cancel (требует токена)',
      },
    },
  });
});

app.use('*', (req, res) => {
  res.status(404).json({
    success: false,
    message: 'Маршрут не найден',
  });
});

app.use((error, req, res, next) => {
  console.error('Ошибка:', error);
  res.status(error.status || 500).json({
    success: false,
    message: error.message || 'Внутренняя ошибка сервера',
  });
});

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
  console.log(`
╔════════════════════════════════════════╗
║  🚀 Comic Con Tickets Backend Server  ║
║  ✅ Версия: 2.0.0 (Расширенная)       ║
║  ✅ Порт: ${PORT}                       ║
║  ✅ Окружение: ${process.env.NODE_ENV}                ║
║  ✅ MongoDB: подключена                ║
║  ✅ Email сервис: активен              ║
║  ✅ Загрузка файлов: активна           ║
╚════════════════════════════════════════╝
  `);
});

module.exports = app;
