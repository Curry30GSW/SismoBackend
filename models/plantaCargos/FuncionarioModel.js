const pool = require('../../config/ConectDb');

const FuncionarioModel = {
    // Crear funcionario y asignar a posición
    create: async (data) => {
        const connection = await pool.getConnection();
        try {
            // Verificar que no exista otro funcionario con el mismo documento
            const [existente] = await connection.query(
                'SELECT id_funcionario FROM funcionarios WHERE numero_documento = ?',
                [data.numero_documento]
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
                lugar_expedicion,
                edad,
                correo_electronico,
                telefono,
                fecha_ingreso,
                fecha_retiro,
                activo,
                direccion,
                lugar_nacimiento,
                barrio,
                id_banco,
                tipo_cuenta,
                numero_cuenta_bancaria,
                id_eps,
                id_cesantia,
                id_pension,
                id_caja_compensacion
            ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
        `;

            const values = [
                data.tipo_documento,
                data.numero_documento,
                data.nombres,
                data.apellidos,
                data.sexo || null,
                data.fecha_nacimiento || null,
                data.lugar_expedicion || null,
                edad,
                data.correo_electronico || null,
                data.telefono || null,
                data.fecha_ingreso || new Date(),
                data.fecha_retiro || null,
                data.activo !== undefined ? data.activo : 1,
                data.direccion || null,
                data.lugar_nacimiento || null,
                data.barrio || null,
                data.id_banco || null,
                data.tipo_cuenta || null,
                data.numero_cuenta_bancaria || null,
                data.id_eps || null,
                data.id_cesantia || null,
                data.id_pension || null,
                data.id_caja_compensacion || null
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
                al.anio,
            
                b.nombre_banco,
                f.tipo_cuenta,
                f.numero_cuenta_bancaria,
            
                e.nombre_eps,
                e.nombre_aporte as eps_nombre_aporte,
            
                c.nombre_cesantia,
                c.nombre_aporte as cesantia_nombre_aporte,

                p.nombre_pension,
                p.nombre_aporte as pension_nombre_aporte,

                cc.nombre_caja
            FROM funcionarios f
            LEFT JOIN posiciones_cargo pc ON f.id_funcionario = pc.id_funcionario 
                AND pc.id_anio_legal = ? 
                AND pc.activo = true
            LEFT JOIN cargos_base cb ON pc.id_cargo_base = cb.id_cargo_base
            LEFT JOIN departamentos d ON pc.id_departamento = d.id_departamento
            LEFT JOIN anios_legales al ON pc.id_anio_legal = al.id_anio_legal

            LEFT JOIN bancos b ON f.id_banco = b.id_banco
            LEFT JOIN eps e ON f.id_eps = e.id_eps
            LEFT JOIN cesantias c ON f.id_cesantia = c.id_cesantia
            LEFT JOIN pensiones p ON f.id_pension = p.id_pension
            LEFT JOIN caja_compensacion cc ON f.id_caja_compensacion = cc.id_caja
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


    getAllFuncionarios: async (filtros = {}) => {
        let query = `
            SELECT 
                id_funcionario,
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
                fecha_retiro,
                activo,
                created_at,
                updated_at
            FROM funcionarios
            WHERE 1=1
        `;
        let params = [];

        // Filtro por activo/inactivo
        if (filtros.activo !== undefined) {
            query += ' AND activo = ?';
            params.push(filtros.activo);
        }

        // Filtro por tipo de documento
        if (filtros.tipo_documento) {
            query += ' AND tipo_documento = ?';
            params.push(filtros.tipo_documento);
        }

        query += ' ORDER BY apellidos, nombres';

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
        const [rows] = await pool.query(`
        SELECT 
            f.*,
            c.numero_contrato,
            c.fecha_inicio,
            c.estado,
            c.cargo,
            c.salario,
            c.lugar_labores
        FROM funcionarios f
        INNER JOIN contratos c 
            ON f.id_funcionario = c.id_funcionario
        WHERE f.activo = true
          AND c.estado = 'ACTIVO'
        ORDER BY f.apellidos, f.nombres
    `);

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
        const connection = await pool.getConnection();
        try {
            // Verificar que no exista otro funcionario con el mismo documento (excluyendo el actual)
            const [existente] = await connection.query(
                'SELECT id_funcionario FROM funcionarios WHERE tipo_documento = ? AND numero_documento = ? AND id_funcionario != ?',
                [data.tipo_documento, data.numero_documento, id]
            );

            if (existente.length > 0) {
                throw new Error('Ya existe otro funcionario con este documento');
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
            UPDATE funcionarios SET
                tipo_documento = ?,
                numero_documento = ?,
                nombres = ?,
                apellidos = ?,
                sexo = ?,
                fecha_nacimiento = ?,
                lugar_expedicion = ?,
                edad = ?,
                correo_electronico = ?,
                telefono = ?,
                fecha_ingreso = ?,
                fecha_retiro = ?,
                activo = ?,
                direccion = ?,
                lugar_nacimiento = ?,
                barrio = ?,
                id_banco = ?,
                tipo_cuenta = ?,
                numero_cuenta_bancaria = ?,
                id_eps = ?,
                id_cesantia = ?,
                id_pension = ?,
                id_caja_compensacion = ?
            WHERE id_funcionario = ?
        `;

            const values = [
                data.tipo_documento,
                data.numero_documento,
                data.nombres,
                data.apellidos,
                data.sexo || null,
                data.fecha_nacimiento || null,
                data.lugar_expedicion || null,
                edad,
                data.correo_electronico || null,
                data.telefono || null,
                data.fecha_ingreso || null,
                data.fecha_retiro || null,
                data.activo !== undefined ? data.activo : 1,
                data.direccion || null,
                data.lugar_nacimiento || null,
                data.barrio || null,
                data.id_banco || null,
                data.tipo_cuenta || null,
                data.numero_cuenta_bancaria || null,
                data.id_eps || null,
                data.id_cesantia || null,
                data.id_pension || null,
                data.id_caja_compensacion || null,
                id
            ];

            const [result] = await connection.query(query, values);
            return { id_funcionario: id, ...data };

        } catch (error) {
            throw error;
        } finally {
            connection.release();
        }
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
    },


    //CONTRATOS
    getByDocumentoCompleto: async (tipo, numero) => {
        const [rows] = await pool.query(`
            SELECT 
                f.*,
                -- Datos de banco
                b.id_banco,
                b.nombre_banco,
                -- Datos de EPS
                e.id_eps,
                e.nombre_eps,
                e.codigo_eps,
                -- Datos de Cesantías
                c.id_cesantia,
                c.nombre_cesantia,
                c.codigo_cesantia,
                -- Datos de Pensión
                p.id_pension,
                p.nombre_pension,
                p.codigo_pension,
                -- Datos de Caja de Compensación
                cc.id_caja,
                cc.nombre_caja,
                cc.codigo_caja
            FROM funcionarios f
            LEFT JOIN bancos b ON f.id_banco = b.id_banco
            LEFT JOIN eps e ON f.id_eps = e.id_eps
            LEFT JOIN cesantias c ON f.id_cesantia = c.id_cesantia
            LEFT JOIN pensiones p ON f.id_pension = p.id_pension
            LEFT JOIN caja_compensacion cc ON f.id_caja_compensacion = cc.id_caja
            WHERE f.tipo_documento = ? AND f.numero_documento = ? AND f.activo = true
        `, [tipo, numero]);

        return rows[0];
    },

    // Obtener posiciones activas de un funcionario
    getPosicionesActivas: async (idFuncionario) => {
        const [rows] = await pool.query(`
            SELECT 
                pc.id_posicion,
                pc.codigo_posicion,
                cb.nombre_cargo,
                d.nombre_departamento,
                al.anio,
                pc.fecha_creacion_posicion,
                pc.encargado
            FROM posiciones_cargo pc
            INNER JOIN cargos_base cb ON pc.id_cargo_base = cb.id_cargo_base
            INNER JOIN departamentos d ON pc.id_departamento = d.id_departamento
            INNER JOIN anios_legales al ON pc.id_anio_legal = al.id_anio_legal
            WHERE pc.id_funcionario = ? AND pc.activo = true
            ORDER BY al.anio DESC, pc.fecha_creacion_posicion DESC
        `, [idFuncionario]);

        return rows;
    },
};

module.exports = FuncionarioModel;