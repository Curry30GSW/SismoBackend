const pool = require('../config/ConectDb');

const CategoriaDirectorModel = {

    create: async (data) => {
        const connection = await pool.getConnection();
        try {
            const query = `
                INSERT INTO directores_categorias (
                    categoria,
                    rango_min,
                    rango_max,
                    salario_basico,
                    bonificacion
                ) VALUES (?, ?, ?, ?, ?)
            `;

            const values = [
                data.categoria,
                data.rango_min,
                data.rango_max,
                data.salario_basico,
                data.bonificacion
            ];

            const [result] = await connection.query(query, values);
            return result;

        } finally {
            connection.release();
        }
    },

    getAll: async () => {
        let query = 'SELECT * FROM directores_categorias';
        let params = [];

        query += ' ORDER BY rango_min Desc';

        const [rows] = await pool.query(query, params);
        return rows;
    },

    getById: async (id) => {
        const [rows] = await pool.query(
            'SELECT * FROM directores_categorias WHERE id_categoria = ?',
            [id]
        );
        return rows[0];
    },

    findByCategoria: async (categoria) => {
        const [rows] = await pool.query(
            'SELECT * FROM directores_categorias WHERE categoria = ?',
            [categoria]
        );
        return rows[0];
    },

    // Método para encontrar categoría por rango
    findByRango: async (valor) => {
        const [rows] = await pool.query(
            'SELECT * FROM directores_categorias WHERE ? BETWEEN rango_min AND rango_max',
            [valor]
        );
        return rows[0];
    },

    update: async (id, data) => {
        const query = `
            UPDATE directores_categorias SET
                categoria = ?,
                rango_min = ?,
                rango_max = ?,
                salario_basico = ?,
                bonificacion = ?,
                activo = ?
            WHERE id_categoria = ?
        `;

        const values = [
            data.categoria,
            data.rango_min,
            data.rango_max,
            data.salario_basico,
            data.bonificacion,
            data.activo !== undefined ? data.activo : 1,
            id
        ];

        const [result] = await pool.query(query, values);
        return result;
    },

    delete: async (id) => {
        const [result] = await pool.query(
            'DELETE FROM directores_categorias WHERE id_categoria = ?',
            [id]
        );
        return result;
    },

    // Método para desactivar (soft delete)
    deactivate: async (id) => {
        const [result] = await pool.query(
            'UPDATE directores_categorias SET activo = 0 WHERE id_categoria = ?',
            [id]
        );
        return result;
    },

    // Método para activar
    activate: async (id) => {
        const [result] = await pool.query(
            'UPDATE directores_categorias SET activo = 1 WHERE id_categoria = ?',
            [id]
        );
        return result;
    },

    // Método para verificar rangos no solapados
    checkRangoOverlap: async (rangoMin, rangoMax, excludeId = null) => {
        let query = `
            SELECT * FROM directores_categorias 
            WHERE (
                (? BETWEEN rango_min AND rango_max) OR
                (? BETWEEN rango_min AND rango_max) OR
                (rango_min BETWEEN ? AND ?) OR
                (rango_max BETWEEN ? AND ?)
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

    // Obtener todas las categorías con estadísticas
    getWithStats: async () => {
        const [rows] = await pool.query(`
            SELECT 
                dc.*,
                COUNT(c.id_cargo) as total_directores,
                SUM(CASE WHEN c.activo = 1 THEN 1 ELSE 0 END) as directores_activos
            FROM directores_categorias dc
            LEFT JOIN cargos c ON dc.id_categoria = c.id_categoria AND c.director_agencia = 1
            WHERE dc.activo = 1
            GROUP BY dc.id_categoria
            ORDER BY dc.rango_min ASC
        `);
        return rows;
    }

};

module.exports = CategoriaDirectorModel;