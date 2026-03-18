const pool = require('../../config/ConectDb');

const NivelRiesgoModel = {
    // =============================================
    // CREATE
    // =============================================
    create: async (data) => {
        const query = `
            INSERT INTO nivel_riesgo (
                clase_riesgo,
                tarifa,
                actividades,
                activo
            ) VALUES (?, ?, ?, ?)
        `;

        const values = [
            data.clase_riesgo,
            data.tarifa,
            data.actividades,
            data.activo !== undefined ? data.activo : true
        ];

        const [result] = await pool.query(query, values);
        return { id_riesgo: result.insertId, ...data };
    },

    // =============================================
    // READ
    // =============================================
    getAll: async () => {
        const [rows] = await pool.query(`
            SELECT * FROM nivel_riesgo 
            ORDER BY clase_riesgo
        `);
        return rows;
    },

    getById: async (id) => {
        const [rows] = await pool.query(`
            SELECT * FROM nivel_riesgo 
            WHERE id_riesgo = ?
        `, [id]);
        return rows[0];
    },

    // =============================================
    // UPDATE
    // =============================================
    update: async (id, data) => {
        const query = `
            UPDATE nivel_riesgo SET
                clase_riesgo = ?,
                tarifa = ?,
                actividades = ?
            WHERE id_riesgo = ?
        `;

        const values = [
            data.clase_riesgo,
            data.tarifa,
            data.actividades,
            id
        ];

        const [result] = await pool.query(query, values);
        return result;
    },

    // =============================================
    // DELETE (SOFT DELETE)
    // =============================================
    delete: async (id) => {
        const [result] = await pool.query(
            'UPDATE nivel_riesgo SET activo = false WHERE id_riesgo = ?',
            [id]
        );
        return result;
    }
};

module.exports = NivelRiesgoModel;