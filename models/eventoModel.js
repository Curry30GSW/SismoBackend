const pool = require('../config/ConectDb');
const { v4: uuidv4 } = require('uuid');

const EventoModel = {
    async crear({ nombre, descripcion, magnitud }) {
        const id = uuidv4();
        const tokenPublico = uuidv4(); // token para el link público

        await pool.query(
            `INSERT INTO eventos_sismicos
             (id, token_publico, nombre, descripcion, magnitud)
             VALUES (?,?,?,?,?)`,
            [id, tokenPublico, nombre, descripcion || null, magnitud || null]
        );

        return this.obtenerPorId(id);
    },

    async listar() {
        const [rows] = await pool.query(
            `SELECT e.*,
                (SELECT COUNT(*) FROM reportes_evento r WHERE r.evento_id = e.id) AS total_reportados
         FROM eventos_sismicos e
         ORDER BY e.fecha DESC`
        );
        return rows.map(this._mapear);
    },

    async listarActivos() {
        const [rows] = await pool.query(
            `SELECT e.*,
                (SELECT COUNT(*) FROM reportes_evento r WHERE r.evento_id = e.id) AS total_reportados
         FROM eventos_sismicos e
         WHERE e.activo = TRUE
         ORDER BY e.fecha DESC`
        );
        return rows.map(this._mapear);
    },

    async obtenerPorId(id) {
        const [rows] = await pool.query(
            `SELECT e.*,
                (SELECT COUNT(*) FROM reportes_evento r WHERE r.evento_id = e.id) AS total_reportados
         FROM eventos_sismicos e
         WHERE e.id = ?`,
            [id]
        );
        return rows[0] ? this._mapear(rows[0]) : null;
    },

    // 👇 Busca por el token público (para el link compartible)
    async obtenerPorToken(tokenPublico) {
        const [rows] = await pool.query(
            'SELECT * FROM eventos_sismicos WHERE token_publico = ?',
            [tokenPublico]
        );
        return rows[0] ? this._mapear(rows[0]) : null;
    },

    async actualizarActivo(id, activo) {
        const [resultado] = await pool.query(
            `UPDATE eventos_sismicos
         SET activo = ?,
             activo_reporte = ?
         WHERE id = ?`,
            [!!activo, !!activo, id]
        );
        return resultado.affectedRows;
    },

    async reportar(eventoId, personaId, estado, comentario, ubicacion, detalle) {
        await pool.query(
            `INSERT INTO reportes_evento
             (evento_id, persona_id, estado, comentario, ubicacion, necesita_ayuda_detalle)
             VALUES (?,?,?,?,?,?)
             ON DUPLICATE KEY UPDATE
                estado = VALUES(estado),
                comentario = VALUES(comentario),
                ubicacion = VALUES(ubicacion),
                necesita_ayuda_detalle = VALUES(necesita_ayuda_detalle),
                fecha = CURRENT_TIMESTAMP`,
            [eventoId, personaId, estado, comentario || null, ubicacion || null, detalle || null]
        );
    },

    async obtenerReportes(eventoId) {
        const [rows] = await pool.query(
            `SELECT r.persona_id AS personaId, p.cedula, p.nombre, p.apellidos, p.foto,
                    r.estado, r.comentario, r.ubicacion, r.necesita_ayuda_detalle, r.fecha
             FROM reportes_evento r
             JOIN personas p ON p.id = r.persona_id
             WHERE r.evento_id = ?
             ORDER BY r.fecha DESC`,
            [eventoId]
        );
        return rows;
    },

    async obtenerPendientes(eventoId) {
        const [rows] = await pool.query(
            `SELECT id, cedula, nombre, apellidos, foto FROM personas
             WHERE id NOT IN (
                SELECT persona_id FROM reportes_evento WHERE evento_id = ?
             )
             ORDER BY nombre ASC`,
            [eventoId]
        );
        return rows;
    },

    // 👇 Verifica si una persona ya reportó en un evento
    async obtenerReporteDePersona(eventoId, personaId) {
        const [rows] = await pool.query(
            `SELECT * FROM reportes_evento
             WHERE evento_id = ? AND persona_id = ?`,
            [eventoId, personaId]
        );
        return rows[0] || null;
    },

    // Helper privado
    _mapear(r) {
        return {
            id: r.id,
            tokenPublico: r.token_publico,
            nombre: r.nombre,
            descripcion: r.descripcion,
            magnitud: r.magnitud,
            activo: !!r.activo,
            activoReporte: !!r.activo_reporte,
            fecha: r.fecha,
            totalReportados: Number(r.total_reportados) || 0,
        };
    },
};

module.exports = EventoModel;