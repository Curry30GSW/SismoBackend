const rateLimit = require('express-rate-limit');

// 5 intentos por cada 15 min por IP
const loginLimiter = rateLimit({
    windowMs: 15 * 60 * 1000,
    max: 5,
    standardHeaders: true,
    legacyHeaders: false,
    skipSuccessfulRequests: true, // solo cuenta los fallidos
    handler: (req, res) => {
        const retryAfter = req.rateLimit?.resetTime
            ? Math.max(1, Math.ceil((req.rateLimit.resetTime - Date.now()) / 1000))
            : 900;

        res.status(429).json({
            success: false,
            message: `Demasiados intentos fallidos. Intente nuevamente en ${retryAfter} segundos.`,
            retryAfter,
        });
    },
});

module.exports = { loginLimiter };