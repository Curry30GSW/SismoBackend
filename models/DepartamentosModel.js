const pool = require('../config/ConectDb');

const DepartamentoModel = {
    create: async (data) => {
        const connection = await pool.getConnection();
        try {
            const query = `
                INSERT INTO departamentos (
                    codigo_ext,
                    nombre_departamento,
                    activo
                ) VALUES (?, ?, ?)
            `;

            const values = [
                data.ext,
                data.departamento,
                data.activo !== undefined ? data.activo : true
            ];

            const [result] = await connection.query(query, values);
            return { id_departamento: result.insertId, ...data };

        } finally {
            connection.release();
        }
    },

    findAll: async () => {
        const [rows] = await pool.query(`
            SELECT id_departamento, codigo_ext, nombre_departamento, activo
            FROM departamentos
            ORDER BY nombre_departamento ASC
        `,);
        return rows;
    },

    findById: async (id) => {
        const [rows] = await pool.query(
            'SELECT * FROM departamentos WHERE id_departamento = ?',
            [id]
        );
        return rows[0];
    },

    findByExt: async (ext) => {
        const [rows] = await pool.query(
            'SELECT * FROM departamentos WHERE codigo_ext = ?',
            [ext]
        );
        return rows[0];
    },

    update: async (id, data) => {
        const query = `
            UPDATE departamentos SET
                codigo_ext = ?,
                nombre_departamento = ?,
                activo = ?
            WHERE id_departamento = ?
        `;

        const values = [
            data.codigo_ext,
            data.nombre_departamento,
            data.activo,
            id
        ];

        const [result] = await pool.query(query, values);
        return result;
    },

    delete: async (id) => {
        // Soft delete
        const [result] = await pool.query(
            'UPDATE departamentos SET activo = false WHERE id_departamento = ?',
            [id]
        );
        return result;
    },

    // Obtener departamentos con estadísticas de posiciones
    getWithStats: async (idAnioLegal) => {
        const [rows] = await pool.query(`
            SELECT 
                d.*,
                COUNT(DISTINCT pc.id_posicion) as total_posiciones,
                COUNT(DISTINCT f.id_funcionario) as funcionarios_asignados,
                COUNT(DISTINCT pc.id_posicion) - COUNT(DISTINCT f.id_funcionario) as posiciones_disponibles
            FROM departamentos d
            LEFT JOIN posiciones_cargo pc ON d.id_departamento = pc.id_departamento 
                AND pc.id_anio_legal = ? 
                AND pc.activo = true
            LEFT JOIN funcionarios f ON pc.id_posicion = f.id_posicion AND f.activo = true
            WHERE d.activo = true
            GROUP BY d.id_departamento
            ORDER BY d.nombre_departamento ASC
        `, [idAnioLegal]);
        return rows;
    }
};

module.exports = DepartamentoModel;