const pool = require('../../config/ConectDb');

const PosicionFijoModel = {
    // =============================================
    // CREATE
    // =============================================
    create: async (data) => {
        const connection = await pool.getConnection();
        try {
            const query = `
                INSERT INTO posiciones_cargo_fijo (
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
                    id_funcionario,
                    encargado
                ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
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
                data.id_funcionario || null,
                data.encargado || 0
            ];

            const [result] = await connection.query(query, values);
            return { id_posicion_fijo: result.insertId, ...data };

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
                pf.id_posicones_fijo as id_posicion,
                pf.id_cargo_base,
                pf.id_anio_legal,
                pf.codigo_posicion,
                pf.id_departamento,
                pf.sede_ubicacion,
                pf.fecha_creacion_posicion,
                pf.fecha_eliminacion_posicion,
                pf.activo,
                pf.id_funcionario,
                pf.encargado,
                pf.salario_base,
                
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
                hsc.bonificacion,
                hsc.aplica_auxilio_transporte,
                
                -- Datos del funcionario (si existe)
                f.nombres,
                f.apellidos,
                f.numero_documento,
                f.tipo_documento,
                f.sexo,
                f.edad
            FROM posiciones_cargo_fijo pf
            INNER JOIN cargos_base cb ON pf.id_cargo_base = cb.id_cargo_base
            INNER JOIN departamentos d ON pf.id_departamento = d.id_departamento
            INNER JOIN anios_legales al ON pf.id_anio_legal = al.id_anio_legal
            LEFT JOIN historico_salarios_cargo hsc 
                ON cb.id_cargo_base = hsc.id_cargo_base 
                AND hsc.id_anio_legal = ? 
                AND hsc.activo = true
            LEFT JOIN funcionarios f ON pf.id_funcionario = f.id_funcionario AND f.activo = true
            WHERE pf.id_anio_legal = ? 
              AND pf.activo = true
              AND d.activo = true
        `;
        let params = [idAnioLegal, idAnioLegal];

        if (filtros.id_cargo_base) {
            query += ' AND pf.id_cargo_base = ?';
            params.push(filtros.id_cargo_base);
        }

        if (filtros.id_departamento) {
            query += ' AND pf.id_departamento = ?';
            params.push(filtros.id_departamento);
        }

        if (filtros.estado === 'ocupado') {
            query += ' AND pf.id_funcionario IS NOT NULL';
        } else if (filtros.estado === 'disponible') {
            query += ' AND pf.id_funcionario IS NULL';
        }

        query += ' ORDER BY d.nombre_departamento, cb.nombre_cargo';

        const [rows] = await pool.query(query, params);
        return rows;
    },

    getById: async (id) => {
        const [rows] = await pool.query(`
            SELECT 
                pf.*,
                cb.nombre_cargo,
                cb.codigo_cargo,
                d.nombre_departamento,
                al.anio,
                al.salario_minimo_legal,
                al.auxilio_transporte
            FROM posiciones_cargo_fijo pf
            INNER JOIN cargos_base cb ON pf.id_cargo_base = cb.id_cargo_base
            INNER JOIN departamentos d ON pf.id_departamento = d.id_departamento
            INNER JOIN anios_legales al ON pf.id_anio_legal = al.id_anio_legal
            WHERE pf.id_posicones_fijo = ?
        `, [id]);
        return rows[0];
    },

    getByCodigo: async (codigo) => {
        const [rows] = await pool.query(
            'SELECT * FROM posiciones_cargo_fijo WHERE codigo_posicion = ?',
            [codigo]
        );
        return rows[0];
    },

    getDisponibilidad: async (idAnioLegal) => {
        const [rows] = await pool.query(`
            SELECT 
                cb.id_cargo_base,
                cb.nombre_cargo,
                COUNT(pf.id_posicones_fijo) as total_posiciones,
                COUNT(pf.id_funcionario) as posiciones_ocupadas,
                COUNT(pf.id_posicones_fijo) - COUNT(pf.id_funcionario) as disponibilidad
            FROM cargos_base cb
            LEFT JOIN posiciones_cargo_fijo pf 
                ON cb.id_cargo_base = pf.id_cargo_base 
                AND pf.id_anio_legal = ? 
                AND pf.activo = true
            WHERE cb.activo = true
            GROUP BY cb.id_cargo_base
            ORDER BY disponibilidad DESC
        `, [idAnioLegal]);
        return rows;
    },

    // =============================================
    // UPDATE
    // =============================================
    update: async (id, data) => {
        const query = `
            UPDATE posiciones_cargo_fijo SET
                id_departamento = ?,
                sede_ubicacion = ?,
                salario_base = ?,
                aplica_auxilio_transporte = ?,
                bonificacion = ?,
                activo = ?
            WHERE id_posicones_fijo = ?
        `;

        const values = [
            data.id_departamento,
            data.sede_ubicacion,
            data.salario_base,
            data.aplica_auxilio_transporte,
            data.bonificacion,
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
            UPDATE posiciones_cargo_fijo 
            SET activo = false, 
                fecha_eliminacion_posicion = ? 
            WHERE id_posicones_fijo = ?
        `, [fechaEliminacion, id]);
        return result;
    },

    // =============================================
    // ASIGNACIÓN DE FUNCIONARIOS
    // =============================================
    asignarFuncionario: async (idPosicion, idFuncionario, esEncargado) => {
        const connection = await pool.getConnection();
        try {
            await connection.beginTransaction();

            // Verificar que la posición existe
            const [posicion] = await connection.query(
                'SELECT * FROM posiciones_cargo_fijo WHERE id_posicones_fijo = ? AND activo = true',
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

            // Verificar si el funcionario ya tiene otra posición FIJO en el mismo año
            const [posicionActual] = await connection.query(
                `SELECT pf.*, cb.nombre_cargo 
                 FROM posiciones_cargo_fijo pf
                 INNER JOIN cargos_base cb ON pf.id_cargo_base = cb.id_cargo_base
                 WHERE pf.id_funcionario = ? 
                   AND pf.activo = true 
                   AND pf.id_anio_legal = ?`,
                [idFuncionario, idAnioLegal]
            );

            if (posicionActual.length > 0 && !esEncargado) {
                throw new Error(
                    `El funcionario ya está asignado a la posición FIJO: ${posicionActual[0].nombre_cargo}-(${posicionActual[0].sede_ubicacion}) en el año ${idAnioLegal}. ` +
                    `Debe marcarlo como "Encargado" para asignarlo a múltiples posiciones.`
                );
            }

            // Asignar funcionario
            await connection.query(
                'UPDATE posiciones_cargo_fijo SET id_funcionario = ?, encargado = ? WHERE id_posicones_fijo = ?',
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

    desasignarFuncionario: async (idPosicion) => {
        const connection = await pool.getConnection();
        try {
            await connection.beginTransaction();

            const [posicion] = await connection.query(
                'SELECT * FROM posiciones_cargo_fijo WHERE id_posicones_fijo = ? AND activo = true',
                [idPosicion]
            );

            if (!posicion[0]) {
                throw new Error('Posición no encontrada o inactiva');
            }

            const idFuncionario = posicion[0].id_funcionario;

            if (!idFuncionario) {
                throw new Error('La posición no tiene funcionario asignado');
            }

            await connection.query(
                'UPDATE posiciones_cargo_fijo SET id_funcionario = NULL, encargado = 0 WHERE id_posicones_fijo = ?',
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
    // TRASLADOS
    // =============================================
    trasladarCargo: async (idPosicion, idNuevoDepartamento) => {
        const connection = await pool.getConnection();
        try {
            await connection.beginTransaction();

            const [posicion] = await connection.query(
                'SELECT * FROM posiciones_cargo_fijo WHERE id_posicones_fijo = ? AND activo = true',
                [idPosicion]
            );

            if (!posicion[0]) {
                throw new Error('Posición no encontrada o inactiva');
            }

            const [departamento] = await connection.query(
                'SELECT * FROM departamentos WHERE id_departamento = ? AND activo = true',
                [idNuevoDepartamento]
            );

            if (!departamento[0]) {
                throw new Error('Departamento destino no encontrado o inactivo');
            }

            await connection.query(
                'UPDATE posiciones_cargo_fijo SET id_departamento = ?, sede_ubicacion = ? WHERE id_posicones_fijo = ?',
                [idNuevoDepartamento, departamento[0].nombre_departamento, idPosicion]
            );

            await connection.commit();
            return {
                success: true,
                id_posicion: idPosicion,
                id_departamento_anterior: posicion[0].id_departamento,
                id_departamento_nuevo: idNuevoDepartamento
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
                SELECT pf.*, f.id_funcionario as funcionario_id
                FROM posiciones_cargo_fijo pf
                LEFT JOIN funcionarios f ON pf.id_funcionario = f.id_funcionario AND f.activo = true
                WHERE pf.id_anio_legal = ? AND pf.activo = true
            `, [idAnioOrigen]);

            let posicionesCopiadas = 0;

            for (const posicion of rows) {
                const nuevoCodigo = posicion.codigo_posicion.replace(/\d{4}$/, fechaCreacion.getFullYear().toString());

                await connection.query(`
                    INSERT INTO posiciones_cargo_fijo (
                        id_cargo_base, id_anio_legal, codigo_posicion, id_departamento,
                        sede_ubicacion, salario_base, aplica_auxilio_transporte, 
                        bonificacion, fecha_creacion_posicion, activo, id_funcionario, encargado
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
                    posicion.encargado
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

module.exports = PosicionFijoModel;