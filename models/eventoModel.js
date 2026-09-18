const pool = require('../config/ConectDb');
const { v4: uuidv4 } = require('uuid');

const EventoModel = {
    async crear({ nombre, descripcion, magnitud, ubicacion }) {
        const id = uuidv4();
        await pool.query(
            `INSERT INTO eventos_sismicos (id, nombre, descripcion, magnitud, ubicacion)
       VALUES (?,?,?,?,?)`,
            [id, nombre, descripcion || null, magnitud || null, ubicacion || null]
        );
        return this.obtenerPorId(id);
    },

    async listar() {
        const [rows] = await pool.query('SELECT * FROM eventos_sismicos ORDER BY fecha DESC');
        return rows;
    },

    async listarActivos() {
        const [rows] = await pool.query(
            'SELECT * FROM eventos_sismicos WHERE activo = TRUE ORDER BY fecha DESC'
        );
        return rows;
    },

    async obtenerPorId(id) {
        const [rows] = await pool.query('SELECT * FROM eventos_sismicos WHERE id = ?', [id]);
        return rows[0] || null;
    },

    async actualizarActivo(id, activo) {
        const [resultado] = await pool.query(
            'UPDATE eventos_sismicos SET activo = ? WHERE id = ?',
            [!!activo, id]
        );
        return resultado.affectedRows;
    },

    // Upsert del reporte
    async reportar(eventoId, personaId, estado, comentario) {
        await pool.query(
            `INSERT INTO reportes_evento (evento_id, persona_id, estado, comentario)
       VALUES (?,?,?,?)
       ON DUPLICATE KEY UPDATE
         estado = VALUES(estado),
         comentario = VALUES(comentario),
         fecha = CURRENT_TIMESTAMP`,
            [eventoId, personaId, estado, comentario || null]
        );
    },

    async obtenerReportes(eventoId) {
        const [rows] = await pool.query(
            `SELECT r.persona_id AS personaId, p.cedula, p.nombre, p.apellidos,
              r.estado, r.comentario, r.fecha
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
            `SELECT id, cedula, nombre, apellidos FROM personas
       WHERE id NOT IN (SELECT persona_id FROM reportes_evento WHERE evento_id = ?)`,
            [eventoId]
        );
        return rows;
    },
};

module.exports = EventoModel;