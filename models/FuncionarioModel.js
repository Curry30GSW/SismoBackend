const pool = require('../config/ConectDb');

const FuncionarioModel = {
    // Crear funcionario y asignar a posición
    create: async (data) => {
        const connection = await pool.getConnection();
        try {
            await connection.beginTransaction();

            // Verificar que la posición esté disponible
            const [posicion] = await connection.query(
                'SELECT * FROM posiciones_cargo WHERE id_posicion = ? AND activo = true',
                [data.id_posicion]
            );

            if (!posicion[0]) {
                throw new Error('Posición no encontrada o inactiva');
            }

            const [ocupado] = await connection.query(
                'SELECT * FROM funcionarios WHERE id_posicion = ? AND activo = true',
                [data.id_posicion]
            );

            if (ocupado[0]) {
                throw new Error('La posición ya está ocupada por otro funcionario');
            }

            // Insertar funcionario
            const queryFuncionario = `
                INSERT INTO funcionarios (
                    id_posicion,
                    tipo_documento,
                    numero_documento,
                    nombres,
                    apellidos,
                    fecha_nacimiento,
                    correo_electronico,
                    telefono,
                    fecha_ingreso,
                    activo
                ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
            `;

            const valuesFuncionario = [
                data.id_posicion,
                data.tipo_documento,
                data.numero_documento,
                data.nombres,
                data.apellidos,
                data.fecha_nacimiento || null,
                data.correo_electronico || null,
                data.telefono || null,
                data.fecha_ingreso || new Date(),
                true
            ];

            const [result] = await connection.query(queryFuncionario, valuesFuncionario);

            await connection.commit();
            return { id_funcionario: result.insertId, ...data };

        } catch (error) {
            await connection.rollback();
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
                pc.codigo_posicion,
                pc.sede_ubicacion,
                cb.nombre_cargo,
                cb.codigo_cargo,
                d.nombre_departamento,
                al.anio,
                al.salario_minimo_legal,
                al.auxilio_transporte
            FROM funcionarios f
            INNER JOIN posiciones_cargo pc ON f.id_posicion = pc.id_posicion
            INNER JOIN cargos_base cb ON pc.id_cargo_base = cb.id_cargo_base
            INNER JOIN departamentos d ON pc.id_departamento = d.id_departamento
            INNER JOIN anios_legales al ON pc.id_anio_legal = al.id_anio_legal
            WHERE f.activo = true
        `;
        let params = [];

        if (filtros.id_cargo_base) {
            query += ' AND cb.id_cargo_base = ?';
            params.push(filtros.id_cargo_base);
        }

        if (filtros.id_departamento) {
            query += ' AND pc.id_departamento = ?';
            params.push(filtros.id_departamento);
        }

        if (filtros.id_anio_legal) {
            query += ' AND pc.id_anio_legal = ?';
            params.push(filtros.id_anio_legal);
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
            INNER JOIN posiciones_cargo pc ON f.id_posicion = pc.id_posicion
            INNER JOIN cargos_base cb ON pc.id_cargo_base = cb.id_cargo_base
            INNER JOIN departamentos d ON pc.id_departamento = d.id_departamento
            INNER JOIN anios_legales al ON pc.id_anio_legal = al.id_anio_legal
            WHERE f.id_funcionario = ?
        `, [id]);
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
    }
};

module.exports = FuncionarioModel;