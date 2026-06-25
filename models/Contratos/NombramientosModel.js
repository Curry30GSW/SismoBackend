const pool = require('../../config/ConectDb');

const NombramientoModel = {
    generarCodigoNombramiento: async () => {
        try {
            const anioActual = new Date().getFullYear();
            const [rows] = await pool.query(`
                SELECT codigo_nombramiento 
                FROM nombramientos 
                WHERE codigo_nombramiento LIKE ? 
                ORDER BY id_nombramiento DESC 
                LIMIT 1
            `, [`CM-${anioActual}-%`]);

            let nuevoNumero = 1;
            if (rows[0] && rows[0].codigo_nombramiento) {
                const match = rows[0].codigo_nombramiento.match(/CM-\d+-(\d+)/);
                if (match) {
                    nuevoNumero = parseInt(match[1]) + 1;
                }
            }
            return `CM-${anioActual}-${nuevoNumero}`;
        } catch (error) {
            console.error('Error generando código de cambio:', error);
            const timestamp = Date.now().toString().slice(-6);
            return `CM-${timestamp}`;
        }
    },

    create: async (data) => {
        const query = `
        INSERT INTO nombramientos (
            codigo_nombramiento,
            id_contrato_anterior,
            id_contrato_nuevo,
            id_posicion_nueva,
            id_posicion_anterior,
            id_funcionario,
            fecha_nombramiento,
            fecha_efectiva,
            estado,
            usuario_creacion
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `;

        const values = [
            data.codigo_nombramiento,
            data.id_contrato_anterior,
            data.id_contrato_nuevo,
            data.id_posicion_nueva || null,
            data.id_posicion_anterior || null,
            data.id_funcionario || null,
            data.fecha_nombramiento || new Date().toISOString().split('T')[0],
            data.fecha_efectiva || data.fecha_nombramiento || new Date().toISOString().split('T')[0],
            data.estado || 'PENDIENTE',
            data.usuario_creacion || 'SISTEMA'
        ];

        const [result] = await pool.query(query, values);
        return { id_nombramiento: result.insertId, ...data };
    },

    getPendientes: async () => {
        const [rows] = await pool.query(`
            SELECT 
                nm.*,
                c.id_funcionario,
                c.id_posicion as id_posicion_actual,
                c.estado as estado_contrato_actual
            FROM nombramientos nm
            INNER JOIN contratos c ON c.id_contrato = nm.id_contrato_anterior
            WHERE nm.estado = 'PENDIENTE' 
            AND nm.fecha_efectiva <= CURDATE()
            AND c.estado = 'ACTIVO'
            ORDER BY nm.fecha_efectiva ASC
        `);
        return rows;
    },

    marcarEjecutado: async (idNombramiento) => {
        const [result] = await pool.query(`
            UPDATE nombramientos 
            SET estado = 'EJECUTADO', 
                ejecutado_at = NOW() 
            WHERE id_nombramiento = ?
        `, [idNombramiento]);
        return result;
    },

    getById: async (idNombramiento) => {
        const [rows] = await pool.query(`
            SELECT * FROM nombramientos WHERE id_nombramiento = ?
        `, [idNombramiento]);
        return rows[0];
    },

    getByFuncionario: async (idFuncionario) => {
        const [rows] = await pool.query(`
            SELECT 
                n.*,
                c_ant.numero_contrato as contrato_anterior,
                c_nuevo.numero_contrato as contrato_nuevo,
                c_ant.cargo as cargo_anterior,
                c_nuevo.cargo as cargo_nuevo
            FROM nombramientos n
            INNER JOIN contratos c_ant ON n.id_contrato_anterior = c_ant.id_contrato
            INNER JOIN contratos c_nuevo ON n.id_contrato_nuevo = c_nuevo.id_contrato
            WHERE n.id_funcionario = ?
            ORDER BY n.fecha_nombramiento DESC
        `, [idFuncionario]);
        return rows;
    },
};

module.exports = NombramientoModel;