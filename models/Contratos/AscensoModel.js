const pool = require('../../config/ConectDb');

const AscensoModel = {
    // Generar código de ascenso
    generarCodigoAscenso: async () => {
        try {
            const anioActual = new Date().getFullYear();

            // Buscar el último código del año actual
            const [rows] = await pool.query(`
            SELECT codigo_ascenso 
            FROM ascensos 
            WHERE codigo_ascenso LIKE ? 
            ORDER BY id_ascenso DESC 
            LIMIT 1
        `, [`ASC-${anioActual}-%`]);

            let nuevoNumero = 1;
            if (rows[0] && rows[0].codigo_ascenso) {
                // Extraer el número del último código (formato: ASC-2026-123)
                const match = rows[0].codigo_ascenso.match(/ASC-\d+-(\d+)/);
                if (match) {
                    nuevoNumero = parseInt(match[1]) + 1;
                }
            }

            // Sin padding, solo el número
            return `ASC-${anioActual}-${nuevoNumero}`;
        } catch (error) {
            console.error('Error generando código de ascenso:', error);
            const timestamp = Date.now().toString().slice(-6);
            return `ASC-${timestamp}`;
        }
    },

    create: async (data) => {
        const query = `
            INSERT INTO ascensos (
                codigo_ascenso,
                id_contrato_anterior,
                id_contrato_nuevo,
                id_posicion_nueva,
                fecha_ascenso,
                fecha_efectiva,
                estado,
                id_posicion_anterior,
                id_funcionario,
                usuario_creacion
            ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
        `;

        const values = [
            data.codigo_ascenso,
            data.id_contrato_anterior,
            data.id_contrato_nuevo,
            data.id_posicion_nueva,
            data.fecha_ascenso || new Date().toISOString().split('T')[0],
            data.fecha_efectiva || data.fecha_ascenso || new Date().toISOString().split('T')[0],
            data.estado || 'PENDIENTE', // Por defecto PENDIENTE
            data.id_posicion_anterior || null,
            data.id_funcionario || null,
            data.usuario_creacion || 'SISTEMA'
        ];

        const [result] = await pool.query(query, values);
        return { id_ascenso: result.insertId, ...data };
    },

    getById: async (idAscenso) => {
        const [rows] = await pool.query(`
            SELECT 
                a.id_ascenso,
                a.codigo_ascenso,
                a.fecha_ascenso,
                a.fecha_efectiva,
                a.estado,
                a.ejecutado_at,
                a.id_posicion_anterior,
                a.id_funcionario,
                a.usuario_creacion,
                a.created_at,
                
                -- Contrato anterior
                c_ant.id_contrato as contrato_anterior_id,
                c_ant.numero_contrato as contrato_anterior_numero,
                c_ant.cargo as cargo_anterior,
                c_ant.salario as salario_anterior,
                c_ant.lugar_labores as departamento_anterior,
                c_ant.fecha_inicio as fecha_inicio_anterior,
                c_ant.fecha_fin as fecha_fin_anterior,
                c_ant.tipo_contrato as tipo_contrato_anterior,
                c_ant.estado as estado_contrato_anterior,
                
                -- Contrato nuevo
                c_nuevo.id_contrato as contrato_nuevo_id,
                c_nuevo.numero_contrato as contrato_nuevo_numero,
                c_nuevo.cargo as cargo_nuevo,
                c_nuevo.salario as salario_nuevo,
                c_nuevo.lugar_labores as departamento_nuevo,
                c_nuevo.fecha_inicio as fecha_inicio_nuevo,
                c_nuevo.tipo_contrato as tipo_contrato_nuevo,
                c_nuevo.estado as estado_contrato_nuevo,
                
                -- Funcionario
                f.id_funcionario,
                f.tipo_documento,
                f.numero_documento,
                f.nombres,
                f.apellidos,
                f.correo_electronico,
                f.telefono,
                
                -- Posición nueva
                p.id_posicion,
                p.codigo_posicion,
                cb.nombre_cargo as posicion_cargo,
                d.nombre_departamento,
                
                -- Posición anterior
                pa.id_posicion as id_posicion_anterior_detalle,
                pa.codigo_posicion as codigo_posicion_anterior,
                cba.nombre_cargo as posicion_anterior_cargo,
                da.nombre_departamento as departamento_anterior_detalle,
                
                -- Incremento calculado
                ROUND(((c_nuevo.salario - c_ant.salario) / c_ant.salario) * 100, 2) as incremento_porcentaje
                
            FROM ascensos a
            INNER JOIN contratos c_ant ON a.id_contrato_anterior = c_ant.id_contrato
            INNER JOIN contratos c_nuevo ON a.id_contrato_nuevo = c_nuevo.id_contrato
            INNER JOIN funcionarios f ON c_nuevo.id_funcionario = f.id_funcionario
            LEFT JOIN posiciones_cargo p ON a.id_posicion_nueva = p.id_posicion
            LEFT JOIN cargos_base cb ON p.id_cargo_base = cb.id_cargo_base
            LEFT JOIN departamentos d ON p.id_departamento = d.id_departamento
            LEFT JOIN posiciones_cargo pa ON a.id_posicion_anterior = pa.id_posicion
            LEFT JOIN cargos_base cba ON pa.id_cargo_base = cba.id_cargo_base
            LEFT JOIN departamentos da ON pa.id_departamento = da.id_departamento
            WHERE a.id_ascenso = ?
        `, [idAscenso]);

        return rows[0];
    },

    getPendientes: async () => {
        const [rows] = await pool.query(`
            SELECT 
                a.*,
                c.id_funcionario,
                c.id_posicion as id_posicion_actual,
                c.estado as estado_contrato_actual
            FROM ascensos a
            INNER JOIN contratos c ON c.id_contrato = a.id_contrato_anterior
            WHERE a.estado = 'PENDIENTE' 
            AND a.fecha_efectiva <= CURDATE()
            AND c.estado = 'ACTIVO'
            ORDER BY a.fecha_efectiva ASC
        `);
        return rows;
    },

    // Obtener ascensos por funcionario
    getByFuncionario: async (idFuncionario) => {
        const [rows] = await pool.query(`
            SELECT 
                a.id_ascenso,
                a.codigo_ascenso,
                a.fecha_ascenso,
                a.motivo,
                c_ant.numero_contrato as contrato_anterior,
                c_nuevo.numero_contrato as contrato_nuevo,
                c_ant.cargo as cargo_anterior,
                c_nuevo.cargo as cargo_nuevo,
                c_ant.salario as salario_anterior,
                c_nuevo.salario as salario_nuevo,
                ROUND(((c_nuevo.salario - c_ant.salario) / c_ant.salario) * 100, 2) as incremento_porcentaje
            FROM ascensos a
            INNER JOIN contratos c_ant ON a.id_contrato_anterior = c_ant.id_contrato
            INNER JOIN contratos c_nuevo ON a.id_contrato_nuevo = c_nuevo.id_contrato
            WHERE c_nuevo.id_funcionario = ?
            ORDER BY a.fecha_ascenso DESC
        `, [idFuncionario]);
        return rows;
    },

    // Obtener todos los ascensos
    getAll: async () => {
        const [rows] = await pool.query(`
        SELECT 
            a.id_ascenso,
            a.codigo_ascenso,
            a.fecha_ascenso,
            f.nombres,
            f.apellidos,
            f.numero_documento,
            c_ant.numero_contrato as contrato_anterior,
            c_ant.estado as estado_contrato_anterior,
            c_nuevo.numero_contrato as contrato_nuevo,
            c_nuevo.estado as estado_contrato_nuevo,
            c_ant.cargo as cargo_anterior,
            c_ant.lugar_labores as departamento_anterior,
            c_nuevo.lugar_labores as departamento_nuevo,
            c_nuevo.cargo as cargo_nuevo,
            c_ant.fecha_inicio as fecha_inicio_anterior,
            c_ant.salario as salario_anterior,
            c_nuevo.salario as salario_nuevo
        FROM ascensos a
        INNER JOIN contratos c_ant 
            ON a.id_contrato_anterior = c_ant.id_contrato
        INNER JOIN contratos c_nuevo 
            ON a.id_contrato_nuevo = c_nuevo.id_contrato
        INNER JOIN funcionarios f 
            ON c_nuevo.id_funcionario = f.id_funcionario
        ORDER BY a.fecha_ascenso DESC
    `);

        return rows;
    },

    // Obtener count total
    getCount: async () => {
        const [rows] = await pool.query('SELECT COUNT(*) as total FROM ascensos');
        return rows[0].total;
    },

    // Marcar ascenso como ejecutado
    marcarEjecutado: async (idAscenso) => {
        const [result] = await pool.query(`
        UPDATE ascensos 
        SET estado = 'EJECUTADO', 
            ejecutado_at = NOW() 
        WHERE id_ascenso = ?
    `, [idAscenso]);
        return result;
    },

    // Cancelar ascenso
    cancelar: async (idAscenso, motivo) => {
        const [result] = await pool.query(`
        UPDATE ascensos 
        SET estado = 'CANCELADO',
            motivo_cancelacion = ?
        WHERE id_ascenso = ?
    `, [motivo, idAscenso]);
        return result;
    },
};

module.exports = AscensoModel;