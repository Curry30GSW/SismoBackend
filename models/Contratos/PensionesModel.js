const pool = require('../../config/ConectDb');

const PensionesModel = {
    create: async (data) => {
        const query = `
            INSERT INTO pensiones (
                codigo_pension,
                nit_pension,
                nombre_pension,
                nombre_aporte
            ) VALUES (?, ?, ?, ?)
        `;

        const values = [
            data.codigo_pension,
            data.nit_pension,
            data.nombre_pension,
            data.nombre_aporte
        ];

        const [result] = await pool.query(query, values);
        return { id_pension: result.insertId, ...data };
    },

    getAll: async () => {
        const [rows] = await pool.query(
            'SELECT * FROM pensiones ORDER BY nombre_pension'
        );
        return rows;
    },

    getById: async (id) => {
        const [rows] = await pool.query(
            'SELECT * FROM pensiones WHERE id_pension = ?',
            [id]
        );
        return rows[0];
    },

    getByCodigo: async (codigo) => {
        const [rows] = await pool.query(
            'SELECT * FROM pensiones WHERE codigo_pension = ?',
            [codigo]
        );
        return rows[0];
    },

    update: async (id, data) => {
        const query = `
            UPDATE pensiones SET
                codigo_pension = ?,
                nit_pension = ?,
                nombre_pension = ?,
                nombre_aporte = ?
            WHERE id_pension = ?
        `;

        const values = [
            data.codigo_pension,
            data.nit_pension,
            data.nombre_pension,
            data.nombre_aporte
        ];

        const [result] = await pool.query(query, values);
        return result;
    },

    delete: async (id) => {
        const [result] = await pool.query(
            'UPDATE pensiones SET activo = false WHERE id_pension = ?',
            [id]
        );
        return result;
    }
};

module.exports = PensionesModel;