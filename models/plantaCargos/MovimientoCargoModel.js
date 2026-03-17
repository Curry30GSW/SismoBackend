const pool = require('../../config/ConectDb');

const MovimientoCargoModel = {
    // Registrar movimiento
    create: async (data) => {
        const connection = await pool.getConnection();
        try {
            const query = `
                INSERT INTO movimientos_cargo (
                    id_posicion,
                    id_funcionario,
                    tipo_movimiento,
                    fecha_movimiento,
                    id_anio_legal,
                    motivo,
                    usuario_sistema
                ) VALUES (?, ?, ?, ?, ?, ?, ?)
            `;

            const values = [
                data.id_posicion,
                data.id_funcionario || null,
                data.tipo_movimiento,
                data.fecha_movimiento || new Date(),
                data.id_anio_legal,
                data.motivo || null,
                data.usuario_sistema || 'SISTEMA'
            ];

            const [result] = await connection.query(query, values);
            return { id_movimiento: result.insertId, ...data };

        } finally {
            connection.release();
        }
    },

    // Obtener movimientos de una posición
    getByPosicion: async (idPosicion) => {
        const [rows] = await pool.query(`
            SELECT 
                mc.*,
                pc.codigo_posicion,
                cb.nombre_cargo,
                CONCAT(f.nombres, ' ', f.apellidos) as nombre_funcionario
            FROM movimientos_cargo mc
            INNER JOIN posiciones_cargo pc ON mc.id_posicion = pc.id_posicion
            INNER JOIN cargos_base cb ON pc.id_cargo_base = cb.id_cargo_base
            LEFT JOIN funcionarios f ON mc.id_funcionario = f.id_funcionario
            WHERE mc.id_posicion = ?
            ORDER BY mc.fecha_movimiento DESC
        `, [idPosicion]);
        return rows;
    },

    // Obtener movimientos de un funcionario
    getByFuncionario: async (idFuncionario) => {
        const [rows] = await pool.query(`
            SELECT 
                mc.*,
                pc.codigo_posicion,
                cb.nombre_cargo
            FROM movimientos_cargo mc
            INNER JOIN posiciones_cargo pc ON mc.id_posicion = pc.id_posicion
            INNER JOIN cargos_base cb ON pc.id_cargo_base = cb.id_cargo_base
            WHERE mc.id_funcionario = ?
            ORDER BY mc.fecha_movimiento DESC
        `, [idFuncionario]);
        return rows;
    },

    // Obtener movimientos por año
    getByAnio: async (idAnioLegal, tipo = null) => {
        let query = `
            SELECT 
                mc.*,
                pc.codigo_posicion,
                cb.nombre_cargo,
                d.nombre_departamento,
                CONCAT(f.nombres, ' ', f.apellidos) as nombre_funcionario
            FROM movimientos_cargo mc
            INNER JOIN posiciones_cargo pc ON mc.id_posicion = pc.id_posicion
            INNER JOIN cargos_base cb ON pc.id_cargo_base = cb.id_cargo_base
            INNER JOIN departamentos d ON pc.id_departamento = d.id_departamento
            LEFT JOIN funcionarios f ON mc.id_funcionario = f.id_funcionario
            WHERE mc.id_anio_legal = ?
        `;
        let params = [idAnioLegal];

        if (tipo) {
            query += ' AND mc.tipo_movimiento = ?';
            params.push(tipo);
        }

        query += ' ORDER BY mc.fecha_movimiento DESC';

        const [rows] = await pool.query(query, params);
        return rows;
    },

    // Obtener resumen de movimientos por año
    getResumenByAnio: async (idAnioLegal) => {
        const [rows] = await pool.query(`
            SELECT 
                tipo_movimiento,
                COUNT(*) as cantidad,
                MIN(fecha_movimiento) as primer_movimiento,
                MAX(fecha_movimiento) as ultimo_movimiento
            FROM movimientos_cargo
            WHERE id_anio_legal = ?
            GROUP BY tipo_movimiento
            ORDER BY cantidad DESC
        `, [idAnioLegal]);
        return rows;
    },

    // Registrar creación de posición (método helper)
    registrarCreacion: async (idPosicion, idAnioLegal, motivo, usuario) => {
        return await MovimientoCargoModel.create({
            id_posicion: idPosicion,
            tipo_movimiento: 'CREACION',
            id_anio_legal: idAnioLegal,
            motivo: motivo || 'Creación de posición',
            usuario_sistema: usuario
        });
    },

    // Registrar asignación de funcionario (método helper)
    registrarAsignacion: async (idPosicion, idFuncionario, idAnioLegal, motivo, usuario) => {
        return await MovimientoCargoModel.create({
            id_posicion: idPosicion,
            id_funcionario: idFuncionario,
            tipo_movimiento: 'ASIGNACION',
            id_anio_legal: idAnioLegal,
            motivo: motivo || 'Asignación de funcionario',
            usuario_sistema: usuario
        });
    },

    // Registrar desasignación (método helper)
    registrarDesasignacion: async (idPosicion, idFuncionario, idAnioLegal, motivo, usuario) => {
        return await MovimientoCargoModel.create({
            id_posicion: idPosicion,
            id_funcionario: idFuncionario,
            tipo_movimiento: 'DESASIGNACION',
            id_anio_legal: idAnioLegal,
            motivo: motivo || 'Desasignación de funcionario',
            usuario_sistema: usuario
        });
    },

    // Registrar traslado (método helper)
    registrarTraslado: async (idPosicionOrigen, idPosicionDestino, idFuncionario, idAnioLegal, motivo, usuario) => {
        const connection = await pool.getConnection();
        try {
            await connection.beginTransaction();

            // Registrar salida de posición origen
            await MovimientoCargoModel.create({
                id_posicion: idPosicionOrigen,
                id_funcionario: idFuncionario,
                tipo_movimiento: 'DESASIGNACION',
                id_anio_legal: idAnioLegal,
                motivo: motivo || 'Traslado',
                usuario_sistema: usuario
            });

            // Registrar entrada a posición destino
            await MovimientoCargoModel.create({
                id_posicion: idPosicionDestino,
                id_funcionario: idFuncionario,
                tipo_movimiento: 'ASIGNACION',
                id_anio_legal: idAnioLegal,
                motivo: motivo || 'Traslado',
                usuario_sistema: usuario
            });

            await connection.commit();

        } catch (error) {
            await connection.rollback();
            throw error;
        } finally {
            connection.release();
        }
    },

    // Registrar eliminación (método helper)
    registrarEliminacion: async (idPosicion, idAnioLegal, motivo, usuario) => {
        return await MovimientoCargoModel.create({
            id_posicion: idPosicion,
            tipo_movimiento: 'ELIMINACION',
            id_anio_legal: idAnioLegal,
            motivo: motivo || 'Eliminación de posición',
            usuario_sistema: usuario
        });
    }
};

module.exports = MovimientoCargoModel;