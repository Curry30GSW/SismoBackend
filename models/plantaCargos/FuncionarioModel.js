const pool = require('../../config/ConectDb');

const FuncionarioModel = {
    // Crear funcionario y asignar a posición
    create: async (data) => {
        const connection = await pool.getConnection();
        try {
            // Verificar que no exista otro funcionario con el mismo documento
            const [existente] = await connection.query(
                'SELECT id_funcionario FROM funcionarios WHERE tipo_documento = ? AND numero_documento = ?',
                [data.tipo_documento, data.numero_documento]
            );

            if (existente.length > 0) {
                throw new Error('Ya existe un funcionario con este documento');
            }

            // Calcular edad si se proporciona fecha de nacimiento
            let edad = data.edad || 0;
            if (data.fecha_nacimiento && !data.edad) {
                const fechaNac = new Date(data.fecha_nacimiento);
                const hoy = new Date();
                edad = hoy.getFullYear() - fechaNac.getFullYear();
                const m = hoy.getMonth() - fechaNac.getMonth();
                if (m < 0 || (m === 0 && hoy.getDate() < fechaNac.getDate())) {
                    edad--;
                }
            }

            const query = `
                INSERT INTO funcionarios (
                    tipo_documento,
                    numero_documento,
                    nombres,
                    apellidos,
                    sexo,
                    fecha_nacimiento,
                    edad,
                    correo_electronico,
                    telefono,
                    fecha_ingreso,
                    activo
                ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
            `;

            const values = [
                data.tipo_documento,
                data.numero_documento,
                data.nombres,
                data.apellidos,
                data.sexo || null,
                data.fecha_nacimiento || null,
                edad,
                data.correo_electronico || null,
                data.telefono || null,
                data.fecha_ingreso || new Date(),
                data.activo !== undefined ? data.activo : true
            ];

            const [result] = await connection.query(query, values);
            return { id_funcionario: result.insertId, ...data };

        } catch (error) {
            throw error;
        } finally {
            connection.release();
        }
    },

    // Obtener todos los funcionarios activos
    getAll: async (filtros = {}) => {
        let query = `
    SELECT 
        f.*,
        pc.id_posicion,
        pc.codigo_posicion,
        pc.sede_ubicacion,
        pc.salario_base as salario_posicion,
        pc.aplica_auxilio_transporte,
        pc.bonificacion as bonificacion_posicion,
        pc.encargado,
        cb.nombre_cargo,
        cb.codigo_cargo,
        d.nombre_departamento,
        al.anio
    FROM funcionarios f
    LEFT JOIN posiciones_cargo pc ON f.id_funcionario = pc.id_funcionario 
        AND pc.id_anio_legal = ? 
        AND pc.activo = true
    LEFT JOIN cargos_base cb ON pc.id_cargo_base = cb.id_cargo_base
    LEFT JOIN departamentos d ON pc.id_departamento = d.id_departamento
    LEFT JOIN anios_legales al ON pc.id_anio_legal = al.id_anio_legal
    WHERE 1=1
`;
        let params = [filtros.id_anio_legal];

        // Filtro por activo/inactivo
        if (filtros.activo !== undefined) {
            query += ' AND f.activo = ?';
            params.push(filtros.activo);
        }


        if (filtros.con_cargo !== undefined) {
            if (filtros.con_cargo === true) {
                // Para "con cargo": mostrar los que tienen cargo y NO son encargados
                query += ' AND pc.id_posicion IS NOT NULL AND (pc.encargado IS NULL OR pc.encargado = 0)';
            } else if (filtros.con_cargo === false) {
                // Para "sin cargo": mostrar los que NO tienen cargo
                query += ' AND pc.id_posicion IS NULL';
            }
        } else {
            query += ` AND (
            pc.id_posicion IS NULL 
            OR (pc.id_posicion IS NOT NULL AND (pc.encargado IS NULL OR pc.encargado = 0))
        )`;
        }

        // Filtros adicionales
        if (filtros.id_cargo_base) {
            query += ' AND cb.id_cargo_base = ?';
            params.push(filtros.id_cargo_base);
        }

        if (filtros.id_departamento) {
            query += ' AND pc.id_departamento = ?';
            params.push(filtros.id_departamento);
        }

        query += ' ORDER BY f.apellidos, f.nombres';

        const [rows] = await pool.query(query, params);
        return rows;
    },

    // Obtener funcionario por ID
    getById: async (id) => {
        const [rows] = await pool.query(`
            SELECT 
                f.*,
                pc.codigo_posicion,
                pc.sede_ubicacion,
                pc.salario_base,
                pc.aplica_auxilio_transporte,
                pc.bonificacion,
                cb.nombre_cargo,
                cb.codigo_cargo,
                d.nombre_departamento,
                al.anio
            FROM funcionarios f
            INNER JOIN posiciones_cargo pc ON f.id_funcionario = pc.id_funcionario
            INNER JOIN cargos_base cb ON pc.id_cargo_base = cb.id_cargo_base
            INNER JOIN departamentos d ON pc.id_departamento = d.id_departamento
            INNER JOIN anios_legales al ON pc.id_anio_legal = al.id_anio_legal
            WHERE f.id_funcionario = ?
        `, [id]);
        return rows[0];
    },

    // Obtener funcionarios con su posición actual en un año específico
    getAllWithPosicionByAnio: async (idAnioLegal) => {
        const [rows] = await pool.query(`
            SELECT 
                f.*,
                pc.id_posicion,
                pc.codigo_posicion,
                pc.sede_ubicacion,
                pc.salario_base,
                cb.nombre_cargo,
                cb.codigo_cargo,
                d.nombre_departamento
            FROM funcionarios f
            LEFT JOIN posiciones_cargo pc ON f.id_funcionario = pc.id_funcionario 
                AND pc.id_anio_legal = ? 
                AND pc.activo = true
            LEFT JOIN cargos_base cb ON pc.id_cargo_base = cb.id_cargo_base
            LEFT JOIN departamentos d ON pc.id_departamento = d.id_departamento
            WHERE f.activo = true
            ORDER BY f.apellidos, f.nombres
        `, [idAnioLegal]);
        return rows;
    },

    // Obtener funcionario por ID
    getById: async (id) => {
        const [rows] = await pool.query(
            'SELECT * FROM funcionarios WHERE id_funcionario = ?',
            [id]
        );
        return rows[0];
    },

    // Obtener por documento
    getByDocumento: async (tipo, numero) => {
        const [rows] = await pool.query(
            'SELECT * FROM funcionarios WHERE tipo_documento = ? AND numero_documento = ? AND activo = true',
            [tipo, numero]
        );
        return rows[0];
    },

    // Obtener funcionario por documento (solo activos)
    getByDocumentoActivo: async (tipo, numero) => {
        const [rows] = await pool.query(
            'SELECT * FROM funcionarios WHERE tipo_documento = ? AND numero_documento = ? AND activo = true',
            [tipo, numero]
        );
        return rows[0];
    },

    // Obtener todos los funcionarios activos
    getAllActivosOnlyFuncionarios: async () => {
        const [rows] = await pool.query(
            'SELECT * FROM funcionarios WHERE activo = true ORDER BY apellidos, nombres'
        );
        return rows;
    },

    // Desactivar funcionario (soft delete)
    deactivate: async (id, fechaRetiro) => {
        const [result] = await pool.query(
            'UPDATE funcionarios SET activo = false, fecha_retiro = ? WHERE id_funcionario = ?',
            [fechaRetiro || new Date(), id]
        );
        return result;
    },

    // Actualizar funcionario
    update: async (id, data) => {
        const query = `
            UPDATE funcionarios SET
                nombres = ?,
                apellidos = ?,
                fecha_nacimiento = ?,
                correo_electronico = ?,
                telefono = ?
            WHERE id_funcionario = ?
        `;

        const values = [
            data.nombres,
            data.apellidos,
            data.fecha_nacimiento || null,
            data.correo_electronico || null,
            data.telefono || null,
            id
        ];

        const [result] = await pool.query(query, values);
        return result;
    },

    // Retirar funcionario (desactivar)
    retire: async (id, fechaRetiro) => {
        const connection = await pool.getConnection();
        try {
            await connection.beginTransaction();

            const [funcionario] = await connection.query(
                'SELECT * FROM funcionarios WHERE id_funcionario = ?',
                [id]
            );

            if (!funcionario[0]) {
                throw new Error('Funcionario no encontrado');
            }

            await connection.query(
                'UPDATE funcionarios SET activo = false, fecha_retiro = ? WHERE id_funcionario = ?',
                [fechaRetiro || new Date(), id]
            );

            await connection.commit();
            return { success: true, id_posicion_liberada: funcionario[0].id_posicion };

        } catch (error) {
            await connection.rollback();
            throw error;
        } finally {
            connection.release();
        }
    },

    // Trasladar funcionario a otra posición
    transfer: async (idFuncionario, idNuevaPosicion, fechaTraslado) => {
        const connection = await pool.getConnection();
        try {
            await connection.beginTransaction();

            // Verificar nueva posición disponible
            const [nuevaPosicion] = await connection.query(
                'SELECT * FROM posiciones_cargo WHERE id_posicion = ? AND activo = true',
                [idNuevaPosicion]
            );

            if (!nuevaPosicion[0]) {
                throw new Error('Posición destino no disponible');
            }

            const [ocupada] = await connection.query(
                'SELECT * FROM funcionarios WHERE id_posicion = ? AND activo = true',
                [idNuevaPosicion]
            );

            if (ocupada[0]) {
                throw new Error('La posición destino ya está ocupada');
            }

            // Obtener posición actual
            const [funcionario] = await connection.query(
                'SELECT * FROM funcionarios WHERE id_funcionario = ?',
                [idFuncionario]
            );

            if (!funcionario[0]) {
                throw new Error('Funcionario no encontrado');
            }

            const idPosicionActual = funcionario[0].id_posicion;

            // Actualizar funcionario a nueva posición
            await connection.query(
                'UPDATE funcionarios SET id_posicion = ? WHERE id_funcionario = ?',
                [idNuevaPosicion, idFuncionario]
            );

            await connection.commit();
            return {
                success: true,
                id_posicion_origen: idPosicionActual,
                id_posicion_destino: idNuevaPosicion
            };

        } catch (error) {
            await connection.rollback();
            throw error;
        } finally {
            connection.release();
        }
    },

    // Obtener estadísticas de funcionarios
    getEstadisticas: async (idAnioLegal) => {
        const [rows] = await pool.query(`
            SELECT 
                COUNT(*) as total_funcionarios,
                COUNT(DISTINCT pc.id_departamento) as departamentos_con_personal,
                AVG(TIMESTAMPDIFF(YEAR, f.fecha_ingreso, CURDATE())) as antiguedad_promedio,
                SUM(CASE WHEN TIMESTAMPDIFF(YEAR, f.fecha_ingreso, CURDATE()) >= 5 THEN 1 ELSE 0 END) as funcionarios_mas_5_anios
            FROM funcionarios f
            INNER JOIN posiciones_cargo pc ON f.id_posicion = pc.id_posicion
            WHERE f.activo = true AND pc.id_anio_legal = ?
        `, [idAnioLegal]);
        return rows[0];
    },

    // Obtener historial de posiciones de un funcionario
    getHistorialPosiciones: async (idFuncionario) => {
        const [rows] = await pool.query(`
            SELECT 
                pc.id_posicion,
                pc.codigo_posicion,
                pc.fecha_creacion_posicion,
                pc.fecha_eliminacion_posicion,
                al.anio,
                cb.nombre_cargo,
                d.nombre_departamento,
                CASE 
                    WHEN pc.fecha_eliminacion_posicion IS NULL THEN 'Activo'
                    ELSE 'Finalizado'
                END as estado
            FROM posiciones_cargo pc
            INNER JOIN anios_legales al ON pc.id_anio_legal = al.id_anio_legal
            INNER JOIN cargos_base cb ON pc.id_cargo_base = cb.id_cargo_base
            INNER JOIN departamentos d ON pc.id_departamento = d.id_departamento
            WHERE pc.id_funcionario = ?
            ORDER BY al.anio DESC, pc.fecha_creacion_posicion DESC
        `, [idFuncionario]);
        return rows;
    }
};

module.exports = FuncionarioModel;