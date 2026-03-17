const pool = require('../../config/ConectDb');

const ArlModel = {
    create: async (data) => {
        const query = `
            INSERT INTO arl (
                nombre_arl,
                activo
            ) VALUES (?, ?)
        `;

        const values = [
            data.nombre_arl,
            data.activo !== undefined ? data.activo : true
        ];

        const [result] = await pool.query(query, values);
        return { id_arl: result.insertId, ...data };
    },

    getAll: async (activo = true) => {
        const [rows] = await pool.query(
            'SELECT * FROM arl WHERE activo = ? ORDER BY nombre_arl',
            [activo]
        );
        return rows;
    },

    getById: async (id) => {
        const [rows] = await pool.query(
            'SELECT * FROM arl WHERE id_arl = ?',
            [id]
        );
        return rows[0];
    },

    update: async (id, data) => {
        const query = `
            UPDATE arl SET
                nombre_arl = ?,
                activo = ?
            WHERE id_arl = ?
        `;

        const values = [
            data.nombre_arl,
            data.activo,
            id
        ];

        const [result] = await pool.query(query, values);
        return result;
    },
    delete: async (id) => {
        const [result] = await pool.query(
            'UPDATE arl SET activo = false WHERE id_arl = ?',
            [id]
        );
        return result;
    },
    getNivelesByArl: async (idArl) => {
        const [rows] = await pool.query(`
            SELECT nr.* 
            FROM niveles_riesgo nr
            WHERE nr.id_arl = ? AND nr.activo = true
            ORDER BY nr.nivel
        `, [idArl]);
        return rows;
    }
};

module.exports = ArlModel;