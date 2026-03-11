const pool = require('../config/ConectDb');

const TipoPlantaModel = {
    // Obtener todos los tipos de planta
    getAll: async (activo = true) => {
        const query = 'SELECT * FROM tipos_planta WHERE activo = ? ORDER BY nombre_tipo';
        const [rows] = await pool.query(query, [activo]);
        return rows;
    },

    // Obtener tipo por ID
    getById: async (id) => {
        const [rows] = await pool.query('SELECT * FROM tipos_planta WHERE id_tipo_planta = ?', [id]);
        return rows[0];
    },

    // Obtener tipo por código
    getByCodigo: async (codigo) => {
        const [rows] = await pool.query('SELECT * FROM tipos_planta WHERE codigo_tipo = ?', [codigo]);
        return rows[0];
    },

    // Crear nuevo tipo
    create: async (data) => {
        const query = `
            INSERT INTO tipos_planta (codigo_tipo, nombre_tipo, descripcion, color_representacion, activo)
            VALUES (?, ?, ?, ?, ?)
        `;
        const [result] = await pool.query(query, [
            data.codigo_tipo,
            data.nombre_tipo,
            data.descripcion || null,
            data.color_representacion || null,
            data.activo !== undefined ? data.activo : true
        ]);
        return { id_tipo_planta: result.insertId, ...data };
    },

    // Actualizar tipo
    update: async (id, data) => {
        const query = `
            UPDATE tipos_planta SET
                codigo_tipo = ?,
                nombre_tipo = ?,
                descripcion = ?,
                color_representacion = ?,
                activo = ?
            WHERE id_tipo_planta = ?
        `;
        const [result] = await pool.query(query, [
            data.codigo_tipo,
            data.nombre_tipo,
            data.descripcion,
            data.color_representacion,
            data.activo,
            id
        ]);
        return result;
    },

    // Eliminar (soft delete)
    delete: async (id) => {
        const [result] = await pool.query(
            'UPDATE tipos_planta SET activo = false WHERE id_tipo_planta = ?',
            [id]
        );
        return result;
    },

    // Obtener con estadísticas de cargos
    getWithStats: async () => {
        const [rows] = await pool.query(`
            SELECT 
                tp.*,
                COUNT(DISTINCT cb.id_cargo_base) as total_cargos,
                COUNT(DISTINCT CASE WHEN cb.activo = true THEN cb.id_cargo_base END) as cargos_activos
            FROM tipos_planta tp
            LEFT JOIN cargos_base cb ON tp.id_tipo_planta = cb.id_tipo_planta
            WHERE tp.activo = true
            GROUP BY tp.id_tipo_planta
            ORDER BY tp.nombre_tipo
        `);
        return rows;
    }
};

module.exports = TipoPlantaModel;