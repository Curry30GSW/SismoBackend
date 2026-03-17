const pool = require('../../config/ConectDb');

const AnioLegalModel = {
    // Crear nuevo año legal
    create: async (data) => {
        const connection = await pool.getConnection();
        try {
            const query = `
                INSERT INTO anios_legales (
                    anio,
                    salario_minimo_legal,
                    salario_minimo_coopserp,
                    auxilio_transporte,
                    activo
                ) VALUES (?, ?, ?, ?, ?)
            `;

            const values = [
                data.anio,
                data.salario_minimo_legal,
                data.salario_minimo_coopserp,
                data.auxilio_transporte,
                data.activo !== undefined ? data.activo : true
            ];

            const [result] = await connection.query(query, values);
            return { id: result.insertId, ...data };

        } finally {
            connection.release();
        }
    },

    // Obtener todos los años legales
    getAll: async (activo = null) => {
        let query = 'SELECT * FROM anios_legales';
        let params = [];

        if (activo !== null) {
            query += ' WHERE activo = ?';
            params.push(activo);
        }

        query += ' ORDER BY anio DESC';

        const [rows] = await pool.query(query, params);
        return rows;
    },

    // Obtener año actual (activo)
    getCurrentYear: async () => {
        const [rows] = await pool.query(
            'SELECT * FROM anios_legales WHERE activo = true ORDER BY anio DESC LIMIT 1'
        );
        return rows[0];
    },

    // Obtener año por ID
    getById: async (id) => {
        const [rows] = await pool.query(
            'SELECT * FROM anios_legales WHERE id_anio_legal = ?',
            [id]
        );
        return rows[0];
    },

    // Obtener año por número de año
    getByAnio: async (anio) => {
        const [rows] = await pool.query(
            'SELECT * FROM anios_legales WHERE anio = ?',
            [anio]
        );
        return rows[0];
    },

    // Actualizar año legal
    update: async (id, data) => {
        const query = `
            UPDATE anios_legales SET
                anio = ?,
                salario_minimo_legal = ?,
                salario_minimo_coopserp = ?,
                auxilio_transporte = ?,
                activo = ?
            WHERE id_anio_legal = ?
        `;

        const values = [
            data.anio,
            data.salario_minimo_legal,
            data.salario_minimo_coopserp,
            data.auxilio_transporte,
            data.activo,
            id
        ];

        const [result] = await pool.query(query, values);
        return result;
    },

    // Activar/Desactivar año
    setActivo: async (id, activo) => {
        // Si vamos a activar un año, desactivamos todos los demás
        const connection = await pool.getConnection();
        try {
            await connection.beginTransaction();

            if (activo) {
                await connection.query(
                    'UPDATE anios_legales SET activo = false WHERE id_anio_legal != ?',
                    [id]
                );
            }

            const [result] = await connection.query(
                'UPDATE anios_legales SET activo = ? WHERE id_anio_legal = ?',
                [activo, id]
            );

            await connection.commit();
            return result;

        } catch (error) {
            await connection.rollback();
            throw error;
        } finally {
            connection.release();
        }
    },

    // Verificar si existe año
    exists: async (anio) => {
        const [rows] = await pool.query(
            'SELECT COUNT(*) as count FROM anios_legales WHERE anio = ?',
            [anio]
        );
        return rows[0].count > 0;
    }
};

module.exports = AnioLegalModel;