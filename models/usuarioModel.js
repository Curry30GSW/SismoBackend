const pool = require('../config/ConectDb');

const UsuarioModel = {
    async buscarPorUsuario(usuario) {
        const [rows] = await pool.query(
            `SELECT id, usuario, nombre, password_hash, rol, activo, creado_en
       FROM usuarios
       WHERE usuario = ?
       LIMIT 1`,
            [usuario]
        );
        return rows[0] || null;
    },

    async buscarPorId(id) {
        const [rows] = await pool.query(
            `SELECT id, usuario, nombre, rol, activo, creado_en, actualizado_en
       FROM usuarios
       WHERE id = ?
       LIMIT 1`,
            [id]
        );
        return rows[0] || null;
    },

    async crear({ usuario, nombre, passwordHash, rol = 'operador', activo = 1 }) {
        const { v4: uuidv4 } = require('uuid');
        const id = uuidv4();
        await pool.query(
            `INSERT INTO usuarios (id, usuario, nombre, password_hash, rol, activo)
       VALUES (?,?,?,?,?,?)`,
            [id, usuario, nombre, passwordHash, rol, activo]
        );
        return id;
    },

    async actualizarPassword(id, passwordHash) {
        const [r] = await pool.query(
            'UPDATE usuarios SET password_hash = ? WHERE id = ?',
            [passwordHash, id]
        );
        return r.affectedRows;
    },

    async actualizarActivo(id, activo) {
        const [r] = await pool.query(
            'UPDATE usuarios SET activo = ? WHERE id = ?',
            [activo ? 1 : 0, id]
        );
        return r.affectedRows;
    },

    toPublico(row) {
        if (!row) return null;
        return {
            id: row.id,
            usuario: row.usuario,
            nombre: row.nombre,
            rol: row.rol,
            activo: !!row.activo,
            creadoEn: row.creado_en,
        };
    },
};

module.exports = UsuarioModel;