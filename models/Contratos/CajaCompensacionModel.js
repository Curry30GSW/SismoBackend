const pool = require('../../config/ConectDb');

const CajaCompensacionModel = {
    create: async (data) => {
        const query = `
            INSERT INTO caja_compensacion (
                codigo_caja,
                nombre_caja,
                activo
            ) VALUES (?, ?, ?)
        `;

        const values = [
            data.codigo_caja,
            data.nombre_caja,
            data.activo !== undefined ? data.activo : true
        ];

        const [result] = await pool.query(query, values);
        return { id_caja: result.insertId, ...data };
    },

    getAll: async () => {
        const [rows] = await pool.query(
            'SELECT * FROM caja_compensacion ORDER BY nombre_caja'
        );
        return rows;
    },

    getById: async (id) => {
        const [rows] = await pool.query(
            'SELECT * FROM caja_compensacion WHERE id_caja = ?',
            [id]
        );
        return rows[0];
    },

    getByCodigo: async (codigo) => {
        const [rows] = await pool.query(
            'SELECT * FROM caja_compensacion WHERE codigo_caja = ?',
            [codigo]
        );
        return rows[0];
    },
    update: async (id, data) => {
        const query = `
            UPDATE caja_compensacion SET
                codigo_caja = ?,
                nombre_caja = ?,
                activo = ?
            WHERE id_caja = ?
        `;

        const values = [
            data.codigo_caja,
            data.nombre_caja,
            data.activo,
            id
        ];

        const [result] = await pool.query(query, values);
        return result;
    },

    delete: async (id) => {
        const [result] = await pool.query(
            'UPDATE caja_compensacion SET activo = false WHERE id_caja = ?',
            [id]
        );
        return result;
    }
};

module.exports = CajaCompensacionModel;