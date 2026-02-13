const pool = require('../config/ConectDb');

const PosicionCargoModel = {
    // Crear nueva posición
    create: async (data) => {
        const connection = await pool.getConnection();
        try {
            const query = `
                INSERT INTO posiciones_cargo (
                    id_cargo_base,
                    id_anio_legal,
                    codigo_posicion,
                    id_departamento,
                    sede_ubicacion,
                    salario_base,
                    aplica_auxilio_transporte,
                    bonificacion,
                    fecha_creacion_posicion,
                    activo,
                    observaciones
                ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
            `;

            const values = [
                data.id_cargo_base,
                data.id_anio_legal,
                data.codigo_posicion,
                data.id_departamento,
                data.sede_ubicacion || null,
                data.salario_base,
                data.aplica_auxilio_transporte !== undefined ? data.aplica_auxilio_transporte : true,
                data.bonificacion || 0,
                data.fecha_creacion_posicion || new Date(),
                data.activo !== undefined ? data.activo : true,
                data.observaciones || null
            ];

            const [result] = await connection.query(query, values);
            return { id_posicion: result.insertId, ...data };

        } finally {
            connection.release();
        }
    },

    // Obtener todas las posiciones activas de un año
    getAllByAnio: async (idAnioLegal, filtros = {}) => {
        let query = `
            SELECT 
                pc.*,
                cb.nombre_cargo,
                cb.codigo_cargo,
                cb.es_director_agencia,
                d.nombre_departamento,
                d.codigo_ext,
                al.anio,
                al.salario_minimo_legal,
                al.auxilio_transporte,
                f.id_funcionario,
                f.nombres,
                f.apellidos,
                f.numero_documento
            FROM posiciones_cargo pc
            INNER JOIN cargos_base cb ON pc.id_cargo_base = cb.id_cargo_base
            INNER JOIN departamentos d ON pc.id_departamento = d.id_departamento
            INNER JOIN anios_legales al ON pc.id_anio_legal = al.id_anio_legal
            LEFT JOIN funcionarios f ON pc.id_posicion = f.id_posicion AND f.activo = true
            WHERE pc.id_anio_legal = ? AND pc.activo = true
        `;
        let params = [idAnioLegal];

        if (filtros.id_cargo_base) {
            query += ' AND pc.id_cargo_base = ?';
            params.push(filtros.id_cargo_base);
        }

        if (filtros.id_departamento) {
            query += ' AND pc.id_departamento = ?';
            params.push(filtros.id_departamento);
        }

        if (filtros.estado === 'ocupado') {
            query += ' AND f.id_funcionario IS NOT NULL';
        } else if (filtros.estado === 'disponible') {
            query += ' AND f.id_funcionario IS NULL';
        }

        query += ' ORDER BY d.nombre_departamento, cb.nombre_cargo';

        const [rows] = await pool.query(query, params);
        return rows;
    },

    // Obtener posición por ID
    getById: async (id) => {
        const [rows] = await pool.query(`
            SELECT 
                pc.*,
                cb.nombre_cargo,
                cb.codigo_cargo,
                d.nombre_departamento,
                al.anio,
                al.salario_minimo_legal,
                al.auxilio_transporte
            FROM posiciones_cargo pc
            INNER JOIN cargos_base cb ON pc.id_cargo_base = cb.id_cargo_base
            INNER JOIN departamentos d ON pc.id_departamento = d.id_departamento
            INNER JOIN anios_legales al ON pc.id_anio_legal = al.id_anio_legal
            WHERE pc.id_posicion = ?
        `, [id]);
        return rows[0];
    },

    // Obtener por código de posición
    getByCodigo: async (codigo) => {
        const [rows] = await pool.query(
            'SELECT * FROM posiciones_cargo WHERE codigo_posicion = ?',
            [codigo]
        );
        return rows[0];
    },

    // Actualizar posición
    update: async (id, data) => {
        const query = `
            UPDATE posiciones_cargo SET
                id_departamento = ?,
                sede_ubicacion = ?,
                salario_base = ?,
                aplica_auxilio_transporte = ?,
                bonificacion = ?,
                observaciones = ?,
                activo = ?
            WHERE id_posicion = ?
        `;

        const values = [
            data.id_departamento,
            data.sede_ubicacion,
            data.salario_base,
            data.aplica_auxilio_transporte,
            data.bonificacion,
            data.observaciones,
            data.activo,
            id
        ];

        const [result] = await pool.query(query, values);
        return result;
    },

    // Eliminar posición (soft delete)
    delete: async (id, fechaEliminacion, motivo) => {
        const connection = await pool.getConnection();
        try {
            await connection.beginTransaction();

            const [result] = await connection.query(`
                UPDATE posiciones_cargo 
                SET activo = false, 
                    fecha_eliminacion_posicion = ? 
                WHERE id_posicion = ?
            `, [fechaEliminacion, id]);

            await connection.commit();
            return result;

        } catch (error) {
            await connection.rollback();
            throw error;
        } finally {
            connection.release();
        }
    },

    // Obtener disponibilidad de cargos
    getDisponibilidad: async (idAnioLegal) => {
        const [rows] = await pool.query(`
            SELECT 
                cb.id_cargo_base,
                cb.nombre_cargo,
                COUNT(pc.id_posicion) as total_posiciones,
                COUNT(f.id_funcionario) as posiciones_ocupadas,
                COUNT(pc.id_posicion) - COUNT(f.id_funcionario) as disponibilidad
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
            ORDER BY disponibilidad DESC
        `, [idAnioLegal]);
        return rows;
    },

    // Copiar posiciones de un año a otro
    copyFromYear: async (idAnioOrigen, idAnioDestino, fechaCreacion) => {
        const connection = await pool.getConnection();
        try {
            await connection.beginTransaction();

            const [rows] = await connection.query(`
                SELECT pc.* 
                FROM posiciones_cargo pc
                WHERE pc.id_anio_legal = ? AND pc.activo = true
            `, [idAnioOrigen]);

            for (const posicion of rows) {
                const nuevoCodigo = posicion.codigo_posicion.replace(/\d{4}$/, fechaCreacion.getFullYear().toString());

                await connection.query(`
                    INSERT INTO posiciones_cargo (
                        id_cargo_base, id_anio_legal, codigo_posicion, id_departamento,
                        sede_ubicacion, salario_base, aplica_auxilio_transporte, 
                        bonificacion, fecha_creacion_posicion, activo, observaciones
                    ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
                `, [
                    posicion.id_cargo_base,
                    idAnioDestino,
                    nuevoCodigo,
                    posicion.id_departamento,
                    posicion.sede_ubicacion,
                    posicion.salario_base,
                    posicion.aplica_auxilio_transporte,
                    posicion.bonificacion,
                    fechaCreacion,
                    true,
                    `Copiado desde año ${posicion.id_anio_legal}`
                ]);
            }

            await connection.commit();
            return rows.length;

        } catch (error) {
            await connection.rollback();
            throw error;
        } finally {
            connection.release();
        }
    }
};

module.exports = PosicionCargoModel;