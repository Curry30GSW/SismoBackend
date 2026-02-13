const pool = require('../config/ConectDb');

const CategoriaDirectorModel = {
    create: async (data) => {
        const connection = await pool.getConnection();
        try {
            const query = `
                INSERT INTO categorias_director (
                    codigo_categoria,
                    nombre_categoria,
                    rango_min_clientes,
                    rango_max_clientes,
                    activo
                ) VALUES (?, ?, ?, ?, ?)
            `;

            const values = [
                data.codigo_categoria,
                data.nombre_categoria || data.codigo_categoria,
                data.rango_min_clientes,
                data.rango_max_clientes,
                data.activo !== undefined ? data.activo : true
            ];

            const [result] = await connection.query(query, values);
            return { id_categoria: result.insertId, ...data };

        } finally {
            connection.release();
        }
    },

    getAll: async (activo) => {
        let query = `
        SELECT * FROM categorias_director`;
        const params = [];
        if (activo !== undefined) {
            query += ` WHERE activo = ?`;
            params.push(activo);
        }

        query += ` ORDER BY rango_min_clientes ASC`;

        const [rows] = await pool.query(query, params);
        return rows;
    },

    getById: async (id) => {
        const [rows] = await pool.query(
            'SELECT * FROM categorias_director WHERE id_categoria = ?',
            [id]
        );
        return rows[0];
    },

    findByCodigo: async (codigo) => {
        const [rows] = await pool.query(
            'SELECT * FROM categorias_director WHERE codigo_categoria = ?',
            [codigo]
        );
        return rows[0];
    },

    findByRangoClientes: async (numClientes) => {
        const [rows] = await pool.query(
            'SELECT * FROM categorias_director WHERE ? BETWEEN rango_min_clientes AND rango_max_clientes AND activo = true',
            [numClientes]
        );
        return rows[0];
    },

    update: async (id, data) => {
        const query = `
            UPDATE categorias_director SET
                codigo_categoria = ?,
                nombre_categoria = ?,
                rango_min_clientes = ?,
                rango_max_clientes = ?,
                activo = ?
            WHERE id_categoria = ?
        `;

        const values = [
            data.codigo_categoria,
            data.nombre_categoria,
            data.rango_min_clientes,
            data.rango_max_clientes,
            data.activo,
            id
        ];

        const [result] = await pool.query(query, values);
        return result;
    },

    delete: async (id) => {
        // Soft delete
        const [result] = await pool.query(
            'UPDATE categorias_director SET activo = false WHERE id_categoria = ?',
            [id]
        );
        return result;
    },

    checkRangoOverlap: async (rangoMin, rangoMax, excludeId = null) => {
        let query = `
            SELECT * FROM categorias_director 
            WHERE activo = true AND (
                (? BETWEEN rango_min_clientes AND rango_max_clientes) OR
                (? BETWEEN rango_min_clientes AND rango_max_clientes) OR
                (rango_min_clientes BETWEEN ? AND ?) OR
                (rango_max_clientes BETWEEN ? AND ?)
            )
        `;

        const params = [rangoMin, rangoMax, rangoMin, rangoMax, rangoMin, rangoMax];

        if (excludeId) {
            query += ' AND id_categoria != ?';
            params.push(excludeId);
        }

        const [rows] = await pool.query(query, params);
        return rows.length > 0;
    },

    getWithStats: async (idAnioLegal) => {
        const [rows] = await pool.query(`
            SELECT 
                cd.*,
                COUNT(DISTINCT pc.id_posicion) as total_posiciones_director,
                SUM(CASE WHEN f.id_funcionario IS NOT NULL AND f.activo = true THEN 1 ELSE 0 END) as directores_asignados
            FROM categorias_director cd
            LEFT JOIN cargos_base cb ON cd.id_categoria = cb.id_categoria_director AND cb.es_director_agencia = true
            LEFT JOIN posiciones_cargo pc ON cb.id_cargo_base = pc.id_cargo_base 
                AND pc.id_anio_legal = ? 
                AND pc.activo = true
            LEFT JOIN funcionarios f ON pc.id_posicion = f.id_posicion AND f.activo = true
            WHERE cd.activo = true
            GROUP BY cd.id_categoria
            ORDER BY cd.rango_min_clientes ASC
        `, [idAnioLegal]);
        return rows;
    }
};

module.exports = CategoriaDirectorModel;