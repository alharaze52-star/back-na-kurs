const User = require('../models/User');
const jwt = require('jsonwebtoken');
const { sendVerificationEmail } = require('../services/emailService');
const fs = require('fs');
const path = require('path');

const generateToken = (id) => {
  return jwt.sign({ id }, process.env.JWT_SECRET, {
    expiresIn: '30d',
  });
};

const generateVerificationCode = () => {
  return Math.floor(100000 + Math.random() * 900000).toString();
};

exports.register = async (req, res) => {
  try {
    const { firstName, lastName, email, password, confirmPassword } = req.body;

    if (!firstName || !lastName || !email || !password) {
      return res.status(400).json({
        success: false,
        message: 'Пожалуйста, заполните все обязательные поля',
      });
    }

    if (password !== confirmPassword) {
      return res.status(400).json({
        success: false,
        message: 'Пароли не совпадают',
      });
    }

    if (password.length < 6) {
      return res.status(400).json({
        success: false,
        message: 'Пароль должен содержать минимум 6 символов',
      });
    }

    let user = await User.findOne({ email });
    if (user) {
      return res.status(400).json({
        success: false,
        message: 'Пользователь с таким email уже зарегистрирован',
      });
    }

    const verificationCode = generateVerificationCode();
    const verificationCodeExpires = new Date(Date.now() + 10 * 60 * 1000);

    user = new User({
      firstName,
      lastName,
      email,
      password,
      verificationCode,
      verificationCodeExpires,
      isVerified: false,
    });

    await user.save();

    try {
      await sendVerificationEmail(email, verificationCode, firstName);
    } catch (emailError) {
      console.error('Ошибка отправки email:', emailError);
      return res.status(500).json({
        success: false,
        message: 'Ошибка отправки кода верификации на email',
      });
    }

    res.status(201).json({
      success: true,
      message: 'Регистрация успешна. Код верификации отправлен на вашу почту',
      email: user.email,
    });
  } catch (error) {
    console.error('Ошибка регистрации:', error);
    res.status(500).json({
      success: false,
      message: 'Ошибка при регистрации. Попробуйте снова.',
      error: error.message,
    });
  }
};

exports.verifyEmail = async (req, res) => {
  try {
    const { email, verificationCode } = req.body;

    if (!email || !verificationCode) {
      return res.status(400).json({
        success: false,
        message: 'Email и код верификации обязательны',
      });
    }

    const user = await User.findOne({ email });

    if (!user) {
      return res.status(400).json({
        success: false,
        message: 'Пользователь не найден',
      });
    }

    if (user.isVerified) {
      return res.status(400).json({
        success: false,
        message: 'Email уже верифицирован',
      });
    }

    if (user.verificationCodeExpires < Date.now()) {
      return res.status(400).json({
        success: false,
        message: 'Код верификации истек. Запросите новый код',
      });
    }

    if (user.verificationCode !== verificationCode) {
      return res.status(400).json({
        success: false,
        message: 'Неверный код верификации',
      });
    }

    user.isVerified = true;
    user.verificationCode = null;
    user.verificationCodeExpires = null;
    await user.save();

    const token = generateToken(user._id);

    const userResponse = {
      id: user._id,
      firstName: user.firstName,
      lastName: user.lastName,
      email: user.email,
      isVerified: user.isVerified,
      avatar: user.avatar,
      createdAt: user.createdAt,
    };

    res.status(200).json({
      success: true,
      message: 'Email успешно верифицирован',
      token,
      user: userResponse,
    });
  } catch (error) {
    console.error('Ошибка верификации:', error);
    res.status(500).json({
      success: false,
      message: 'Ошибка при верификации email',
    });
  }
};

exports.login = async (req, res) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({
        success: false,
        message: 'Пожалуйста, введите email и пароль',
      });
    }

    const emailRegex = /^\w+([\.-]?\w+)*@\w+([\.-]?\w+)*(\.\w{2,3})+$/;
    if (!emailRegex.test(email)) {
      return res.status(400).json({
        success: false,
        message: 'Некорректный формат email',
      });
    }

    const user = await User.findOne({ email }).select('+password');
    if (!user) {
      return res.status(401).json({
        success: false,
        message: 'Неверный email или пароль',
      });
    }

    if (!user.isVerified) {
      return res.status(401).json({
        success: false,
        message: 'Email не верифицирован. Проверьте вашу почту',
      });
    }

    const isPasswordCorrect = await user.matchPassword(password);
    if (!isPasswordCorrect) {
      return res.status(401).json({
        success: false,
        message: 'Неверный email или пароль',
      });
    }

    const token = generateToken(user._id);

    const userResponse = {
      id: user._id,
      firstName: user.firstName,
      lastName: user.lastName,
      email: user.email,
      avatar: user.avatar,
      isVerified: user.isVerified,
      createdAt: user.createdAt,
    };

    res.status(200).json({
      success: true,
      message: 'Вход успешен',
      token,
      user: userResponse,
    });
  } catch (error) {
    console.error('Ошибка входа:', error);
    res.status(500).json({
      success: false,
      message: 'Ошибка при входе. Попробуйте снова.',
      error: error.message,
    });
  }
};

exports.getMe = async (req, res) => {
  try {
    const user = await User.findById(req.user.id);

    res.status(200).json({
      success: true,
      user: {
        id: user._id,
        firstName: user.firstName,
        lastName: user.lastName,
        email: user.email,
        avatar: user.avatar,
        isVerified: user.isVerified,
        createdAt: user.createdAt,
      },
    });
  } catch (error) {
    console.error('Ошибка получения пользователя:', error);
    res.status(500).json({
      success: false,
      message: 'Ошибка при получении данных пользователя',
    });
  }
};

exports.updateProfile = async (req, res) => {
  try {
    const { firstName, lastName } = req.body;
    const user = await User.findById(req.user.id);

    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'Пользователь не найден',
      });
    }

    if (firstName) user.firstName = firstName;
    if (lastName) user.lastName = lastName;

    await user.save();

    res.status(200).json({
      success: true,
      message: 'Профиль обновлен',
      user: {
        id: user._id,
        firstName: user.firstName,
        lastName: user.lastName,
        email: user.email,
        avatar: user.avatar,
        createdAt: user.createdAt,
      },
    });
  } catch (error) {
    console.error('Ошибка обновления профиля:', error);
    res.status(500).json({
      success: false,
      message: 'Ошибка при обновлении профиля',
    });
  }
};

exports.uploadAvatar = async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({
        success: false,
        message: 'Файл не загружен',
      });
    }

    const user = await User.findById(req.user.id);

    if (!user) {
      fs.unlinkSync(req.file.path);
      return res.status(404).json({
        success: false,
        message: 'Пользователь не найден',
      });
    }

    if (user.avatar) {
      const oldAvatarPath = path.join(__dirname, '../../uploads/avatars', path.basename(user.avatar));
      if (fs.existsSync(oldAvatarPath)) {
        fs.unlinkSync(oldAvatarPath);
      }
    }

    user.avatar = `/uploads/avatars/${req.file.filename}`;
    await user.save();

    res.status(200).json({
      success: true,
      message: 'Аватар загружен',
      user: {
        id: user._id,
        firstName: user.firstName,
        lastName: user.lastName,
        email: user.email,
        avatar: user.avatar,
        createdAt: user.createdAt,
      },
    });
  } catch (error) {
    if (req.file) {
      fs.unlinkSync(req.file.path);
    }
    console.error('Ошибка загрузки аватара:', error);
    res.status(500).json({
      success: false,
      message: 'Ошибка при загрузке аватара',
    });
  }
};

