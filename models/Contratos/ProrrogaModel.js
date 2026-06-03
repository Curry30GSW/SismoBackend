const pool = require('../../config/ConectDb');

const ProrrogaModel = {
    // Crear nueva prórroga
    create: async (data) => {
        const connection = await pool.getConnection();
        try {
            await connection.beginTransaction();

            // 🔥 1. Obtener el último número de prórroga para este contrato
            const [ultima] = await connection.query(
                'SELECT MAX(numero_prorroga) as max_num FROM prorrogas_contrato WHERE id_contrato = ?',
                [data.id_contrato]
            );
            const numeroProrroga = (ultima[0].max_num || 0) + 1;

            // 🔥 2. Si existe una prórroga activa, marcarla como COMPLETADA
            await connection.query(`
            UPDATE prorrogas_contrato 
            SET estado = 'COMPLETADA' 
            WHERE id_contrato = ? AND estado = 'ACTIVA'
        `, [data.id_contrato]);

            // 🔥 3. Insertar nueva prórroga como ACTIVA
            const query = `
            INSERT INTO prorrogas_contrato (
                id_contrato,
                codigo_prorroga,      
                numero_prorroga,
                fecha_inicio,
                fecha_fin_anterior,
                fecha_fin_nueva,
                dias_prorrogados,
                estado,
                usuario_creacion
            ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
        `;

            const values = [
                data.id_contrato,
                data.codigo_prorroga,
                numeroProrroga,
                data.fecha_inicio,
                data.fecha_fin_anterior,
                data.fecha_fin_nueva,
                data.dias_prorrogados,
                'ACTIVA',
                data.usuario_creacion || 'SISTEMA'
            ];

            const [result] = await connection.query(query, values);

            // 🔥 4. Actualizar el contrato original
            await connection.query(`
            UPDATE contratos SET
                fecha_fin = ?,
                estado = 'PRORROGADO',
                fecha_modificacion = NOW()
            WHERE id_contrato = ?
        `, [data.fecha_fin_nueva, data.id_contrato]);

            await connection.commit();

            return {
                id_prorroga: result.insertId,
                codigo_prorroga: data.codigo_prorroga,  // ← NUEVO
                numero_prorroga: numeroProrroga
            };

        } catch (error) {
            await connection.rollback();
            throw error;
        } finally {
            connection.release();
        }
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
            FROM prorrogas_contrato p
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
                p.codigo_prorroga LIKE ?
            )`;
            const searchTerm = `%${filtros.busqueda}%`;
            params.push(searchTerm, searchTerm, searchTerm, searchTerm, searchTerm);
        }

        query += ' ORDER BY p.fecha_prorroga ASC';

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
            FROM prorrogas_contrato p
            INNER JOIN contratos c ON p.id_contrato = c.id_contrato
            INNER JOIN funcionarios f ON c.id_funcionario = f.id_funcionario
            WHERE p.id_prorroga = ?
        `, [id]);
        return rows[0];
    },

    // Obtener todas las prórrogas de un contrato
    getByContrato: async (idContrato) => {
        const [rows] = await pool.query(`
            SELECT 
                p.*,
                DATEDIFF(p.fecha_fin_nueva, p.fecha_fin_anterior) as dias_calculados
            FROM prorrogas_contrato p
            WHERE p.id_contrato = ?
            ORDER BY p.numero_prorroga ASC
        `, [idContrato]);
        return rows;
    },

    // Obtener la última prórroga activa
    getUltimaActiva: async (idContrato) => {
        const [rows] = await pool.query(`
            SELECT * FROM prorrogas_contrato
            WHERE id_contrato = ? AND estado = 'ACTIVA'
            ORDER BY numero_prorroga DESC
            LIMIT 1
        `, [idContrato]);
        return rows[0];
    },

    // Verificar si un contrato puede ser prorrogado
    puedeProrrogar: async (idContrato) => {
        const [contrato] = await pool.query(`
        SELECT tipo_contrato, fecha_fin, estado 
        FROM contratos 
        WHERE id_contrato = ?
    `, [idContrato]);

        if (!contrato[0]) return false;

        if (contrato[0].tipo_contrato !== 'TERMINO_FIJO') return false;

        if (contrato[0].estado !== 'ACTIVO' && contrato[0].estado !== 'PRORROGADO') return false;

        const fechaFin = new Date(contrato[0].fecha_fin);
        const hoy = new Date();

        // Se puede prorrogar hasta 30 días después del vencimiento
        const diasRestantes = Math.ceil((fechaFin - hoy) / (1000 * 60 * 60 * 24));
        return diasRestantes <= 40;
    },

    // Completar una prórroga (cuando se vence el nuevo plazo)
    completarProrroga: async (idProrroga) => {
        const [result] = await pool.query(`
            UPDATE prorrogas_contrato SET estado = 'COMPLETADA' WHERE id_prorroga = ?
        `, [idProrroga]);
        return result;
    },

    getCantidadByContrato: async (idContrato) => {
        const [rows] = await pool.query(`
        SELECT COUNT(*) as total FROM prorrogas_contrato WHERE id_contrato = ?
    `, [idContrato]);
        return rows[0]?.total || 0;
    },
};

module.exports = ProrrogaModel;