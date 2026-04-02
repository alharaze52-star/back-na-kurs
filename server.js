require('dotenv').config();
const express = require('express');
const cors = require('cors');
const connectDB = require('./backend/config/db');
const authRoutes = require('./backend/routes/authRoutes');

const app = express();

// Подключение к MongoDB
connectDB();

// Middleware
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// CORS (разрешаем все источники для разработки)
app.use(cors({
  origin: '*',
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH'],
  allowedHeaders: ['Content-Type', 'Authorization'],
}));

// Routes
app.use('/api/auth', authRoutes);

// Базовый маршрут
app.get('/', (req, res) => {
  res.json({
    message: '🎬 Comic Con Tickets API',
    version: '1.0.0',
    endpoints: {
      auth: {
        register: 'POST /api/auth/register',
        login: 'POST /api/auth/login',
        getMe: 'GET /api/auth/me (требует токена)',
      },
    },
  });
});

// Обработка ошибок 404
app.use('*', (req, res) => {
  res.status(404).json({
    success: false,
    message: 'Маршрут не найден',
  });
});

// Глобальная обработка ошибок
app.use((error, req, res, next) => {
  console.error('❌ Ошибка:', error);
  res.status(error.status || 500).json({
    success: false,
    message: error.message || 'Внутренняя ошибка сервера',
  });
});

// Запуск сервера
const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
  console.log(`
╔════════════════════════════════════════╗
║  🚀 Comic Con Tickets Backend Server  ║
║  ✅ Порт: ${PORT}                       ║
║  ✅ Окружение: ${process.env.NODE_ENV}                ║
║  ✅ MongoDB: подключена               ║
╚════════════════════════════════════════╝
  `);
});

module.exports = app;
