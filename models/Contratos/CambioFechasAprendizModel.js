const pool = require('../../config/ConectDb');

const CambioFechasAprendizModel = {
    // Crear registro de cambio de fechas
    create: async (data) => {
        const query = `
            INSERT INTO cambios_fechas_aprendiz (
                id_contrato,
                electiva_inicio_anterior,
                electiva_fin_anterior,
                practica_inicio_anterior,
                practica_fin_anterior,
                electiva_inicio_nueva,
                electiva_fin_nueva,
                practica_inicio_nueva,
                practica_fin_nueva,
                usuario_modificacion
            ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
        `;

        const values = [
            data.id_contrato,
            data.electiva_inicio_anterior || null,
            data.electiva_fin_anterior || null,
            data.practica_inicio_anterior || null,
            data.practica_fin_anterior || null,
            data.electiva_inicio_nueva || null,
            data.electiva_fin_nueva || null,
            data.practica_inicio_nueva || null,
            data.practica_fin_nueva || null,
            data.usuario_modificacion || 'SISTEMA'
        ];

        const [result] = await pool.query(query, values);
        return { id_cambio: result.insertId, ...data };
    },

    // Obtener historial de cambios por contrato
    getByContrato: async (idContrato) => {
        const [rows] = await pool.query(`
            SELECT * FROM cambios_fechas_aprendiz 
            WHERE id_contrato = ? 
            ORDER BY fecha_cambio DESC
        `, [idContrato]);
        return rows;
    },

    // Obtener último cambio por contrato
    getUltimoCambio: async (idContrato) => {
        const [rows] = await pool.query(`
            SELECT * FROM cambios_fechas_aprendiz 
            WHERE id_contrato = ? 
            ORDER BY fecha_cambio DESC 
            LIMIT 1
        `, [idContrato]);
        return rows[0] || null;
    }
};

module.exports = CambioFechasAprendizModel;