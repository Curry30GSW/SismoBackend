const AuthService = require('../services/authService');

const authController = {
    // POST /auth/login
    async login(req, res) {
        try {
            const { user, password } = req.body;

            const usuario = await AuthService.validarCredenciales(user, password);
            const tokens = AuthService.generarTokens(usuario);

            AuthService.setCookies(res, tokens);

            return res.status(200).json({
                success: true,
                message: 'Inicio de sesión exitoso',
                usuario,
            });
        } catch (err) {
            console.error('[auth.login]', err.message);
            return res.status(err.status || 500).json({
                success: false,
                message: err.message || 'Error al iniciar sesión',
            });
        }
    },

    // POST /auth/logout
    async logout(req, res) {
        AuthService.clearCookies(res);
        return res.json({ success: true, message: 'Sesión cerrada' });
    },

    // GET /auth/me
    async me(req, res) {
        try {
            const perfil = await AuthService.obtenerPerfil(req.user.id_usuario);
            return res.json({ success: true, usuario: perfil });
        } catch (err) {
            return res.status(err.status || 500).json({
                success: false,
                message: err.message,
            });
        }
    },

    // POST /auth/refresh
    async refresh(req, res) {
        try {
            const token = req.cookies?.refresh_token;
            if (!token) {
                return res.status(401).json({ success: false, message: 'No hay refresh token' });
            }

            const decoded = AuthService.verificarRefresh(token);
            const usuario = await AuthService.obtenerPerfil(decoded.id_usuario);
            const tokens = AuthService.generarTokens(usuario);

            AuthService.setCookies(res, tokens);
            return res.json({ success: true, usuario });
        } catch (err) {
            AuthService.clearCookies(res);
            return res.status(401).json({
                success: false,
                message: 'Sesión expirada. Inicie sesión nuevamente.',
            });
        }
    },
};

module.exports = authController;