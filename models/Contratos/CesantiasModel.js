const pool = require('../../config/ConectDb');

const CesantiasModel = {
    create: async (data) => {
        const query = `
            INSERT INTO cesantias (
                codigo_cesantia,
                nit,
                nombre_cesantia,
                nombre_aporte,
                activo
            ) VALUES (?, ?, ?, ?, ?)
        `;

        const values = [
            data.codigo_cesantia,
            data.nit,
            data.nombre_cesantia,
            data.nombre_aporte,
            data.activo !== undefined ? data.activo : true
        ];

        const [result] = await pool.query(query, values);
        return { id_cesantias: result.insertId, ...data };
    },

    getAll: async () => {
        const [rows] = await pool.query(
            'SELECT * FROM cesantias ORDER BY nombre_cesantia'
        );
        return rows;
    },

    getById: async (id) => {
        const [rows] = await pool.query(
            'SELECT * FROM cesantias WHERE id_cesantias = ?',
            [id]
        );
        return rows[0];
    },

    getByCodigo: async (codigo) => {
        const [rows] = await pool.query(
            'SELECT * FROM cesantias WHERE codigo_cesantia = ?',
            [codigo]
        );
        return rows[0];
    },
    update: async (id, data) => {
        const query = `
            UPDATE cesantias SET
                codigo_cesantia = ?,
                nit = ?,
                nombre_cesantia = ?,
                nombre_aporte = ?,
                activo = ?
            WHERE id_cesantias = ?
        `;

        const values = [
            data.codigo_cesantia,
            data.nit,
            data.nombre_cesantia,
            data.nombre_aporte,
            data.activo,
            id
        ];

        const [result] = await pool.query(query, values);
        return result;
    },

    delete: async (id) => {
        const [result] = await pool.query(
            'UPDATE cesantias SET activo = false WHERE id_cesantias = ?',
            [id]
        );
        return result;
    }
};

module.exports = CesantiasModel;