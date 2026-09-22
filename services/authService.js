const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const UsuarioModel = require('../models/usuarioModel');

const ACCESS_SECRET = process.env.JWT_ACCESS_SECRET || 'secret_access_key';
const REFRESH_SECRET = process.env.JWT_REFRESH_SECRET || 'secret_refresh_key';
const ACCESS_EXPIRES = process.env.JWT_ACCESS_EXPIRES || '2h';
const REFRESH_EXPIRES = process.env.JWT_REFRESH_EXPIRES || '7d';

const AuthService = {
    async validarCredenciales(usuario, password) {
        if (!usuario || !password) {
            const err = new Error('Usuario y contraseña son obligatorios');
            err.status = 400;
            throw err;
        }

        const row = await UsuarioModel.buscarPorUsuario(usuario);
        if (!row) {
            const err = new Error('Credenciales incorrectas.');
            err.status = 401;
            throw err;
        }

        if (!row.activo) {
            const err = new Error('La cuenta está desactivada. Contacte al administrador.');
            err.status = 403;
            throw err;
        }

        const ok = await bcrypt.compare(password, row.password_hash);
        if (!ok) {
            const err = new Error('Credenciales incorrectas.');
            err.status = 401;
            throw err;
        }

        return UsuarioModel.toPublico(row);
    },

    // Genera access + refresh tokens
    generarTokens(usuario) {
        const payload = {
            id_usuario: usuario.id,
            usuario: usuario.usuario,
            nombre: usuario.nombre,
            rol: usuario.rol,
        };

        const accessToken = jwt.sign(payload, ACCESS_SECRET, { expiresIn: ACCESS_EXPIRES });
        const refreshToken = jwt.sign(
            { id_usuario: usuario.id },
            REFRESH_SECRET,
            { expiresIn: REFRESH_EXPIRES }
        );

        return { accessToken, refreshToken };
    },

    verificarRefresh(refreshToken) {
        return jwt.verify(refreshToken, REFRESH_SECRET);
    },

    // Setea cookies httpOnly
    setCookies(res, { accessToken, refreshToken }) {
        const isProd = process.env.NODE_ENV === 'production';

        res.cookie('access_token', accessToken, {
            httpOnly: true,
            secure: isProd,
            sameSite: isProd ? 'strict' : 'lax',
            maxAge: 2 * 60 * 60 * 1000,
        });

        res.cookie('refresh_token', refreshToken, {
            httpOnly: true,
            secure: isProd,
            sameSite: isProd ? 'strict' : 'lax',
            maxAge: 7 * 24 * 60 * 60 * 1000, // 7 días
            path: '/auth/refresh',
        });
    },

    clearCookies(res) {
        res.clearCookie('access_token');
        res.clearCookie('refresh_token', { path: '/auth/refresh' });
    },

    async obtenerPerfil(idUsuario) {
        const row = await UsuarioModel.buscarPorId(idUsuario);
        if (!row) {
            const err = new Error('Usuario no encontrado');
            err.status = 404;
            throw err;
        }
        return UsuarioModel.toPublico(row);
    },
};

module.exports = AuthService;