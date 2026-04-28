const pool = require('../../config/ConectDb');

const AscensoModel = {
    // Generar código de ascenso
    generarCodigoAscenso: async () => {
        try {
            const [rows] = await pool.query(`
                SELECT codigo_ascenso 
                FROM ascensos 
                WHERE codigo_ascenso IS NOT NULL 
                ORDER BY id_ascenso DESC 
                LIMIT 1
            `);

            let nuevoNumero = 1;
            if (rows[0] && rows[0].codigo_ascenso) {
                const match = rows[0].codigo_ascenso.match(/ASC-(\d+)/);
                if (match) {
                    nuevoNumero = parseInt(match[1]) + 1;
                }
            }

            const numeroFormateado = nuevoNumero.toString().padStart(4, '0');
            return `ASC-${numeroFormateado}`;
        } catch (error) {
            console.error('Error generando código de ascenso:', error);
            const timestamp = Date.now().toString().slice(-6);
            return `ASC-${timestamp}`;
        }
    },

    // Crear registro de ascenso
    create: async (data) => {
        const query = `
            INSERT INTO ascensos (
                codigo_ascenso,
                id_contrato_anterior,
                id_contrato_nuevo,
                id_posicion_nueva,
                fecha_ascenso,
                usuario_creacion
            ) VALUES (?, ?, ?, ?, ?, ?)
        `;

        const values = [
            data.codigo_ascenso,
            data.id_contrato_anterior,
            data.id_contrato_nuevo,
            data.id_posicion_nueva,
            data.fecha_ascenso,
            data.usuario_creacion || 'SISTEMA'
        ];

        const [result] = await pool.query(query, values);
        return { id_ascenso: result.insertId, ...data };
    },

    // Obtener ascenso completo con todos los datos relacionados
    getById: async (idAscenso) => {
        const [rows] = await pool.query(`
            SELECT 
                a.id_ascenso,
                a.codigo_ascenso,
                a.fecha_ascenso,
                a.motivo,
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
                
                -- Contrato nuevo
                c_nuevo.id_contrato as contrato_nuevo_id,
                c_nuevo.numero_contrato as contrato_nuevo_numero,
                c_nuevo.cargo as cargo_nuevo,
                c_nuevo.salario as salario_nuevo,
                c_nuevo.lugar_labores as departamento_nuevo,
                c_nuevo.fecha_inicio as fecha_inicio_nuevo,
                c_nuevo.tipo_contrato as tipo_contrato_nuevo,
                
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
                
                -- Incremento calculado
                ROUND(((c_nuevo.salario - c_ant.salario) / c_ant.salario) * 100, 2) as incremento_porcentaje
                
            FROM ascensos a
            INNER JOIN contratos c_ant ON a.id_contrato_anterior = c_ant.id_contrato
            INNER JOIN contratos c_nuevo ON a.id_contrato_nuevo = c_nuevo.id_contrato
            INNER JOIN funcionarios f ON c_nuevo.id_funcionario = f.id_funcionario
            LEFT JOIN posiciones_cargo p ON a.id_posicion_nueva = p.id_posicion
            LEFT JOIN cargos_base cb ON p.id_cargo_base = cb.id_cargo_base
            LEFT JOIN departamentos d ON p.id_departamento = d.id_departamento
            WHERE a.id_ascenso = ?
        `, [idAscenso]);

        return rows[0];
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
    getAll: async (limit = 100, offset = 0) => {
        const [rows] = await pool.query(`
            SELECT 
                a.id_ascenso,
                a.codigo_ascenso,
                a.fecha_ascenso,
                a.motivo,
                f.nombres,
                f.apellidos,
                f.numero_documento,
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
            INNER JOIN funcionarios f ON c_nuevo.id_funcionario = f.id_funcionario
            ORDER BY a.fecha_ascenso DESC
            LIMIT ? OFFSET ?
        `, [limit, offset]);
        return rows;
    },

    // Obtener count total
    getCount: async () => {
        const [rows] = await pool.query('SELECT COUNT(*) as total FROM ascensos');
        return rows[0].total;
    }
};

module.exports = AscensoModel;