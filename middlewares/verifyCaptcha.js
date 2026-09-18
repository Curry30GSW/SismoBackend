// o usa global fetch si Node >= 18
const verifyCaptcha = async (req, res, next) => {
    try {
        const token = req.body.captcha;
        if (!token) {
            return res.status(400).json({
                success: false,
                message: 'Captcha requerido.',
            });
        }

        const secret = process.env.RECAPTCHA_SECRET;
        if (!secret) {
            console.warn('[Captcha] RECAPTCHA_SECRET no configurado, se omite verificación.');
            return next();
        }

        const params = new URLSearchParams({
            secret,
            response: token,
            remoteip: req.ip,
        });

        const resp = await fetch('https://www.google.com/recaptcha/api/siteverify', {
            method: 'POST',
            headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
            body: params,
        });
        const data = await resp.json();

        if (!data.success) {
            return res.status(400).json({
                success: false,
                message: 'Captcha inválido o expirado.',
            });
        }

        next();
    } catch (err) {
        console.error('[Captcha] Error verificando:', err);
        res.status(500).json({ success: false, message: 'Error verificando captcha.' });
    }
};

module.exports = verifyCaptcha;