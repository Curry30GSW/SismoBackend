const pool = require('../../config/ConectDb');

const FirmanteModel = {
    listar: async () => {
        const [rows] = await pool.query(`
            SELECT * FROM firmantes_documentos
            ORDER BY tipo_firma ASC, activo DESC, fecha_inicio DESC
        `);
        return rows;
    },

    obtenerActivo: async (tipo_firma) => {
        const [rows] = await pool.query(`
            SELECT * FROM firmantes_documentos
            WHERE tipo_firma = ? AND activo = true
            ORDER BY fecha_inicio DESC LIMIT 1
        `, [tipo_firma]);
        return rows[0] || null;
    },

    crear: async ({ tipo_firma, nombre_firma, cargo_firma, activo_desde_creacion, usuario_creacion }) => {
        // Si el nuevo se crea activo, desactiva cualquier otro activo del mismo tipo
        if (activo_desde_creacion) {
            await pool.query(`
                UPDATE firmantes_documentos
                SET activo = false, fecha_fin = NOW()
                WHERE tipo_firma = ? AND activo = true
            `, [tipo_firma]);
        }

        const [result] = await pool.query(`
            INSERT INTO firmantes_documentos (tipo_firma, nombre_firma, cargo_firma, activo, usuario_creacion)
            VALUES (?, ?, ?, ?, ?)
        `, [tipo_firma, nombre_firma, cargo_firma, !!activo_desde_creacion, usuario_creacion || 'SISTEMA']);

        return { id_firmante: result.insertId, tipo_firma, nombre_firma, cargo_firma };
    },

    // Editar los datos de un firmante YA existente (no cambia cuál está activo)
    actualizar: async (id_firmante, { nombre_firma, cargo_firma }) => {
        const [result] = await pool.query(`
            UPDATE firmantes_documentos
            SET nombre_firma = ?, cargo_firma = ?
            WHERE id_firmante = ?
        `, [nombre_firma, cargo_firma, id_firmante]);
        return result;
    },

    // Activar este firmante y desactivar cualquier otro activo del mismo tipo
    activar: async (id_firmante) => {
        const [rows] = await pool.query(`SELECT tipo_firma FROM firmantes_documentos WHERE id_firmante = ?`, [id_firmante]);
        if (!rows[0]) return null;
        const { tipo_firma } = rows[0];

        await pool.query(`
            UPDATE firmantes_documentos
            SET activo = false, fecha_fin = NOW()
            WHERE tipo_firma = ? AND activo = true AND id_firmante != ?
        `, [tipo_firma, id_firmante]);

        await pool.query(`
            UPDATE firmantes_documentos
            SET activo = true, fecha_fin = NULL
            WHERE id_firmante = ?
        `, [id_firmante]);

        return true;
    },

    // Soft delete
    eliminar: async (id_firmante) => {
        const [result] = await pool.query(`
            UPDATE firmantes_documentos
            SET activo = false, fecha_fin = NOW()
            WHERE id_firmante = ?
        `, [id_firmante]);
        return result;
    }
};
module.exports = FirmanteModel;