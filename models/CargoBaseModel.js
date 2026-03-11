const pool = require('../config/ConectDb');

const CargoBaseModel = {
    // Crear nuevo cargo base
    create: async (data) => {
        const connection = await pool.getConnection();
        try {
            const query = `
                INSERT INTO cargos_base (
                    codigo_cargo,
                    nombre_cargo,
                    requiere_bonificacion,
                    es_director_agencia,
                    id_categoria_director,
                    id_tipo_planta,
                    activo
                ) VALUES (?, ?, ?, ?, ?, ?, ?)
            `;

            const values = [
                data.codigo_cargo,
                data.nombre_cargo,
                data.requiere_bonificacion || false,
                data.es_director_agencia || false,
                data.id_categoria_director || null,
                data.id_tipo_planta || null,
                data.activo !== undefined ? data.activo : true
            ];

            const [result] = await connection.query(query, values);
            return { id_cargo_base: result.insertId, ...data };

        } finally {
            connection.release();
        }
    },


    // Obtener todos los cargos base
    getAll: async (filtros = {}) => {
        let query = `
            SELECT 
                cb.*,
                tp.id_tipo_planta as tipo_planta_id,
                tp.codigo_tipo,
                tp.nombre_tipo,
                tp.color_representacion
            FROM cargos_base cb
            LEFT JOIN tipos_planta tp ON cb.id_tipo_planta = tp.id_tipo_planta
            WHERE 1=1
        `;
        let params = [];

        if (filtros.activo !== undefined) {
            query += ' AND cb.activo = ?';
            params.push(filtros.activo);
        }

        if (filtros.es_director_agencia !== undefined) {
            query += ' AND cb.es_director_agencia = ?';
            params.push(filtros.es_director_agencia);
        }

        // 🔥 NUEVO FILTRO POR TIPO DE PLANTA
        if (filtros.id_tipo_planta) {
            query += ' AND cb.id_tipo_planta = ?';
            params.push(filtros.id_tipo_planta);
        }

        query += ' ORDER BY cb.nombre_cargo ASC';

        const [rows] = await pool.query(query, params);
        return rows;
    },


    // Obtener cargo base por ID
    getById: async (id) => {
        const [rows] = await pool.query(`
            SELECT 
                cb.*,
                tp.id_tipo_planta as tipo_planta_id,
                tp.codigo_tipo,
                tp.nombre_tipo,
                tp.color_representacion
            FROM cargos_base cb
            LEFT JOIN tipos_planta tp ON cb.id_tipo_planta = tp.id_tipo_planta
            WHERE cb.id_cargo_base = ?
        `, [id]);
        return rows[0];
    },

    // Obtener por código
    getByCodigo: async (codigo) => {
        const [rows] = await pool.query(
            'SELECT * FROM cargos_base WHERE codigo_cargo = ?',
            [codigo]
        );
        return rows[0];
    },

    // Actualizar cargo base
    update: async (id, data) => {
        const query = `
            UPDATE cargos_base SET
                codigo_cargo = ?,
                nombre_cargo = ?,
                requiere_bonificacion = ?,
                es_director_agencia = ?,
                id_categoria_director = ?,
                id_tipo_planta = ?,
                activo = ?
            WHERE id_cargo_base = ?
        `;

        const values = [
            data.codigo_cargo,
            data.nombre_cargo,
            data.requiere_bonificacion,
            data.es_director_agencia,
            data.id_categoria_director,
            data.id_tipo_planta,
            data.activo,
            id
        ];

        const [result] = await pool.query(query, values);
        return result;
    },


    // Eliminar (soft delete)
    delete: async (id) => {
        const [result] = await pool.query(
            'UPDATE cargos_base SET activo = false WHERE id_cargo_base = ?',
            [id]
        );
        return result;
    },

    // Obtener cargos con información de salarios históricos
    getWithSalarioHistorico: async (idAnioLegal) => {
        const [rows] = await pool.query(`
            SELECT 
                cb.*,
                hsc.salario_base,
                hsc.bonificacion as bonificacion_anual,
                hsc.aplica_auxilio_transporte,
                al.salario_minimo_legal,
                al.auxilio_transporte
            FROM cargos_base cb
            LEFT JOIN historico_salarios_cargo hsc 
                ON cb.id_cargo_base = hsc.id_cargo_base 
                AND hsc.id_anio_legal = ?
                AND hsc.activo = true
            LEFT JOIN anios_legales al ON hsc.id_anio_legal = al.id_anio_legal
            WHERE cb.activo = true
            ORDER BY cb.nombre_cargo ASC
        `, [idAnioLegal]);
        return rows;
    },

    // Obtener cargos con disponibilidad
    getWithDisponibilidad: async (idAnioLegal) => {
        const [rows] = await pool.query(`
            SELECT 
                cb.*,
                COUNT(DISTINCT pc.id_posicion) as total_posiciones,
                COUNT(DISTINCT f.id_funcionario) as posiciones_ocupadas,
                COUNT(DISTINCT pc.id_posicion) - COUNT(DISTINCT f.id_funcionario) as disponibilidad
            FROM cargos_base cb
            LEFT JOIN posiciones_cargo pc 
                ON cb.id_cargo_base = pc.id_cargo_base 
                AND pc.id_anio_legal = ?
                AND pc.activo = true
            LEFT JOIN funcionarios f 
                ON pc.id_posicion = f.id_posicion 
                AND f.activo = true
            WHERE cb.activo = true
            GROUP BY cb.id_cargo_base
            ORDER BY cb.nombre_cargo ASC
        `, [idAnioLegal]);
        return rows;
    }
};

module.exports = CargoBaseModel;