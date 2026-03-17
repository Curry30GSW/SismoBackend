const pool = require('../../config/ConectDb');

const PosicionSenaModel = {
    // =============================================
    // CREATE
    // =============================================
    create: async (data) => {
        const connection = await pool.getConnection();
        try {
            const query = `
                INSERT INTO posiciones_cargo_sena (
                    id_cargo_base,
                    id_anio_legal,
                    codigo_posicion,
                    id_departamento,
                    sede_ubicacion,
                    salario_base,
                    aplica_auxilio_transporte,
                    bonificacion,
                    fecha_creacion_posicion,
                    fecha_eliminacion,
                    contrato_hasta,
                    activo,
                    id_funcionario
                ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
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
                data.fecha_eliminacion || null,
                data.contrato_hasta || null, // Campo específico de SENA
                data.activo !== undefined ? data.activo : true,
                data.id_funcionario || null
            ];

            const [result] = await connection.query(query, values);
            return { id_posicion_sena: result.insertId, ...data };

        } finally {
            connection.release();
        }
    },

    // =============================================
    // READ
    // =============================================
    getAllByAnio: async (idAnioLegal, filtros = {}) => {
        let query = `
            SELECT 
                ps.id_posicion_sena as id_posicion,
                ps.id_cargo_base,
                ps.id_anio_legal,
                ps.codigo_posicion,
                ps.id_departamento,
                ps.sede_ubicacion,
                ps.fecha_creacion_posicion,
                ps.fecha_eliminacion,
                ps.contrato_hasta,
                ps.activo,
                ps.id_funcionario,
                
                -- Datos del cargo
                cb.nombre_cargo,
                cb.codigo_cargo,
                cb.es_director_agencia,
                
                -- Datos del departamento
                d.nombre_departamento,
                d.codigo_ext,
                
                -- Datos del año legal
                al.anio,
                al.salario_minimo_legal,
                al.auxilio_transporte,
                
                -- Datos del histórico de salarios
                hsc.salario_base,
                hsc.bonificacion,
                hsc.aplica_auxilio_transporte,
                
                -- Datos del funcionario (si existe)
                f.nombres,
                f.apellidos,
                f.numero_documento,
                f.tipo_documento,
                f.sexo,
                f.edad
            FROM posiciones_cargo_sena ps
            INNER JOIN cargos_base cb ON ps.id_cargo_base = cb.id_cargo_base
            INNER JOIN departamentos d ON ps.id_departamento = d.id_departamento
            INNER JOIN anios_legales al ON ps.id_anio_legal = al.id_anio_legal
            LEFT JOIN historico_salarios_cargo hsc 
                ON cb.id_cargo_base = hsc.id_cargo_base 
                AND hsc.id_anio_legal = ? 
                AND hsc.activo = true
            LEFT JOIN funcionarios f ON ps.id_funcionario = f.id_funcionario AND f.activo = true
            WHERE ps.id_anio_legal = ? 
              AND ps.activo = true
              AND d.activo = true
        `;
        let params = [idAnioLegal, idAnioLegal];

        if (filtros.id_cargo_base) {
            query += ' AND ps.id_cargo_base = ?';
            params.push(filtros.id_cargo_base);
        }

        if (filtros.id_departamento) {
            query += ' AND ps.id_departamento = ?';
            params.push(filtros.id_departamento);
        }

        if (filtros.estado === 'ocupado') {
            query += ' AND ps.id_funcionario IS NOT NULL';
        } else if (filtros.estado === 'disponible') {
            query += ' AND ps.id_funcionario IS NULL';
        }

        query += ' ORDER BY d.nombre_departamento, cb.nombre_cargo';

        const [rows] = await pool.query(query, params);
        return rows;
    },

    getById: async (id) => {
        const [rows] = await pool.query(`
            SELECT 
                ps.*,
                cb.nombre_cargo,
                cb.codigo_cargo,
                d.nombre_departamento,
                al.anio,
                al.salario_minimo_legal,
                al.auxilio_transporte
            FROM posiciones_cargo_sena ps
            INNER JOIN cargos_base cb ON ps.id_cargo_base = cb.id_cargo_base
            INNER JOIN departamentos d ON ps.id_departamento = d.id_departamento
            INNER JOIN anios_legales al ON ps.id_anio_legal = al.id_anio_legal
            WHERE ps.id_posicion_sena = ?
        `, [id]);
        return rows[0];
    },

    getByCodigo: async (codigo) => {
        const [rows] = await pool.query(
            'SELECT * FROM posiciones_cargo_sena WHERE codigo_posicion = ?',
            [codigo]
        );
        return rows[0];
    },

    getDisponibilidad: async (idAnioLegal) => {
        const [rows] = await pool.query(`
            SELECT 
                cb.id_cargo_base,
                cb.nombre_cargo,
                COUNT(ps.id_posicion_sena) as total_posiciones,
                COUNT(ps.id_funcionario) as posiciones_ocupadas,
                COUNT(ps.id_posicion_sena) - COUNT(ps.id_funcionario) as disponibilidad
            FROM cargos_base cb
            LEFT JOIN posiciones_cargo_sena ps 
                ON cb.id_cargo_base = ps.id_cargo_base 
                AND ps.id_anio_legal = ? 
                AND ps.activo = true
            WHERE cb.activo = true
            GROUP BY cb.id_cargo_base
            ORDER BY disponibilidad DESC
        `, [idAnioLegal]);
        return rows;
    },

    // Obtener aprendices próximos a terminar contrato
    getProximosAVencer: async (idAnioLegal, dias = 30) => {
        const [rows] = await pool.query(`
            SELECT 
                ps.*,
                cb.nombre_cargo,
                d.nombre_departamento,
                f.nombres,
                f.apellidos,
                f.numero_documento,
                DATEDIFF(ps.contrato_hasta, CURDATE()) as dias_restantes
            FROM posiciones_cargo_sena ps
            INNER JOIN cargos_base cb ON ps.id_cargo_base = cb.id_cargo_base
            INNER JOIN departamentos d ON ps.id_departamento = d.id_departamento
            INNER JOIN funcionarios f ON ps.id_funcionario = f.id_funcionario
            WHERE ps.id_anio_legal = ? 
              AND ps.activo = true
              AND ps.contrato_hasta IS NOT NULL
              AND ps.contrato_hasta BETWEEN CURDATE() AND DATE_ADD(CURDATE(), INTERVAL ? DAY)
            ORDER BY ps.contrato_hasta ASC
        `, [idAnioLegal, dias]);
        return rows;
    },

    // =============================================
    // UPDATE
    // =============================================
    update: async (id, data) => {
        const query = `
            UPDATE posiciones_cargo_sena SET
                id_departamento = ?,
                sede_ubicacion = ?,
                salario_base = ?,
                aplica_auxilio_transporte = ?,
                bonificacion = ?,
                contrato_hasta = ?,
                activo = ?
            WHERE id_posicion_sena = ?
        `;

        const values = [
            data.id_departamento,
            data.sede_ubicacion,
            data.salario_base,
            data.aplica_auxilio_transporte,
            data.bonificacion,
            data.contrato_hasta,
            data.activo,
            id
        ];

        const [result] = await pool.query(query, values);
        return result;
    },

    // =============================================
    // DELETE (SOFT DELETE)
    // =============================================
    delete: async (id, fechaEliminacion) => {
        const [result] = await pool.query(`
            UPDATE posiciones_cargo_sena 
            SET activo = false, 
                fecha_eliminacion = ? 
            WHERE id_posicion_sena = ?
        `, [fechaEliminacion, id]);
        return result;
    },

    // =============================================
    // ASIGNACIÓN DE FUNCIONARIOS (SENA)
    // =============================================
    asignarAprendiz: async (idPosicion, idFuncionario, contratoHasta) => {
        const connection = await pool.getConnection();
        try {
            await connection.beginTransaction();

            // Verificar que la posición existe
            const [posicion] = await connection.query(
                'SELECT * FROM posiciones_cargo_sena WHERE id_posicion_sena = ? AND activo = true',
                [idPosicion]
            );

            if (!posicion[0]) {
                throw new Error('Posición no encontrada o inactiva');
            }

            if (posicion[0].id_funcionario) {
                throw new Error('La posición ya tiene un aprendiz asignado');
            }

            // Verificar que el funcionario existe
            const [funcionario] = await connection.query(
                'SELECT * FROM funcionarios WHERE id_funcionario = ? AND activo = true',
                [idFuncionario]
            );

            if (!funcionario[0]) {
                throw new Error('Funcionario no encontrado o inactivo');
            }

            // Verificar si ya tiene otra posición SENA activa
            const [posicionActual] = await connection.query(
                `SELECT ps.*, cb.nombre_cargo 
                 FROM posiciones_cargo_sena ps
                 INNER JOIN cargos_base cb ON ps.id_cargo_base = cb.id_cargo_base
                 WHERE ps.id_funcionario = ? AND ps.activo = true`,
                [idFuncionario]
            );

            if (posicionActual.length > 0) {
                throw new Error(
                    `El aprendiz ya está asignado a la posición SENA: ${posicionActual[0].nombre_cargo}`
                );
            }

            // Asignar aprendiz con fecha de contrato
            await connection.query(
                'UPDATE posiciones_cargo_sena SET id_funcionario = ?, contrato_hasta = ? WHERE id_posicion_sena = ?',
                [idFuncionario, contratoHasta, idPosicion]
            );

            await connection.commit();
            return {
                success: true,
                id_posicion: idPosicion,
                id_funcionario: idFuncionario,
                contrato_hasta: contratoHasta
            };

        } catch (error) {
            await connection.rollback();
            throw error;
        } finally {
            connection.release();
        }
    },

    desasignarAprendiz: async (idPosicion) => {
        const connection = await pool.getConnection();
        try {
            await connection.beginTransaction();

            const [posicion] = await connection.query(
                'SELECT * FROM posiciones_cargo_sena WHERE id_posicion_sena = ? AND activo = true',
                [idPosicion]
            );

            if (!posicion[0]) {
                throw new Error('Posición no encontrada o inactiva');
            }

            const idFuncionario = posicion[0].id_funcionario;

            if (!idFuncionario) {
                throw new Error('La posición no tiene aprendiz asignado');
            }

            await connection.query(
                'UPDATE posiciones_cargo_sena SET id_funcionario = NULL, contrato_hasta = NULL WHERE id_posicion_sena = ?',
                [idPosicion]
            );

            await connection.commit();
            return {
                success: true,
                id_posicion: idPosicion,
                id_funcionario: idFuncionario
            };

        } catch (error) {
            await connection.rollback();
            throw error;
        } finally {
            connection.release();
        }
    },

    // =============================================
    // COPIA DE AÑO
    // =============================================
    copyFromYear: async (idAnioOrigen, idAnioDestino, fechaCreacion) => {
        const connection = await pool.getConnection();
        try {
            await connection.beginTransaction();

            const [rows] = await connection.query(`
                SELECT ps.*, f.id_funcionario as funcionario_id
                FROM posiciones_cargo_sena ps
                LEFT JOIN funcionarios f ON ps.id_funcionario = f.id_funcionario AND f.activo = true
                WHERE ps.id_anio_legal = ? AND ps.activo = true
            `, [idAnioOrigen]);

            let posicionesCopiadas = 0;

            for (const posicion of rows) {
                const nuevoCodigo = posicion.codigo_posicion.replace(/\d{4}$/, fechaCreacion.getFullYear().toString());

                await connection.query(`
                    INSERT INTO posiciones_cargo_sena (
                        id_cargo_base, id_anio_legal, codigo_posicion, id_departamento,
                        sede_ubicacion, salario_base, aplica_auxilio_transporte, 
                        bonificacion, fecha_creacion_posicion, activo, id_funcionario, contrato_hasta
                    ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
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
                    posicion.funcionario_id,
                    posicion.contrato_hasta
                ]);

                posicionesCopiadas++;
            }

            await connection.commit();
            return { posiciones: posicionesCopiadas };

        } catch (error) {
            await connection.rollback();
            throw error;
        } finally {
            connection.release();
        }
    }
};

module.exports = PosicionSenaModel;