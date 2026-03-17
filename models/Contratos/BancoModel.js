const pool = require('../../config/ConectDb');

const BancoModel = {
    create: async (data) => {
        const query = `
            INSERT INTO bancos (
                nombre_banco,
                activo
            ) VALUES (?, ?)
        `;

        const values = [
            data.nombre_banco,
            data.activo !== undefined ? data.activo : true
        ];

        const [result] = await pool.query(query, values);
        return { id_banco: result.insertId, ...data };
    },

    getAll: async () => {
        const [rows] = await pool.query(
            'SELECT * FROM bancos ORDER BY nombre_banco'
        );
        return rows;
    },

    getById: async (id) => {
        const [rows] = await pool.query(
            'SELECT * FROM bancos WHERE id_banco = ?',
            [id]
        );
        return rows[0];
    },

    update: async (id, data) => {
        const query = `
            UPDATE bancos SET
                nombre_banco = ?,
                activo = ?
            WHERE id_banco = ?
        `;

        const values = [
            data.nombre_banco,
            data.activo,
            id
        ];

        const [result] = await pool.query(query, values);
        return result;
    },

    delete: async (id) => {
        const [result] = await pool.query(
            'UPDATE bancos SET activo = false WHERE id_banco = ?',
            [id]
        );
        return result;
    }
};

module.exports = BancoModel;