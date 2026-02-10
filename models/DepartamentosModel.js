const pool = require('../config/ConectDb');

const DepartamentoModel = {

    create: async (data) => {
        const connection = await pool.getConnection();
        try {
            const query = `
                INSERT INTO departamentos (
                    ext,
                    departamento
                ) VALUES (?, ?)
            `;

            const values = [
                data.ext,
                data.departamento
            ];

            const [result] = await connection.query(query, values);
            return result;

        } finally {
            connection.release();
        }
    },

    findAll: async () => {
        const [rows] = await pool.query(`
            SELECT id_departamento, ext, departamento
            FROM departamentos
            ORDER BY departamento ASC
        `);
        return rows;
    },

    findById: async (id) => {
        const [rows] = await pool.query(
            'SELECT * FROM departamentos WHERE id_departamento = ?',
            [id]
        );
        return rows[0];
    },

    findByExt: async (ext) => {
        const [rows] = await pool.query(
            'SELECT * FROM departamentos WHERE ext = ?',
            [ext]
        );
        return rows[0];
    },

    update: async (id, data) => {
        const query = `
            UPDATE departamentos SET
                ext = ?,
                departamento = ?
            WHERE id_departamento = ?
        `;

        const values = [
            data.ext,
            data.departamento,
            id
        ];

        const [result] = await pool.query(query, values);
        return result;
    },

    delete: async (id) => {
        const [result] = await pool.query(
            'DELETE FROM departamentos WHERE id_departamento = ?',
            [id]
        );
        return result;
    }
};

module.exports = DepartamentoModel;
