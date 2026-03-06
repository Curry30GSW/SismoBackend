const pool = require('../config/ConectDb');

const ConfiguracionPrestacionesModel = {
    // Obtener todas las prestaciones activas
    getAll: async () => {
        const [rows] = await pool.query(
            'SELECT * FROM configuracion_prestaciones WHERE activo = true ORDER BY id_config'
        );
        return rows;
    },

    // Obtener una prestación por ID
    getById: async (id) => {
        const [rows] = await pool.query(
            'SELECT * FROM configuracion_prestaciones WHERE id_config = ?',
            [id]
        );
        return rows[0];
    },

    // Crear nueva prestación
    create: async (data) => {
        const { nombre_prestacion, porcentaje, descripcion } = data;
        const [result] = await pool.query(
            'INSERT INTO configuracion_prestaciones (nombre_prestacion, porcentaje, descripcion) VALUES (?, ?, ?)',
            [nombre_prestacion, porcentaje, descripcion]
        );
        return { id_config: result.insertId, ...data };
    },

    // Actualizar prestación
    update: async (id, data) => {
        const { nombre_prestacion, porcentaje, descripcion, activo } = data;
        const [result] = await pool.query(
            'UPDATE configuracion_prestaciones SET nombre_prestacion = ?, porcentaje = ?, descripcion = ?, activo = ? WHERE id_config = ?',
            [nombre_prestacion, porcentaje, descripcion, activo, id]
        );
        return result;
    },

    // Eliminar (soft delete)
    delete: async (id) => {
        const [result] = await pool.query(
            'UPDATE configuracion_prestaciones SET activo = false WHERE id_config = ?',
            [id]
        );
        return result;
    },

    // Obtener porcentaje por nombre
    getByNombre: async (nombre) => {
        const [rows] = await pool.query(
            'SELECT * FROM configuracion_prestaciones WHERE nombre_prestacion = ? AND activo = true',
            [nombre]
        );
        return rows[0];
    }
};

module.exports = ConfiguracionPrestacionesModel;