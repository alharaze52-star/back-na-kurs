const jwt = require('jsonwebtoken');

const auth = async (req, res, next) => {
  try {
    const token = req.headers.authorization?.split(' ')[1];

    if (!token) {
      return res.status(401).json({
        success: false,
        message: 'Токен не предоставлен. Пожалуйста, пройдите аутентификацию',
      });
    }

    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    req.user = decoded;
    next();
  } catch (error) {
    if (error.name === 'TokenExpiredError') {
      return res.status(401).json({
        success: false,
        message: 'Токен истек. Пожалуйста, войдите снова',
      });
    }

    res.status(401).json({
      success: false,
      message: 'Недействительный или отсутствующий токен',
    });
  }
};

module.exports = auth;
