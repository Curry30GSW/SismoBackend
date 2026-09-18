const express = require('express');
const router = express.Router();

const authController = require('../controllers/authController');
const { authMiddleware } = require('../middlewares/authMiddleware');
const { loginLimiter } = require('../middlewares/rateLimiter');
const verifyCaptcha = require('../middlewares/verifyCaptcha');

// El orden importa: rateLimit → captcha → validación en controller
router.post('/login', loginLimiter, verifyCaptcha, authController.login);
router.post('/logout', authController.logout);
router.post('/refresh', authController.refresh);
router.get('/me', authMiddleware, authController.me);

module.exports = router;