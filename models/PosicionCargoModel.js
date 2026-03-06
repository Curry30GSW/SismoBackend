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

    // Asignar funcionario a una posición
    asignarFuncionario: async (idPosicion, idFuncionario, esEncargado) => {
        const connection = await pool.getConnection();
        try {
            await connection.beginTransaction();

            // Verificar que la posición existe y está disponible
            const [posicion] = await connection.query(
                'SELECT * FROM posiciones_cargo WHERE id_posicion = ? AND activo = true',
                [idPosicion]
            );

            if (!posicion[0]) {
                throw new Error('Posición no encontrada o inactiva');
            }

            const idAnioLegal = posicion[0].id_anio_legal;

            // Verificar que la posición no tenga ya un funcionario
            if (posicion[0].id_funcionario) {
                throw new Error('La posición ya tiene un funcionario asignado');
            }

            // Verificar que el funcionario existe
            const [funcionario] = await connection.query(
                'SELECT * FROM funcionarios WHERE id_funcionario = ? AND activo = true',
                [idFuncionario]
            );

            if (!funcionario[0]) {
                throw new Error('Funcionario no encontrado o inactivo');
            }

            const [posicionActual] = await connection.query(
                `SELECT pc.*, cb.nombre_cargo 
             FROM posiciones_cargo pc
             INNER JOIN cargos_base cb ON pc.id_cargo_base = cb.id_cargo_base
             WHERE pc.id_funcionario = ? AND pc.activo = true AND pc.id_anio_legal = ?`,
                [idFuncionario, idAnioLegal]
            );

            if (posicionActual.length > 0 && !esEncargado) {
                throw new Error(
                    `El funcionario ya está asignado a la posición: ${posicionActual[0].nombre_cargo}-(${posicionActual[0].sede_ubicacion}) en el año ${idAnioLegal}. ` +
                    `Debe marcarlo como "Encargado" para asignarlo a múltiples posiciones.`
                );
            }


            // Asignar funcionario a la posición
            await connection.query(
                'UPDATE posiciones_cargo SET id_funcionario = ?, encargado = ? WHERE id_posicion = ?',
                [idFuncionario, esEncargado ? 1 : 0, idPosicion]
            );

            await connection.commit();
            return {
                success: true,
                id_posicion: idPosicion,
                id_funcionario: idFuncionario,
                esEncargado,
                posicion: posicion[0],
                funcionario: funcionario[0],
                tieneOtraPosicion: posicionActual.length > 0,
                otraPosicion: posicionActual[0] || null
            };

        } catch (error) {
            await connection.rollback();
            throw error;
        } finally {
            connection.release();
        }
    },

    // Desasignar funcionario de una posición
    desasignarFuncionario: async (idPosicion) => {
        const connection = await pool.getConnection();
        try {
            await connection.beginTransaction();

            // Verificar que la posición existe
            const [posicion] = await connection.query(
                'SELECT * FROM posiciones_cargo WHERE id_posicion = ? AND activo = true',
                [idPosicion]
            );

            if (!posicion[0]) {
                throw new Error('Posición no encontrada o inactiva');
            }

            // Guardar el id del funcionario antes de desasignar
            const idFuncionario = posicion[0].id_funcionario;
            const eraEncargado = posicion[0].encargado === 1;

            if (!idFuncionario) {
                throw new Error('La posición no tiene funcionario asignado');
            }

            // 🔥 Desasignar funcionario Y resetear encargado a 0
            await connection.query(
                'UPDATE posiciones_cargo SET id_funcionario = NULL, encargado = 0 WHERE id_posicion = ?',
                [idPosicion]
            );

            await connection.commit();

            return {
                success: true,
                id_posicion: idPosicion,
                id_funcionario: idFuncionario,
                eraEncargado // Información adicional útil
            };

        } catch (error) {
            await connection.rollback();
            throw error;
        } finally {
            connection.release();
        }
    },

    // Obtener todas las posiciones activas de un año
    getAllByAnio: async (idAnioLegal, filtros = {}) => {
        let query = `
    SELECT 
        pc.id_posicion,
        pc.id_cargo_base,
        pc.id_anio_legal,
        pc.codigo_posicion,
        pc.id_departamento,
        pc.sede_ubicacion,
        pc.fecha_creacion_posicion,
        pc.fecha_eliminacion_posicion,
        pc.activo as posicion_activa,
        pc.observaciones,
        pc.id_funcionario,
        pc.encargado,
        
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
        f.id_funcionario,
        f.nombres,
        f.apellidos,
        f.numero_documento,
        f.tipo_documento,
        f.sexo,
        f.edad
    FROM posiciones_cargo pc
    INNER JOIN cargos_base cb ON pc.id_cargo_base = cb.id_cargo_base
    INNER JOIN departamentos d ON pc.id_departamento = d.id_departamento
    INNER JOIN anios_legales al ON pc.id_anio_legal = al.id_anio_legal
    LEFT JOIN historico_salarios_cargo hsc 
        ON cb.id_cargo_base = hsc.id_cargo_base 
        AND hsc.id_anio_legal = ? 
        AND hsc.activo = true
    LEFT JOIN funcionarios f ON pc.id_funcionario = f.id_funcionario AND f.activo = true
    WHERE pc.id_anio_legal = ? 
      AND pc.activo = true
      AND d.activo = true  -- 🔥 SOLO DEPARTAMENTOS ACTIVOS
`;
        let params = [idAnioLegal, idAnioLegal];

        if (filtros.id_cargo_base) {
            query += ' AND pc.id_cargo_base = ?';
            params.push(filtros.id_cargo_base);
        }

        if (filtros.id_departamento) {
            query += ' AND pc.id_departamento = ?';
            params.push(filtros.id_departamento);
        }

        if (filtros.estado === 'ocupado') {
            query += ' AND pc.id_funcionario IS NOT NULL';
        } else if (filtros.estado === 'disponible') {
            query += ' AND pc.id_funcionario IS NULL';
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
            COUNT(pc.id_funcionario) as posiciones_ocupadas,
            COUNT(pc.id_posicion) - COUNT(pc.id_funcionario) as disponibilidad
        FROM cargos_base cb
        LEFT JOIN posiciones_cargo pc 
            ON cb.id_cargo_base = pc.id_cargo_base 
            AND pc.id_anio_legal = ? 
            AND pc.activo = true
        WHERE cb.activo = true
        GROUP BY cb.id_cargo_base
        ORDER BY disponibilidad DESC
    `, [idAnioLegal]);
        return rows;
    },

    getByDocumento: async (tipo, numero) => {
        const [rows] = await pool.query(
            'SELECT * FROM funcionarios WHERE tipo_documento = ? AND numero_documento = ? AND activo = true',
            [tipo, numero]
        );
        return rows[0];
    },


    getByDocumento: async (tipo, numero) => {
        const [rows] = await pool.query(
            'SELECT * FROM funcionarios WHERE tipo_documento = ? AND numero_documento = ? AND activo = true',
            [tipo, numero]
        );
        return rows[0];
    },

    // Copiar posiciones de un año a otro
    copyFromYear: async (idAnioOrigen, idAnioDestino, fechaCreacion) => {
        const connection = await pool.getConnection();
        try {
            await connection.beginTransaction();

            // 🔥 Obtener posiciones del año origen (con el funcionario asociado)
            const [rows] = await connection.query(`
            SELECT 
                pc.*,
                f.id_funcionario as funcionario_id
            FROM posiciones_cargo pc
            LEFT JOIN funcionarios f ON pc.id_funcionario = f.id_funcionario AND f.activo = true
            WHERE pc.id_anio_legal = ? AND pc.activo = true
        `, [idAnioOrigen]);

            let posicionesCopiadas = 0;

            for (const posicion of rows) {
                // Generar nuevo código con el año destino
                const nuevoCodigo = posicion.codigo_posicion.replace(/\d{4}$/, fechaCreacion.getFullYear().toString());

                // Insertar la nueva posición, REUTILIZANDO el id_funcionario si existía
                await connection.query(`
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
                    observaciones,
                    id_funcionario
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
                    `Copiado desde año ${posicion.id_anio_legal}`,
                    posicion.funcionario_id
                ]);

                posicionesCopiadas++;
            }

            await connection.commit();


            return {
                posiciones: posicionesCopiadas
            };

        } catch (error) {
            await connection.rollback();
            throw error;
        } finally {
            connection.release();
        }
    },

    // Trasladar cargo a otro departamento
    trasladarCargo: async (idPosicion, idNuevoDepartamento) => {
        const connection = await pool.getConnection();
        try {
            await connection.beginTransaction();

            // Verificar que la posición existe
            const [posicion] = await connection.query(
                'SELECT * FROM posiciones_cargo WHERE id_posicion = ? AND activo = true',
                [idPosicion]
            );

            if (!posicion[0]) {
                throw new Error('Posición no encontrada o inactiva');
            }

            // Verificar que el nuevo departamento existe
            const [departamento] = await connection.query(
                'SELECT * FROM departamentos WHERE id_departamento = ? AND activo = true',
                [idNuevoDepartamento]
            );

            if (!departamento[0]) {
                throw new Error('Departamento destino no encontrado o inactivo');
            }

            // Actualizar la posición con el nuevo departamento y sede_ubicacion
            await connection.query(
                'UPDATE posiciones_cargo SET id_departamento = ?, sede_ubicacion = ? WHERE id_posicion = ?',
                [idNuevoDepartamento, departamento[0].nombre_departamento, idPosicion]
            );

            await connection.commit();

            return {
                success: true,
                id_posicion: idPosicion,
                id_departamento_anterior: posicion[0].id_departamento,
                id_departamento_nuevo: idNuevoDepartamento,
                sede_anterior: posicion[0].sede_ubicacion,
                sede_nueva: departamento[0].nombre_departamento
            };

        } catch (error) {
            await connection.rollback();
            throw error;
        } finally {
            connection.release();
        }
    },

    // Trasladar funcionario a otra posición
    trasladarFuncionario: async (idPosicionOrigen, idPosicionDestino) => {
        const connection = await pool.getConnection();
        try {
            await connection.beginTransaction();

            // 1. Verificar que la posición origen existe y tiene funcionario
            const [posicionOrigen] = await connection.query(
                'SELECT * FROM posiciones_cargo WHERE id_posicion = ? AND activo = true',
                [idPosicionOrigen]
            );

            if (!posicionOrigen[0]) {
                throw new Error('Posición origen no encontrada o inactiva');
            }

            if (!posicionOrigen[0].id_funcionario) {
                throw new Error('La posición origen no tiene funcionario asignado');
            }

            // 2. Verificar que la posición destino existe y está disponible
            const [posicionDestino] = await connection.query(
                'SELECT * FROM posiciones_cargo WHERE id_posicion = ? AND activo = true',
                [idPosicionDestino]
            );

            if (!posicionDestino[0]) {
                throw new Error('Posición destino no encontrada o inactiva');
            }

            // 3. Verificar que la posición destino NO tenga funcionario
            if (posicionDestino[0].id_funcionario) {
                throw new Error('La posición destino ya tiene un funcionario asignado');
            }

            // 4. Verificar que ambas posiciones sean del mismo año legal
            if (posicionOrigen[0].id_anio_legal !== posicionDestino[0].id_anio_legal) {
                throw new Error('No se puede trasladar entre diferentes años legales');
            }

            const idFuncionario = posicionOrigen[0].id_funcionario;
            const idAnioLegal = posicionOrigen[0].id_anio_legal;

            // 5. Verificar si el funcionario es encargado (puede tener múltiples posiciones)
            const esEncargado = posicionOrigen[0].encargado === 1;

            // 🔥 CORREGIDO: Verificar que no tenga otras posiciones en el MISMO AÑO LEGAL
            if (!esEncargado) {
                const [otrasPosiciones] = await connection.query(
                    `SELECT COUNT(*) as total 
                 FROM posiciones_cargo 
                 WHERE id_funcionario = ? 
                   AND id_posicion != ? 
                   AND activo = true
                   AND id_anio_legal = ?`, // ← FILTRO POR EL MISMO AÑO
                    [idFuncionario, idPosicionOrigen, idAnioLegal]
                );

                if (otrasPosiciones[0].total > 0) {
                    throw new Error(`El funcionario no es encargado y ya tiene otras posiciones activas en el año ${idAnioLegal}`);
                }
            }

            // 6. REALIZAR EL TRASLADO:
            await connection.query(
                'UPDATE posiciones_cargo SET id_funcionario = NULL, encargado = 0 WHERE id_posicion = ?',
                [idPosicionOrigen]
            );

            await connection.query(
                'UPDATE posiciones_cargo SET id_funcionario = ?, encargado = ? WHERE id_posicion = ?',
                [idFuncionario, esEncargado ? 1 : 0, idPosicionDestino]
            );

            await connection.commit();

            return {
                success: true,
                id_funcionario: idFuncionario,
                id_posicion_origen: idPosicionOrigen,
                id_posicion_destino: idPosicionDestino,
                es_encargado: esEncargado,
                codigo_origen: posicionOrigen[0].codigo_posicion,
                codigo_destino: posicionDestino[0].codigo_posicion
            };

        } catch (error) {
            await connection.rollback();
            throw error;
        } finally {
            connection.release();
        }
    },
};

module.exports = PosicionCargoModel;