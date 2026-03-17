const pool = require('../../config/ConectDb');

const NivelRiesgoModel = {

    create: async (data) => {
        const query = `
            INSERT INTO niveles_riesgo (
                id_arl,
                clase_riesgo,
                tarifa,
                actividades,
                activo
            ) VALUES (?, ?, ?, ?, ?)
        `;

        const values = [
            data.id_arl,
            data.clase_riesgo,
            data.tarifa,
            data.actividades,
            data.activo !== undefined ? data.activo : true
        ];

        const [result] = await pool.query(query, values);
        return { id_riesgo: result.insertId, ...data };
    },

    getAll: async (activo = true) => {
        const [rows] = await pool.query(`
            SELECT nr.*, a.nombre_arl 
            FROM niveles_riesgo nr
            INNER JOIN arl a ON nr.id_arl = a.id_arl
            WHERE nr.activo = ?
            ORDER BY a.nombre_arl, nr.clase_riesgo
        `, [activo]);
        return rows;
    },

    getById: async (id) => {
        const [rows] = await pool.query(`
            SELECT nr.*, a.nombre_arl 
            FROM niveles_riesgo nr
            INNER JOIN arl a ON nr.id_arl = a.id_arl
            WHERE nr.id_riesgo = ?
        `, [id]);
        return rows[0];
    },

    getByArl: async (idArl) => {
        const [rows] = await pool.query(`
            SELECT * FROM niveles_riesgo 
            WHERE id_arl = ? AND activo = true
            ORDER BY clase_riesgo
        `, [idArl]);
        return rows;
    },

    update: async (id, data) => {
        const query = `
            UPDATE niveles_riesgo SET
                id_arl = ?,
                clase_riesgo = ?,
                tarifa = ?,
                actividades = ?,
                activo = ?
            WHERE id_riesgo = ?
        `;

        const values = [
            data.id_arl,
            data.clase_riesgo,
            data.tarifa,
            data.actividades,
            data.activo,
            id
        ];

        const [result] = await pool.query(query, values);
        return result;
    },

    delete: async (id) => {
        const [result] = await pool.query(
            'UPDATE niveles_riesgo SET activo = false WHERE id_riesgo = ?',
            [id]
        );
        return result;
    }
};

module.exports = NivelRiesgoModel;