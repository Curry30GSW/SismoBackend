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
                numero_prorroga,
                fecha_inicio,
                fecha_fin_anterior,
                fecha_fin_nueva,
                dias_prorrogados,
                estado,
                usuario_creacion
            ) VALUES (?, ?, ?, ?, ?, ?, ?, ?)
        `;

            const values = [
                data.id_contrato,
                numeroProrroga,
                data.fecha_inicio,
                data.fecha_fin_anterior,
                data.fecha_fin_nueva,
                data.dias_prorrogados,
                'ACTIVA',  // ← La nueva prórroga se crea como ACTIVA
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
                numero_prorroga: numeroProrroga
            };

        } catch (error) {
            await connection.rollback();
            throw error;
        } finally {
            connection.release();
        }
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
        return diasRestantes <= 30;
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