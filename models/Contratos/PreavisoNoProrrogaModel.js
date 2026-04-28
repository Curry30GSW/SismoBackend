const pool = require('../../config/ConectDb');

const PreavisoNoProrrogaModel = {
    // Crear nuevo preaviso
    create: async (data) => {
        const query = `
            INSERT INTO preavisos_no_prorroga (
                id_contrato,
                codigo_preaviso, 
                fecha_preaviso,
                fecha_notificacion,
                dias_antelacion,
                estado,
                usuario_creacion
            ) VALUES (?, ?, ?, ?, ?, ?, ?)
        `;

        const values = [
            data.id_contrato,
            data.codigo_preaviso,
            data.fecha_preaviso,
            data.fecha_notificacion,
            data.dias_antelacion,
            'PENDIENTE',
            data.usuario_creacion || 'SISTEMA'
        ];

        const [result] = await pool.query(query, values);
        return { id_preaviso: result.insertId, ...data };
    },

    // Obtener el último código de preaviso generado
    obtenerUltimoCodigo: async () => {
        const [rows] = await pool.query(`
            SELECT codigo_preaviso FROM preavisos_no_prorroga 
            ORDER BY id_preaviso DESC 
            LIMIT 1
        `);
        return rows.length > 0 ? rows[0].codigo_preaviso : null;
    },


    // Verificar si ya existe un preaviso activo para el contrato
    existePreavisoActivo: async (idContrato) => {
        const [rows] = await pool.query(`
            SELECT id_preaviso FROM preavisos_no_prorroga
            WHERE id_contrato = ? AND estado IN ('PENDIENTE', 'NOTIFICADO')
        `, [idContrato]);
        return rows.length > 0;
    },

    // Obtener preaviso por contrato
    getByContrato: async (idContrato) => {
        const [rows] = await pool.query(`
            SELECT * FROM preavisos_no_prorroga
            WHERE id_contrato = ?
            ORDER BY fecha_creacion DESC
            LIMIT 1
        `, [idContrato]);
        return rows[0];
    },

    // Marcar como notificado
    marcarNotificado: async (idPreaviso) => {
        const [result] = await pool.query(`
            UPDATE preavisos_no_prorroga SET estado = 'NOTIFICADO'
            WHERE id_preaviso = ?
        `, [idPreaviso]);
        return result;
    },

    // Cancelar preaviso
    cancelar: async (idPreaviso) => {
        const [result] = await pool.query(`
            UPDATE preavisos_no_prorroga SET estado = 'CANCELADO'
            WHERE id_preaviso = ?
        `, [idPreaviso]);
        return result;
    }
};

module.exports = PreavisoNoProrrogaModel;