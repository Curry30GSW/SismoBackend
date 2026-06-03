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


    getAll: async (filtros = {}) => {
        let query = `
            SELECT 
                p.*,
                c.numero_contrato,
                c.cargo,
                c.estado as estado_contrato,
                f.nombres,
                f.apellidos,
                f.numero_documento
            FROM preavisos_no_prorroga p
            INNER JOIN contratos c ON p.id_contrato = c.id_contrato
            INNER JOIN funcionarios f ON c.id_funcionario = f.id_funcionario
            WHERE 1=1
        `;
        const params = [];

        if (filtros.estado) {
            query += ' AND p.estado = ?';
            params.push(filtros.estado);
        }

        if (filtros.id_contrato) {
            query += ' AND p.id_contrato = ?';
            params.push(filtros.id_contrato);
        }

        if (filtros.busqueda) {
            query += ` AND (
                f.nombres LIKE ? OR 
                f.apellidos LIKE ? OR 
                f.numero_documento LIKE ? OR 
                c.numero_contrato LIKE ? OR
                p.codigo_preaviso LIKE ?
            )`;
            const searchTerm = `%${filtros.busqueda}%`;
            params.push(searchTerm, searchTerm, searchTerm, searchTerm, searchTerm);
        }

        query += ' ORDER BY p.fecha_creacion ASC';

        const [rows] = await pool.query(query, params);
        return rows;
    },

    getById: async (id) => {
        const [rows] = await pool.query(`
            SELECT 
                p.*,
                c.numero_contrato,
                c.cargo,
                c.fecha_inicio as contrato_fecha_inicio,
                c.fecha_fin as contrato_fecha_fin,
                f.nombres,
                f.apellidos,
                f.numero_documento,
                f.tipo_documento
            FROM preavisos_no_prorroga p
            INNER JOIN contratos c ON p.id_contrato = c.id_contrato
            INNER JOIN funcionarios f ON c.id_funcionario = f.id_funcionario
            WHERE p.id_preaviso = ?
        `, [id]);
        return rows[0];
    },


    // Obtener el último código de preaviso generado
    obtenerUltimoCodigo: async (anio) => {
        const [rows] = await pool.query(`
        SELECT codigo_preaviso 
        FROM preavisos_no_prorroga 
        WHERE codigo_preaviso LIKE ? 
        ORDER BY id_preaviso DESC 
        LIMIT 1
    `, [`NPR-${anio}-%`]);
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