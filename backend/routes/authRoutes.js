const express = require('express');
const { register, login, getMe, verifyEmail, updateProfile, uploadAvatar } = require('../controllers/authController');
const auth = require('../middleware/auth');
const upload = require('../config/multer');

const router = express.Router();

router.post('/register', register);
router.post('/verify-email', verifyEmail);
router.post('/login', login);
router.get('/me', auth, getMe);
router.put('/profile', auth, updateProfile);
router.post('/upload-avatar', auth, upload.single('avatar'), uploadAvatar);

module.exports = router;
